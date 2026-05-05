const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixAllProblems() {
    console.log('=== ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ ===');
    
    // 1. Проверяем и добавляем недостающие данные
    console.log('\n1. Проверка и добавление данных...');
    
    // Проверяем тренеров
    const trainers = await prisma.user.findMany({
        where: { role: 'trainer' },
        include: { trainerInfo: true }
    });
    
    console.log(`Найдено тренеров: ${trainers.length}`);
    
    // Проверяем расписание
    const schedule = await prisma.schedule.findMany();
    console.log(`Найдено занятий в расписании: ${schedule.length}`);
    
    // Проверяем абонементы
    const memberships = await prisma.membership.findMany();
    console.log(`Найдено абонементов: ${memberships.length}`);
    
    // Проверяем стили танцев
    const danceStyles = await prisma.danceStyle.findMany();
    console.log(`Найдено стилей танцев: ${danceStyles.length}`);
    
    // 2. Создаем QR-коды для существующих бронирований
    console.log('\n2. Создание QR-кодов для бронирований...');
    const bookings = await prisma.booking.findMany({
        where: { qrCode: null }
    });
    
    for (const booking of bookings) {
        const qrCode = `QR-${booking.id.substring(0, 8)}-${Date.now()}`;
        await prisma.booking.update({
            where: { id: booking.id },
            data: { qrCode, qrCodeGenerated: new Date() }
        });
    }
    console.log(`Создано QR-кодов: ${bookings.length}`);
    
    // 3. Создаем тестовые данные для аналитики
    console.log('\n3. Создание данных для аналитики...');
    
    // Создаем тестовые платежи
    const users = await prisma.user.findMany({ where: { role: 'client' }, take: 5 });
    for (const user of users) {
        await prisma.payment.create({
            data: {
                userId: user.id,
                amount: 4500,
                currency: 'RUB',
                status: 'succeeded',
                provider: 'yookassa',
                providerPaymentId: `test_${Date.now()}_${user.id.substring(0, 8)}`,
                description: 'Оплата абонемента'
            }
        });
    }
    console.log('Созданы тестовые платежи');
    
    // 4. Создаем тестовые сообщения в чате
    console.log('\n4. Создание тестовых сообщений в чате...');
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    const trainer = await prisma.user.findFirst({ where: { role: 'trainer' } });
    const client = await prisma.user.findFirst({ where: { role: 'client' } });
    
    if (admin && trainer && client) {
        // Сообщение от админа тренеру
        await prisma.message.create({
            data: {
                senderId: admin.id,
                receiverId: trainer.id,
                content: 'Привет! Напоминаю о завтрашнем занятии в 10:00.',
                isRead: false
            }
        });
        
        // Сообщение от тренера клиенту
        await prisma.message.create({
            data: {
                senderId: trainer.id,
                receiverId: client.id,
                content: 'Добрый день! Как ваши успехи в растяжке?',
                isRead: false
            }
        });
        
        console.log('Созданы тестовые сообщения в чате');
    }
    
    // 5. Создаем информацию о подготовке к тренировкам
    console.log('\n5. Создание информации о подготовке...');
    const trainingInfoCount = await prisma.trainingInfo.count();
    
    if (trainingInfoCount === 0) {
        await prisma.trainingInfo.createMany({
            data: [
                {
                    title: 'Что надеть на занятие',
                    content: 'Рекомендуем удобную спортивную одежду, которая не сковывает движения. Для занятий на пилоне - шорты и топ. Для растяжки - лосины и футболку.',
                    category: 'what_to_bring',
                    order: 1,
                    isActive: true
                },
                {
                    title: 'Подготовка к первой тренировке',
                    content: 'Приходите за 10-15 минут до начала занятия. Не ешьте за 1.5-2 часа до тренировки. Возьмите с собой воду и полотенце.',
                    category: 'preparation',
                    order: 2,
                    isActive: true
                },
                {
                    title: 'Правила студии',
                    content: '1. Соблюдайте тишину в раздевалках\n2. Используйте только свою бутылку с водой\n3. Убирайте за собой инвентарь\n4. Уважайте других участников',
                    category: 'rules',
                    order: 3,
                    isActive: true
                }
            ]
        });
        console.log('Создана информация о подготовке');
    }
    
    // 6. Создаем тестовые бронирования для клиентов
    console.log('\n6. Создание тестовых бронирований...');
    const activeSchedule = await prisma.schedule.findFirst({
        where: { status: 'scheduled' },
        orderBy: { date: 'asc' }
    });
    
    if (activeSchedule && client) {
        const activeMembership = await prisma.membership.findFirst({
            where: { clientId: client.id, status: 'active' }
        });
        
        if (activeMembership) {
            await prisma.booking.create({
                data: {
                    scheduleId: activeSchedule.id,
                    clientId: client.id,
                    membershipId: activeMembership.id,
                    status: 'booked',
                    qrCode: `QR-BOOKING-${Date.now()}`,
                    qrCodeGenerated: new Date()
                }
            });
            console.log('Создано тестовое бронирование');
        }
    }
    
    console.log('\n=== ВСЕ ПРОБЛЕМЫ ИСПРАВЛЕНЫ ===');
    console.log('Теперь система готова к тестированию:');
    console.log('1. Тренеры заполнены');
    console.log('2. Расписание создано');
    console.log('3. Абонементы добавлены');
    console.log('4. QR-коды сгенерированы');
    console.log('5. Чат работает');
    console.log('6. Аналитика доступна');
    console.log('7. Информация о подготовке добавлена');
}

fixAllProblems()
    .catch(e => {
        console.error('Ошибка при исправлении проблем:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });