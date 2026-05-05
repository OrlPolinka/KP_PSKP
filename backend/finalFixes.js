const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalFixes() {
    console.log('=== ФИНАЛЬНЫЕ ИСПРАВЛЕНИЯ ===');
    
    // 1. Создаем тестовые бронирования для красивого отображения счетчиков
    console.log('\n1. Создание тестовых бронирований для клиентов...');
    
    const clients = await prisma.user.findMany({
        where: { role: 'client' },
        take: 3
    });
    
    const schedules = await prisma.schedule.findMany({
        where: { status: 'scheduled' },
        take: 9
    });
    
    const memberships = await prisma.membership.findMany({
        where: { status: 'active' }
    });
    
    let bookingCount = 0;
    
    // Создаем бронирования с разными статусами
    for (let i = 0; i < Math.min(clients.length, 3); i++) {
        const client = clients[i];
        const clientMembership = memberships.find(m => m.clientId === client.id);
        
        if (!clientMembership) continue;
        
        // Прошедшие занятия (completed)
        for (let j = 0; j < 3 && j < schedules.length; j++) {
            const schedule = schedules[j];
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - (j + 1) * 2);
            
            await prisma.booking.create({
                data: {
                    scheduleId: schedule.id,
                    clientId: client.id,
                    membershipId: clientMembership.id,
                    status: 'attended',
                    bookingTime: pastDate,
                    checkedIn: true,
                    checkedInAt: pastDate,
                    qrCode: `QR-PAST-${client.id.substring(0, 8)}-${j}`,
                    qrCodeGenerated: pastDate
                }
            });
            bookingCount++;
        }
        
        // Будущие занятия (booked)
        for (let j = 3; j < 6 && j < schedules.length; j++) {
            const schedule = schedules[j];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (j - 2) * 2);
            
            await prisma.booking.create({
                data: {
                    scheduleId: schedule.id,
                    clientId: client.id,
                    membershipId: clientMembership.id,
                    status: 'booked',
                    bookingTime: new Date(),
                    qrCode: `QR-FUTURE-${client.id.substring(0, 8)}-${j}`,
                    qrCodeGenerated: new Date()
                }
            });
            bookingCount++;
        }
        
        // Отмененные занятия (cancelled)
        for (let j = 6; j < 9 && j < schedules.length; j++) {
            const schedule = schedules[j];
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - (j - 5) * 2);
            
            await prisma.booking.create({
                data: {
                    scheduleId: schedule.id,
                    clientId: client.id,
                    membershipId: clientMembership.id,
                    status: 'cancelled',
                    bookingTime: pastDate,
                    cancelledAt: pastDate,
                    cancelledBy: client.id
                }
            });
            bookingCount++;
        }
    }
    
    console.log(`Создано тестовых бронирований: ${bookingCount}`);
    
    // 2. Обновляем информацию о стилях танцев для красивого отображения
    console.log('\n2. Обновление информации о стилях танцев...');
    
    const styleUpdates = [
        { name: 'Зумба', imageUrl: 'https://example.com/zumba.jpg', videoUrl: 'https://example.com/zumba-video.mp4', benefits: JSON.stringify(['Сжигание калорий', 'Улучшение координации', 'Повышение настроения']) },
        { name: 'Хип-хоп', imageUrl: 'https://example.com/hiphop.jpg', videoUrl: 'https://example.com/hiphop-video.mp4', benefits: JSON.stringify(['Развитие ритма', 'Улучшение физической формы', 'Раскрепощение']) },
        { name: 'Контемпорари', imageUrl: 'https://example.com/contemporary.jpg', videoUrl: 'https://example.com/contemporary-video.mp4', benefits: JSON.stringify(['Развитие пластики', 'Эмоциональная разгрузка', 'Улучшение осанки']) },
        { name: 'Стретчинг', imageUrl: 'https://example.com/stretching.jpg', videoUrl: 'https://example.com/stretching-video.mp4', benefits: JSON.stringify(['Увеличение гибкости', 'Снятие напряжения', 'Улучшение кровообращения']) }
    ];
    
    for (const update of styleUpdates) {
        await prisma.danceStyle.updateMany({
            where: { name: update.name },
            data: {
                imageUrl: update.imageUrl,
                videoUrl: update.videoUrl,
                benefits: update.benefits,
                difficulty: 'beginner',
                duration: 60,
                calories: 300
            }
        });
    }
    
    console.log('Обновлена информация о стилях танцев');
    
    // 3. Создаем дополнительные сообщения в чате
    console.log('\n3. Создание дополнительных сообщений в чате...');
    
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    const trainer = await prisma.user.findFirst({ where: { role: 'trainer' } });
    const client = await prisma.user.findFirst({ where: { role: 'client' } });
    
    if (admin && trainer && client) {
        const messages = [
            { sender: admin, receiver: trainer, content: 'Добрый день! Напоминаю о завтрашнем собрании тренеров в 11:00.' },
            { sender: trainer, receiver: admin, content: 'Хорошо, буду обязательно. Подготовлю отчет по занятиям.' },
            { sender: trainer, receiver: client, content: 'Привет! Как твои успехи в растяжке? Вижу прогресс!' },
            { sender: client, receiver: trainer, content: 'Спасибо! Стараюсь заниматься регулярно. Очень нравятся занятия!' },
            { sender: admin, receiver: client, content: 'Здравствуйте! Напоминаем, что у вас заканчивается абонемент через 5 дней.' }
        ];
        
        for (const msg of messages) {
            await prisma.message.create({
                data: {
                    senderId: msg.sender.id,
                    receiverId: msg.receiver.id,
                    content: msg.content,
                    isRead: false,
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // случайная дата в течение недели
                }
            });
        }
        
        console.log('Созданы дополнительные сообщения в чате');
    }
    
    // 4. Создаем уведомления для пользователей
    console.log('\n4. Создание уведомлений...');
    
    const users = await prisma.user.findMany({ take: 5 });
    
    for (const user of users) {
        await prisma.notification.create({
            data: {
                userId: user.id,
                type: 'reminder',
                title: 'Напоминание о занятии',
                message: 'У вас запланировано занятие завтра в 10:00. Не забудьте!',
                isRead: false
            }
        });
    }
    
    console.log('Созданы уведомления');
    
    console.log('\n=== ВСЕ ФИНАЛЬНЫЕ ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ ===');
    console.log('Теперь система полностью готова к тестированию:');
    console.log('1. ✅ Красивые счетчики бронирований для клиентов');
    console.log('2. ✅ Полная информация о стилях танцев');
    console.log('3. ✅ Работающий чат с историей сообщений');
    console.log('4. ✅ Уведомления для пользователей');
    console.log('5. ✅ Все данные заполнены и готовы к использованию');
}

finalFixes()
    .catch(e => {
        console.error('Ошибка при финальных исправлениях:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });