const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Начинаем заполнение базы данных...');

    // ==================== 1. ОЧИСТКА ====================
    console.log('Очистка существующих данных...');
    try { await prisma.bookingHistory.deleteMany(); } catch(e) {}
    try { await prisma.attendanceLog.deleteMany(); } catch(e) {}
    try { await prisma.booking.deleteMany(); } catch(e) {}
    try { await prisma.schedule.deleteMany(); } catch(e) {}
    try { await prisma.membership.deleteMany(); } catch(e) {}
    try { await prisma.membershipType.deleteMany(); } catch(e) {}
    try { await prisma.trainer.deleteMany(); } catch(e) {}
    try { await prisma.user.deleteMany(); } catch(e) {}
    try { await prisma.danceStyle.deleteMany(); } catch(e) {}
    try { await prisma.hall.deleteMany(); } catch(e) {}
    try { await prisma.trainingInfo.deleteMany(); } catch(e) { console.log('trainingInfo table not yet migrated, skipping'); }
    try { await prisma.notification.deleteMany(); } catch(e) { console.log('notification table not yet migrated, skipping'); }
    try { await prisma.payment.deleteMany(); } catch(e) { console.log('payment table not yet migrated, skipping'); }

    // ==================== 2. ЗАЛЫ ====================
    console.log('Создание залов...');
    await prisma.hall.createMany({
        data: [
            { name: 'Большой танцевальный зал', capacity: 25, description: 'Зал с профессиональным паркетом, зеркалами во всю стену и современной акустикой. Подходит для групповых занятий до 25 человек.', isActive: true },
            { name: 'Малый зал (индивидуальный)', capacity: 6, description: 'Уютный зал для персональных тренировок и занятий в мини-группах. Оснащен зеркалами и ковриками.', isActive: true },
            { name: 'Зал для растяжки и йоги', capacity: 12, description: 'Теплый зал с ковровым покрытием, ковриками, болстерами и блоками для йоги. Идеально для растяжки и релакса.', isActive: true },
            { name: 'Хип-хоп студия', capacity: 20, description: 'Специализированный зал с уличной атмосферой, граффити на стенах и хорошей звукоизоляцией.', isActive: true },
            { name: 'Балетный класс', capacity: 15, description: 'Классический балетный зал со станками, зеркалами и профессиональным покрытием.', isActive: true }
        ]
    });

    // ==================== 3. ТАНЦЕВАЛЬНЫЕ СТИЛИ ====================
    console.log('Создание танцевальных стилей...');
    await prisma.danceStyle.createMany({
        data: [
            { name: 'Зумба', description: 'Энергичная фитнес-программа на основе латиноамериканских ритмов. Сжигает до 600 калорий за занятие.', isActive: true, difficulty: 'beginner' },
            { name: 'Хип-хоп', description: 'Уличные танцы, включающие базовые шаги, брейкинг и современную хореографию.', isActive: true, difficulty: 'intermediate' },
            { name: 'Контемпорари', description: 'Современная хореография, сочетающая элементы джаза, балета и лирики. Развивает пластику и эмоциональность.', isActive: true, difficulty: 'advanced' },
            { name: 'Стретчинг', description: 'Растяжка всего тела для улучшения гибкости и снятия мышечного напряжения.', isActive: true, difficulty: 'beginner' },
            { name: 'Балет-фитнес', description: 'Фитнес-тренировка на основе балетных упражнений для укрепления мышц корпуса и ног.', isActive: true, difficulty: 'intermediate' },
            { name: 'Тверк', description: 'Энергичный танцевальный стиль, развивающий мышцы ягодиц и корпуса.', isActive: true, difficulty: 'intermediate' },
            { name: 'Дэнсхолл', description: 'Ямайский уличный танец с характерными движениями бедрами.', isActive: true, difficulty: 'intermediate' },
            { name: 'K-Pop танцы', description: 'Танцы под популярную корейскую музыку. Изучение хореографии групп BTS, Blackpink и других.', isActive: true, difficulty: 'beginner' },
            { name: 'Сальса', description: 'Латиноамериканский парный танец. Базовый уровень для начинающих.', isActive: true, difficulty: 'beginner' },
            { name: 'Бачата', description: 'Романтичный парный танец из Доминиканы.', isActive: true, difficulty: 'beginner' },
            { name: 'Хай-хилс', description: 'Танцы на высоких каблуках. Развивает женственность и уверенность.', isActive: true, difficulty: 'advanced' },
            { name: 'Поли-дэнс', description: 'Танцы на пилоне для укрепления мышц и развития гибкости.', isActive: true, difficulty: 'advanced' }
        ]
    });

    // ==================== 4. ТИПЫ АБОНЕМЕНТОВ ====================
    console.log('Создание типов абонементов...');
    await prisma.membershipType.createMany({
        data: [
            { name: 'Базовое занятие', description: 'Одно посещение любого группового занятия', price: 600, visitCount: 1, durationDays: null, isActive: true },
            { name: 'Пробная неделя', description: '7 дней безлимита на все групповые занятия', price: 1500, visitCount: null, durationDays: 7, isActive: true },
            { name: 'Абонемент на 4 занятия', description: '4 занятия в течение 30 дней', price: 2000, visitCount: 4, durationDays: 30, isActive: true },
            { name: 'Абонемент на 8 занятий', description: '8 занятий в течение 45 дней', price: 3600, visitCount: 8, durationDays: 45, isActive: true },
            { name: 'Абонемент на 12 занятий', description: '12 занятий в течение 60 дней', price: 5000, visitCount: 12, durationDays: 60, isActive: true },
            { name: 'Безлимитный на месяц', description: 'Безлимитное посещение всех групповых занятий на 30 дней', price: 4500, visitCount: null, durationDays: 30, isActive: true },
            { name: 'Безлимитный на 3 месяца', description: 'Безлимитное посещение на 90 дней (экономия 15%)', price: 11500, visitCount: null, durationDays: 90, isActive: true },
            { name: 'Безлимитный на год', description: 'Годовой абонемент на все групповые занятия (экономия 30%)', price: 38000, visitCount: null, durationDays: 365, isActive: true },
            { name: 'Персональная тренировка', description: 'Индивидуальное занятие с тренером (1 час)', price: 1500, visitCount: 1, durationDays: null, isActive: true },
            { name: 'Пакет 5 персональных тренировок', description: '5 индивидуальных занятий со скидкой', price: 6500, visitCount: 5, durationDays: 60, isActive: true }
        ]
    });

    // ==================== 5. ПОЛЬЗОВАТЕЛИ ====================
    console.log('Создание пользователей...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    const usersData = [
        { email: 'admin@dancestudio.ru', password: hashedPassword, role: 'admin', fullName: 'Екатерина Смирнова', phone: '+7(916)123-45-67', isActive: true },
        { email: 'admin2@dancestudio.ru', password: hashedPassword, role: 'admin', fullName: 'Алексей Волков', phone: '+7(916)234-56-78', isActive: true },
        { email: 'anna.zubareva@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Анна Зубарева', phone: '+7(916)345-67-89', isActive: true },
        { email: 'dmitry.smirnov@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Дмитрий Смирнов', phone: '+7(916)456-78-90', isActive: true },
        { email: 'ekaterina.ivanova@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Екатерина Иванова', phone: '+7(916)567-89-01', isActive: true },
        { email: 'maria.ivanova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Мария Иванова', phone: '+7(909)111-22-33', isActive: true },
        { email: 'alexey.petrov@mail.ru', password: hashedPassword, role: 'client', fullName: 'Алексей Петров', phone: '+7(909)222-33-44', isActive: true },
        { email: 'olga.sidorova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Ольга Сидорова', phone: '+7(909)333-44-55', isActive: true }
    ];

    await prisma.user.createMany({ data: usersData });

    // ==================== 6. ПОЛУЧЕНИЕ ID ====================
    const admin = await prisma.user.findUnique({ where: { email: 'admin@dancestudio.ru' } });
    const trainerAnna = await prisma.user.findUnique({ where: { email: 'anna.zubareva@dancestudio.ru' } });
    const trainerDmitry = await prisma.user.findUnique({ where: { email: 'dmitry.smirnov@dancestudio.ru' } });
    const trainerEkaterina = await prisma.user.findUnique({ where: { email: 'ekaterina.ivanova@dancestudio.ru' } });
    const clientMaria = await prisma.user.findUnique({ where: { email: 'maria.ivanova@mail.ru' } });
    const clientAlexey = await prisma.user.findUnique({ where: { email: 'alexey.petrov@mail.ru' } });
    const clientOlga = await prisma.user.findUnique({ where: { email: 'olga.sidorova@mail.ru' } });

    // ==================== 7. ТРЕНЕРЫ ====================
    console.log('Создание профилей тренеров...');
    await prisma.trainer.createMany({
        data: [
            {
                id: trainerAnna.id, userId: trainerAnna.id,
                specialization: 'Зумба, Дэнсхолл, Тверк',
                bio: 'Сертифицированный инструктор Zumba с международным сертификатом. Победительница всероссийских конкурсов по Dancehall 2021 и 2022 года. Веду занятия для всех уровней подготовки — от новичков до продвинутых. Моя цель — сделать каждое занятие праздником движения!',
                experience: 6,
                education: 'Российский государственный университет физической культуры, специальность "Хореография"',
                achievements: JSON.stringify(['Победительница конкурса Dancehall Battle 2021', 'Сертифицированный инструктор Zumba (международный)', 'Участница фестиваля уличных танцев Москва 2022', 'Тренер года студии 2023']),
                certificates: JSON.stringify(['Zumba Instructor Network (ZIN)', 'Сертификат по фитнес-аэробике', 'Первая медицинская помощь']),
                socialLinks: JSON.stringify([{'name': 'Instagram', 'url': 'https://instagram.com', 'icon': '📸'}, {'name': 'VK', 'url': 'https://vk.com', 'icon': '💙'}]),
                customPageTitle: 'Добро пожаловать на мои занятия!',
                customPageContent: 'Я верю, что танец — это лучший способ выразить себя и зарядиться энергией. На моих занятиях вы не только научитесь двигаться, но и обретёте уверенность в себе. Жду вас!',
                isPublished: true,
                hireDate: new Date('2022-03-15')
            },
            {
                id: trainerDmitry.id, userId: trainerDmitry.id,
                specialization: 'Хип-хоп, K-Pop танцы, Хай-хилс',
                bio: 'Участник команды Street Dance Crew, выступавшей на крупнейших фестивалях России. Тренирую детей и взрослых уже 5 лет. Специализируюсь на уличных стилях и современной хореографии. Каждое занятие — это новый уровень!',
                experience: 5,
                education: 'Московский хореографический колледж',
                achievements: JSON.stringify(['Участник Street Dance Crew', 'Финалист Battle of the Year Russia 2020', 'Хореограф музыкального клипа 2022', 'Победитель Hip-Hop International Russia 2021']),
                certificates: JSON.stringify(['Сертификат преподавателя хип-хопа', 'Сертификат K-Pop Dance Academy Seoul']),
                socialLinks: JSON.stringify([{'name': 'Instagram', 'url': 'https://instagram.com', 'icon': '📸'}, {'name': 'YouTube', 'url': 'https://youtube.com', 'icon': '🎬'}]),
                customPageTitle: 'Хип-хоп — это образ жизни',
                customPageContent: 'Уличные танцы — это не просто движения, это культура, история и самовыражение. Приходите на мои занятия и откройте для себя этот удивительный мир!',
                isPublished: true,
                hireDate: new Date('2022-06-20')
            },
            {
                id: trainerEkaterina.id, userId: trainerEkaterina.id,
                specialization: 'Контемпорари, Стретчинг, Балет-фитнес',
                bio: 'Профессиональный хореограф с образованием в Академии балета. 8 лет преподавательского опыта. Работала в профессиональных театрах и танцевальных компаниях. Помогаю ученикам раскрыть внутреннюю красоту через движение.',
                experience: 8,
                education: 'Академия русского балета им. А.Я. Вагановой, Санкт-Петербург',
                achievements: JSON.stringify(['Солистка театра современного танца 2015-2019', 'Хореограф спектакля "Времена года" 2020', 'Лауреат премии "Лучший педагог по хореографии" 2022', 'Участница международного фестиваля Contemporary Dance Berlin']),
                certificates: JSON.stringify(['Диплом хореографа высшей категории', 'Сертификат Pilates instructor', 'Сертификат по йоге (200 часов)']),
                socialLinks: JSON.stringify([{'name': 'Instagram', 'url': 'https://instagram.com', 'icon': '📸'}]),
                customPageTitle: 'Танец как искусство и терапия',
                customPageContent: 'Контемпорари — это язык тела, который позволяет выразить то, что невозможно передать словами. На моих занятиях вы научитесь слушать своё тело и двигаться в гармонии с собой.',
                isPublished: true,
                hireDate: new Date('2021-09-10')
            }
        ]
    });

    // ==================== 8. СОЗДАНИЕ РАСПИСАНИЯ ====================
    console.log('Создание расписания...');
    
    // Получаем ID стилей
    const zumbaStyle = await prisma.danceStyle.findFirst({ where: { name: 'Зумба' } });
    const hiphopStyle = await prisma.danceStyle.findFirst({ where: { name: 'Хип-хоп' } });
    const contemporaryStyle = await prisma.danceStyle.findFirst({ where: { name: 'Контемпорари' } });
    const stretchingStyle = await prisma.danceStyle.findFirst({ where: { name: 'Стретчинг' } });
    const balletStyle = await prisma.danceStyle.findFirst({ where: { name: 'Балет-фитнес' } });
    
    // Получаем ID залов
    const bigHall = await prisma.hall.findFirst({ where: { name: 'Большой танцевальный зал' } });
    const yogaHall = await prisma.hall.findFirst({ where: { name: 'Зал для растяжки и йоги' } });
    const hiphopHall = await prisma.hall.findFirst({ where: { name: 'Хип-хоп студия' } });
    const balletHall = await prisma.hall.findFirst({ where: { name: 'Балетный класс' } });
    
    // Создаем расписание на ближайшие 7 дней
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Утренние занятия
        await prisma.schedule.create({
            data: {
                danceStyleId: zumbaStyle.id,
                trainerId: trainerAnna.id,
                hallId: bigHall.id,
                date: date,
                startTime: new Date(`1970-01-01T09:00:00`),
                endTime: new Date(`1970-01-01T10:00:00`),
                maxCapacity: 20,
                currentBookings: 0,
                status: 'scheduled',
                createdBy: admin.id
            }
        });
        
        await prisma.schedule.create({
            data: {
                danceStyleId: hiphopStyle.id,
                trainerId: trainerDmitry.id,
                hallId: hiphopHall.id,
                date: date,
                startTime: new Date(`1970-01-01T10:30:00`),
                endTime: new Date(`1970-01-01T11:30:00`),
                maxCapacity: 15,
                currentBookings: 0,
                status: 'scheduled',
                createdBy: admin.id
            }
        });
        
        // Дневные занятия
        await prisma.schedule.create({
            data: {
                danceStyleId: contemporaryStyle.id,
                trainerId: trainerEkaterina.id,
                hallId: bigHall.id,
                date: date,
                startTime: new Date(`1970-01-01T14:00:00`),
                endTime: new Date(`1970-01-01T15:00:00`),
                maxCapacity: 18,
                currentBookings: 0,
                status: 'scheduled',
                createdBy: admin.id
            }
        });
        
        // Вечерние занятия
        await prisma.schedule.create({
            data: {
                danceStyleId: stretchingStyle.id,
                trainerId: trainerEkaterina.id,
                hallId: yogaHall.id,
                date: date,
                startTime: new Date(`1970-01-01T18:00:00`),
                endTime: new Date(`1970-01-01T19:00:00`),
                maxCapacity: 12,
                currentBookings: 0,
                status: 'scheduled',
                createdBy: admin.id
            }
        });
        
        await prisma.schedule.create({
            data: {
                danceStyleId: balletStyle.id,
                trainerId: trainerEkaterina.id,
                hallId: balletHall.id,
                date: date,
                startTime: new Date(`1970-01-01T19:30:00`),
                endTime: new Date(`1970-01-01T20:30:00`),
                maxCapacity: 10,
                currentBookings: 0,
                status: 'scheduled',
                createdBy: admin.id
            }
        });
    }
    
    // ==================== 9. СОЗДАНИЕ АБОНЕМЕНТОВ ====================
    console.log('Создание абонементов...');
    
    // Получаем типы абонементов
    const monthUnlimited = await prisma.membershipType.findFirst({ where: { name: 'Безлимитный на месяц' } });
    const fourClasses = await prisma.membershipType.findFirst({ where: { name: 'Абонемент на 4 занятия' } });
    
    // Создаем абонементы для клиентов
    const clients = [clientMaria, clientAlexey, clientOlga];
    
    for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        
        await prisma.membership.create({
            data: {
                clientId: client.id,
                membershipTypeId: i % 2 === 0 ? monthUnlimited.id : fourClasses.id,
                startDate: startDate,
                endDate: endDate,
                remainingVisits: i % 2 === 0 ? null : 4,
                status: 'active',
                purchaseDate: new Date(),
                pricePaid: i % 2 === 0 ? 4500 : 2000
            }
        });
    }
    
    console.log('✅ База данных успешно заполнена!');
}

main()
    .catch(e => {
        console.error('Ошибка при заполнении базы данных:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });