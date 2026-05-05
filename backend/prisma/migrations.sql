-- SQL миграция для новых таблиц и полей
-- Выполните этот скрипт в базе данных PostgreSQL

-- 1. Добавляем новые поля в таблицу trainers
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS custompagetitle VARCHAR(255);
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS custompagecontent TEXT;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS certificates TEXT;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS sociallinks TEXT;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS ispublished BOOLEAN DEFAULT false;
ALTER TABLE trainers ALTER COLUMN bio TYPE TEXT;
ALTER TABLE trainers ALTER COLUMN photourl TYPE TEXT;
ALTER TABLE trainers ALTER COLUMN videourl TYPE TEXT;
ALTER TABLE trainers ALTER COLUMN achievements TYPE TEXT;
ALTER TABLE trainers ALTER COLUMN gallery TYPE TEXT;

-- 2. Добавляем новые поля в таблицу dancestyles
ALTER TABLE dancestyles ADD COLUMN IF NOT EXISTS longdescription TEXT;
ALTER TABLE dancestyles ADD COLUMN IF NOT EXISTS videourl TEXT;
ALTER TABLE dancestyles ADD COLUMN IF NOT EXISTS imageurl TEXT;
ALTER TABLE dancestyles ADD COLUMN IF NOT EXISTS benefits TEXT;
ALTER TABLE dancestyles ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'beginner';
ALTER TABLE dancestyles ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE dancestyles ADD COLUMN IF NOT EXISTS calories INTEGER;

-- 3. Добавляем новые поля в таблицу schedule
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS cancelledby UUID;
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS cancelledat TIMESTAMP(6);

-- 4. Добавляем поля для QR-кодов в таблицу bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qrcode VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qrcodegenerated TIMESTAMP(6);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkedin BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkedinat TIMESTAMP(6);

-- 5. Добавляем поле paymentId в таблицу memberships
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS paymentid UUID;

-- 6. Создаём таблицу уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    isread BOOLEAN DEFAULT false,
    createdat TIMESTAMP(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_userid_isread ON notifications(userid, isread);
CREATE INDEX IF NOT EXISTS idx_notifications_createdat ON notifications(createdat);

-- 7. Создаём таблицу информации о подготовке
CREATE TABLE IF NOT EXISTS traininginfo (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    videourl TEXT,
    imageurl TEXT,
    "order" INTEGER DEFAULT 0,
    isactive BOOLEAN DEFAULT true,
    createdat TIMESTAMP(6) DEFAULT NOW(),
    updatedat TIMESTAMP(6) DEFAULT NOW()
);

-- 8. Создаём таблицу платежей
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    status VARCHAR(20) DEFAULT 'pending',
    provider VARCHAR(50) NOT NULL,
    providerpaymentid VARCHAR(255),
    description TEXT,
    metadata TEXT,
    createdat TIMESTAMP(6) DEFAULT NOW(),
    updatedat TIMESTAMP(6)
);

-- 9. Добавляем внешний ключ для payments в memberships
ALTER TABLE memberships ADD CONSTRAINT fk_membership_payment 
    FOREIGN KEY (paymentid) REFERENCES payments(id) ON DELETE SET NULL ON UPDATE NO ACTION;

-- 10. Обновляем русские названия стилей танцев
UPDATE dancestyles SET 
    name = 'Зумба',
    description = 'Энергичная фитнес-программа на основе латиноамериканских танцев. Сжигает до 600 ккал за занятие!',
    longdescription = 'Зумба — это танцевальная фитнес-программа, созданная на основе латиноамериканских танцев. Занятия проходят под зажигательную музыку и включают элементы сальсы, меренге, кумбии и реггетона. Идеально подходит для тех, кто хочет похудеть и получить заряд энергии!',
    difficulty = 'beginner',
    duration = 60,
    calories = 600,
    benefits = '["Эффективное сжигание калорий","Улучшение координации","Повышение выносливости","Отличное настроение"]'
WHERE name = 'Zumba';

