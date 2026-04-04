const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Начинаем заполнение базы данных...');

    // ==================== 1. ОЧИСТКА ТАБЛИЦ ====================
    console.log('🧹 Очистка существующих данных...');
    await prisma.bookingHistory.deleteMany();
    await prisma.attendanceLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.membershipType.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.danceStyle.deleteMany();
    await prisma.hall.deleteMany();

    // ==================== 2. ЗАЛЫ ====================
    console.log('🏢 Создание залов...');
    const halls = await prisma.hall.createMany({
        data: [
            { name: 'Большой танцевальный зал', capacity: 25, description: 'Зал с профессиональным паркетом, зеркалами во всю стену и современной акустикой. Подходит для групповых занятий до 25 человек.', isActive: true },
            { name: 'Малый зал (индивидуальный)', capacity: 6, description: 'Уютный зал для персональных тренировок и занятий в мини-группах. Оснащен зеркалами и ковриками.', isActive: true },
            { name: 'Зал для растяжки и йоги', capacity: 12, description: 'Теплый зал с ковровым покрытием, ковриками, болстерами и блоками для йоги. Идеально для растяжки и релакса.', isActive: true },
            { name: 'Хип-хоп студия', capacity: 20, description: 'Специализированный зал с уличной атмосферой, граффити на стенах и хорошей звукоизоляцией.', isActive: true },
            { name: 'Балетный класс', capacity: 15, description: 'Классический балетный зал с станками, зеркалами и профессиональным покрытием.', isActive: true }
        ]
    });

    // ==================== 3. ТАНЦЕВАЛЬНЫЕ СТИЛИ ====================
    console.log('💃 Создание танцевальных стилей...');
    const danceStyles = await prisma.danceStyle.createMany({
        data: [
            { name: 'Zumba', description: 'Энергичная фитнес-программа на основе латиноамериканских ритмов. Сжигает до 600 калорий за занятие.', isActive: true },
            { name: 'Hip-Hop', description: 'Уличные танцы, включающие базовые шаги, брейкинг и современную хореографию.', isActive: true },
            { name: 'Contemporary', description: 'Современная хореография, сочетающая элементы джаза, балета и лирики. Развивает пластику и эмоциональность.', isActive: true },
            { name: 'Stretching', description: 'Растяжка всего тела для улучшения гибкости и снятия мышечного напряжения.', isActive: true },
            { name: 'Ballet Body', description: 'Фитнес-тренировка на основе балетных упражнений для укрепления мышц корпуса и ног.', isActive: true },
            { name: 'Twerk', description: 'Энергичный танцевальный стиль, развивающий мышцы ягодиц и корпуса.', isActive: true },
            { name: 'Dancehall', description: 'Ямайский уличный танец с характерными движениями бедрами.', isActive: true },
            { name: 'K-Pop Dance', description: 'Танцы под популярную корейскую музыку. Изучение хореографии групп BTS, Blackpink и других.', isActive: true },
            { name: 'Salsa', description: 'Латиноамериканский парный танец. Базовый уровень для начинающих.', isActive: true },
            { name: 'Bachata', description: 'Романтичный парный танец из Доминиканы.', isActive: true },
            { name: 'High Heels', description: 'Танцы на высоких каблуках. Развивает женственность и уверенность.', isActive: true },
            { name: 'Pole Dance (на пилоне)', description: 'Танцы на пилоне для укрепления мышц и развития гибкости.', isActive: true }
        ]
    });

    // ==================== 4. ТИПЫ АБОНЕМЕНТОВ ====================
    console.log('🎫 Создание типов абонементов...');
    const membershipTypes = await prisma.membershipType.createMany({
        data: [
            { name: 'Разовое занятие', description: 'Одно посещение любого группового занятия', price: 600, visitCount: 1, durationDays: null, isActive: true },
            { name: 'Пробная неделя', description: '7 дней безлимита на все групповые занятия', price: 1500, visitCount: null, durationDays: 7, isActive: true },
            { name: 'Абонемент на 4 занятия', description: '4 занятия в течение 30 дней', price: 2000, visitCount: 4, durationDays: 30, isActive: true },
            { name: 'Абонемент на 8 занятий', description: '8 занятий в течение 45 дней', price: 3600, visitCount: 8, durationDays: 45, isActive: true },
            { name: 'Абонемент на 12 занятий', description: '12 занятий в течение 60 дней', price: 5000, visitCount: 12, durationDays: 60, isActive: true },
            { name: 'Безлимитный на месяц', description: 'Безлимитное посещение всех групповых занятий на 30 дней', price: 4500, visitCount: null, durationDays: 30, isActive: true },
            { name: 'Безлимитный на 3 месяца', description: 'Безлимитное посещение на 90 дней (экономия 15%)', price: 11500, visitCount: null, durationDays: 90, isActive: true },
            { name: 'Безлимитный на год', description: 'Годовой абонемент на все групповые занятия (экономия 30%)', price: 38000, visitCount: null, durationDays: 365, isActive: true },
            { name: 'Персональные тренировки (1 час)', description: 'Индивидуальное занятие с тренером', price: 1500, visitCount: 1, durationDays: null, isActive: true },
            { name: 'Пакет персональных тренировок (5 часов)', description: '5 индивидуальных занятий со скидкой', price: 6500, visitCount: 5, durationDays: 60, isActive: true }
        ]
    });

    // ==================== 5. ПОЛЬЗОВАТЕЛИ ====================
    console.log('👥 Создание пользователей...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    const usersData = [
        // АДМИНИСТРАТОРЫ
        { email: 'admin@dancestudio.ru', password: hashedPassword, role: 'admin', fullName: 'Екатерина Смирнова', phone: '+7(916)123-45-67', isActive: true },
        { email: 'director@dancestudio.ru', password: hashedPassword, role: 'admin', fullName: 'Алексей Волков', phone: '+7(916)234-56-78', isActive: true },
        
        // ТРЕНЕРЫ
        { email: 'anna.zubareva@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Анна Зубарева', phone: '+7(916)345-67-89', isActive: true },
        { email: 'dmitry.kozlov@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Дмитрий Козлов', phone: '+7(916)456-78-90', isActive: true },
        { email: 'elena.morozova@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Елена Морозова', phone: '+7(916)567-89-01', isActive: true },
        { email: 'mikhail.sokolov@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Михаил Соколов', phone: '+7(916)678-90-12', isActive: true },
        { email: 'olga.volkova@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Ольга Волкова', phone: '+7(916)789-01-23', isActive: true },
        { email: 'ivan.petrov@dancestudio.ru', password: hashedPassword, role: 'trainer', fullName: 'Иван Петров', phone: '+7(916)890-12-34', isActive: true },
        
        // КЛИЕНТЫ
        { email: 'maria.ivanova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Мария Иванова', phone: '+7(909)111-22-33', isActive: true },
        { email: 'ekaterina.sidorova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Екатерина Сидорова', phone: '+7(909)222-33-44', isActive: true },
        { email: 'olga.kuznetsova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Ольга Кузнецова', phone: '+7(909)333-44-55', isActive: true },
        { email: 'anna.popova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Анна Попова', phone: '+7(909)444-55-66', isActive: true },
        { email: 'svetlana.vasilieva@mail.ru', password: hashedPassword, role: 'client', fullName: 'Светлана Васильева', phone: '+7(909)555-66-77', isActive: true },
        { email: 'elena.pavlova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Елена Павлова', phone: '+7(909)666-77-88', isActive: true },
        { email: 'tatyana.semenova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Татьяна Семенова', phone: '+7(909)777-88-99', isActive: true },
        { email: 'natalia.grigorieva@mail.ru', password: hashedPassword, role: 'client', fullName: 'Наталья Григорьева', phone: '+7(909)888-99-00', isActive: true },
        { email: 'irina.mikhailova@mail.ru', password: hashedPassword, role: 'client', fullName: 'Ирина Михайлова', phone: '+7(909)999-00-11', isActive: true },
        { email: 'alexey.fedorov@mail.ru', password: hashedPassword, role: 'client', fullName: 'Алексей Федоров', phone: '+7(909)000-11-22', isActive: true },
        { email: 'dmitry.nikolaev@mail.ru', password: hashedPassword, role: 'client', fullName: 'Дмитрий Николаев', phone: '+7(909)111-22-33', isActive: true },
        { email: 'sergey.andreev@mail.ru', password: hashedPassword, role: 'client', fullName: 'Сергей Андреев', phone: '+7(909)222-33-44', isActive: true }
    ];

    await prisma.user.createMany({ data: usersData });

    // ==================== 6. ПОЛУЧАЕМ ID ====================
    const admin = await prisma.user.findUnique({ where: { email: 'admin@dancestudio.ru' } });
    const admin2 = await prisma.user.findUnique({ where: { email: 'director@dancestudio.ru' } });
    
    const trainerAnna = await prisma.user.findUnique({ where: { email: 'anna.zubareva@dancestudio.ru' } });
    const trainerDmitry = await prisma.user.findUnique({ where: { email: 'dmitry.kozlov@dancestudio.ru' } });
    const trainerElena = await prisma.user.findUnique({ where: { email: 'elena.morozova@dancestudio.ru' } });
    const trainerMikhail = await prisma.user.findUnique({ where: { email: 'mikhail.sokolov@dancestudio.ru' } });
    const trainerOlga = await prisma.user.findUnique({ where: { email: 'olga.volkova@dancestudio.ru' } });
    const trainerIvan = await prisma.user.findUnique({ where: { email: 'ivan.petrov@dancestudio.ru' } });
    
    const clientMaria = await prisma.user.findUnique({ where: { email: 'maria.ivanova@mail.ru' } });
    const clientEkaterina = await prisma.user.findUnique({ where: { email: 'ekaterina.sidorova@mail.ru' } });
    const clientOlga = await prisma.user.findUnique({ where: { email: 'olga.kuznetsova@mail.ru' } });
    const clientAnna = await prisma.user.findUnique({ where: { email: 'anna.popova@mail.ru' } });
    const clientSvetlana = await prisma.user.findUnique({ where: { email: 'svetlana.vasilieva@mail.ru' } });
    const clientElena = await prisma.user.findUnique({ where: { email: 'elena.pavlova@mail.ru' } });
    const clientTatyana = await prisma.user.findUnique({ where: { email: 'tatyana.semenova@mail.ru' } });
    const clientNatalia = await prisma.user.findUnique({ where: { email: 'natalia.grigorieva@mail.ru' } });
    const clientIrina = await prisma.user.findUnique({ where: { email: 'irina.mikhailova@mail.ru' } });
    const clientAlexey = await prisma.user.findUnique({ where: { email: 'alexey.fedorov@mail.ru' } });
    const clientDmitry = await prisma.user.findUnique({ where: { email: 'dmitry.nikolaev@mail.ru' } });
    const clientSergey = await prisma.user.findUnique({ where: { email: 'sergey.andreev@mail.ru' } });

    // ==================== 7. ПРОФИЛИ ТРЕНЕРОВ ====================
    console.log('🏋️ Создание профилей тренеров...');
    await prisma.trainer.createMany({
        data: [
            { id: trainerAnna.id, userId: trainerAnna.id, specialization: 'Zumba, Dancehall, Twerk', bio: 'Сертифицированный инструктор Zumba. Стаж 6 лет. Победительница всероссийских конкурсов по Dancehall.', hireDate: new Date('2022-03-15') },
            { id: trainerDmitry.id, userId: trainerDmitry.id, specialization: 'Hip-Hop, K-Pop, High Heels', bio: 'Участник команды Street Dance Crew. Тренирует детей и взрослых. Стаж 5 лет.', hireDate: new Date('2022-06-20') },
            { id: trainerElena.id, userId: trainerElena.id, specialization: 'Contemporary, Stretching, Ballet Body', bio: 'Профессиональный хореограф с образованием в Академии балета. Стаж 8 лет.', hireDate: new Date('2021-09-10') },
            { id: trainerMikhail.id, userId: trainerMikhail.id, specialization: 'Salsa, Bachata', bio: 'Тренер по латиноамериканским танцам. Участник международных фестивалей.', hireDate: new Date('2023-01-25') },
            { id: trainerOlga.id, userId: trainerOlga.id, specialization: 'Pole Dance, Stretching', bio: 'Мастер спорта по спортивной гимнастике. Тренер по пилону 4 года.', hireDate: new Date('2022-11-05') },
            { id: trainerIvan.id, userId: trainerIvan.id, specialization: 'Hip-Hop, Twerk', bio: 'Танцор с 10-летним стажем. Работал с известными артистами.', hireDate: new Date('2023-04-18') }
        ]
    });

    // ==================== 8. ЗАНЯТИЯ В РАСПИСАНИИ ====================
    console.log('📅 Создание расписания на неделю...');

    // Получаем актуальные стили из БД
    const styles = await prisma.danceStyle.findMany();
    console.log(`Найдено стилей: ${styles.length}`);
    const danceStyleMap = {};
    styles.forEach(s => {
        danceStyleMap[s.name] = s.id;
        console.log(`  - ${s.name} → ${s.id}`);
    });

    // Получаем залы
    const hallsList = await prisma.hall.findMany();
    console.log(`Найдено залов: ${hallsList.length}`);
    const hallMap = {};
    hallsList.forEach(h => {
        hallMap[h.name] = h.id;
        console.log(`  - ${h.name} → ${h.id}`);
    });

    // Базовые даты
    const today = new Date();
    const getDate = (daysOffset) => {
        const date = new Date(today);
        date.setDate(today.getDate() + daysOffset);
        date.setHours(0, 0, 0, 0);
        return date;
    };

    const createTime = (timeStr) => {
        return new Date(`1970-01-01T${timeStr}`);
    };

    const scheduleData = [
        { danceStyleName: 'Zumba', trainerEmail: 'anna.zubareva@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 0, startTime: '10:00:00', endTime: '11:00:00', maxCapacity: 20 },
        { danceStyleName: 'Stretching', trainerEmail: 'elena.morozova@dancestudio.ru', hallName: 'Зал для растяжки и йоги', daysOffset: 0, startTime: '12:00:00', endTime: '13:00:00', maxCapacity: 12 },
        { danceStyleName: 'Hip-Hop', trainerEmail: 'dmitry.kozlov@dancestudio.ru', hallName: 'Хип-хоп студия', daysOffset: 0, startTime: '18:00:00', endTime: '19:30:00', maxCapacity: 18 },
        { danceStyleName: 'Contemporary', trainerEmail: 'elena.morozova@dancestudio.ru', hallName: 'Балетный класс', daysOffset: 0, startTime: '19:00:00', endTime: '20:30:00', maxCapacity: 15 },
        { danceStyleName: 'Salsa', trainerEmail: 'mikhail.sokolov@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 1, startTime: '19:00:00', endTime: '20:30:00', maxCapacity: 20 },
        { danceStyleName: 'Pole Dance (на пилоне)', trainerEmail: 'olga.volkova@dancestudio.ru', hallName: 'Малый зал (индивидуальный)', daysOffset: 1, startTime: '20:00:00', endTime: '21:00:00', maxCapacity: 6 },
        { danceStyleName: 'K-Pop Dance', trainerEmail: 'dmitry.kozlov@dancestudio.ru', hallName: 'Хип-хоп студия', daysOffset: 1, startTime: '18:00:00', endTime: '19:30:00', maxCapacity: 15 },
        { danceStyleName: 'Twerk', trainerEmail: 'anna.zubareva@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 1, startTime: '20:30:00', endTime: '21:30:00', maxCapacity: 15 },
        { danceStyleName: 'Ballet Body', trainerEmail: 'elena.morozova@dancestudio.ru', hallName: 'Балетный класс', daysOffset: 2, startTime: '10:00:00', endTime: '11:00:00', maxCapacity: 12 },
        { danceStyleName: 'Hip-Hop', trainerEmail: 'ivan.petrov@dancestudio.ru', hallName: 'Хип-хоп студия', daysOffset: 2, startTime: '19:00:00', endTime: '20:30:00', maxCapacity: 18 },
        { danceStyleName: 'Bachata', trainerEmail: 'mikhail.sokolov@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 2, startTime: '20:00:00', endTime: '21:30:00', maxCapacity: 20 },
        { danceStyleName: 'High Heels', trainerEmail: 'dmitry.kozlov@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 2, startTime: '21:00:00', endTime: '22:00:00', maxCapacity: 12 },
        { danceStyleName: 'Zumba', trainerEmail: 'anna.zubareva@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 3, startTime: '18:00:00', endTime: '19:00:00', maxCapacity: 20 },
        { danceStyleName: 'Dancehall', trainerEmail: 'anna.zubareva@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 3, startTime: '19:30:00', endTime: '21:00:00', maxCapacity: 18 },
        { danceStyleName: 'Stretching', trainerEmail: 'olga.volkova@dancestudio.ru', hallName: 'Зал для растяжки и йоги', daysOffset: 3, startTime: '20:00:00', endTime: '21:00:00', maxCapacity: 12 },
        { danceStyleName: 'Contemporary', trainerEmail: 'elena.morozova@dancestudio.ru', hallName: 'Балетный класс', daysOffset: 4, startTime: '18:30:00', endTime: '20:00:00', maxCapacity: 15 },
        { danceStyleName: 'Twerk', trainerEmail: 'ivan.petrov@dancestudio.ru', hallName: 'Хип-хоп студия', daysOffset: 4, startTime: '20:00:00', endTime: '21:30:00', maxCapacity: 15 },
        { danceStyleName: 'Pole Dance (на пилоне)', trainerEmail: 'olga.volkova@dancestudio.ru', hallName: 'Малый зал (индивидуальный)', daysOffset: 4, startTime: '21:00:00', endTime: '22:00:00', maxCapacity: 6 },
        { danceStyleName: 'Zumba', trainerEmail: 'anna.zubareva@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 5, startTime: '11:00:00', endTime: '12:00:00', maxCapacity: 25 },
        { danceStyleName: 'Ballet Body', trainerEmail: 'elena.morozova@dancestudio.ru', hallName: 'Балетный класс', daysOffset: 5, startTime: '15:00:00', endTime: '16:00:00', maxCapacity: 12 },
        { danceStyleName: 'Bachata', trainerEmail: 'mikhail.sokolov@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 5, startTime: '18:00:00', endTime: '19:30:00', maxCapacity: 20 },
        { danceStyleName: 'Stretching', trainerEmail: 'elena.morozova@dancestudio.ru', hallName: 'Зал для растяжки и йоги', daysOffset: 6, startTime: '11:00:00', endTime: '12:00:00', maxCapacity: 12 },
        { danceStyleName: 'K-Pop Dance', trainerEmail: 'dmitry.kozlov@dancestudio.ru', hallName: 'Хип-хоп студия', daysOffset: 6, startTime: '15:00:00', endTime: '16:30:00', maxCapacity: 15 },
        { danceStyleName: 'Salsa', trainerEmail: 'mikhail.sokolov@dancestudio.ru', hallName: 'Большой танцевальный зал', daysOffset: 6, startTime: '18:00:00', endTime: '19:30:00', maxCapacity: 20 }
    ];

    const getTrainerId = async (email) => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error(`Тренер ${email} не найден`);
        const trainer = await prisma.trainer.findUnique({ where: { id: user.id } });
        if (!trainer) throw new Error(`Профиль тренера для ${email} не найден`);
        return trainer.id;
    };

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@dancestudio.ru' } });

    for (const s of scheduleData) {
        const danceStyleId = danceStyleMap[s.danceStyleName];
        if (!danceStyleId) {
            console.error(`❌ Стиль "${s.danceStyleName}" не найден в базе!`);
            continue;
        }
        
        const trainerId = await getTrainerId(s.trainerEmail);
        const hallId = hallMap[s.hallName];
        if (!hallId) {
            console.error(`❌ Зал "${s.hallName}" не найден в базе!`);
            continue;
        }
        
        const date = getDate(s.daysOffset);
        const startTime = createTime(s.startTime);
        const endTime = createTime(s.endTime);
        
        await prisma.schedule.create({
            data: {
                danceStyle: { connect: { id: danceStyleId } },
                trainer: { connect: { id: trainerId } },
                hall: { connect: { id: hallId } },
                date,
                startTime,
                endTime,
                maxCapacity: s.maxCapacity,
                currentBookings: 0,
                status: 'scheduled',
                createdByUser: { connect: { id: adminUser.id } }
            }
        });
        console.log(`✅ Создано занятие: ${s.danceStyleName}, ${s.trainerEmail}, ${s.startTime}`);
    }

    // ==================== 9. АБОНЕМЕНТЫ КЛИЕНТОВ ====================
    console.log('💳 Покупка абонементов клиентами...');
    
    const membershipTypeMap = {};
    const types = await prisma.membershipType.findMany();
    types.forEach(t => { membershipTypeMap[t.name] = t.id; });

    const now = new Date();
    const membershipsData = [
        // Мария Иванова
        { clientId: clientMaria.id, membershipTypeId: membershipTypeMap['Абонемент на 8 занятий'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 45*24*60*60*1000), remainingVisits: 8, status: 'active', pricePaid: 3600 },
        // Екатерина Сидорова
        { clientId: clientEkaterina.id, membershipTypeId: membershipTypeMap['Безлимитный на месяц'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 30*24*60*60*1000), remainingVisits: null, status: 'active', pricePaid: 4500 },
        // Ольга Кузнецова
        { clientId: clientOlga.id, membershipTypeId: membershipTypeMap['Абонемент на 4 занятия'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 30*24*60*60*1000), remainingVisits: 4, status: 'active', pricePaid: 2000 },
        // Анна Попова
        { clientId: clientAnna.id, membershipTypeId: membershipTypeMap['Разовое занятие'], purchaseDate: new Date(now), startDate: new Date(now), endDate: null, remainingVisits: 1, status: 'active', pricePaid: 600 },
        // Светлана Васильева
        { clientId: clientSvetlana.id, membershipTypeId: membershipTypeMap['Пакет персональных тренировок (5 часов)'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 60*24*60*60*1000), remainingVisits: 5, status: 'active', pricePaid: 6500 },
        // Елена Павлова
        { clientId: clientElena.id, membershipTypeId: membershipTypeMap['Безлимитный на 3 месяца'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 90*24*60*60*1000), remainingVisits: null, status: 'active', pricePaid: 11500 },
        // Татьяна Семенова
        { clientId: clientTatyana.id, membershipTypeId: membershipTypeMap['Абонемент на 12 занятий'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 60*24*60*60*1000), remainingVisits: 12, status: 'active', pricePaid: 5000 },
        // Наталья Григорьева
        { clientId: clientNatalia.id, membershipTypeId: membershipTypeMap['Безлимитный на год'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 365*24*60*60*1000), remainingVisits: null, status: 'active', pricePaid: 38000 },
        // Ирина Михайлова
        { clientId: clientIrina.id, membershipTypeId: membershipTypeMap['Абонемент на 8 занятий'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 45*24*60*60*1000), remainingVisits: 8, status: 'active', pricePaid: 3600 },
        // Алексей Федоров
        { clientId: clientAlexey.id, membershipTypeId: membershipTypeMap['Разовое занятие'], purchaseDate: new Date(now), startDate: new Date(now), endDate: null, remainingVisits: 1, status: 'active', pricePaid: 600 },
        // Дмитрий Николаев
        { clientId: clientDmitry.id, membershipTypeId: membershipTypeMap['Пробная неделя'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 7*24*60*60*1000), remainingVisits: null, status: 'active', pricePaid: 1500 },
        // Сергей Андреев
        { clientId: clientSergey.id, membershipTypeId: membershipTypeMap['Абонемент на 4 занятия'], purchaseDate: new Date(now), startDate: new Date(now), endDate: new Date(now.getTime() + 30*24*60*60*1000), remainingVisits: 4, status: 'active', pricePaid: 2000 }
    ];

    await prisma.membership.createMany({ data: membershipsData });

    // ==================== 10. ЗАПИСИ НА ЗАНЯТИЯ ====================
    console.log('📝 Создание записей на занятия...');

    const schedulesList = await prisma.schedule.findMany();
    const membershipsList = await prisma.membership.findMany();

    // Создаем карту membershipId по clientId
    const clientMembershipMap = {};
    for (const m of membershipsList) {
        if (!clientMembershipMap[m.clientId]) {
            clientMembershipMap[m.clientId] = m.id;
        }
    }

    // Записи на занятия (без attendedAt)
    const bookingsData = [
        { scheduleId: schedulesList[0].id, clientId: clientMaria.id, membershipId: clientMembershipMap[clientMaria.id], status: 'attended', bookingTime: new Date(now.getTime() - 3*24*60*60*1000) },
        { scheduleId: schedulesList[0].id, clientId: clientEkaterina.id, membershipId: clientMembershipMap[clientEkaterina.id], status: 'attended', bookingTime: new Date(now.getTime() - 3*24*60*60*1000) },
        { scheduleId: schedulesList[1].id, clientId: clientOlga.id, membershipId: clientMembershipMap[clientOlga.id], status: 'attended', bookingTime: new Date(now.getTime() - 3*24*60*60*1000) },
        { scheduleId: schedulesList[2].id, clientId: clientAnna.id, membershipId: clientMembershipMap[clientAnna.id], status: 'attended', bookingTime: new Date(now.getTime() - 3*24*60*60*1000) },
        { scheduleId: schedulesList[3].id, clientId: clientSvetlana.id, membershipId: clientMembershipMap[clientSvetlana.id], status: 'attended', bookingTime: new Date(now.getTime() - 3*24*60*60*1000) },
        { scheduleId: schedulesList[4].id, clientId: clientElena.id, membershipId: clientMembershipMap[clientElena.id], status: 'attended', bookingTime: new Date(now.getTime() - 2*24*60*60*1000) },
        { scheduleId: schedulesList[4].id, clientId: clientTatyana.id, membershipId: clientMembershipMap[clientTatyana.id], status: 'attended', bookingTime: new Date(now.getTime() - 2*24*60*60*1000) },
        { scheduleId: schedulesList[5].id, clientId: clientNatalia.id, membershipId: clientMembershipMap[clientNatalia.id], status: 'attended', bookingTime: new Date(now.getTime() - 2*24*60*60*1000) },
        { scheduleId: schedulesList[6].id, clientId: clientIrina.id, membershipId: clientMembershipMap[clientIrina.id], status: 'attended', bookingTime: new Date(now.getTime() - 2*24*60*60*1000) }
    ];

    for (const b of bookingsData) {
        await prisma.booking.create({ data: b });
    }

    // ==================== 11. ЛОГИ ПОСЕЩЕНИЙ ====================
    console.log('📋 Создание логов посещений...');

    const bookings = await prisma.booking.findMany();

    // trainerId должен быть из таблицы Trainer, а не User
    const trainerAnnaObj = await prisma.trainer.findUnique({ where: { id: trainerAnna.id } });
    const trainerDmitryObj = await prisma.trainer.findUnique({ where: { id: trainerDmitry.id } });
    const trainerElenaObj = await prisma.trainer.findUnique({ where: { id: trainerElena.id } });
    const trainerMikhailObj = await prisma.trainer.findUnique({ where: { id: trainerMikhail.id } });
    const trainerOlgaObj = await prisma.trainer.findUnique({ where: { id: trainerOlga.id } });
    const trainerIvanObj = await prisma.trainer.findUnique({ where: { id: trainerIvan.id } });

    const attendanceLogsData = [
        { bookingId: bookings[0]?.id, trainerId: trainerAnnaObj.id, markedAt: new Date(now.getTime() - 2*24*60*60*1000 + 2*60*60*1000) },
        { bookingId: bookings[1]?.id, trainerId: trainerAnnaObj.id, markedAt: new Date(now.getTime() - 2*24*60*60*1000 + 2*60*60*1000) },
        { bookingId: bookings[2]?.id, trainerId: trainerElenaObj.id, markedAt: new Date(now.getTime() - 2*24*60*60*1000 + 1*60*60*1000) },
        { bookingId: bookings[3]?.id, trainerId: trainerDmitryObj.id, markedAt: new Date(now.getTime() - 2*24*60*60*1000 + 2*60*60*1000) },
        { bookingId: bookings[4]?.id, trainerId: trainerElenaObj.id, markedAt: new Date(now.getTime() - 2*24*60*60*1000 + 2*60*60*1000) },
        { bookingId: bookings[5]?.id, trainerId: trainerMikhailObj.id, markedAt: new Date(now.getTime() - 1*24*60*60*1000 + 2*60*60*1000) },
        { bookingId: bookings[6]?.id, trainerId: trainerMikhailObj.id, markedAt: new Date(now.getTime() - 1*24*60*60*1000 + 2*60*60*1000) },
        { bookingId: bookings[7]?.id, trainerId: trainerOlgaObj.id, markedAt: new Date(now.getTime() - 1*24*60*60*1000 + 1*60*60*1000) },
        { bookingId: bookings[8]?.id, trainerId: trainerDmitryObj.id, markedAt: new Date(now.getTime() - 1*24*60*60*1000 + 2*60*60*1000) }
    ];

    for (const log of attendanceLogsData) {
        if (log.bookingId) {
            await prisma.attendanceLog.create({ data: log });
        }
    }

    // ==================== 12. ИСТОРИЯ ИЗМЕНЕНИЙ ====================
    console.log('📜 Создание истории изменений...');

    const bookingsForHistory = await prisma.booking.findMany();

    const bookingHistoryData = [
        { bookingId: bookingsForHistory[0]?.id, status: 'booked' },
        { bookingId: bookingsForHistory[0]?.id, status: 'attended' },
        { bookingId: bookingsForHistory[1]?.id, status: 'booked' },
        { bookingId: bookingsForHistory[1]?.id, status: 'attended' },
        { bookingId: bookingsForHistory[2]?.id, status: 'booked' },
        { bookingId: bookingsForHistory[2]?.id, status: 'attended' }
    ];

    for (const h of bookingHistoryData) {
        if (h.bookingId) {
            await prisma.bookingHistory.create({ data: h });
        }
    }

    // ==================== ИТОГИ ====================
    console.log('\n✅ БАЗА ДАННЫХ УСПЕШНО ЗАПОЛНЕНА!');
    console.log('📊 СТАТИСТИКА:');
    console.log(`   - Залы: ${hallsList.length}`);
    console.log(`   - Танцевальные стили: ${styles.length}`);
    console.log(`   - Типы абонементов: ${types.length}`);
    console.log(`   - Пользователи: ${usersData.length} (админы: 2, тренеры: 6, клиенты: 12)`);
    console.log(`   - Занятия в расписании: ${scheduleData.length}`);
    console.log(`   - Абонементов куплено: ${membershipsData.length}`);
    console.log(`   - Записей на занятия: ${bookingsData.length}`);
    console.log(`   - Логов посещений: ${attendanceLogsData.length}`);
    console.log('\n🔑 ПАРОЛЬ ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ: 123456');
}

main()
    .catch(e => {
        console.error('❌ Ошибка при заполнении БД:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });