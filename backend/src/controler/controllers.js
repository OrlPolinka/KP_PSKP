const { error } = require('console');
const prisma = require('./prisma');
const bcrypt = require('bcryptjs');
const { stat } = require('fs');
const jwt = require('jsonwebtoken');
const { start } = require('repl');
const { isatty } = require('tty');
const { availableMemory } = require('process');
const e = require('express');

class Controler{

    //регистрация и вход
    async register(req, res){
        try{
            let {email, password, fullName, phone, role} = req.body;

            if(!email || !password || !fullName){
                return res.status(400).json({
                    error: 'Email, пароль и имя обязательны'
                });
            }

            let existingUser = await prisma.user.findUnique({
                where: {email}
            });

            if(existingUser){
                return res.status(400).json({
                    error: 'Пользователь с таким email уже существует'
                });
            }

            let hashedPassword = await bcrypt.hash(password, 10);

            let user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    fullName,
                    phone: phone || null,
                    role: role || 'client',
                    isActive: true
                }
            });

            if(user.role === 'trainer'){
                await prisma.trainer.create({
                    data: {
                        id: user.id,
                        userId: user.id
                    }
                });
            }

            let token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {expiresIn: '7d'}
            );

            let {password: _, ...userWithoutPassword} = user;

            res.status(201).json({
                success: true,
                message: 'Регистрация успешна',
                token,
                user: userWithoutPassword
            });
        }
        catch(error){
            console.error('Register error:', error);
            res.status(500).json({
                error: 'Ошибка при регистрации',
                details: error.message
            });
        }
    }

    async login(req, res){
        try{
            let {email, password} = req.body;

            if(!email || !password){
                return res.status(400).json({
                    error: 'Email и пароль обязательны'
                });
            }

            let user = await prisma.user.findUnique({
                where: {email}
            });

            if(!user){
                return res.status(401).json({
                    error: 'Неверный email или пароль'
                });
            }

            if(!user.isActive){
                return res.status(403).json({
                    error: 'Аккаунт заблокирован. Обратитесь к администратору'
                });
            }

            let isValidPassword = await bcrypt.compare(password, user.password);

            if(!isValidPassword){
                return res.status(401).json({
                    error: 'Неверный email или пароль'
                });
            }

            let token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {expiresIn: '7d'}
            );

            let {password: _, ...userWithoutPassword} = user;

            res.json({
                success: true,
                message: 'Вход выполнен успешно',
                token,
                user: userWithoutPassword
            });
        }
        catch(error){
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Ошибка при входе'
            });
        }
    }

    async getMe(req, res){
        try{
            let userId = req.user.id;
            
            let user = await prisma.user.findUnique({
                where: {id: userId},
                include: {
                    trainerInfo: true,
                    memberships: {
                        where: {status: 'active'},
                        include: {membershipType: true}
                    }
                }
            });

            if(!user){
                return res.status(404).json({error: 'Пользователь не найден'});
            }

            let {password: _, ...userWithoutPassword} = user;

            res.json({user: userWithoutPassword});
        }   
        catch(error){
            console.error('GetMe error:', error);
            res.status(500).json({error: 'Ошибка при получении профиля'});
        }
    }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //пользователи
    async getUsers(req, res){
        try{
            let users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true
                },
                // В модели Membership нет createdAt, сортируем по времени покупки.
                orderBy: {purchaseDate: 'desc'}
            });

            res.json({users});
        }
        catch(error){
            console.error('getUsers error:', error);
            res.status(500).json({error: 'Ошибка при получении пользователей'});
        }
    }

    async getUserById(req, res){
        try{
            let {id} = req.params;

            let user = await prisma.user.findUnique({
                where: {id},
                include: {
                    trainerInfo: true,
                    memberships: {
                        include: {membershipType: true}
                    }
                }
            });

            if(!user){
                return res.status(404).json({error: 'Пользователь не найден'});
            }

            let {password: _, ...userWithoutPassword} = user;

            res.json({user: userWithoutPassword});
        }
        catch(error){
            console.error('getUserById error:', error);
            res.status(500).json({error: 'Ошибка при получении пользователя'});
        }
    }

    async blockUser(req, res){
        try{
            let {id} = req.params;
            let {isActive} = req.body;

            let user = await prisma.user.update({
                where: {id},
                data: {isActive}
            });

            let {password: _, ...userWithoutPassword} = user;

            res.json({
                success: true,
                message: isActive ? 'Пользователь разблокирован' : 'Пользователь заблокирован',
                user: userWithoutPassword
            });
        }
        catch(error){
            console.error('blockUser error:', error);
            res.status(500).json({error: 'Ошибка при изменении статуса пользователя'});
        }
    }

    async deleteUser(req, res){
        try{
            let {id} = req.params;

            let existingUser = await prisma.user.findUnique({
                where: {id}
            });

            if(!existingUser){
                return res.status(404).json({error: 'Пользователь не найден'});
            }

            let user = await prisma.user.delete({
                where: {id}
            });

            let {password: _, ...userWithoutPassword} = user;

            res.json({
                success: true,
                message: 'Пользователь удален',
                user: userWithoutPassword
            });
        }
        catch(error){
            console.error('deleteUser error:', error);
            res.status(500).json({error: 'Ошибка при удалении пользователя'});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //тренеры
    async getTrainers(req, res){
        try{
            let trainers = await prisma.user.findMany({
                where: {
                    role: 'trainer'
                },
                include: {
                    trainerInfo: true
                },
                // В модели Membership нет createdAt, сортируем по дате покупки.
                orderBy: {purchaseDate: 'desc'}
            });

            let trainersWithoutPassword = trainers.map(trainer => {
                let {password, ...trainerWithoutPassword} = trainer;
                return trainerWithoutPassword;
            });

            res.json({trainers: trainersWithoutPassword});
        }
        catch(error){
            console.error('getTrainers error:', error);
            res.status(500).json({error: 'Ошибка при получении тренеров'});
        }
    }

    async createTrainer(req, res){
        try{
            let {email, password, fullName, phone, specialization, bio} = req.body;

            if(!email || !password || !fullName){
                return res.status(400).json({
                    error: 'Email, пароль и имя обязательны'
                });
            }

            let existingTrainer = await prisma.user.findUnique({
                where: {email}
            });

            if(existingTrainer){
                return res.status(400).json({
                    error: 'Пользователь с таким email уже существует'
                });
            }

            let hashedPassword = await bcrypt.hash(password, 10);

            let user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    fullName,
                    phone: phone || null,
                    role: 'trainer',
                    isActive: true
                }
            });

            // Создаем профиль тренера (Trainer) для user'а.
            let trainer = await prisma.trainer.create({
                data: {
                    id: user.id,      // логика в проекте: trainer.id = user.id
                    userId: user.id,
                    specialization: specialization || null,
                    bio: bio || null
                }
            });

            let token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {expiresIn: '7d'}
            );

            let {password: _, ...userWithoutPassword} = user;

            res.status(201).json({
                success: true,
                message: 'Тренер успешно создан',
                token,
                user: userWithoutPassword,
                trainer
            });
        }
        catch(error){
            console.error('createTrainer error:', error);
            res.status(500).json({
                error: 'Ошибка создания тренера',
                details: error.message
            });
        }
    }

    async updateTrainer(req, res){
        try{
            let {id} = req.params;
            let {email, password, fullName, phone, specialization, bio, isActive} = req.body;

            let existingTrainer = await prisma.user.findUnique({
                where: {id}
            });

            if(!existingTrainer){
                return res.status(404).json({
                    error: 'Тренер не найден'
                });
            }

            if(email && email !== existingTrainer.email){
                let userWithSameEmail = await prisma.user.findUnique({
                    where: {email}
                });

                if(userWithSameEmail){
                    return res.status(400).json({
                        error: 'Пользователь с таким email уже существует'
                    });
                }
            }

            let userUpdateData = {};
            if(email) userUpdateData.email = email;
            if(password) userUpdateData.password = await bcrypt.hash(password, 10);
            if(fullName) userUpdateData.fullName = fullName;
            if(phone !== undefined) userUpdateData.phone = phone;
            if(isActive !== undefined) userUpdateData.isActive = isActive;

            let user = await prisma.user.update({
                where: {id},
                data: userUpdateData
            });

            let trainerUpdateData = {};
            if(specialization !== undefined) trainerUpdateData.specialization = specialization;
            if(bio !== undefined) trainerUpdateData.bio = bio;

            if(Object.keys(trainerUpdateData).length > 0){
                await prisma.trainer.update({
                    where: {id},
                    data: trainerUpdateData
                });
            }

            let updatedTrainer = await prisma.user.findUnique({
                where: {id},
                include: {
                    trainerInfo: true
                }
            });

            let {password: _, ...userWithoutPassword} = updatedTrainer;

            res.json({
                success: true,
                message: 'Информация о тренере обновлена',
                user: userWithoutPassword
            });
        }
        catch(error){
            console.error('updateTrainer error:', error);
            res.status(500).json({error: 'Ошибка при изменении тренера'});
        }
    }

    async deleteTrainer(req, res){
        try{
            let {id} = req.params;

            let existingUser = await prisma.user.findUnique({
                where: {id},
                include: {
                    trainerInfo: true
                }
            });

            if(!existingUser){
                return res.status(404).json({error: 'Тренер не найден'});
            }

            if(existingUser.role !== 'trainer'){
                return res.status(400).json({error: 'Пользователь не является тренером'});
            }

            let deletedUser = await prisma.user.delete({
                where: {id}
            });

            let {password: _, ...userWithoutPassword} = deletedUser;

            res.json({
                success: true,
                message: 'Тренер успешно удален',
                user: userWithoutPassword
            });
        }
        catch(error){
            console.error('deleteTrainer error:', error);
            res.status(500).json({error: 'Ошибка при удалении тренера'});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //расписание
    async createSchedule(req, res){
        try{
            let {danceStyleId, trainerId, hallId, date, startTime, endTime, maxCapacity, currentBookings, status, cancellationReason} = req.body;

            if(!req.user || !req.user.id){
                return res.status(401).json({
                    error: 'Не авторизован. Передайте Bearer токен в Authorization header'
                });
            }

            let createdBy = req.user.id;
            if(!createdBy){
                return res.status(401).json({ error: 'Не удалось определить пользователя из токена' });
            }

            // Проверяем, что пользователь существует в БД (иначе будет FK violation).
            let createdByUser = await prisma.user.findUnique({
                where: { id: createdBy },
                select: { id: true }
            });
            if(!createdByUser){
                return res.status(401).json({ error: 'Пользователь из токена не найден' });
            }

            let danceStyleIdValue = parseInt(danceStyleId);
            let hallIdValue = parseInt(hallId);
            let maxCapacityValue = parseInt(maxCapacity);
            if(Number.isNaN(danceStyleIdValue) || Number.isNaN(hallIdValue) || Number.isNaN(maxCapacityValue)){
                return res.status(400).json({
                    error: 'danceStyleId, hallId и maxCapacity должны быть числами'
                });
            }

            if(!danceStyleIdValue || !trainerId || !hallIdValue || !startTime || !endTime || !maxCapacityValue || !date){
                return res.status(400).json({
                    error: 'Танцевальное направление, тренер, зал, начальное и конечное время, максимальная вместимость и дата обязательны'
                });
            }

            let danceStyle = await prisma.danceStyle.findUnique({
                where: {id: danceStyleIdValue}
            });

            if(!danceStyle){
                return res.status(404).json({
                    error: 'Танцевальное направление не найдено'
                });
            }

            let trainer = await prisma.user.findFirst({
                where: {
                    id: trainerId,
                    role: 'trainer',
                    isActive: true
                }
            });

            if(!trainer){
                return res.status(404).json({
                    error: 'Тренер не найден или не активен'
                });
            }

            // В Prisma Schedule.trainerId ссылается на Trainer.id,
            // а с фронта часто приходит User.id (id тренера).
            // Поэтому маппим trainerId(User) -> trainer.id(Trainer).
            let trainerRecord = await prisma.trainer.findFirst({
                where: {
                    OR: [
                        { id: trainer.id },
                        { userId: trainer.id }
                    ]
                }
            });

            if(!trainerRecord){
                return res.status(404).json({
                    error: 'Профиль тренера (Trainer) не найден'
                });
            }

            let actualTrainerId = trainerRecord.id;

            let hall = await prisma.hall.findUnique({
                where: {id: hallIdValue}
            })

            if(!hall){
                return res.status(404).json({
                    error: 'Зал не найден'
                });
            }

            if(maxCapacityValue > hall.capacity){
                return res.status(400).json({
                    error: `Максимальная вместимость не может превышать вместимость зала: ${hall.capacity}`
                });
            }

            // startTime/endTime в запросе приходят как строка "HH:mm:ss",
            // а в Prisma это DateTime @db.Time, поэтому для фильтрации нужно передавать Date.
            let startTimeDate = new Date(`1970-01-01T${startTime}`);
            let endTimeDate = new Date(`1970-01-01T${endTime}`);
            if (Number.isNaN(startTimeDate.getTime()) || Number.isNaN(endTimeDate.getTime())) {
                return res.status(400).json({
                    error: 'Некорректный формат startTime/endTime. Ожидается "HH:mm:ss"'
                });
            }

            let hallSchedule = await prisma.schedule.findFirst({
                where: {
                    hallId: hallIdValue,
                    date: new Date(date),
                    status: {not: 'cancelled'},
                    OR: [
                        {
                            AND: [
                                {startTime: {lte: startTimeDate}},
                                {endTime: {gt: endTimeDate}}
                            ]
                        },
                        {
                            AND: [
                                {startTime: {lt: startTimeDate}},
                                {endTime: {gte: endTimeDate}}
                            ]
                        }
                    ]
                }
            });

            if(hallSchedule){
                return res.status(409).json({
                    error: 'Зал занят в это время'
                });
            }

            let trainerSchedule = await prisma.schedule.findFirst({
                where: {
                    trainerId: actualTrainerId,
                    date: new Date(date),
                    status: {not: 'cancelled'},
                    OR: [
                        {
                            AND: [
                                {startTime: {lte: startTimeDate}},
                                {endTime: {gt: endTimeDate}}
                            ]
                        },
                        {
                            AND: [
                                {startTime: {lt: startTimeDate}},
                                {endTime: {gte: endTimeDate}}
                            ]
                        }
                    ]
                }
            });

            if(trainerSchedule){
                return res.status(409).json({
                    error: 'Тренер уже занят в это время'
                });
            }

            let schedule = await prisma.schedule.create({
                data: {
                    danceStyleId: danceStyleIdValue,
                    trainerId: actualTrainerId,
                    hallId: hallIdValue,
                    date: new Date(date),
                    startTime: startTimeDate,
                    endTime: endTimeDate,
                    maxCapacity: maxCapacityValue,
                    currentBookings: 0,
                    status: status || 'scheduled',
                    cancellationReason: cancellationReason || null,
                    createdBy 
                },
                include: {
                    danceStyle: true,
                    trainer: {
                        select: {
                            id: true,
                            specialization: true,
                            bio: true,
                            hireDate: true,
                            user: {
                                select: {
                                    fullName: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    hall: true
                }
            });

            // Приводим ответ к старому формату: fullName/email/phone на уровне `trainer`.
            if (schedule?.trainer?.user) {
                schedule.trainer = {
                    ...schedule.trainer,
                    fullName: schedule.trainer.user.fullName,
                    email: schedule.trainer.user.email,
                    phone: schedule.trainer.user.phone
                };
                delete schedule.trainer.user;
            }

            res.status(201).json({
                success: true,
                message: 'Занятие успешно создано',
                schedule
            });
        }
        catch(error){
            console.error('createSchedule error:', error);
            res.status(500).json({
                error: 'Ошибка создания расписания',
                details: error.message
            });
        }
    }

    async updateSchedule(req, res) {
        try {
            let { id } = req.params;
            let {
                danceStyleId,
                trainerId,
                hallId,
                date,
                startTime,
                endTime,
                maxCapacity,
                currentBookings,
                status,
                cancellationReason
            } = req.body;
            
            let existingSchedule = await prisma.schedule.findUnique({
                where: { id }
            });
            
            if (!existingSchedule) {
                return res.status(404).json({
                    error: 'Запись расписания не найдена'
                });
            }
            
            let hall;
            if (hallId) {
                hall = await prisma.hall.findUnique({
                    where: { id: hallId }
                });
                if (!hall) {
                    return res.status(404).json({ error: 'Зал не найден' });
                }
            } else {
                hall = await prisma.hall.findUnique({
                    where: { id: existingSchedule.hallId }
                });
            }
            
            if (danceStyleId && danceStyleId !== existingSchedule.danceStyleId) {
                let danceStyle = await prisma.danceStyle.findUnique({
                    where: { id: danceStyleId }
                });
                if (!danceStyle) {
                    return res.status(404).json({ error: 'Танцевальное направление не найдено' });
                }
            }
            
            let newDate = date ? new Date(date) : existingSchedule.date;
            let newStartTime = startTime 
                ? new Date(`1970-01-01T${startTime}`) 
                : existingSchedule.startTime;
            let newEndTime = endTime 
                ? new Date(`1970-01-01T${endTime}`) 
                : existingSchedule.endTime;
            let newHallId = hallId || existingSchedule.hallId;
            let newTrainerId = trainerId || existingSchedule.trainerId;
            
            if (trainerId && trainerId !== existingSchedule.trainerId) {
                let trainer = await prisma.user.findFirst({
                    where: {
                        id: trainerId,
                        role: 'trainer',
                        isActive: true
                    }
                });
                if (!trainer) {
                    return res.status(404).json({ error: 'Тренер не найден или не активен' });
                }
            }
            
            let needCheckHall = (hallId && hallId !== existingSchedule.hallId) ||
                (date && date !== existingSchedule.date.toISOString().split('T')[0]) ||
                (startTime && startTime !== existingSchedule.startTime.toISOString().split('T')[1].slice(0, 8)) ||
                (endTime && endTime !== existingSchedule.endTime.toISOString().split('T')[1].slice(0, 8));
            
            if (needCheckHall) {
                let hallSchedule = await prisma.schedule.findFirst({
                    where: {
                        id: { not: id },
                        hallId: newHallId,
                        date: newDate,
                        status: { not: 'cancelled' },
                        OR: [
                            {
                                AND: [
                                    { startTime: { lte: newStartTime } },
                                    { endTime: { gt: newStartTime } }
                                ]
                            },
                            {
                                AND: [
                                    { startTime: { lt: newEndTime } },
                                    { endTime: { gte: newEndTime } }
                                ]
                            },
                            {
                                AND: [
                                    { startTime: { gte: newStartTime } },
                                    { endTime: { lte: newEndTime } }
                                ]
                            }
                        ]
                    }
                });
                if (hallSchedule) {
                    return res.status(409).json({ error: 'Зал уже занят в это время' });
                }
            }
            
            let needCheckTrainer = (trainerId && trainerId !== existingSchedule.trainerId) ||
                (date && date !== existingSchedule.date.toISOString().split('T')[0]) ||
                (startTime && startTime !== existingSchedule.startTime.toISOString().split('T')[1].slice(0, 8)) ||
                (endTime && endTime !== existingSchedule.endTime.toISOString().split('T')[1].slice(0, 8));
            
            if (needCheckTrainer) {
                let trainerSchedule = await prisma.schedule.findFirst({
                    where: {
                        id: { not: id },
                        trainerId: newTrainerId,
                        date: newDate,
                        status: { not: 'cancelled' },
                        OR: [
                            {
                                AND: [
                                    { startTime: { lte: newStartTime } },
                                    { endTime: { gt: newStartTime } }
                                ]
                            },
                            {
                                AND: [
                                    { startTime: { lt: newEndTime } },
                                    { endTime: { gte: newEndTime } }
                                ]
                            },
                            {
                                AND: [
                                    { startTime: { gte: newStartTime } },
                                    { endTime: { lte: newEndTime } }
                                ]
                            }
                        ]
                    }
                });
                if (trainerSchedule) {
                    return res.status(409).json({ error: 'Тренер уже занят в это время' });
                }
            }
            
            if (maxCapacity && maxCapacity > hall.capacity) {
                return res.status(400).json({
                    error: `Максимальная вместимость не может превышать вместимость зала (${hall.capacity})`
                });
            }
            
            let newMaxCapacity = maxCapacity !== undefined ? maxCapacity : existingSchedule.maxCapacity;
            let newCurrentBookings = currentBookings !== undefined ? currentBookings : existingSchedule.currentBookings;
            
            if (newCurrentBookings > newMaxCapacity) {
                return res.status(400).json({
                    error: `Количество записей (${newCurrentBookings}) не может превышать максимальную вместимость (${newMaxCapacity})`
                });
            }
            
            let scheduleUpdateData = {};
            if (danceStyleId !== undefined) scheduleUpdateData.danceStyleId = danceStyleId;
            if (trainerId !== undefined) scheduleUpdateData.trainerId = trainerId;
            if (hallId !== undefined) scheduleUpdateData.hallId = hallId;
            if (date !== undefined) scheduleUpdateData.date = new Date(date);
            if (startTime !== undefined) scheduleUpdateData.startTime = new Date(`1970-01-01T${startTime}`);
            if (endTime !== undefined) scheduleUpdateData.endTime = new Date(`1970-01-01T${endTime}`);
            if (maxCapacity !== undefined) scheduleUpdateData.maxCapacity = maxCapacity;
            if (currentBookings !== undefined) scheduleUpdateData.currentBookings = currentBookings;
            if (status !== undefined) scheduleUpdateData.status = status;
            if (cancellationReason !== undefined) scheduleUpdateData.cancellationReason = cancellationReason;
            
            let updatedSchedule = await prisma.schedule.update({
                where: { id },
                data: scheduleUpdateData,
                include: {
                    danceStyle: true,
                    trainer: {
                        select: {
                            id: true,
                            specialization: true,
                            bio: true,
                            hireDate: true,
                            user: {
                                select: {
                                    fullName: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    hall: true
                }
            });

            if (updatedSchedule?.trainer?.user) {
                updatedSchedule.trainer = {
                    ...updatedSchedule.trainer,
                    fullName: updatedSchedule.trainer.user.fullName,
                    email: updatedSchedule.trainer.user.email,
                    phone: updatedSchedule.trainer.user.phone
                };
                delete updatedSchedule.trainer.user;
            }
            
            res.json({
                success: true,
                message: 'Расписание обновлено',
                schedule: updatedSchedule
            });
            
        } catch (error) {
            console.error('updateSchedule error:', error);
            res.status(500).json({ error: 'Ошибка при обновлении расписания' });
        }
    }

    async deleteSchedule(req, res){
        try{
            let {id} = req.params;

            let existingSchedule = await prisma.schedule.findUnique({
                where: {id},
                include: {
                    bookings: {
                        where: {
                            status: {not: 'cancelled'}
                        }
                    }
                }
            });

            if(!existingSchedule){
                return res.status(404).json({error: 'Занятия в расписании не найдено'});
            }

            if(existingSchedule.bookings && existingSchedule.bookings.length > 0){
                return res.status(409).json({error: 'Невозможно удалить занятие, так как на него есть активные записи. Сначала отмените записи клиентов'});
            }

            let deletedSchedule = await prisma.schedule.delete({
                where: {id}
            });

            res.json({
                success: true,
                message: 'Занятие в расписании успешно удалено',
                schedule: deletedSchedule
            });
        }
        catch(error){
            console.error('deleteSchedule error:', error);
            res.status(500).json({error: 'Ошибка при удалении занятия в расписании'});
        }
    }

    async getSchedule(req, res){
        try{
            let {role, id: userId} = req.user;
            let {date, trainerId, status, fromDate, toDate} = req.query;

            //условия фильтрации
            let where = {};

            if(date){
                where.date = new Date(date);
            }

            if(fromDate || toDate){
                where.date = {};
                if(fromDate) where.date.gte = new Date(fromDate);
                if(toDate) where.date.lte = new Date(toDate);
            }

            if(status){
                where.status = status;
            }

            if(trainerId){
                where.trainerId = trainerId;
            }

            if(role === 'trainer'){
                where.trainerId = userId;
            }

            if(role === 'client'){
                where.status = {not: 'cancelled'};
                where.date = { gte: new Date() };
            }

            let schedule = await prisma.schedule.findMany({
                where,
                include: {
                    danceStyle: true,
                    trainer: {
                        select: {
                            id: true,
                            specialization: true,
                            bio: true,
                            hireDate: true,
                            user: {
                                select: {
                                    fullName: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    hall: true,
                    _count: {
                        select: {bookings: true}
                    }
                },
                orderBy: [
                    {date: 'asc'},
                    {startTime: 'asc'}
                ]
            });

            let formattedSchedule = schedule.map(item => ({
                id: item.id,
                danceStyle: item.danceStyle,
                trainer: item.trainer?.user
                    ? {
                        id: item.trainer.id,
                        fullName: item.trainer.user.fullName,
                        email: item.trainer.user.email,
                        phone: item.trainer.user.phone,
                        specialization: item.trainer.specialization,
                        bio: item.trainer.bio,
                        hireDate: item.trainer.hireDate
                    }
                    : item.trainer,
                hall: item.hall,
                date: item.date.toISOString().split('T')[0],
                startTime: item.startTime.toISOString().split('T')[1].slice(0, 5),
                endTime: item.endTime.toISOString().split('T')[1].slice(0, 5),
                maxCapacity: item.maxCapacity,
                currentBookings: item.currentBookings,
                bookingsCount: item._count?.bookings,
                status: item.status,
                cancellationReason: item.cancellationReason
            }));

            res.json({
                success: true,
                schedule: formattedSchedule
            });
        }
        catch(error){
            console.error('getSchedule error:', error);
            res.status(500).json({error: 'Ошибка при получении расписания'});
        }
    }

    async getScheduleById(req, res){
        try{
            let {id} = req.params;

            let schedule = await prisma.schedule.findUnique({
                where: {id},
                include: {
                    danceStyle: true,
                    trainer: {
                        select: {
                            id: true,
                            specialization: true,
                            bio: true,
                            hireDate: true,
                            user: {
                                select: {
                                    fullName: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    hall: true,
                    bookings: {
                        select: {
                            id: true,
                            clientId: true,
                            status: true,
                            bookingTime: true,
                            client: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            bookings: true
                        }
                    }
                }
            });

            if(!schedule){
                return res.status(404).json({
                    error: 'Занятие в расписании не найдено'
                });
            }

            if (schedule?.trainer?.user) {
                schedule.trainer = {
                    ...schedule.trainer,
                    fullName: schedule.trainer.user.fullName,
                    email: schedule.trainer.user.email,
                    phone: schedule.trainer.user.phone
                };
                delete schedule.trainer.user;
            }

            res.json({schedule});
        }
        catch(error){
            console.error('getScheduleById error:', error);
            res.status(500).json({error: 'Ошибка при получении занятия расписания'});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //абонементы клиентов
    async getMemberships(req, res){
        try{
            let {role, id: userId} = req.user;
            let {status, clientId} = req.query;

            let where = {};

            if(role === 'client'){
                where.clientId = userId;
            }

            if(clientId && role === 'admin'){
                where.clientId = clientId;
            }

            if(status){
                where.status = status;
            }

            let memberships = await prisma.membership.findMany({
                where,
                include: {
                    membershipType: true,
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    },
                    bookings: {
                        select: {
                            id: true,
                            status: true,
                            bookingTime: true,
                            schedule: {
                                select: {
                                    date: true,
                                    startTime: true,
                                    endTime: true,
                                    danceStyle: {
                                        select: {name: true}
                                    }
                                }
                            }
                        },
                        take: 5,
                        orderBy: {bookingTime: 'desc'}
                    }
                },
                // В модели Membership нет createdAt, сортируем по дате покупки.
                orderBy: {purchaseDate: 'desc'}
            });

            let formattedMemberships = memberships.map(membership => ({
                id: membership.id,
                client: membership.client,
                membershipType: membership.membershipType,
                purchaseDate: membership.purchaseDate,
                startDate: membership.startDate,
                endDate: membership.endDate,
                remainingVisits: membership.remainingVisits,
                status: membership.status,
                pricePaid: membership.pricePaid,
                pausedAt: membership.pausedAt,
                pausedUntil: membership.pausedUntil,
                visitsUsed: membership.membershipType.visitCount 
                    ? (membership.membershipType.visitCount - (membership.remainingVisits || 0))
                    : null,
                recentBookings: membership.bookings
            }));

            res.json({
                success: true,
                memberships: formattedMemberships 
            });
        }
        catch(error){
            console.error('getMemberships error:', error);
            res.status(500).json({
                error: 'Ошибка при получении абонементов',
                details: error.message
            });
        }
    }

    async getMembershipById(req, res){
        try{
            let {id} = req.params;
            let {role, id: userId} = req.user;

            let membership = await prisma.membership.findUnique({
                where: {id},
                include: {
                    membershipType: true,
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    },
                    bookings: {
                        select: {
                            id: true,
                            status: true,
                            bookingTime: true,
                            schedule: {
                                select: {
                                    date: true,
                                    startTime: true,
                                    endTime: true,
                                    danceStyle: {
                                        select: {name: true}
                                    }
                                }
                            }
                        },
                        orderBy: {bookingTime: 'desc'},
                        take: 10
                    }
                }
            });

            if(!membership){
                return res.status(404).json({
                    error: 'Абонемент не найден'
                });
            }

            if(role === 'client' && membership.clientId !== userId){
                return res.status(403).json({
                    error: 'Доступ запрещен. Вы можете просматривать только свои абонементы'
                });
            }

            let formattedMembership = {
                id: membership.id,
                client: membership.client,
                membershipType: membership.membershipType,
                purchaseDate: membership.purchaseDate,
                startDate: membership.startDate,
                endDate: membership.endDate,
                remainingVisits: membership.remainingVisits,
                status: membership.status,
                pricePaid: membership.pricePaid,
                pausedAt: membership.pausedAt,
                pausedUntil: membership.pausedUntil,
                visitsUsed: membership.membershipType.visitCount 
                    ? (membership.membershipType.visitCount - (membership.remainingVisits || 0))
                    : null,
                recentBookings: membership.bookings
            };

            res.json({
                success: true,
                membership: formattedMembership
            });
        }
        catch(error){
            console.error('getMembershipById error:', error);
            res.status(500).json({error: 'Ошибка при получении абонемента'});
        }
    }

    async createMembership(req, res){
        try{
            let {role, id: userId} = req.user;
            let {
                membershipTypeId
            } = req.body;

            if(!membershipTypeId){
                return res.status(400).json({
                    error: 'Выберите тип абонемента'
                });
            }

            let membershipType = await prisma.membershipType.findUnique({
                where: {id: membershipTypeId}
            });

            if(!membershipType){
                return res.status(404).json({
                    error: 'Данный тип абонемента не найден'
                });
            }

            if(!membershipType.isActive){
                return res.status(400).json({
                    error: 'Этот тип абонемента временно не доступен для покупки'
                });
            }

            let clientId = userId;
            if(role === 'admin' && (req.body.clientId || req.body.clienId)){
                clientId = req.body.clientId || req.body.clienId;
            }

            let client = await prisma.user.findFirst({
                where: {
                    id: clientId,
                    role: 'client',
                    isActive: true
                }
            });

            if(!client){
                return res.status(404).json({
                    error: 'Клиент не найден или неактивен'
                });
            }

            let startDate = new Date();
            let endDate = membershipType.durationDays 
                ? new Date(startDate.getTime() + membershipType.durationDays * 24 * 60 * 60 * 1000)
                : null;
            
            let remainingVisits = membershipType.visitCount === null 
                ? null 
                : membershipType.visitCount;

            let membership = await prisma.membership.create({
                data: {
                    clientId,
                    membershipTypeId,
                    purchaseDate: new Date(),
                    startDate,
                    endDate,
                    remainingVisits,
                    status: 'active',
                    pricePaid: membershipType.price
                },
                include: {
                    membershipType: {
                        select: {
                            name: true,
                            visitCount: true,
                            durationDays: true
                        }
                    },
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Абонемент успешно приобретен',
                membership: {
                    id: membership.id,
                    client: membership.client,
                    membershipType: membership.membershipType,
                    purchaseDate: membership.purchaseDate,
                    startDate: membership.startDate,
                    endDate: membership.endDate,
                    remainingVisits: membership.remainingVisits,
                    status: membership.status,
                    pricePaid: membership.pricePaid
                }
            });
        }
        catch(error){
            console.error('createMembership error:', error);
            res.status(500).json({error: 'Ошибка при создании абонемента'});
        }
    }

    async pauseMembership(req, res){
        try{
            let {id} = req.params;
            let {role, id: userId} = req.user;
            let {status, pauseReason} = req.body;

            if(role !== 'admin'){
                return res.status(403).json({
                    error: 'Доступ запрещен. Активировать/деактивировать абонементы может только администратор'
                });
            }

            let existingMembership = await prisma.membership.findUnique({
                where: {id},
                include: {
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    membershipType: true
                }
            });

            if(!existingMembership){
                return res.status(404).json({
                    error: 'Абонемент не найден'
                });
            }

            let validStatuses = ['active', 'paused', 'expired', 'cancelled'];
            if(!validStatuses.includes(status)){
                return res.status(400).json({
                    error: `Недопустимый статус. Допустимые значения: ${validStatuses.join(', ')}`
                });
            }

            if(status === 'paused' && existingMembership.status !== 'active'){
                return res.status(400).json({
                    error: 'Приостановить можно только активный абонемент'
                });
            }

            if(status === 'active' && existingMembership.status !== 'paused'){
                return res.status(400).json({
                    error: 'Активировать можно только приостановленный абонемент'
                });
            }

            if(status === 'cancelled' && ['expired', 'cancelled'].includes(existingMembership.status)){
                return res.status(400).json({
                    error: 'Абонемент уже завершен или отменен'
                });
            }

            let updateData = {status};

            if(status === 'paused'){
                updateData.pausedAt = new Date();
                updateData.pausedUntil = null;
            }

            if (status === 'active' && existingMembership.status === 'paused') {
                updateData.pausedUntil = new Date(); 
                // Если нужно продлить абонемент на время приостановки
                if (existingMembership.endDate && existingMembership.pausedAt) {
                    const pauseDays = Math.ceil((new Date() - existingMembership.pausedAt) / (1000 * 60 * 60 * 24));
                    updateData.endDate = new Date(existingMembership.endDate.getTime() + pauseDays * 24 * 60 * 60 * 1000);
                }
            }

            let updatedMembership = await prisma.membership.update({
                where: {id},
                data: updateData,
                include: {
                    membershipType: true,
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            });

            let message = '';
            switch(status){
                case 'active': {
                    message = 'Абонемент активирован';
                    break;
                }
                case 'paused': {
                    message = 'Абонемент приостановлен';
                    break;
                }
                case 'cancelled': {
                    message = 'Абонемент отменен';
                    break;
                }
                case 'expired': {
                    message = 'Абонемент помечен как просроченный';
                    break;
                }
                default: {
                    message = 'Статус абонемента изменен';
                }
            }

            let {pausedAt, pausedUntil, ...rest} = updatedMembership;

            res.json({
                success: true,
                message,
                membership: {
                    ...rest,
                    pausedAt: pausedAt || null,
                    pausedUntil: pausedUntil || null
                }
            });
        }
        catch(error){
            console.error('pauseMembership error:', error);
            res.status(500).json({error: 'Ошибка при приостановке абонемента'});
        }
    }

    async updateMembership(req, res){
        try{
            let { id } = req.params;
            let {
                clientId,
                membershipTypeId,
                purchaseDate,
                startDate,
                endDate,
                remainingVisits,
                status,
                pricePaid
            } = req.body;

            let existingMembership = await prisma.membership.findUnique({
                where: {id},
                include: {
                    membershipType: true,
                    client: true
                }
            });

            if(!existingMembership){
                return res.status(404).json({
                    error: 'Абонемент не найден'
                });
            }

            if(clientId && clientId !== existingMembership.clientId){
                let newClient = await prisma.user.findFirst({
                    where: {
                        id: clientId,
                        role: 'client',
                        isActive: true
                    }
                });

                if(!newClient){
                    return res.status(404).json({
                        error: 'Клиент не найден или неактивен'
                    });
                }
            }

            if(membershipTypeId && membershipTypeId !== existingMembership.membershipTypeId){
                let newType = await prisma.membershipType.findFirst({
                    where: {
                        id: membershipTypeId
                    }
                });

                if(!newType){
                    return res.status(404).json({
                        error: 'Тип абонемента не найден'
                    });
                }
            }            

            if(status){
                let validStatuses = ['active', 'paused', 'expired', 'cancelled'];
                if(!validStatuses.includes(status)){
                    return res.status(400).json({
                        error: `Недопустимый статус. Допустимые значения: ${validStatuses.join(', ')}`
                    });
                }
            }

            if(remainingVisits !== undefined && remainingVisits < 0){
                return res.status(400).json({
                    error: 'Количество оставшихся занятий не может быть отрицательным'
                });
            }

            if(pricePaid !== undefined && pricePaid < 0){
                return res.status(400).json({
                    error: 'Цена не может быть отрицательной'
                });
            }            

            let updateData = {};
            if(clientId !== undefined) updateData.clientId = clientId;
            if(membershipTypeId !== undefined) updateData.membershipTypeId = membershipTypeId;
            if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
            if (startDate !== undefined) updateData.startDate = new Date(startDate);
            if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
            if(remainingVisits !== undefined) updateData.remainingVisits = remainingVisits;
            if(status !== undefined) updateData.status = status;
            if(pricePaid !== undefined) updateData.pricePaid = pricePaid;

            let updatedMembership = await prisma.membership.update({
                where: {id},
                data: updateData,
                include: {
                    membershipType: true,
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                message: 'Абонемент обновлен',
                membership: updatedMembership
            });
        }
        catch(error){
            console.error('updateMembership error:', error);
            res.status(500).json({error: 'Ошибка при обновлении абонемента'});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //типы абонементов
    async getMembershipTypes(req, res){
        try{
            let membershipTypes = await prisma.membershipType.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    visitCount: true,
                    durationDays: true,
                    isActive: true
                },
                where: {isActive: true},
                orderBy: {
                    price: 'asc'
                }
            });

            res.json({
                success: true,
                membershipTypes
            });
        }
        catch(error){
            console.error('getMembershipTypes error:', error);
            res.status(500).json({error: 'Ошибка при получении типов абонементов'});
        }
    }

    async createMembershipType(req, res){
        try{
            let {
                name,
                description,
                price,
                visitCount,
                durationDays,
                isActive
            } = req.body;

            // Prisma Decimal удобнее передавать строкой.
            let priceValue = price;
            if (priceValue !== undefined && typeof priceValue === 'number') {
                priceValue = priceValue.toString();
            }

            if(!name || price === undefined){
                return res.status(400).json({
                    error: 'Название и цена обязательны'
                });
            }

            if(price !== undefined && price < 0){
                return res.status(400).json({
                    error: 'Цена не может быть отрицательной'
                });
            }

            if(visitCount !== undefined && visitCount < 0){
                return res.status(400).json({
                    error: 'Количество занятий не может быть отрицательным'
                });
            }

            if(durationDays !== undefined && durationDays < 0){
                return res.status(400).json({
                    error: 'Срок действия не может быть отрицательным'
                });
            }

            if(visitCount !== undefined && visitCount !== null && visitCount <= 0){
                return res.status(400).json({
                    error: 'Количество занятий должно быть больше 0 или null для безлимитного типа'
                });
            }

            let existingMembershipType = await prisma.membershipType.findFirst({
                where: {name}
            });

            if(existingMembershipType){
                return res.status(400).json({
                    error: 'Тип абонемента с таким названием уже существует'
                });
            }

            let membershipType = await prisma.membershipType.create({
                data: {
                    name,
                    description: description || null,
                    price: priceValue,
                    visitCount: visitCount !== undefined ? visitCount : null,
                    durationDays: durationDays || null,
                    isActive: isActive !== undefined ? isActive : true
                }
            });

            res.status(201).json({
                success: true,
                message: 'Тип абонемента успешно создан',
                membershipType
            })
        }
        catch(error){
            console.error('createMembershipType error:', error);
            res.status(500).json({error: 'Ошибка при создании типа абонемента'});
        }
    }

    async updateMembershipType(req, res){
        try{
            let { id } = req.params;
            let membershipTypeId = parseInt(id);
            if (Number.isNaN(membershipTypeId)) {
                return res.status(400).json({ error: 'Некорректный id типа абонемента' });
            }
            let {
                name,
                description,
                price,
                visitCount,
                durationDays,
                isActive
            } = req.body;

            let priceValue = price;
            if (priceValue !== undefined && typeof priceValue === 'number') {
                priceValue = priceValue.toString();
            }

            let existingType = await prisma.membershipType.findUnique({
                where: {id: membershipTypeId}
            });

            if(!existingType){
                return res.status(404).json({
                    error: 'Тип абонемента не найден'
                });
            }

            if(price !== undefined && price < 0){
                return res.status(400).json({
                    error: 'Цена не может быть отрицательной'
                });
            }

            if(visitCount !== undefined && visitCount < 0){
                return res.status(400).json({
                    error: 'Количество занятий не может быть отрицательным'
                });
            }

            if(durationDays !== undefined && durationDays < 0){
                return res.status(400).json({
                    error: 'Срок действия не может быть отрицательным'
                });
            }

            if(visitCount !== undefined && visitCount !== null && visitCount <= 0){
                return res.status(400).json({
                    error: 'Количество занятий должно быть больше 0 или null для безлимитного типа'
                });
            }

            if(name && name !== existingType.name){
                let existingByName = await prisma.membershipType.findFirst({
                    where: {name}
                });

                if(existingByName){
                    return res.status(400).json({
                        error: 'Тип абонемента с таким названием уже существует'
                    });
                }
            }

            let membershipTypeUpdateData = {};
            if(name !== undefined) membershipTypeUpdateData.name = name;
            if(description !== undefined) membershipTypeUpdateData.description = description;
            if(price !== undefined) membershipTypeUpdateData.price = priceValue;
            if(visitCount !== undefined) membershipTypeUpdateData.visitCount = visitCount;
            if(durationDays !== undefined) membershipTypeUpdateData.durationDays = durationDays;
            if(isActive !== undefined) membershipTypeUpdateData.isActive = isActive;

            let updateMembershipType = await prisma.membershipType.update({
                where: {id: membershipTypeId},
                data: membershipTypeUpdateData
            });

            res.json({
                success: true,
                message: 'Тип абонемента обновлен',
                membershipType: updateMembershipType
            });
        }
        catch(error){
            console.error('updateMembershipType error:', error);
            res.status(500).json({error: 'Ошибка при изменении типа абонемента', details: error.message});
        }
    }

    async deleteMembershipType(req, res){
        try{
            let {id} = req.params;
            let membershipTypeId = parseInt(id);
            if (Number.isNaN(membershipTypeId)) {
                return res.status(400).json({ error: 'Некорректный id типа абонемента' });
            }

            let existingType = await prisma.membershipType.findUnique({
                where: {id: membershipTypeId},
                include: {
                    memberships: {
                        where: {
                            status: {in: ['active', 'paused']}
                        }
                    }
                }
            });

            if(!existingType){
                return res.status(404).json({error: 'Тип абонемента не найден'});
            }

            if(existingType.memberships && existingType.memberships.length > 0){
                return res.status(409).json({
                    error: `Невозможно удалить тип абонемента, так как есть ${existingType.memberships.length} активных абонементов этого типа. Сначала отмените или удалите эти абонементы`
                });
            }

            let deletedMembershipType = await prisma.membershipType.delete({
                where: {id: membershipTypeId}
            });

            res.json({
                success: true,
                message: 'Тип абонемента успешно удален',
                membershipType: deletedMembershipType
            });
        }
        catch(error){
            console.error('deleteMembershipType error:', error);
            res.status(500).json({error: 'Ошибка при удалении типа абонемента', details: error.message});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //запись на занятия
    async getBookings(req, res){
        try{
            let {role, id: userId} = req.user;
            let {
                scheduleId,
                clienId,
                clientId,
                status,
                date,
                fromDate,
                toDate
            } = req.query;

            let where = {};

            if(role === 'client'){
                where.clientId = userId;
            } else if(role === 'trainer'){
                where.schedule = {
                    trainerId: userId
                };
            }

            if(scheduleId){
                where.scheduleId = scheduleId;
            }

            let targetClientId = clientId || clienId;
            if(targetClientId && (role === 'admin' || role === 'trainer')){
                where.clientId = targetClientId;
            }

            if(status){
                let validStatuses = ['booked', 'attended', 'no_show', 'cancelled'];
                if(validStatuses.includes(status)){
                    where.status = status;
                }
            }

            if(date){
                where.schedule = {
                    ...where.schedule,
                    date: new Date(date)
                };
            }

            if(fromDate || toDate){
                where.schedule = {
                    ...where.schedule,
                    date: {}
                };
                if(fromDate) where.schedule.date.gte = new Date(fromDate);
                if(toDate) where.schedule.date.lte = new Date(toDate);
            }

            let bookings = await prisma.booking.findMany({
                where,
                include: {
                    schedule: {
                        include: {
                            danceStyle: true,
                            hall: true,
                            trainer: {
                                select: {
                                    id: true,
                                    specialization: true,
                                    bio: true,
                                    hireDate: true,
                                    user: {
                                        select: {
                                            fullName: true,
                                            email: true,
                                            phone: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    },
                    membership: {
                        include: {
                            membershipType: true
                        }
                    },
                    attendanceLogs: true
                },
                orderBy: [
                    {bookingTime: 'desc'}
                ]
            });

            let formattedBookings = bookings.map(booking => ({
                id: booking.id,
                schedule: {
                    id: booking.schedule.id,
                    date: booking.schedule.date,
                    startTime: booking.schedule.startTime,
                    endTime: booking.schedule.endTime,
                    danceStyle: booking.schedule.danceStyle,
                    trainer: booking.schedule.trainer?.user
                        ? {
                            id: booking.schedule.trainer.id,
                            fullName: booking.schedule.trainer.user.fullName,
                            email: booking.schedule.trainer.user.email,
                            phone: booking.schedule.trainer.user.phone,
                            specialization: booking.schedule.trainer.specialization,
                            bio: booking.schedule.trainer.bio,
                            hireDate: booking.schedule.trainer.hireDate
                        }
                        : booking.schedule.trainer,
                    hall: booking.schedule.hall
                },
                client: booking.client,
                membership: {
                    id: booking.membership.id,
                    type: booking.membership.membershipType?.name,
                    remainingVisits: booking.membership.remainingVisits
                },
                status: booking.status,
                bookingTime: booking.bookingTime,
                attendedAt: booking.attendedAt,
                cancelledAt: booking.cancelledAt,
                isAttended: Array.isArray(booking.attendanceLogs) && booking.attendanceLogs.length > 0
            }));

            res.json({
                success: true,
                count: bookings.length,
                bookings: formattedBookings
            });
        }
        catch(error){
            console.error('getBookings error:', error);
            res.status(500).json({error: 'Ошибка при получении записей на занятие', details: error.message});
        }
    }

    async getBookingsBySchedule(req, res){
        try{
            let {scheduleId} = req.params;
            let { role, id: userId } = req.user;
            
            let schedule = await prisma.schedule.findUnique({
                where: {id: scheduleId},
                include: {
                    danceStyle: true,
                    hall: true,
                    trainer: {
                        select: {
                            id: true,
                            specialization: true,
                            bio: true,
                            hireDate: true,
                            user: {
                                select: {
                                    fullName: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    }
                }
            });

            if(!schedule){
                return res.status(404).json({
                    error: 'Занятие не найдено'
                });
            }

            if(role === 'client'){
                return res.status(403).json({
                    error: 'Доступ запрещен. Просматривать записи на занятие могут только тренеры и администраторы'
                });
            }

            if(role === 'trainer' && schedule.trainerId !== userId){
                return res.status(403).json({
                    error: 'Вы можете просматривать записи только на свои занятия'
                });
            }

            if (schedule?.trainer?.user) {
                schedule.trainer = {
                    ...schedule.trainer,
                    fullName: schedule.trainer.user.fullName,
                    email: schedule.trainer.user.email,
                    phone: schedule.trainer.user.phone
                };
                delete schedule.trainer.user;
            }

            let bookings = await prisma.booking.findMany({
                where: {
                    scheduleId,
                    status: { not: 'cancelled' }
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            phone: true,
                            email: true
                        }
                    },
                    membership: {
                        include: {
                            membershipType: {
                                select: {
                                    name: true,
                                    visitCount: true
                                }
                            }
                        }
                    },
                    attendanceLogs: {
                        take: 1,
                        orderBy: { markedAt: 'desc' },
                        select: {
                            id: true,
                            markedAt: true
                        }
                    }
                },
                orderBy: { bookingTime: 'asc' }
            });

            let stats = {
                total: bookings.length,
                booked: bookings.filter(b => b.status === 'booked').length,
                attended: bookings.filter(b => b.status === 'attended').length,
                noShow: bookings.filter(b => b.status === 'no_show').length
            };

            let formattedBookings = bookings.map(booking => ({
                id: booking.id,
                client: booking.client,
                status: booking.status,
                bookingTime: booking.bookingTime,
                attendedAt: booking.attendedAt,
                membership: {
                    id: booking.membership.id,
                    typeName: booking.membership.membershipType.name,
                    remainingVisits: booking.membership.remainingVisits,
                    isUnlimited: booking.membership.membershipType.visitCount === null
                },
                attendanceLog: booking.attendanceLogs?.[0] ? {
                    markedAt: booking.attendanceLogs[0].markedAt,
                } : null
            }));

            res.json({
                success: true,
                schedule: {
                    id: schedule.id,
                    date: schedule.date,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    danceStyle: schedule.danceStyle,
                    hall: schedule.hall,
                    trainer: schedule.trainer,
                    maxCapacity: schedule.maxCapacity,
                    currentBookings: schedule.currentBookings,
                    status: schedule.status
                },
                stats,
                availableSpots: schedule.maxCapacity - stats.total,
                bookings: formattedBookings
            });
        }
        catch(error){
            console.error('getBookingsBySchedule error:', error);
            res.status(500).json({error: 'Ошибка при получении записей на занятие', details: error.message});
        }
    }

    async createBooking(req, res){
        try{
            let {role, id: userId} = req.user;
            let {scheduleId, membershipId} = req.body;

            if(role !== 'client'){
                return res.status(403).json({
                    error: 'Записываться на занятия могут только клиенты'
                });
            }

            if(!scheduleId){
                return res.status(400).json({
                    error: 'Необходимо указать ID занятия'
                });
            }

            let schedule = await prisma.schedule.findUnique({
                where: {id: scheduleId},
                include: {
                    danceStyle: true,
                    hall: true,
                    trainer: {
                        select: {
                            id: true,
                            specialization: true,
                            bio: true,
                            hireDate: true,
                            user: {
                                select: {
                                    fullName: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    }
                }
            });

            if(!schedule){
                return res.status(404).json({
                    error: 'Занятие не найдено'
                });
            }

            if(schedule.status === 'cancelled'){
                return res.status(400).json({
                    error: 'Это занятие отменено, запись невозможна'
                });
            }

            let now = new Date();
            let scheduleDateTime = new Date(schedule.date);
            let [startHour, startMinute] = schedule.startTime.toISOString().split('T')[1].split(':');
            scheduleDateTime.setHours(parseInt(startHour), parseInt(startMinute));

            if(scheduleDateTime < now){
                return res.status(400).json({
                    error: 'Нельзя записаться на прошедшее занятие'
                });
            }

            if(schedule.currentBookings >= schedule.maxCapacity){
                return res.status(409).json({
                    error: 'Нет свободных мест на это занятие'
                });
            }

            let existingBookings = await prisma.booking.findFirst({
                where: {
                    scheduleId,
                    clientId: userId,
                    status: {not: 'cancelled'}
                }
            });

            if(existingBookings){
                return res.status(409).json({
                    error: 'Вы уже записаны на это занятие'
                });
            }

            let selectedMembershipId = membershipId;
            let membership = null;

            if(!selectedMembershipId){
                membership = await prisma.membership.findFirst({
                    where: {
                        clientId: userId,
                        status: 'active',
                        OR: [
                            {remainingVisits: {gt: 0}},
                            {remainingVisits: null}
                        ],
                        AND: [
                            {startDate: {lte: new Date()}},
                            {OR: [
                                {endDate: {gte: new Date()}},
                                {endDate: null}
                            ]}
                        ]
                    },
                    include: {
                        membershipType: true
                    },
                    orderBy: [
                        {remainingVisits: 'asc'},   //сначала те, у кого меньше занятий
                        {endDate: 'asc'}            //потом те, что заканчиваются раньше
                    ]
                });

                if(!membership){
                    return res.status(400).json({
                        error: 'У вас нет активного абонемента с остатком занятий. Приобретите абонемент'
                    });
                }

                selectedMembershipId = membership.id;
            } else{
                membership = await prisma.membership.findFirst({
                    where: {
                        id: selectedMembershipId,
                        clientId: userId,
                        status: 'active',
                        OR: [
                            { remainingVisits: { gt: 0 } },
                            { remainingVisits: null }
                        ],
                        AND: [
                            { startDate: { lte: new Date() } },
                            { OR: [
                                { endDate: { gte: new Date() } },
                                { endDate: null }
                            ]}
                        ]
                    },
                    include: {
                        membershipType: true
                    }
                });

                if(!membership){
                    return res.status(400).json({
                        error: 'Выбранный абонемент неактивен или не имеет остатка занятий'
                    });
                }
            }

            let booking = await prisma.booking.create({
                data: {
                    scheduleId,
                    clientId: userId,
                    membershipId: selectedMembershipId,
                    status: 'booked',
                    bookingTime: new Date()
                },
                include: {
                    schedule: {
                        include: {
                            danceStyle: true,
                            hall: true,
                            trainer: {
                                select: {
                                    id: true,
                                    specialization: true,
                                    bio: true,
                                    hireDate: true,
                                    user: {
                                        select: {
                                            fullName: true,
                                            email: true,
                                            phone: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    membership: {
                        include: {
                            membershipType: true
                        }
                    }
                }
            });

            await prisma.schedule.update({
                where: {id: scheduleId},
                data: {
                    currentBookings: schedule.currentBookings + 1
                }
            });

            if(membership.membershipType.visitCount !== null && membership.remainingVisits !== null){
                await prisma.membership.update({
                    where: {id: selectedMembershipId},
                    data: {remainingVisits: membership.remainingVisits - 1}
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'Вы успешно записаны на занятие',
                booking: {
                    id: booking.id,
                    schedule: {
                        id: booking.schedule.id,
                        date: booking.schedule.date,
                        startTime: booking.schedule.startTime,
                        endTime: booking.schedule.endTime,
                        danceStyle: booking.schedule.danceStyle.name,
                        trainer: booking.schedule.trainer?.user?.fullName,
                        hall: booking.schedule.hall.name
                    },
                    status: booking.status,
                    bookingTime: booking.bookingTime,
                    membership: {
                        id: booking.membership.id,
                        typeName: booking.membership.membershipType.name,
                        remainingVisits: membership.membershipType.visitCount === null
                            ? 'Безлимит' 
                            : (membership.remainingVisits - 1)
                    }
                }
            });
        }
        catch(error){
            console.error('createBooking error:', error);
            res.status(500).json({error: 'Ошибка при записи на занятие'});
        }
    }

    async cancelBooking(req, res){
        try{
            let {id} = req.params;
            let {role, id: userId} = req.user;
            let {reason} = req.body;

            let booking = await prisma.booking.findUnique({
                where: {id},
                include: {
                    schedule: {
                        include: {
                            danceStyle: true,
                            hall: true
                        }
                    },
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    membership: {
                        include: {
                            membershipType: true
                        }
                    }
                }
            });

            if(!booking){
                return res.status(404).json({
                    error: 'Запись не найдена'
                });
            }

            let isOwner = booking.clientId === userId;
            let isAdmin = role === 'admin';
            let isTrainer = role === 'trainer' && booking.schedule.trainerId === userId;

            if(!isOwner && !isAdmin && !isTrainer){
                return res.status(403).json({
                    error: 'Вы можете отменить только свои записи'
                });
            }

            if(booking.status === 'cancelled'){
                return res.status(400).json({
                    error: 'Запись уже отменена'
                });
            }

            let now = new Date();
            let scheduleDateTime = new Date(booking.schedule.date);
            let [startHour, startMinute] = booking.schedule.startTime.toISOString().split('T')[1].split(':');
            scheduleDateTime.setHours(parseInt(startHour), parseInt(startMinute));

            if(isOwner && !isAdmin){
                let hoursBeforeStart = (scheduleDateTime - now) / (1000 * 60 * 60);
                if(hoursBeforeStart < 2){
                    return res.status(400).json({
                        error: 'Отмена записи возможна не позднее чем за 2 часа до начала занятия'
                    });
                }
            }

            let updateBooking = await prisma.booking.update({
                where: {id},
                data: {
                    status: 'cancelled',
                    cancelledAt: new Date()
                }
            });

            await prisma.schedule.update({
                where: {id: booking.scheduleId},
                data: {
                    currentBookings: Math.max(0, booking.schedule.currentBookings - 1)
                }
            });

            if(booking.membership.membershipType.visitCount !== null &&
                booking.membership.remainingVisits !== null &&
                booking.status !== 'attended'
            ){
                await prisma.membership.update({
                    where: {id: booking.membershipId},
                    data: {
                        remainingVisits: booking.membership.remainingVisits + 1
                    }
                });
            }

            await prisma.bookingHistory.create({
                data:{
                    bookingId: id,
                    status: 'cancelled',
                    // В схеме BookingHistory нет changedBy/changedAt/reason
                }
            });

            res.json({
                success: true,
                message: 'Запись успешно отменена',
                booking: {
                    id: updateBooking.id,
                    status: updateBooking.status,
                    cancelledAt: updateBooking.cancelledAt
                }
            });
        }
        catch(error){
            console.error('cancelBooking error:', error);
            res.status(500).json({error: 'Ошибка при отмене занятия', details: error.message});
        }
    }

    async markAttendance(req, res){
        try{
            let {id} = req.params;
            let {role, id: userId} = req.user;
            let {attended, notes} = req.body;

            let booking = await prisma.booking.findUnique({
                where: {id},
                include: {
                    schedule: {
                        include: {
                            danceStyle: true,
                            hall: true
                        }
                    },
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    },
                    membership: {
                        include: {
                            membershipType: true
                        }
                    }
                }
            });

            if(!booking){
                return res.status(404).json({
                    error: 'Запись не найдена'
                });
            }

            let isTrainer = booking.schedule.trainerId === userId;
            let isAdmin = role === 'admin';

            if(!isTrainer && !isAdmin){
                return res.status(403).json({
                    error: 'Только тренер этого занятия или администратор могут отмечать посещения'
                });
            }

            if(booking.status === 'cancelled'){
                return res.status(400).json({
                    error: 'Нельзя отметить посещение отмененной записи'
                });
            }

            if(booking.status === 'attended'){
                return res.status(400).json({
                    error: 'Посещение уже отмечено'
                });
            }

            if(booking.status === 'no_show'){
                return res.status(400).json({
                    error: 'Клиент уже отмечен как не пришедший'
                });
            }      
            
            let now = new Date();
            let scheduleDateTime = new Date(booking.schedule.date);
            let [startHour, startMinute] = booking.schedule.startTime.toISOString().split('T')[1].split(':');
            scheduleDateTime.setHours(parseInt(startHour), parseInt(startMinute));

            let [endHour, endMinute] = booking.schedule.endTime.toISOString().split('T')[1].split(':');
            let endDateTime = new Date(booking.schedule.date);
            endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

            if(endDateTime < now){

            }
            else if(scheduleDateTime > now){
                return res.status(400).json({
                    error: 'Нельзя отметить посещение до начала занятия'
                });
            }

            let newStatus = attended ? 'attended' : 'no_show';

            let updatedBooking = await prisma.booking.update({
                where: {id},
                data: {
                    status: newStatus,
                    attendedAt: attended ? new Date() : null
                }
            });

            if(!attended && booking.membership.membershipType.visitCount !== null &&
                booking.membership.remainingVisits !== null
            ){
                await prisma.membership.update({
                    where: {id: booking.membershipId},
                    data: {
                        remainingVisits: booking.membership.remainingVisits + 1
                    }
                });
            }

            let attendanceLog = await prisma.attendanceLog.create({
                data: {
                    bookingId: id,
                    trainerId: userId,
                    markedAt: new Date()
                }
            });

            await prisma.bookingHistory.create({
                data: {
                    bookingId: id,
                    status: newStatus,
                    // В схеме BookingHistory нет changedBy/changedAt/reason
                }
            });

            res.json({
                succes: true,
                message: attended ? 'Посещение отмечено' : 'Клиент отмечен как не пришедший',
                booking: {
                    id: updatedBooking.id,
                    status: updatedBooking.status,
                    attendedAt: updatedBooking.attendedAt
                },
                attendanceLog: {
                    id: attendanceLog.id,
                    markedAt: attendanceLog.markedAt
                }
            });
        }
        catch(error){
            console.error('markAttendance error:', error);
            res.status(500).json({error: 'Ошибка при отметке посещения', details: error.message});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //история посещений
    async getHistory(req, res){
        try{
            let {role, id: userId} = req.user;
            let {
                fromDate,
                toDate,
                limit = 20, 
                offset = 0
            } = req.query;

            let where = {};

            if(role === 'client'){
                where.clientId = userId;
            } else if(role === 'trainer'){
                where.schedule = {
                    trainerId: userId
                };
            }

            if (fromDate || toDate) {
                where.bookingTime = {};
                if (fromDate) where.bookingTime.gte = new Date(fromDate);
                if (toDate) where.bookingTime.lte = new Date(toDate);
            }

            let bookings = await prisma.booking.findMany({
                where: {
                    ...where,
                    status: {in: ['attended', 'no_show']}
                },
                include: {
                    schedule: {
                        include: {
                            danceStyle: true,
                            hall: true,
                            trainer: {
                                select: {
                                    id: true,
                                    specialization: true,
                                    bio: true,
                                    hireDate: true,
                                    user: {
                                        select: {
                                            fullName: true,
                                            email: true,
                                            phone: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    client: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    },
                    membership: {
                        include: {
                            membershipType: true
                        }
                    },
                    attendanceLogs: {
                        select: {
                            id: true,
                            markedAt: true,
                            trainer: {
                                select: {
                                    id: true,
                                    fullName: true
                                }
                            }
                        }
                    },
                    history: true
                },
                orderBy: [{bookingTime: 'desc'}],
                skip: parseInt(offset),
                take: parseInt(limit)
            });

            let totalCount = await prisma.booking.count({
                where: {
                    ...where,
                    status: {in: ['attended', 'no_show']}
                }
            });

            let formattedHistory = bookings.map(booking => ({
                id: booking.id,
                status: booking.status,
                bookingTime: booking.bookingTime,
                attendedAt: booking.attendedAt,
                schedule: {
                    id: booking.schedule.id,
                    date: booking.schedule.date,
                    startTime: booking.schedule.startTime,
                    endTime: booking.schedule.endTime,
                    danceStyle: booking.schedule.danceStyle.name,
                    trainer: booking.schedule.trainer?.user?.fullName,
                    hall: booking.schedule.hall.name
                },
                client: role !== 'client' ? {
                    id: booking.client.id,
                    fullName: booking.client.fullName,
                    email: booking.client.email,
                    phone: booking.client.phone
                } : undefined,  // админ и тренер видят клиента
                membership: {
                    id: booking.membership.id,
                    typeName: booking.membership.membershipType.name
                },
                attendanceLog: booking.attendanceLog ? {
                    markedAt: booking.attendanceLog.markedAt,
                    markedBy: booking.attendanceLog.trainer.fullName,
                } : null,
                historyStatus: booking.history?.status  // из таблицы bookinghistory
            }));

            let stats = null;
            if( role === 'client'){
                let attendedCount = bookings.filter(b => b.status === 'attended').length;
                let noShowCount = bookings.filter(b => b.status === 'no_show').length;

                stats = {
                    totalVisits: totalCount,
                    attended: attendedCount,
                    noShow: noShowCount,
                    attendanceRate: totalCount > 0 ?
                        Math.round((attendedCount / totalCount) * 100) : 0
                };
            }

            res.json({
                success: true,
                history: formattedHistory,
                pagination: {
                    total: totalCount,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
                },
                ...(stats && { stats })
            });
        }
        catch(error){
            console.error('getHistory error:', error);
            res.status(500).json({error: 'Ошибка при получении истории посещений'});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //аналитика
    async getPopularClasses(req, res){
        try{
            let {role} = req.user;
            let {fromDate, toDate, limit = 10} = req.query;

            if(role !== 'admin'){
                return res.status(403).json({
                    error: 'Доступ запрещен. Аналитика доступна только администратору'
                });
            }

            let dateFilter = {};
            if (fromDate || toDate) {
                dateFilter.date = {};
                if (fromDate) dateFilter.date.gte = new Date(fromDate);
                if (toDate) dateFilter.date.lte = new Date(toDate);
            }

            // Prisma groupBy не умеет считать _count по relation (bookings) так, как это было написано.
            // Берём занятия и агрегируем в JS.
            let schedules = await prisma.schedule.findMany({
                where: {
                    ...dateFilter,
                    status: 'completed'
                },
                include: {
                    danceStyle: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    },
                    _count: {
                        select: { bookings: true }
                    }
                }
            });

            let byStyle = new Map();
            for (let s of schedules) {
                let key = s.danceStyleId;
                let prev = byStyle.get(key) || {
                    danceStyleId: key,
                    danceStyleName: s.danceStyle?.name || 'Неизвестно',
                    description: s.danceStyle?.description,
                    totalBookings: 0,
                    totalOccupancy: 0,
                    totalMaxCapacity: 0,
                    schedulesCount: 0
                };

                prev.totalBookings += s._count?.bookings || 0;
                prev.totalOccupancy += s.currentBookings || 0;
                prev.totalMaxCapacity += s.maxCapacity || 0;
                prev.schedulesCount += 1;
                byStyle.set(key, prev);
            }

            let formattedResults = Array.from(byStyle.values())
                .map(item => {
                    let averageOccupancy = item.schedulesCount > 0
                        ? Math.round(item.totalOccupancy / item.schedulesCount)
                        : 0;
                    let avgMaxCapacity = item.schedulesCount > 0
                        ? Math.round(item.totalMaxCapacity / item.schedulesCount)
                        : 0;
                    let occupancyRate = avgMaxCapacity > 0
                        ? Math.round((averageOccupancy / avgMaxCapacity) * 100)
                        : 0;
                    return {
                        danceStyleId: item.danceStyleId,
                        danceStyleName: item.danceStyleName,
                        description: item.description,
                        totalBookings: item.totalBookings,
                        averageOccupancy,
                        maxCapacity: avgMaxCapacity,
                        occupancyRate
                    };
                })
                .sort((a, b) => b.totalBookings - a.totalBookings)
                .slice(0, parseInt(limit));

            let totalBookings = await prisma.booking.count({
                where: {
                    schedule: {
                        ...dateFilter,
                        status: 'completed'
                    }
                }
            });


            let totalSchedules = await prisma.schedule.count({
                where: {
                    ...dateFilter,
                    status: 'completed'
                }
            });

            res.json({
                success: true,
                period: {
                    fromDate: fromDate || 'все время',
                    toDate: toDate || 'настоящее время'
                },
                summary: {
                    totalBookings,
                    totalSchedules,
                    averageBookingsPerClass: totalSchedules > 0 ?
                        Math.round(totalBookings / totalSchedules) : 0
                },
                popularClasses: formattedResults
            });
        }
        catch(error){
            console.error('getPopularClasses error:', error);
            res.status(500).json({error: 'Ошибка при получении статистики популярных занятий', details: error.message});
        }
    }

    async getTrainersStats(req, res){
        try{
            let {role} = req.user;
            let {fromDate, toDate} = req.query;

            if (role !== 'admin') {
                return res.status(403).json({
                    error: 'Доступ запрещен. Аналитика доступна только администратору'
                });
            }

            let dateFilter = {};
            if (fromDate || toDate) {
                dateFilter.date = {};
                if (fromDate) dateFilter.date.gte = new Date(fromDate);
                if (toDate) dateFilter.date.lte = new Date(toDate);
            }

            // schedulesAsTrainer находится на модели Trainer, а не User
            let trainers = await prisma.trainer.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true
                        }
                    },
                    schedulesAsTrainer: {
                        where: {
                            ...dateFilter,
                            status: 'completed'
                        },
                        include: {
                            bookings: {
                                where: {
                                    status: {in: ['attended', 'no_show']}
                                }
                            }
                        }
                    }
                }
            });

            let trainersStats = trainers.map(trainer => {
                let schedules = trainer.schedulesAsTrainer || [];
                let totalClasses = schedules.length;
                let totalBookings = schedules.reduce((sum, s) => sum + s.bookings.length, 0);
                let attendedBookings = schedules.reduce((sum, s) => 
                    sum + s.bookings.filter(b => b.status === 'attended').length, 0);
                let noShowBookings = schedules.reduce((sum, s) => 
                    sum + s.bookings.filter(b => b.status === 'no_show').length, 0);
                
                let averageAttendance = totalClasses > 0 
                    ? Math.round(totalBookings / totalClasses) 
                    : 0;
                
                let attendanceRate = totalBookings > 0 
                    ? Math.round((attendedBookings / totalBookings) * 100) 
                    : 0;
                
                return {
                    id: trainer.id,
                    userId: trainer.user?.id || null,
                    fullName: trainer.user?.fullName,
                    email: trainer.user?.email,
                    phone: trainer.user?.phone,
                    specialization: trainer.specialization || 'Не указана',
                    bio: trainer.bio,
                    hireDate: trainer.hireDate,
                    statistics: {
                        totalClasses,
                        totalBookings,
                        attendedBookings,
                        noShowBookings,
                        averageAttendance,
                        attendanceRate,
                        occupancyRate: averageAttendance > 0 
                            ? Math.round((averageAttendance / 20) * 100) 
                            : 0  // предполагаем среднюю вместимость зала 20
                    }
                };
            });

            let totalClasses = trainersStats.reduce((sum, t) => sum + t.statistics.totalClasses, 0);
            let totalBookings = trainersStats.reduce((sum, t) => sum + t.statistics.totalBookings, 0);
            let totalAttended = trainersStats.reduce((sum, t) => sum + t.statistics.attendedBookings, 0);

            let summary = {
                totalTrainers: trainers.length,
                totalClasses,
                totalBookings,
                totalAttended,
                overallAttendanceRate: totalBookings > 0 
                    ? Math.round((totalAttended / totalBookings) * 100) : 0,
                averageClassesPerTrainer: trainers.length > 0 
                    ? Math.round(totalClasses / trainers.length) : 0,
                averageBookingsPerTrainer: trainers.length > 0 
                    ? Math.round(totalBookings / trainers.length) : 0
            };

            let sortedStats = trainersStats.sort((a, b) => 
                b.statistics.totalBookings - a.statistics.totalBookings);

            res.json({
                success: true,
                period: {
                    fromDate: fromDate || 'все время',
                    toDate: toDate || 'настоящее время'
                },
                summary,
                trainers: sortedStats
            });
        }
        catch(error){
            console.error('getTrainersStats error:', error);
            res.status(500).json({error: 'Ошибка при получении статистики тренеров', details: error.message});
        }
    }

    async getFinancialStats(req, res){
        try{
            let {role} = req.user;
            let { fromDate, toDate, period = 'month' } = req.query;
            
            if (role !== 'admin') {
                return res.status(403).json({
                    error: 'Доступ запрещен. Аналитика доступна только администратору'
                });
            }

            let dateFilter = {};
            if (fromDate || toDate) {
                dateFilter.purchaseDate = {};
                if (fromDate) dateFilter.purchaseDate.gte = new Date(fromDate);
                if (toDate) dateFilter.purchaseDate.lte = new Date(toDate);
            }

            //Общая выручка
            let totalRevenue = await prisma.membership.aggregate({
                where: dateFilter,
                _sum: {
                    pricePaid: true
                }
            });

            //Количество проданных абонементов по типам
            let membershipsByType = await prisma.membership.groupBy({
                by: ['membershipTypeId'],
                where: dateFilter,
                _count: {
                    id: true
                },
                _sum: {
                    pricePaid: true
                }
            });

            let membershipTypes = await prisma.membershipType.findMany({
                where: {
                    id: { in: membershipsByType.map(m => m.membershipTypeId) }
                },
                select: {
                    id: true,
                    name: true,
                    price: true
                }
            });

            let typesStats = membershipsByType.map(item => {
                let type = membershipTypes.find(t => t.id === item.membershipTypeId);
                return {
                    typeId: item.membershipTypeId,
                    typeName: type?.name || 'Неизвестно',
                    basePrice: type?.price || 0,
                    soldCount: item._count.id,
                    totalRevenue: item._sum.pricePaid || 0,
                    averagePrice: item._count.id > 0 
                        ? Math.round((item._sum.pricePaid || 0) / item._count.id) 
                        : 0
                };
            });

            // Динамика продаж по периодам (без сырого SQL, чтобы не зависеть от имен колонок в БД).
            let memberships = await prisma.membership.findMany({
                where: dateFilter,
                select: {
                    purchaseDate: true,
                    pricePaid: true
                }
            });

            let formatPeriod = (d) => {
                let dt = new Date(d);
                if (period === 'day') return dt.toISOString().slice(0, 10);
                if (period === 'year') return dt.getUTCFullYear().toString();
                if (period === 'week') {
                    // ISO week (упрощенно): год-неделя на основе четверга
                    let date = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
                    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
                    let yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
                    let weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
                    return `${date.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
                }
                // month default
                return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
            };

            let dynMap = new Map();
            for (let m of memberships) {
                if (!m.purchaseDate) continue;
                let key = formatPeriod(m.purchaseDate);
                let prev = dynMap.get(key) || { period: key, count: 0, revenue: 0 };
                prev.count += 1;
                prev.revenue += Number(m.pricePaid || 0);
                dynMap.set(key, prev);
            }
            let salesDynamics = Array.from(dynMap.values()).sort((a, b) => a.period.localeCompare(b.period));

            //Активные абонементы
            let activeMemberships = await prisma.membership.count({
                where: {
                    status: 'active',
                    ...dateFilter
                }
            });

            //Средний чек
            let totalSold = await prisma.membership.count({
                where: dateFilter
            });

            let averageCheck = totalSold > 0 
                ? Math.round((totalRevenue._sum.pricePaid || 0) / totalSold) 
                : 0;

            //Прогноз на следующий период
            let previousPeriodRevenue = await prisma.membership.aggregate({
                where: {
                    purchaseDate: {
                        lt: dateFilter.purchaseDate?.gte || new Date(),
                        gte: dateFilter.purchaseDate?.gte 
                            ? new Date(new Date(dateFilter.purchaseDate.gte).setMonth(new Date(dateFilter.purchaseDate.gte).getMonth() - 1))
                            : new Date(new Date().setMonth(new Date().getMonth() - 1))
                    }
                },
                _sum: {
                    pricePaid: true
                }
            });

            let growthRate = previousPeriodRevenue._sum.pricePaid && previousPeriodRevenue._sum.pricePaid > 0
                ? Math.round(((totalRevenue._sum.pricePaid - previousPeriodRevenue._sum.pricePaid) / previousPeriodRevenue._sum.pricePaid) * 100)
                : 0;

            res.json({
                success: true,
                period: {
                    fromDate: fromDate || 'все время',
                    toDate: toDate || 'настоящее время',
                    groupBy: period
                },
                summary: {
                    totalRevenue: totalRevenue._sum.pricePaid || 0,
                    totalSoldMemberships: totalSold,
                    averageCheck,
                    activeMemberships,
                    growthRate: growthRate + '%'
                },
                byMembershipType: typesStats,
                dynamics: salesDynamics,
                forecast: {
                    nextPeriodRevenue: Math.round((totalRevenue._sum.pricePaid || 0) * (1 + growthRate / 100)),
                    estimatedGrowth: growthRate + '%'
                }
            });
        }
        catch(error){
            console.error('getFinancialStats error:', error);
            res.status(500).json({error: 'Ошибка при получении финансовой статистики', details: error.message});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //залы
    async getHalls(req, res){
        try{
            let halls = await prisma.hall.findMany({
                select: {
                    id: true,
                    name: true,
                    capacity: true,
                    description: true,
                    isActive: true,
                },
                where: {
                    isActive: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            res.json({
                success: true,
                halls
            });
        }
        catch(error){
            console.error('getHalls error:', error);
            res.status(500).json({error: 'Ошибка при получении списка залов'});
        }
    }

    async createHall(req, res){
        try{
            let {name, capacity, description, isActive} = req.body;

            if(!name){
                return res.status(400).json({ error: 'Название обязательно' });
            }

            if (!capacity || capacity <= 0) {
                return res.status(400).json({ error: 'Вместимость зала должна быть больше 0' });
            }

            let existingHall = await prisma.hall.findFirst({
                where: {name}
            });

            if(existingHall){
                return res.status(400).json({
                    error: 'Зал с таким названием уже существует'
                });
            }

            let hall = await prisma.hall.create({
                data: {
                    name,
                    description: description || null,
                    capacity,
                    isActive: isActive !== undefined ? isActive : true
                }
            });

            res.status(201).json({
                success: true,
                message: 'Зал успешно создан',
                hall
            });
        }
        catch(error){
            console.error('createHall error:', error);
            res.status(500).json({error: 'Ошибка при добавлении нового зала'});
        }
    }

    async updateHall(req, res){
        try{
            let {id} = req.params;
            let {name, capacity, description, isActive} = req.body;

            let existingHall = await prisma.hall.findUnique({
                where: {id: parseInt(id)},
                include: {
                    schedules: {
                        where: {
                            status: {
                                not: 'cancelled'
                            },
                            date: {
                                gte: new Date()
                            }
                        }
                    }
                }
            });

            if(!existingHall){
                return res.status(404).json({ error: 'Зал не найден' });
            }

            if (name && name !== existingHall.name) {
                let duplicate = await prisma.hall.findFirst({
                    where: { name }
                });

                if (duplicate) {
                    return res.status(400).json({ error: 'Зал с таким названием уже существует' });
                }
            }

            if (capacity !== undefined && capacity <= 0) {
                return res.status(400).json({ error: 'Вместимость зала должна быть больше 0' });
            }

            if (isActive === false && existingHall.isActive === true) {
                if (existingHall.schedules && existingHall.schedules.length > 0) {
                    return res.status(409).json({
                        error: `Невозможно деактивировать зал, так как есть ${existingHall.schedules.length} запланированных занятий. Сначала перенесите или отмените эти занятия.`
                    });
                }
            }

            let hall = await prisma.hall.update({
                where: { id: parseInt(id) },
                data: {
                    name: name !== undefined ? name : existingHall.name,
                    capacity: capacity !== undefined ? capacity : existingHall.capacity,
                    description: description !== undefined ? description : existingHall.description,
                    isActive: isActive !== undefined ? isActive : existingHall.isActive
                }
            });
            
            res.json({
                success: true,
                message: 'Зал успешно обновлен',
                hall
            });
        }
        catch(error){
            console.error('updateHall error:', error);
            res.status(500).json({error: 'Ошибка при обновлении зала'});
        }
    }

    async deleteHall(req, res){
        try{
            let {id} = req.params;

            let existingHall = await prisma.hall.findUnique({
                where: {
                    id: parseInt(id)
                },
                include: {
                    schedules: {
                        where: {
                            status: {not: 'cancelled'}
                        }
                    }
                }
            });

            if(!existingHall){
                return res.status(404).json({ error: 'Зал не найден' });
            }

            if(existingHall.schedules && existingHall.schedules.length > 0){
                return res.status(409).json({
                    error: `Невозможно удалить зал, так как есть ${existingHall.schedules.length} занятий в нем. Сначала удалите или перенесите эти занятия.`
                });
            }

            await prisma.hall.delete({
                where: {
                    id: parseInt(id)
                }
            });

            res.json({
                success: true,
                message: 'Зал успешно удален'
            });
        }
        catch(error){
            console.error('deleteHall error:', error);
            res.status(500).json({error: 'Ошибка при удалении зала'});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //стили танцев
    async getDanceStyles(req, res){
        try{
            let danceStyles = await prisma.danceStyle.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    isActive: true
                },
                where: {
                    isActive: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            res.json({
                success: true,
                danceStyles
            });
        }
        catch(error){
            console.error('getDanceStyles error:', error);
            res.status(500).json({error: 'Ошибка при получении стилей танцев'});
        }
    }

    async createDanceStyle(req, res) {
        try {
            let { name, description, isActive } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Название обязательно' });
            }
            
            let existing = await prisma.danceStyle.findUnique({
                where: { name }
            });
            
            if (existing) {
                return res.status(400).json({ error: 'Стиль с таким названием уже существует' });
            }
            
            let danceStyle = await prisma.danceStyle.create({
                data: {
                    name,
                    description: description || null,
                    isActive: isActive !== undefined ? isActive : true
                }
            });
            
            res.status(201).json({ success: true, danceStyle });
        } catch (error) {
            console.error('createDanceStyle error:', error);
            res.status(500).json({ error: 'Ошибка при создании стиля танца' });
        }
    }

    async updateDanceStyle(req, res) {
        try {
            let { id } = req.params;
            let { name, description, isActive } = req.body;
            
            let existing = await prisma.danceStyle.findUnique({
                where: { id: parseInt(id) }
            });
            
            if (!existing) {
                return res.status(404).json({ error: 'Стиль не найден' });
            }
            
            if (name && name !== existing.name) {
                let duplicate = await prisma.danceStyle.findUnique({
                    where: { name }
                });
                if (duplicate) {
                    return res.status(400).json({ error: 'Стиль с таким названием уже существует' });
                }
            }
            
            let danceStyle = await prisma.danceStyle.update({
                where: { id: parseInt(id) },
                data: {
                    name: name || existing.name,
                    description: description !== undefined ? description : existing.description,
                    isActive: isActive !== undefined ? isActive : existing.isActive
                }
            });
            
            res.json({ success: true, danceStyle });
        } catch (error) {
            console.error('updateDanceStyle error:', error);
            res.status(500).json({ error: 'Ошибка при обновлении стиля танца' });
        }
    }

    async deleteDanceStyle(req, res) {
        try {
            let { id } = req.params;
            
            let existing = await prisma.danceStyle.findUnique({
                where: { id: parseInt(id) },
                include: { schedules: true }
            });
            
            if (!existing) {
                return res.status(404).json({ error: 'Стиль не найден' });
            }
            
            if (existing.schedules.length > 0) {
                return res.status(409).json({ error: 'Нельзя удалить стиль, так как есть занятия с ним' });
            }
            
            await prisma.danceStyle.delete({
                where: { id: parseInt(id) }
            });
            
            res.json({ success: true, message: 'Стиль танца удален' });
        } catch (error) {
            console.error('deleteDanceStyle error:', error);
            res.status(500).json({ error: 'Ошибка при удалении стиля танца' });
        }
    }


}

module.exports = Controler;