const jwt = require('jsonwebtoken');
const prisma = require('../controler/prisma');

// Map userId -> Set of socketIds (один пользователь может иметь несколько вкладок)
const onlineUsers = new Map();

function setupChat(io) {
    // JWT аутентификация для сокетов
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Нет токена'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Недействительный токен'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`[Chat] User connected: ${userId} (${socket.user.role})`);

        // Добавляем в онлайн
        if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
        onlineUsers.get(userId).add(socket.id);

        // Присоединяем к личной комнате
        socket.join(`user:${userId}`);

        // Уведомляем всех об онлайн-статусе
        io.emit('user_online', { userId, online: true });

        // Отправляем текущий список онлайн
        socket.emit('online_users', Array.from(onlineUsers.keys()));

        // ─── Отправка сообщения ───────────────────────────────────────────
        socket.on('send_message', async (data) => {
            try {
                const { receiverId, content } = data;
                if (!receiverId || !content?.trim()) return;

                // Проверяем что получатель существует
                const receiver = await prisma.user.findUnique({
                    where: { id: receiverId },
                    select: { id: true, fullName: true, role: true, isActive: true }
                });
                if (!receiver || !receiver.isActive) {
                    socket.emit('error', { message: 'Получатель не найден' });
                    return;
                }

                // Сохраняем в БД через raw SQL (Prisma client может не знать о новой модели)
                const result = await prisma.$queryRaw`
                    INSERT INTO messages (senderid, receiverid, content, isread, createdat)
                    VALUES (${userId}::uuid, ${receiverId}::uuid, ${content.trim()}, false, NOW())
                    RETURNING id, senderid, receiverid, content, isread, createdat
                `;
                const message = result[0];

                const sender = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, fullName: true, photoUrl: true, role: true }
                });

                const messagePayload = {
                    id: Number(message.id),
                    senderId: message.senderid,
                    receiverId: message.receiverid,
                    content: message.content,
                    isRead: message.isread,
                    createdAt: message.createdat,
                    sender: {
                        id: sender.id,
                        fullName: sender.fullName,
                        photoUrl: sender.photoUrl,
                        role: sender.role,
                    }
                };

                // Отправляем отправителю
                socket.emit('new_message', messagePayload);

                // Отправляем получателю (если онлайн)
                io.to(`user:${receiverId}`).emit('new_message', messagePayload);

            } catch (err) {
                console.error('[Chat] send_message error:', err);
                socket.emit('error', { message: 'Ошибка отправки сообщения' });
            }
        });

        // ─── Отметить сообщения как прочитанные ──────────────────────────
        socket.on('mark_read', async (data) => {
            try {
                const { senderId } = data;
                if (!senderId) return;

                await prisma.$executeRaw`
                    UPDATE messages
                    SET isread = true
                    WHERE receiverid = ${userId}::uuid
                      AND senderid = ${senderId}::uuid
                      AND isread = false
                `;

                // Уведомляем отправителя что его сообщения прочитаны
                io.to(`user:${senderId}`).emit('messages_read', { by: userId });

            } catch (err) {
                console.error('[Chat] mark_read error:', err);
            }
        });

        // ─── Индикатор печатания ──────────────────────────────────────────
        socket.on('typing', (data) => {
            const { receiverId, isTyping } = data;
            if (!receiverId) return;
            io.to(`user:${receiverId}`).emit('user_typing', {
                userId,
                isTyping
            });
        });

        // ─── Редактирование сообщения ─────────────────────────────────────
        socket.on('edit_message', async (data) => {
            try {
                const { messageId, content } = data;
                if (!messageId || !content?.trim()) return;

                const existing = await prisma.$queryRaw`
                    SELECT id, senderid, receiverid FROM messages WHERE id = ${parseInt(messageId)}
                `;
                if (!existing[0] || existing[0].senderid !== userId) {
                    socket.emit('error', { message: 'Нельзя редактировать это сообщение' });
                    return;
                }

                await prisma.$executeRaw`
                    UPDATE messages SET content = ${content.trim()}, edited = true WHERE id = ${parseInt(messageId)}
                `;

                const payload = { messageId: parseInt(messageId), content: content.trim() };
                // Уведомляем обоих участников
                socket.emit('message_edited', payload);
                io.to(`user:${existing[0].receiverid}`).emit('message_edited', payload);

            } catch (err) {
                console.error('[Chat] edit_message error:', err);
                socket.emit('error', { message: 'Ошибка редактирования' });
            }
        });

        // ─── Удаление сообщения ───────────────────────────────────────────
        socket.on('delete_message', async (data) => {
            try {
                const { messageId } = data;
                if (!messageId) return;

                const existing = await prisma.$queryRaw`
                    SELECT id, senderid, receiverid FROM messages WHERE id = ${parseInt(messageId)}
                `;
                if (!existing[0] || existing[0].senderid !== userId) {
                    socket.emit('error', { message: 'Нельзя удалить это сообщение' });
                    return;
                }

                const receiverId = existing[0].receiverid;
                await prisma.$executeRaw`DELETE FROM messages WHERE id = ${parseInt(messageId)}`;

                const payload = { messageId: parseInt(messageId) };
                socket.emit('message_deleted', payload);
                io.to(`user:${receiverId}`).emit('message_deleted', payload);

            } catch (err) {
                console.error('[Chat] delete_message error:', err);
                socket.emit('error', { message: 'Ошибка удаления' });
            }
        });

        // ─── Отключение ───────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('user_online', { userId, online: false });
                }
            }
            console.log(`[Chat] User disconnected: ${userId}`);
        });
    });
}

module.exports = { setupChat, onlineUsers };