UPDATE dancestyles SET 
    name = 'Хип-хоп',
    description = 'Уличные танцы с элементами фанка и брейк-данса',
    longdescription = 'Хип-хоп — это не просто танец, это культура! На занятиях вы освоите основные движения уличных танцев, научитесь чувствовать ритм и импровизировать. Подходит для начинающих и продолжающих.',
    difficulty = 'beginner',
    duration = 60,
    calories = 500,
    benefits = '["Развитие пластики","Улучшение ритма","Самовыражение","Кардио-нагрузка"]'
WHERE name = 'Hip-Hop';

UPDATE dancestyles SET 
    name = 'Контемпорари',
    description = 'Современная хореография, сочетающая элементы классического танца и джаза',
    longdescription = 'Контемпорари — это современный танцевальный стиль, объединяющий элементы классического балета, джаза и современной хореографии. Танцоры учатся выражать эмоции через движение и исследовать возможности своего тела.',
    difficulty = 'intermediate',
    duration = 90,
    calories = 450,
    benefits = '["Развитие гибкости","Эмоциональное выражение","Укрепление мышц","Пластика движений"]'
WHERE name = 'Contemporary';

UPDATE dancestyles SET 
    name = 'Стретчинг',
    description = 'Растяжка для развития гибкости и улучшения осанки',
    longdescription = 'Стретчинг — это система упражнений на растяжку мышц и связок. Регулярные занятия помогут вам сесть на шпагат, улучшить осанку и снять напряжение после рабочего дня.',
    difficulty = 'beginner',
    duration = 60,
    calories = 200,
    benefits = '["Развитие гибкости","Улучшение осанки","Расслабление мышц","Профилактика травм"]'
WHERE name = 'Stretching';

UPDATE dancestyles SET 
    name = 'Балет-фитнес',
    description = 'Фитнес на основе балетных упражнений для идеальной фигуры',
    longdescription = 'Балет-фитнес — это уникальная методика, адаптирующая балетные упражнения для фитнеса. Вы получите грациозную осанку, подтянутое тело и королевскую походку.',
    difficulty = 'intermediate',
    duration = 60,
    calories = 400,
    benefits = '["Идеальная осанка","Подтянутое тело","Грация движений","Укрепление кора"]'
WHERE name = 'Ballet Body';

UPDATE dancestyles SET 
    name = 'Тверк',
    description = 'Энергичный танец с акцентом на работу бёдрами',
    longdescription = 'Тверк — это энергичный современный танец, который поможет вам развить пластику бёдер и ягодиц. На занятиях вы освоите различные техники и комбинации движений.',
    difficulty = 'intermediate',
    duration = 60,
    calories = 500,
    benefits = '["Укрепление ягодиц","Энергичная кардио-тренировка","Развитие пластики","Уверенность в себе"]'
WHERE name = 'Twerk';

UPDATE dancestyles SET 
    name = 'Дэнсхолл',
    description = 'Ямайский уличный танец с яркими движениями',
    longdescription = 'Дэнсхолл — это ямайский танцевальный стиль с богатой культурой. Яркие, экспрессивные движения под ритмичную музыку подарят вам массу эмоций!',
    difficulty = 'beginner',
    duration = 60,
    calories = 450,
    benefits = '["Экспрессия движений","Ритмичность","Кардио-эффект","Отличное настроение"]'
WHERE name = 'Dancehall';

UPDATE dancestyles SET 
    name = 'K-Pop танцы',
    description = 'Танцы под корейскую поп-музыку',
    longdescription = 'K-Pop танцы — это яркое и стильное направление, основанное на хореографии популярных корейских групп. Выучите танцы из клипов ваших любимых айдолов!',
    difficulty = 'beginner',
    duration = 60,
    calories = 400,
    benefits = '["Стильная хореография","Развитие памяти","Работа в группе","Яркие эмоции"]'
WHERE name = 'K-Pop Dance';

UPDATE dancestyles SET 
    name = 'Сальса',
    description = 'Латиноамериканский парный танец',
    longdescription = 'Сальса — это зажигательный латиноамериканский танец, который танцуют парами. Вы научитесь основным шагам, поворотам и фигурам под ритмы кубинской и колумбийской сальсы.',
    difficulty = 'beginner',
    duration = 60,
    calories = 400,
    benefits = '["Социальный танец","Координация партнёров","Кардио-нагрузка","Новое хобби"]'
WHERE name = 'Salsa';

