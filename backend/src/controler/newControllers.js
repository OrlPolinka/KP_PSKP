/**
 * Дополнительные контроллеры для новых функций:
 * - Профили тренеров (публичные страницы)
 * - Стили танцев с подробной информацией
 * - Информация о подготовке к тренировкам
 * - QR-коды для посещений
 * - Уведомления
 * - Платежи
 */

const prisma = require('./prisma');
const QRCode = require('qrcode');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// ПРОФИЛИ ТРЕНЕРОВ (Публичные страницы)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Получить всех тренеров с публичной информацией (для страницы тренеров)
 */
async function getPublicTrainers(req, res) {
    try {
        const trainers = await prisma.trainer.findMany({
            where: {
                user: { isActive: true }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        photoUrl: true
                    }
                }
            },
            orderBy: { user: { fullName: 'asc' } }
        });

        const formattedTrainers = trainers.map(trainer => ({
            id: trainer.id,
            userId: trainer.userId,
            fullName: trainer.user?.fullName || 'Неизвестно',
            phone: trainer.user?.phone || null,
            photoUrl: trainer.photoUrl || trainer.user?.photoUrl || null,
            specialization: trainer.specialization || null,
            bio: trainer.bio || null,
            experience: trainer.experience || null,
            achievements: trainer.achievements ? JSON.parse(trainer.achievements) : null,
            isPublished: trainer.isPublished || false,
            customPageTitle: trainer.customPageTitle || null
        }));

        res.json({
            success: true,
            trainers: formattedTrainers
        });
    } catch (error) {
        console.error('getPublicTrainers error:', error);
        res.status(500).json({ error: 'Ошибка при получении списка тренеров' });
    }
}

/**
 * Получить публичный профиль тренера по ID
 */
async function getPublicTrainerById(req, res) {
    try {
        const { id } = req.params;

        const trainer = await prisma.trainer.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        photoUrl: true
                    }
                }
            }
        });

        if (!trainer) {
            return res.status(404).json({ error: 'Тренер не найден' });
        }

        // Парсим JSON поля
        let gallery = [];
        let certificates = [];
        let socialLinks = [];
        let achievements = [];

        try {
            if (trainer.gallery) gallery = JSON.parse(trainer.gallery);
        } catch (e) {}
        try {
            if (trainer.certificates) certificates = JSON.parse(trainer.certificates);
        } catch (e) {}
        try {
            if (trainer.socialLinks) socialLinks = JSON.parse(trainer.socialLinks);
        } catch (e) {}
        try {
            if (trainer.achievements) achievements = JSON.parse(trainer.achievements);
        } catch (e) {}

        const formattedTrainer = {
            id: trainer.id,
            userId: trainer.userId,
            fullName: trainer.user?.fullName || 'Неизвестно',
            phone: trainer.user?.phone || null,
            photoUrl: trainer.photoUrl || trainer.user?.photoUrl || null,
            videoUrl: trainer.videoUrl || null,
            gallery: gallery,
            specialization: trainer.specialization || null,
            bio: trainer.bio || null,
            experience: trainer.experience || null,
            achievements: achievements,
            education: trainer.education || null,
            certificates: certificates,
            socialLinks: socialLinks,
            hireDate: trainer.hireDate || null,
            isPublished: trainer.isPublished || false,
            customPageTitle: trainer.customPageTitle || null,
            customPageContent: trainer.customPageContent || null
        };

        res.json({
            success: true,
            trainer: formattedTrainer
        });
    } catch (error) {
        console.error('getPublicTrainerById error:', error);
        res.status(500).json({ error: 'Ошибка при получении профиля тренера' });
    }
}

/**
 * Обновить профиль тренера (самим тренером)
 */
