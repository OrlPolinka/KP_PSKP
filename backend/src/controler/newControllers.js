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

function getDateString(dateObj) {
    if (!dateObj) return null;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function combineDateAndTime(dateValue, timeValue) {
    if (!dateValue || !timeValue) return null;
    const date = new Date(dateValue);
    date.setHours(timeValue.getHours(), timeValue.getMinutes(), timeValue.getSeconds() || 0, 0);
    return date;
}

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
        const scheduleDateTime = combineDateAndTime(booking.schedule.date, booking.schedule.startTime);

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

        console.log('Generating QR code for booking:', booking.id);
        
        let qrImage;
        try {
            // Генерируем QR-код как буфер, затем конвертируем в base64
            const qrBuffer = await QRCode.toBuffer(qrData, {
                errorCorrectionLevel: 'M',
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 300
            });
            
            // Конвертируем буфер в base64 DataURL
            const base64 = qrBuffer.toString('base64');
            qrImage = `data:image/png;base64,${base64}`;
            
            console.log('QR code generated successfully, buffer size:', qrBuffer.length, 'base64 length:', qrImage.length);
        } catch (qrError) {
            console.error('QR code generation error:', qrError);
            return res.status(500).json({ error: 'Ошибка при генерации QR-кода' });
        }

        // Форматируем дату для клиента
        const formatDateForClient = (dateValue) => {
            if (!dateValue) return '';
            
            let year, month, day;
            
            // Если пришла строка в формате YYYY-MM-DD
            if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
                [year, month, day] = dateValue.split('T')[0].split('-');
                return `${day}.${month}.${year}`;
            }
            
            // Если пришёл объект Date или ISO строка
            let dateObj = new Date(dateValue);
            if (isNaN(dateObj.getTime())) return '';
            
            day = dateObj.getDate().toString().padStart(2, '0');
            month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            year = dateObj.getFullYear();
            
            return `${day}.${month}.${year}`;
        };

        res.json({
            success: true,
            qrCode: qrCode,
            qrImage: qrImage,
            booking: {
                id: booking.id,
                schedule: {
                    date: formatDateForClient(booking.schedule.date),
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
 * Получить QR-коды на все сегодняшние занятия клиента
 */
async function getTodayQRCodes(req, res) {
    try {
        const { id: userId } = req.user;
        const today = getDateString(new Date());
        
        // Автоудаление QR-кодов старше вчерашнего дня
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);
        
        await prisma.booking.updateMany({
            where: {
                clientId: userId,
                qrCode: { not: null },
                schedule: {
                    date: {
                        lt: yesterday.toISOString()
                    }
                }
            },
            data: {
                qrCode: null,
                qrCodeGenerated: null
            }
        });
        
        const bookings = await prisma.booking.findMany({
            where: {
                clientId: userId,
                schedule: {
                    date: {
                        gte: new Date(today + 'T00:00:00.000Z'),
                        lt: new Date(today + 'T23:59:59.999Z')
                    },
                    status: { not: 'cancelled' }
                },
                status: { in: ['booked', 'attended'] }
            },
            include: {
                schedule: {
                    include: {
                        danceStyle: true,
                        trainer: {
                            include: { user: { select: { fullName: true } } }
                        },
                        hall: true
                    }
                }
            },
            orderBy: [
                { schedule: { date: 'desc' } },
                { schedule: { startTime: 'desc' } }
            ]
        });

        const qrCodes = [];
        for (const booking of bookings) {
            // Генерируем QR-код если его нет
            let qrCode = booking.qrCode;
            if (!qrCode) {
                qrCode = crypto.randomBytes(16).toString('hex');
                await prisma.booking.update({
                    where: { id: booking.id },
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

            // Форматируем дату
            const formatDateForClient = (dateValue) => {
                console.log('formatDateForClient input:', dateValue, 'type:', typeof dateValue);
                
                if (!dateValue) return '';
                
                let year, month, day;
                
                // Если пришла строка в формате YYYY-MM-DD
                if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
                    [year, month, day] = dateValue.split('T')[0].split('-');
                    const result = `${day}.${month}.${year}`;
                    console.log('formatDateForClient result (string):', result);
                    return result;
                }
                
                // Если пришёл объект Date или ISO строка
                let dateObj = new Date(dateValue);
                console.log('dateObj:', dateObj, 'isNaN:', isNaN(dateObj.getTime()));
                
                if (isNaN(dateObj.getTime())) {
                    console.log('Invalid date, returning empty string');
                    return '';
                }
                
                day = dateObj.getDate().toString().padStart(2, '0');
                month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                year = dateObj.getFullYear();
                
                const result = `${day}.${month}.${year}`;
                console.log('formatDateForClient result (Date):', result);
                return result;
            };

            // Форматируем время
            const formatTime = (timeValue) => {
                if (!timeValue) return '';
                
                // Если время в формате ISO string, парсим его
                if (typeof timeValue === 'string') {
                    // Если это ISO строка с датой, извлекаем только время
                    if (timeValue.includes('T')) {
                        const timePart = timeValue.split('T')[1];
                        if (timePart && timePart.length > 5) {
                            return timePart.substring(0, 5);
                        }
                    }
                    // Если время в формате "HH:MM:SS", обрезаем секунды
                    if (timeValue.length > 5) {
                        return timeValue.substring(0, 5);
                    }
                    return timeValue;
                }
                
                return timeValue;
            };

            // Простое форматирование времени
            const formatTimeSimple = (timeValue) => {
                if (!timeValue) return '';
                
                // Если это ISO строка, извлекаем время
                if (typeof timeValue === 'string' && timeValue.includes('T')) {
                    const timeStr = timeValue.split('T')[1];
                    if (timeStr && timeStr.length >= 5) {
                        return timeStr.substring(0, 5);
                    }
                    return '';
                }
                
                // Если обычная строка времени
                if (typeof timeValue === 'string' && timeValue.length > 5) {
                    return timeValue.substring(0, 5);
                }
                
                return timeValue;
            };

            qrCodes.push({
                bookingId: booking.id,
                qrCode: qrCode,
                qrImage: qrImage,
                schedule: {
                    date: formatDateForClient(booking.schedule.date),
                    startTime: formatTimeSimple(booking.schedule.startTime),
                    endTime: formatTimeSimple(booking.schedule.endTime),
                    danceStyle: booking.schedule.danceStyle.name,
                    trainer: booking.schedule.trainer?.user?.fullName,
                    hall: booking.schedule.hall.name
                },
                status: booking.status,
                checkedIn: booking.checkedIn
            });
        }

        res.json({
            success: true,
            qrCodes,
            count: qrCodes.length
        });
    } catch (error) {
        console.error('getTodayQRCodes error:', error);
        res.status(500).json({ error: 'Ошибка при получении QR-кодов' });
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
        const today = getDateString(new Date());
        const scheduleDate = getDateString(booking.schedule.date);

        if (scheduleDate !== today) {
            return res.status(400).json({
                error: 'Занятие не сегодня',
                scheduleDate: scheduleDate,
                today: today
            });
        }

        // Проверяем, что QR-код не истек (3 часа после окончания занятия)
        const scheduleEndDateTime = new Date(booking.schedule.date);
        const [hours, minutes] = booking.schedule.endTime.split(':');
        scheduleEndDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const scheduleEndTime = scheduleEndDateTime;
        const threeHoursAfterEnd = new Date(scheduleEndTime.getTime() +3 * 60 * 60 * 1000);
        const now = new Date();

        if (now > threeHoursAfterEnd) {
            return res.status(400).json({ 
                error: 'QR-код истек. Прошло более 3 часов после окончания занятия',
                expiredAt: threeHoursAfterEnd
            });
        }

        // Форматируем дату и время для корректного отображения
        const scheduleDateTime = combineDateAndTime(booking.schedule.date, booking.schedule.startTime);
        
        // Форматируем дату в читаемый формат
        const formatDate = (dateValue) => {
            if (!dateValue) return '';
            
            // Если дата уже строка, парсим ее
            let dateObj;
            if (typeof dateValue === 'string') {
                dateObj = new Date(dateValue);
            } else {
                dateObj = dateValue;
            }
            
            // Проверяем что дата валидная
            if (isNaN(dateObj.getTime())) {
                return '';
            }
            
            return dateObj.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            });
        };
        
        // Форматируем время в читаемый формат
        const formatTime = (timeValue) => {
            if (!timeValue) return '';
            
            // Если время уже в нужном формате
            if (typeof timeValue === 'string') {
                // Если время в формате "HH:MM:SS", обрезаем секунды
                if (timeValue.length > 5) {
                    return timeValue.substring(0, 5);
                }
                return timeValue;
            }
            
            // Если время это Date объект, форматируем его
            if (timeValue instanceof Date) {
                return timeValue.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            return '';
        };
        
        const formattedDate = formatDate(booking.schedule.date);
        const formattedStartTime = formatTime(booking.schedule.startTime);
        const formattedEndTime = formatTime(booking.schedule.endTime);

        res.json({
            success: true,
            valid: true,
            booking: {
                id: booking.id,
                client: booking.client,
                schedule: {
                    date: formattedDate,
                    startTime: formattedStartTime,
                    endTime: formattedEndTime,
                    danceStyle: booking.schedule.danceStyle,
                    hall: booking.schedule.hall
                },
                status: booking.status,
                checkedIn: booking.checkedIn,
                qrCodeScanned: booking.qrCodeScanned
            }
        });
    } catch (error) {
        console.error('verifyBookingQRCode error:', error);
        res.status(500).json({ error: 'Ошибка при проверке QR-кода' });
    }
}

/**
 * Скачать QR-код в формате PNG
 */
async function downloadQRCode(req, res) {
    try {
        const { bookingId } = req.params;
        const { id: userId } = req.user;

        const booking = await prisma.booking.findFirst({
            where: {
                id: bookingId,
                clientId: userId
            },
            include: {
                schedule: {
                    include: {
                        danceStyle: true
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({ error: 'Бронирование не найдено' });
        }

        if (!booking.qrCode) {
            return res.status(400).json({ error: 'QR-код не сгенерирован' });
        }

        // Генерируем QR-код с высоким разрешением
        const qrCodeDataUrl = await QRCode.toDataURL(booking.qrCode, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Конвертируем Data URL в Buffer
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Устанавливаем заголовки для скачивания
        const danceStyle = booking.schedule.danceStyle.name;
        const filename = `QR-код_${danceStyle}_${new Date().toISOString().split('T')[0]}.png`;
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);

        res.send(buffer);
    } catch (error) {
        console.error('downloadQRCode error:', error);
        res.status(500).json({ error: 'Ошибка при скачивании QR-кода' });
    }
}

/**
 * Получить все QR-коды клиента
 */
async function getAllQRCodes(req, res) {
    try {
        const { id: userId } = req.user;
        const { page = 1, limit = 10 } = req.query;

        // Пагинация
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Получаем общее количество записей для пагинации
        const total = await prisma.booking.count({
            where: {
                clientId: userId,
                status: { not: 'cancelled' },
                qrCode: { not: null }
            }
        });

        const bookings = await prisma.booking.findMany({
            where: {
                clientId: userId,
                status: { not: 'cancelled' },
                qrCode: { not: null }
            },
            skip,
            take,
            include: {
                schedule: {
                    include: {
                        danceStyle: true,
                        trainer: {
                            include: {
                                user: {
                                    select: { fullName: true }
                                }
                            }
                        },
                        hall: true
                    }
                }
            },
            orderBy: {
                schedule: {
                    date: 'asc'
                }
            }
        });

        const qrCodes = [];
        for (const booking of bookings) {
            const scheduleDate = new Date(booking.schedule.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Определяем, можно ли сканировать QR-код
            const canScan = !booking.qrCodeScanned && 
                           !booking.checkedIn && 
                           booking.status !== 'attended' && 
                           booking.status !== 'no_show' &&
                           scheduleDate >= today;

            // Форматируем дату
            const formatDateForClient = (dateValue) => {
                console.log('formatDateForClient input:', dateValue, 'type:', typeof dateValue);
                
                if (!dateValue) return '';
                
                let year, month, day;
                
                // Если пришла строка в формате YYYY-MM-DD
                if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
                    [year, month, day] = dateValue.split('T')[0].split('-');
                    const result = `${day}.${month}.${year}`;
                    console.log('formatDateForClient result (string):', result);
                    return result;
                }
                
                // Если пришёл объект Date или ISO строка
                let dateObj = new Date(dateValue);
                console.log('dateObj:', dateObj, 'isNaN:', isNaN(dateObj.getTime()));
                
                if (isNaN(dateObj.getTime())) {
                    console.log('Invalid date, returning empty string');
                    return '';
                }
                
                day = dateObj.getDate().toString().padStart(2, '0');
                month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                year = dateObj.getFullYear();
                
                const result = `${day}.${month}.${year}`;
                console.log('formatDateForClient result (Date):', result);
                return result;
            };

            // Форматируем время
            const formatTime = (timeValue) => {
                if (!timeValue) return '';
                
                // Если время в формате ISO string, парсим его
                if (typeof timeValue === 'string') {
                    // Если это ISO строка с датой, извлекаем только время
                    if (timeValue.includes('T')) {
                        const timePart = timeValue.split('T')[1];
                        if (timePart && timePart.length > 5) {
                            return timePart.substring(0, 5);
                        }
                    }
                    // Если время в формате "HH:MM:SS", обрезаем секунды
                    if (timeValue.length > 5) {
                        return timeValue.substring(0, 5);
                    }
                    return timeValue;
                }
                
                return timeValue;
            };

            // Простое форматирование времени
            const formatTimeSimple = (timeValue) => {
                if (!timeValue) return '';
                
                // Если это ISO строка, извлекаем время
                if (typeof timeValue === 'string' && timeValue.includes('T')) {
                    const timeStr = timeValue.split('T')[1];
                    if (timeStr && timeStr.length >= 5) {
                        return timeStr.substring(0, 5);
                    }
                    return '';
                }
                
                // Если обычная строка времени
                if (typeof timeValue === 'string' && timeValue.length > 5) {
                    return timeValue.substring(0, 5);
                }
                
                return timeValue;
            };

            // Генерируем изображение QR-кода
            let qrImage;
            try {
                const qrData = JSON.stringify({
                    bookingId: booking.id,
                    qrCode: booking.qrCode,
                    scheduleId: booking.scheduleId,
                    clientId: booking.clientId
                });
                
                const qrBuffer = await QRCode.toBuffer(qrData, {
                    errorCorrectionLevel: 'M',
                    margin: 2,
                    color: { dark: '#000000', light: '#FFFFFF' },
                    width: 300
                });
                
                const base64 = qrBuffer.toString('base64');
                qrImage = `data:image/png;base64,${base64}`;
            } catch (qrError) {
                console.error('QR code generation error:', qrError);
                qrImage = null;
            }

            qrCodes.push({
                bookingId: booking.id,
                qrCode: booking.qrCode,
                qrImage: qrImage,
                status: booking.status,
                checkedIn: booking.checkedIn,
                qrCodeScanned: booking.qrCodeScanned,
                canScan,
                schedule: {
                    date: formatDateForClient(booking.schedule.date),
                    startTime: formatTimeSimple(booking.schedule.startTime),
                    endTime: formatTimeSimple(booking.schedule.endTime),
                    danceStyle: booking.schedule.danceStyle.name,
                    trainer: booking.schedule.trainer.user.fullName,
                    hall: booking.schedule.hall.name
                }
            });
        }

        res.json({
            success: true,
            qrCodes,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('getAllQRCodes error:', error);
        res.status(500).json({ error: 'Ошибка при загрузке QR-кодов' });
    }
}

/**
 * Отметить посещение через QR-код
 */
async function markAttendanceByQRCode(req, res) {
    try {
        const { qrCode, attended = true, notes } = req.body;
        const { role, id: userId } = req.user;

        if (role !== 'trainer' && role !== 'admin') {
            return res.status(403).json({ error: 'Только тренер может отмечать посещения' });
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
                    select: { id: true, fullName: true, email: true, phone: true }
                },
                membership: {
                    include: {
                        membershipType: true
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({ error: 'QR-код не найден' });
        }

        // Проверяем, что тренер отмечает своё занятие
        if (role === 'trainer') {
            const trainerRecord = await prisma.trainer.findFirst({
                where: { userId }
            });
            if (!trainerRecord || booking.schedule.trainerId !== trainerRecord.id) {
                return res.status(403).json({ error: 'Это не ваше занятие' });
            }
        }

        // Проверяем, что занятие сегодня
        const today = getDateString(new Date());
        const scheduleDate = getDateString(booking.schedule.date);

        if (scheduleDate !== today) {
            return res.status(400).json({
                error: 'Занятие не сегодня',
                scheduleDate: scheduleDate,
                today: today
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Нельзя отметить посещение отмененной записи' });
        }

        if (booking.status === 'attended') {
            return res.status(400).json({ error: 'Посещение уже отмечено' });
        }

        if (booking.status === 'no_show') {
            return res.status(400).json({ error: 'Клиент уже отмечен как не пришедший' });
        }

        // Проверяем, что QR-код не истек (3 часа после окончания занятия)
        const scheduleEndDateTime = new Date(booking.schedule.date);
        const [endHours, endMinutes] = booking.schedule.endTime.split(':');
        scheduleEndDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
        const scheduleEndTime = scheduleEndDateTime;
        const threeHoursAfterEnd = new Date(scheduleEndTime.getTime() +3 * 60 * 60 * 1000);
        const currentTime = new Date();

        if (currentTime > threeHoursAfterEnd) {
            return res.status(400).json({ 
                error: 'QR-код истек. Прошло более 3 часов после окончания занятия',
                expiredAt: threeHoursAfterEnd
            });
        }

        // Проверяем время (можно отмечать за 15 минут до начала)
        const scheduleDateTime = new Date(booking.schedule.date);
        scheduleDateTime.setHours(
            booking.schedule.startTime.getHours(),
            booking.schedule.startTime.getMinutes(),
            booking.schedule.startTime.getSeconds() || 0,
            0
        );
        
        const earlyMarkWindowMinutes = 15;
        const earliestMarkTime = new Date(scheduleDateTime);
        earliestMarkTime.setMinutes(earliestMarkTime.getMinutes() - earlyMarkWindowMinutes);

        if (currentTime < earliestMarkTime) {
            return res.status(400).json({
                error: `Нельзя отметить посещение до начала занятия. Можно отмечать за ${earlyMarkWindowMinutes} минут до старта.`
            });
        }

        const newStatus = attended ? 'attended' : 'no_show';

        // Обновляем бронирование
        const updatedBooking = await prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: newStatus,
                checkedIn: attended,
                checkedInAt: attended ? new Date() : null
            }
        });

        // Возвращаем посещение, если клиент не пришел
        if (!attended && booking.membership && booking.membership.membershipType && 
            booking.membership.membershipType.visitCount !== null && 
            booking.membership.remainingVisits !== null) {
            await prisma.membership.update({
                where: { id: booking.membershipId },
                data: {
                    remainingVisits: booking.membership.remainingVisits + 1
                }
            });
        }

        // Создаем запись в логе посещаемости
        const attendanceLog = await prisma.attendanceLog.create({
            data: {
                bookingId: booking.id,
                trainerId: userId,
                markedAt: new Date()
            }
        });

        // Создаем запись в истории
        await prisma.bookingHistory.create({
            data: {
                bookingId: booking.id,
                status: newStatus
            }
        });

        res.json({
            success: true,
            message: attended ? 'Посещение отмечено' : 'Клиент отмечен как не пришедший',
            booking: {
                id: updatedBooking.id,
                status: updatedBooking.status,
                checkedInAt: updatedBooking.checkedInAt
            },
            attendanceLog: {
                id: attendanceLog.id,
                markedAt: attendanceLog.markedAt
            }
        });
    } catch (error) {
        console.error('markAttendanceByQRCode error:', error);
        res.status(500).json({ error: 'Ошибка при отметке посещения', details: error.message });
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
                    where: { status: { in: ['booked', 'attended', 'no_show'] } },
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

            // Отправляем сообщение в чат от тренера клиенту
            await prisma.message.create({
                data: {
                    senderId: userId,
                    receiverId: booking.client.id,
                    content: `Здравствуйте! Занятие "${schedule.danceStyle?.name || 'Танцы'}" было отменено. ${reason ? 'Причина: ' + reason : ''}`
                }
            });
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
        res.status(500).json({ error: 'Ошибка при приобретении абонемента' });
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
    // Профили тренеров
    getPublicTrainers,
    getPublicTrainerById,
    updateTrainerProfile,
    
    // Стили танцев
    getDanceStylesDetailed,
    getDanceStyleById,
    updateDanceStyleDetailed,
    
    // Информация о подготовке к тренировкам
    getTrainingInfo,
    createTrainingInfo,
    updateTrainingInfo,
    deleteTrainingInfo,
    
    // QR-коды
    generateBookingQRCode,
    downloadQRCode,
    getTodayQRCodes,
    getAllQRCodes,
    verifyBookingQRCode,
    markAttendanceByQRCode,
    
    // Уведомления
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    
    // Отмена занятия тренером
    cancelScheduleByTrainer,
    
    // Платежи
    createPayment,
    paymentWebhook,
    getPaymentHistory
};