UPDATE dancestyles SET 
    name = 'Бачата',
    description = 'Романтичный доминиканский парный танец',
    longdescription = 'Бачата — это романтичный и чувственный парный танец из Доминиканской Республики. Медленные, плавные движения под мелодичную музыку создают особую атмосферу.',
    difficulty = 'beginner',
    duration = 60,
    calories = 350,
    benefits = '["Романтичная атмосфера","Плавность движений","Работа в паре","Музыкальность"]'
WHERE name = 'Bachata';

UPDATE dancestyles SET 
    name = 'Хай-хилс',
    description = 'Танцы на высоких каблуках для уверенности и грации',
    longdescription = 'Хай-хилс — это женственный танцевальный стиль, который исполняется на высоких каблуках. Вы научитесь красиво двигаться, держать баланс и чувствовать себя уверенно.',
    difficulty = 'intermediate',
    duration = 60,
    calories = 400,
    benefits = '["Женственность","Уверенность","Красивая походка","Укрепление ног"]'
WHERE name = 'High Heels';

UPDATE dancestyles SET 
    name = 'Поли-дэнс',
    description = 'Танцы на пилоне для силы и пластики',
    longdescription = 'Поли-дэнс — это комбинация танца и акробатики на пилоне. Занятия развивают силу, гибкость и грацию. Подходит для любого уровня подготовки.',
    difficulty = 'advanced',
    duration = 90,
    calories = 500,
    benefits = '["Сила тела","Гибкость","Грация","Самооценка"]'
WHERE name = 'Pole Dance';

-- 11. Обновляем русские названия типов абонементов
UPDATE membershiptypes SET name = 'Разовое занятие', description = 'Одно посещение любого группового занятия' WHERE name = 'Single Class';
UPDATE membershiptypes SET name = '4 занятия', description = 'Абонемент на 4 занятия в месяц' WHERE name LIKE '4%';
UPDATE membershiptypes SET name = '8 занятий', description = 'Абонемент на 8 занятий в месяц' WHERE name LIKE '8%';
UPDATE membershiptypes SET name = '12 занятий', description = 'Абонемент на 12 занятий в месяц' WHERE name LIKE '12%';
UPDATE membershiptypes SET name = 'Безлимит 1 месяц', description = 'Неограниченное количество занятий на 1 месяц' WHERE name LIKE 'Unlimited%month%' OR name LIKE '1 month%';
UPDATE membershiptypes SET name = 'Безлимит 3 месяца', description = 'Неограниченное количество занятий на 3 месяца' WHERE name LIKE '3 month%' OR name LIKE 'Unlimited 3%';
UPDATE membershiptypes SET name = 'Безлимит 6 месяцев', description = 'Неограниченное количество занятий на 6 месяцев' WHERE name LIKE '6 month%' OR name LIKE 'Unlimited 6%';
UPDATE membershiptypes SET name = 'Безлимит год', description = 'Неограниченное количество занятий на год' WHERE name LIKE 'Annual%' OR name LIKE 'Yearly%' OR name LIKE 'Unlimited year%';

-- 12. Вставляем примеры информации о подготовке
INSERT INTO traininginfo (title, content, category, "order", isactive) VALUES
('Что надеть на занятие', 'Выбирайте удобную спортивную одежду, которая не сковывает движения. Для танцев идеально подходят леггинсы или спортивные штаны и футболка. Обувь должна быть удобной — кроссовки или чешки.', 'what_to_bring', 1, true),
('Что взять с собой', 'Возьмите с собой полотенце, бутылку воды и сменную обувь. Для занятий на пилоне понадобятся лосины и топ.', 'what_to_bring', 2, true),
('Правила посещения', 'Приходите за 10-15 минут до начала занятия. Отключите телефон или поставьте на беззвучный режим. Сообщите тренеру о травмах или ограничениях.', 'rules', 1, true),
('Рекомендации новичкам', 'Не переживайте, если что-то не получается сразу. Танцы — это процесс! Слушайте своё тело и отдыхайте, когда нужно. Главное — получать удовольствие от движения.', 'tips', 1, true),
('Разминка важна', 'Всегда участвуйте в разминке в начале занятия. Это поможет разогреть мышцы и предотвратить травмы.', 'preparation', 1, true);