async function updateTrainerProfile(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Проверяем, что тренер редактирует свой профиль
        const trainer = await prisma.trainer.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!trainer) {
            return res.status(404).json({ error: 'Тренер не найден' });
        }

        if (trainer.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Нет прав для редактирования этого профиля' });
        }

        const {
            specialization,
            bio,
            photoUrl,
            videoUrl,
            gallery,
            achievements,
            experience,
            education,
            certificates,
            socialLinks,
            customPageTitle,
            customPageContent,
            isPublished
        } = req.body;

        const updateData = {};
        if (specialization !== undefined) updateData.specialization = specialization;
        if (bio !== undefined) updateData.bio = bio;
        if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
        if (gallery !== undefined) updateData.gallery = JSON.stringify(gallery);
        if (achievements !== undefined) updateData.achievements = JSON.stringify(achievements);
        if (experience !== undefined) updateData.experience = experience;
        if (education !== undefined) updateData.education = education;
        if (certificates !== undefined) updateData.certificates = JSON.stringify(certificates);
        if (socialLinks !== undefined) updateData.socialLinks = JSON.stringify(socialLinks);
        if (customPageTitle !== undefined) updateData.customPageTitle = customPageTitle;
        if (customPageContent !== undefined) updateData.customPageContent = customPageContent;
        if (isPublished !== undefined) updateData.isPublished = isPublished;

        const updatedTrainer = await prisma.trainer.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        photoUrl: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Профиль тренера обновлён',
            trainer: updatedTrainer
        });
    } catch (error) {
        console.error('updateTrainerProfile error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении профиля тренера' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// СТИЛИ ТАНЦЕВ (с подробной информацией)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Получить все стили танцев с подробной информацией
 */
async function getDanceStylesDetailed(req, res) {
    try {
        const { role } = req.user || {};
        const where = role === 'admin' ? {} : { isActive: true };

        const danceStyles = await prisma.danceStyle.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        const formattedStyles = danceStyles.map(style => {
            let benefits = [];
            try {
                if (style.benefits) benefits = JSON.parse(style.benefits);
            } catch (e) {}

            return {
                id: style.id,
                name: style.name,
                description: style.description || null,
                longDescription: style.longDescription || null,
                videoUrl: style.videoUrl || null,
                imageUrl: style.imageUrl || null,
                benefits: benefits,
                difficulty: style.difficulty || 'beginner',
                duration: style.duration || null,
                calories: style.calories || null,
                isActive: style.isActive
            };
        });

        res.json({
            success: true,
            danceStyles: formattedStyles
        });
    } catch (error) {
        console.error('getDanceStylesDetailed error:', error);
        res.status(500).json({ error: 'Ошибка при получении стилей танцев' });
    }
}

/**
 * Получить стиль танца по ID с подробной информацией
 */
async function getDanceStyleById(req, res) {
    try {
        const { id } = req.params;

        const style = await prisma.danceStyle.findUnique({
            where: { id: parseInt(id) }
        });

        if (!style) {
            return res.status(404).json({ error: 'Стиль танца не найден' });
        }

        let benefits = [];
        try {
            if (style.benefits) benefits = JSON.parse(style.benefits);
        } catch (e) {}

        const formattedStyle = {
            id: style.id,
            name: style.name,
            description: style.description || null,
            longDescription: style.longDescription || null,
            videoUrl: style.videoUrl || null,
            imageUrl: style.imageUrl || null,
            benefits: benefits,
            difficulty: style.difficulty || 'beginner',
            duration: style.duration || null,
            calories: style.calories || null,
            isActive: style.isActive
        };

        res.json({
            success: true,
            danceStyle: formattedStyle
        });
    } catch (error) {
        console.error('getDanceStyleById error:', error);
        res.status(500).json({ error: 'Ошибка при получении стиля танца' });
    }
}

/**
 * Обновить стиль танца (с подробной информацией)
 */
async function updateDanceStyleDetailed(req, res) {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            longDescription,
            videoUrl,
            imageUrl,
            benefits,
            difficulty,
            duration,
            calories,
            isActive
        } = req.body;

        const existing = await prisma.danceStyle.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Стиль не найден' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (longDescription !== undefined) updateData.longDescription = longDescription;
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (benefits !== undefined) updateData.benefits = JSON.stringify(benefits);
        if (difficulty !== undefined) updateData.difficulty = difficulty;
        if (duration !== undefined) updateData.duration = duration;
        if (calories !== undefined) updateData.calories = calories;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await prisma.danceStyle.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json({
            success: true,
            message: 'Стиль танца обновлён',
            danceStyle: updated
        });
    } catch (error) {
        console.error('updateDanceStyleDetailed error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении стиля танца' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ИНФОРМАЦИЯ О ПОДГОТОВКЕ К ТРЕНИРОВКАМ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Получить всю информацию о подготовке
 */
async function getTrainingInfo(req, res) {
    try {
        const { category } = req.query;

        const where = { isActive: true };
        if (category) where.category = category;

        const infoList = await prisma.trainingInfo.findMany({
            where,
            orderBy: { order: 'asc' }
        });

        res.json({
            success: true,
            trainingInfo: infoList
        });
    } catch (error) {
        console.error('getTrainingInfo error:', error);
        res.status(500).json({ error: 'Ошибка при получении информации' });
    }
}

/**
 * Создать информацию о подготовке (админ)
 */
async function createTrainingInfo(req, res) {
    try {
        const { title, content, category, videoUrl, imageUrl, order } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Название, содержимое и категория обязательны' });
        }

        const info = await prisma.trainingInfo.create({
            data: {
                title,
                content,
                category,
                videoUrl: videoUrl || null,
                imageUrl: imageUrl || null,
                order: order || 0,
                isActive: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Информация создана',
            trainingInfo: info
        });
    } catch (error) {
        console.error('createTrainingInfo error:', error);
        res.status(500).json({ error: 'Ошибка при создании информации' });
    }
}

/**
 * Обновить информацию о подготовке (админ)
 */
async function updateTrainingInfo(req, res) {
    try {
        const { id } = req.params;
        const { title, content, category, videoUrl, imageUrl, order, isActive } = req.body;

        const existing = await prisma.trainingInfo.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Информация не найдена' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (category !== undefined) updateData.category = category;
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (order !== undefined) updateData.order = order;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await prisma.trainingInfo.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json({
            success: true,
            message: 'Информация обновлена',
            trainingInfo: updated
        });
    } catch (error) {
        console.error('updateTrainingInfo error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении информации' });
    }
}

/**
 * Удалить информацию о подготовке (админ)
 */
async function deleteTrainingInfo(req, res) {
    try {
        const { id } = req.params;

        await prisma.trainingInfo.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Информация удалена'
        });
    } catch (error) {
        console.error('deleteTrainingInfo error:', error);
        res.status(500).json({ error: 'Ошибка при удалении информации' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// QR-КОДЫ ДЛЯ ПОСЕЩЕНИЙ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Генерация QR-кода для бронирования
 */
async function generateBookingQRCode(req, res) {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                schedule: {
                    include: {
                        danceStyle: true,
                        trainer: {
                            include: { user: { select: { fullName: true } } }
                        }
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        // Проверяем, что это бронирование текущего пользователя
        if (booking.clientId !== userId) {
            return res.status(403).json({ error: 'Нет доступа к этой записи' });
        }

        // Проверяем, что занятие ещё не прошло
        const scheduleDateTime = new Date(booking.schedule.date);
        const [startHour, startMinute] = booking.schedule.startTime.toISOString().split('T')[1].split(':');
        scheduleDateTime.setHours(parseInt(startHour), parseInt(startMinute));

        if (scheduleDateTime < new Date()) {
            return res.status(400).json({ error: 'Занятие уже прошло' });
        }

        // Генерируем уникальный QR-код если его нет
        let qrCode = booking.qrCode;
        if (!qrCode) {
            qrCode = crypto.randomBytes(16).toString('hex');
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    qrCode,
                    qrCodeGenerated: new Date()
                }
            });
        }

        // Генерируем изображение QR-кода
        const qrData = JSON.stringify({
            bookingId: booking.id,
            qrCode: qrCode,
            scheduleId: booking.scheduleId,
            clientId: booking.clientId
        });

        const qrImage = await QRCode.toDataURL(qrData);

        res.json({
            success: true,
            qrCode: qrCode,
            qrImage: qrImage,
            booking: {
                id: booking.id,
                schedule: {
                    date: booking.schedule.date,
                    startTime: booking.schedule.startTime,
                    danceStyle: booking.schedule.danceStyle.name,
                    trainer: booking.schedule.trainer?.user?.fullName
                }
            }
        });
    } catch (error) {
        console.error('generateBookingQRCode error:', error);
        res.status(500).json({ error: 'Ошибка при генерации QR-кода' });
    }
}

/**
 * Проверка QR-кода (тренером)
 */
async function verifyBookingQRCode(req, res) {
    try {
        const { qrCode } = req.body;
        const { role, id: userId } = req.user;

        if (role !== 'trainer' && role !== 'admin') {
            return res.status(403).json({ error: 'Только тренер может проверять QR-коды' });
        }

        const booking = await prisma.booking.findFirst({
            where: { qrCode },
            include: {
                schedule: {
                    include: {
                        danceStyle: true,
                        trainer: true,
                        hall: true
                    }
                },
                client: {
                    select: { id: true, fullName: true, phone: true, photoUrl: true }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({ error: 'QR-код не найден' });
        }

        // Проверяем, что тренер проверяет своё занятие
        if (role === 'trainer') {
            const trainerRecord = await prisma.trainer.findFirst({
                where: { userId }
            });
            if (!trainerRecord || booking.schedule.trainerId !== trainerRecord.id) {
                return res.status(403).json({ error: 'Это не ваше занятие' });
            }
        }

        // Проверяем, что занятие сегодня
        const today = new Date().toISOString().split('T')[0];
        const scheduleDate = booking.schedule.date.toISOString().split('T')[0];

        if (scheduleDate !== today) {
            return res.status(400).json({
                error: 'Занятие не сегодня',
                scheduleDate: scheduleDate,
                today: today
            });
        }

        res.json({
            success: true,
            valid: true,
            booking: {
                id: booking.id,
                client: booking.client,
                schedule: {
                    date: booking.schedule.date,
                    startTime: booking.schedule.startTime,
                    endTime: booking.schedule.endTime,
                    danceStyle: booking.schedule.danceStyle,
                    hall: booking.schedule.hall
                },
                status: booking.status,
                checkedIn: booking.checkedIn
            }
        });
    } catch (error) {
        console.error('verifyBookingQRCode error:', error);
        res.status(500).json({ error: 'Ошибка при проверке QR-кода' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// УВЕДОМЛЕНИЯ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Получить уведомления пользователя
 */
async function getNotifications(req, res) {
    try {
        const { id: userId } = req.user;
        const { unreadOnly } = req.query;

        const where = { userId };
        if (unreadOnly === 'true') where.isRead = false;

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('getNotifications error:', error);
        res.status(500).json({ error: 'Ошибка при получении уведомлений' });
    }
}

/**
 * Отметить уведомление как прочитанное
 */
async function markNotificationRead(req, res) {
    try {
        const { id } = req.params;
        const { id: userId } = req.user;

        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('markNotificationRead error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
    }
}

/**
 * Отметить все уведомления как прочитанные
 */
async function markAllNotificationsRead(req, res) {
    try {
        const { id: userId } = req.user;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('markAllNotificationsRead error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении уведомлений' });
    }
}

/**
 * Создать уведомление (вспомогательная функция)
 */
async function createNotification(userId, type, title, message, data = null) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data: data ? JSON.stringify(data) : null
            }
        });
    } catch (error) {
        console.error('createNotification error:', error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ОТМЕНА ЗАНЯТИЯ ТРЕНЕРОМ С УВЕДОМЛЕНИЯМИ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Отмена занятия тренером (с уведомлением всех записанных клиентов)
 */
async function cancelScheduleByTrainer(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const { role, id: userId } = req.user;

        if (role !== 'trainer' && role !== 'admin') {
            return res.status(403).json({ error: 'Только тренер может отменить занятие' });
        }

        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                bookings: {
                    where: { status: 'booked' },
                    include: {
                        client: {
                            select: { id: true, fullName: true, email: true }
                        }
                    }
                },
                danceStyle: true
            }
        });

        if (!schedule) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        // Проверяем, что тренер отменяет своё занятие
        if (role === 'trainer') {
            const trainerRecord = await prisma.trainer.findFirst({
                where: { userId }
            });
            if (!trainerRecord || schedule.trainerId !== trainerRecord.id) {
                return res.status(403).json({ error: 'Вы можете отменять только свои занятия' });
            }
        }

        if (schedule.status === 'cancelled') {
            return res.status(400).json({ error: 'Занятие уже отменено' });
        }

        // Обновляем статус занятия
        await prisma.schedule.update({
            where: { id },
            data: {
                status: 'cancelled',
                cancellationReason: reason || 'Отменено тренером',
                cancelledBy: userId,
                cancelledAt: new Date()
            }
        });

        // Отменяем все бронирования и возвращаем занятия в абонементы
        for (const booking of schedule.bookings) {
            // Возвращаем занятие в абонемент
            const membership = await prisma.membership.findUnique({
                where: { id: booking.membershipId },
                include: { membershipType: true }
            });

            if (membership && membership.membershipType.visitCount !== null && membership.remainingVisits !== null) {
                await prisma.membership.update({
                    where: { id: booking.membershipId },
                    data: { remainingVisits: membership.remainingVisits + 1 }
                });
            }

            // Обновляем статус бронирования
            await prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelledBy: userId
                }
            });

            // Создаём уведомление для клиента
            await createNotification(
                booking.client.id,
                'class_cancelled',
                'Занятие отменено',
                `Занятие "${schedule.danceStyle?.name || 'Танцы'}" было отменено тренером. ${reason ? 'Причина: ' + reason : ''}`,
                {
                    scheduleId: id,
                    bookingId: booking.id,
                    reason: reason
                }
            );
        }

        // Обновляем счётчик записей
        await prisma.schedule.update({
            where: { id },
            data: { currentBookings: 0 }
        });

        res.json({
            success: true,
            message: 'Занятие отменено. Уведомления отправлены всем записанным клиентам.',
            cancelledBookings: schedule.bookings.length
        });
    } catch (error) {
        console.error('cancelScheduleByTrainer error:', error);
        res.status(500).json({ error: 'Ошибка при отмене занятия' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ПЛАТЕЖИ (Интеграция с платёжными системами)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Создать платёж (инициация оплаты)
 */
async function createPayment(req, res) {
    try {
        const { id: userId } = req.user;
        const { amount, membershipTypeId, description, provider = 'yookassa' } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Некорректная сумма' });
        }

        // Создаём запись о платеже
        const payment = await prisma.payment.create({
            data: {
                userId,
                amount,
                currency: 'RUB',
                status: 'pending',
                provider,
                description: description || 'Оплата абонемента',
                metadata: membershipTypeId ? JSON.stringify({ membershipTypeId }) : null
            }
        });

        // В реальном проекте здесь вызывается API платёжной системы
        // Для YooKassa:
        // const yookassa = require('./yookassa');
        // const paymentUrl = await yookassa.createPayment({
        //     amount: { value: amount, currency: 'RUB' },
        //     confirmation: { type: 'redirect', return_url: '...' },
        //     description
        // });

        res.json({
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                provider: payment.provider,
                createdAt: payment.createdAt
            },
            // В реальном проекте возвращаем URL для оплаты:
            // paymentUrl: paymentUrl.confirmation.confirmation_url
        });
    } catch (error) {
        console.error('createPayment error:', error);
        res.status(500).json({ error: 'Ошибка при создании платежа' });
    }
}

/**
 * Webhook для подтверждения платежа (от платёжной системы)
 */
async function paymentWebhook(req, res) {
    try {
        const { paymentId, status, metadata } = req.body;

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Платёж не найден' });
        }

        // Обновляем статус платежа
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status,
                providerPaymentId: req.body.providerPaymentId || null,
                updatedAt: new Date()
            }
        });

        // Если платёж успешен, создаём абонемент
        if (status === 'succeeded') {
            const meta = payment.metadata ? JSON.parse(payment.metadata) : {};
            if (meta.membershipTypeId) {
                const membershipType = await prisma.membershipType.findUnique({
                    where: { id: meta.membershipTypeId }
                });

                if (membershipType) {
                    const startDate = new Date();
                    const endDate = membershipType.durationDays
                        ? new Date(startDate.getTime() + membershipType.durationDays * 24 * 60 * 60 * 1000)
                        : null;

                    await prisma.membership.create({
                        data: {
                            clientId: payment.userId,
                            membershipTypeId: meta.membershipTypeId,
                            purchaseDate: new Date(),
                            startDate,
                            endDate,
                            remainingVisits: membershipType.visitCount,
                            status: 'active',
                            pricePaid: payment.amount,
                            paymentId: payment.id
                        }
                    });

                    // Создаём уведомление
                    await createNotification(
                        payment.userId,
                        'payment_success',
                        'Оплата прошла успешно',
                        `Абонемент "${membershipType.name}" успешно оплачен и активирован.`
                    );
                }
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('paymentWebhook error:', error);
        res.status(500).json({ error: 'Ошибка при обработке платежа' });
    }
}

/**
 * Получить историю платежей пользователя
 */
async function getPaymentHistory(req, res) {
    try {
        const { id: userId } = req.user;
        const { role } = req.user;

        const where = {};
        if (role !== 'admin') where.userId = userId;

        const payments = await prisma.payment.findMany({
            where,
            include: {
                user: {
                    select: { id: true, fullName: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json({
            success: true,
            payments
        });
    } catch (error) {
        console.error('getPaymentHistory error:', error);
        res.status(500).json({ error: 'Ошибка при получении истории платежей' });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ЭКСПОРТ
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    // Тренеры
    getPublicTrainers,
    getPublicTrainerById,
    updateTrainerProfile,

    // Стили танцев
    getDanceStylesDetailed,
    getDanceStyleById,
    updateDanceStyleDetailed,

    // Информация о подготовке
    getTrainingInfo,
    createTrainingInfo,
    updateTrainingInfo,
    deleteTrainingInfo,

    // QR-коды
    generateBookingQRCode,
    verifyBookingQRCode,

    // Уведомления
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    createNotification,

    // Отмена занятия тренером
    cancelScheduleByTrainer,

    // Платежи
    createPayment,
    paymentWebhook,
    getPaymentHistory
};
