const { error } = require('console');
const prisma = require('./prisma');
const bcrypt = require('bcriptjs');
const { stat } = require('fs');
const jwt = require('jsonwebtoken');
const { start } = require('repl');
const { isatty } = require('tty');
const { availableMemory } = require('process');

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

            let user = prisma.user.findUnique({
                where: email
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
            
            let user = await prisma.findUnique({
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
            req.status(500).json({error: 'Ошибка при получении профиля'});
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
                orderBy: {createdAt: 'desc'}
            });

            res.json({users});
        }
        catch(error){
            console.error('getUsers error:', error);
            req.status(500).json({error: 'Ошибка при получении пользователей'});
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
            req.status(500).json({error: 'Ошибка при получении пользователя'});
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
            req.status(500).json({error: 'Ошибка при изменении статуса пользователя'});
        }
    }

    async deleteUser(req, res){
        try{
            let {id} = req.params;

            let existingUser = await prisma.findUnique({
                where: {id}
            });

            if(!existingUser){
                return res.status(404).json({error: 'Пользователь не найден'});
            }

            let user = prisma.user.delete({
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
            req.status(500).json({error: 'Ошибка при удалении пользователя'});
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
                orderBy: {createdAt: 'desc'}
            });

            let trainersWithoutPassword = trainers.map(trainer => {
                let {password, ...trainerWithoutPassword} = trainer;
                return trainerWithoutPassword;
            });

            res.json({trainers: trainersWithoutPassword});
        }
        catch(error){
            console.error('getTrainers error:', error);
            req.status(500).json({error: 'Ошибка при получении тренеров'});
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
                trainer: {
                    specialization: trainer.specialization,
                    bio: trainer.bio
                }
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
            if(phone !== undefind) userUpdateData.phone = phone;
            if(isActive !== undefind) userUpdateData.isActive = isActive;

            let user = await prisma.user.update({
                where: {id},
                data: userUpdateData
            });

            let trainerUpdateData = {};
            if(specialization !== undefind) trainerUpdateData.specialization = specialization;
            if(bio !== undefind) trainerUpdateData.bio = bio;

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
            req.status(500).json({error: 'Ошибка при изменении тренера'});
        }
    }

    async deleteTrainer(req, res){
        try{
            let {id} = req.params;

            let existingUser = await prisma.findUnique({
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

            let deletedUser = prisma.user.delete({
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
            req.status(500).json({error: 'Ошибка при удалении тренера'});
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //расписание
    async createSchedule(req, res){
        try{
            let {danceStyleId, trainerId, hallId, date, startTime, endTime, maxCapacity, currentBookings, status, cancellationReason} = req.body;

            let createdBy = req.user.id;

            if(!danceStyleId || !trainerId || !hallId || !startTime || !endTime || !maxCapacity || !date){
                return res.status(400).json({
                    error: 'Танцевальное направление, тренер, зал, начальное и конечное время, максимальная вместимость и дата обязательны'
                });
            }

            let danceStyle = await prisma.danceStyle.findUnique({
                where: {id: danceStyleId}
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

            let hall = await prisma.hall.findUnique({
                where: {id: hallId}
            })

            if(!hall){
                return res.status(404).json({
                    error: 'Зал не найден'
                });
            }

            if(maxCapacity > hall.capacity){
                return res.status(400).json({
                    error: `Максимальная вместимость не может превышать вместимость зала: ${hall.capacity}`
                });
            }

            let hallSchedule = await prisma.schedule.findFirst({
                where: {
                    hallId,
                    date: new Date(date),
                    status: {not: 'cancelled'},
                    OR: [
                        {
                            AND: [
                                {startTime: {lte: startTime}},
                                {endTime: {gt: endTime}}
                            ]
                        },
                        {
                            AND: [
                                {startTime: {lt: startTime}},
                                {endTime: {gte: endTime}}
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
                    trainerId,
                    date: new Date(date),
                    status: {not: 'cancelled'},
                    OR: [
                        {
                            AND: [
                                {startTime: {lte: startTime}},
                                {endTime: {gt: endTime}}
                            ]
                        },
                        {
                            AND: [
                                {startTime: {lt: startTime}},
                                {endTime: {gte: endTime}}
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
                    danceStyleId,
                    trainerId,
                    hallId,
                    date: new Date(date),
                    startTime:  new Date(`1970-01-01${startTime}`),
                    endTime:  new Date(`1970-01-01${endTime}`),
                    maxCapacity,
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
                            fullName: true,
                            email: true
                        }
                    },
                    hall: true
                }
            });

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
                            fullName: true,
                            email: true
                        }
                    },
                    hall: true
                }
            });
            
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
            req.status(500).json({error: 'Ошибка при удалении занятия в расписании'});
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
                            fullName: true,
                            email: true,
                            phone: true,
                            trainerInfo: true
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
                trainer: item.trainer,
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
            req.status(500).json({error: 'Ошибка при получении расписания'});
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
                            fullName: true,
                            email: true,
                            phone: true,
                            trainerInfo: true
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

            res.json({schedule});
        }
        catch(error){
            console.error('getScheduleById error:', error);
            req.status(500).json({error: 'Ошибка при получении занятия расписания'});
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
                orderBy: {createdAt: 'desc'}
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
            req.status(500).json({error: 'Ошибка при получении абонементов'});
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
            req.status(500).json({error: 'Ошибка при получении абонемента'});
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

            let clienId = userId;
            if(role === 'admin' && req.body.clienId){
                clienId = req.body.clienId;
            }

            let client = await prisma.user.findFirst({
                where: {
                    id: clienId,
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
            
            let remainingVisits = membershipType.isUnlimited 
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
                            durationDays: true,
                            isUnlimited: true
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
            req.status(500).json({error: 'Ошибка при создании абонемента'});
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
            req.status(500).json({error: 'Ошибка при приостановке абонемента'});
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
                            if: true,
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
            req.status(500).json({error: 'Ошибка при обновлении абонемента'});
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
                    isUnlimited: true,
                    isActive: true,
                    sortOrder: true
                },
                where: {isActive: true},
                orderBy: [
                    {sortOrder: 'asc'},
                    {price: 'asc'}
                ]
            });

            res.json({
                success: true,
                membershipTypes
            });
        }
        catch(error){
            console.error('getMembershipTypes error:', error);
            req.status(500).json({error: 'Ошибка при получении типов абонементов'});
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
                isUnlimited,
                isActive,
                sortOrder
            } = req.body;

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

            if(isUnlimited){
                if(visitCount !== undefined && visitCount !== null){
                    return res.status(400).json({
                        error: 'Для безлимитного абонемента количество занятий не указывается'
                    });
                }
            } else {
                if(!visitCount || visitCount <= 0){
                    return res.status(400).json({
                        error: 'Для обычного абонемента необходимо указать количество занятий (больше 0)'
                    });
                }
            }

            if(sortOrder !== undefined && sortOrder < 0){
                return res.status(400).json({
                    error: 'Порядок сортировки не может быть отрицательным'
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
                    price,
                    visitCount: isUnlimited ? null : (visitCount || null),
                    durationDays: durationDays || null,
                    isUnlimited: isUnlimited || false,
                    isActive: isActive !== undefined ? isActive : true,
                    sortOrder: sortOrder || 0
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
            req.status(500).json({error: 'Ошибка при создании типа абонемента'});
        }
    }

    async updateMembershipType(req, res){
        try{
            let { id } = req.params;
            let {
                name,
                description,
                price,
                visitCount,
                durationDays,
                isUnlimited,
                isActive,
                sortOrder
            } = req.body;

            let existingType = await prisma.membershipType.findUnique({
                where: {id}
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

            let newIsUnlimited = isUnlimited !== undefined ? isUnlimited : existingType.isUnlimited;

            if(newIsUnlimited){
                if(visitCount !== undefined && visitCount !== null){
                    return res.status(400).json({
                        error: 'Для безлимитного абонемента количество занятий не указывается'
                    });
                }
            } else {
                let newVisitCount = visitCount !== undefined ? visitCount : existingType.visitCount;
                if(!newVisitCount || newVisitCount <= 0){
                    return res.status(400).json({
                        error: 'Для обычного абонемента необходимо указать количество занятий (больше 0)'
                    });
                }
            }

            if(sortOrder !== undefined && sortOrder < 0){
                return res.status(400).json({
                    error: 'Порядок сортировки не может быть отрицательным'
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
            if(price !== undefined) membershipTypeUpdateData.price = price;
            if(visitCount !== undefined) membershipTypeUpdateData.visitCount = newIsUnlimited ? null : visitCount;
            if(durationDays !== undefined) membershipTypeUpdateData.durationDays = durationDays;
            if(isUnlimited !== undefined) membershipTypeUpdateData.isUnlimited = isUnlimited;
            if(isActive !== undefined) membershipTypeUpdateData.isActive = isActive;
            if(sortOrder !== undefined) membershipTypeUpdateData.sortOrder = sortOrder;

            let updateMembershipType = await prisma.membershipType.update({
                where: {id},
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
            req.status(500).json({error: 'Ошибка при изменении типа абонемента'});
        }
    }

    async deleteMembershipType(req, res){
        try{
            let {id} = req.params;

            let existingType = await prisma.membershipType.findUnique({
                where: {id},
                include: {
                    memberships: {
                        where: {
                            status: {in ['active', 'paused']}
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
                where: {id}
            });

            res.json({
                success: true,
                message: 'Тип абонемента успешно удален',
                membershipType: deletedMembershipType
            });
        }
        catch(error){
            console.error('deleteMembershipType error:', error);
            req.status(500).json({error: 'Ошибка при удалении типа абонемента'});
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
                status,
                date,
                fromDate,
                toDate
            } = req.query;

            let where = {};

            if(role === 'client'){
                where.clienId = userId;
            } else if(role === 'trainer'){
                where.schedule = {
                    trainerId: userId
                };
            }

            if(scheduleId){
                where.scheduleId = scheduleId;
            }

            if(clienId && (role === 'admin' || role === 'trainer')){
                where.clienId = clienId;
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
                                    fullName: true,
                                    email: true,
                                    phone: true
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
                    trainer: booking.schedule.trainer,
                    hall: booking.schedule.hall
                },
                client: booking.client,
                membership: {
                    id: booking.membership.id,
                    type: booking.membership.type,
                    remainingVisits: booking.membership.remainingVisits
                },
                status: booking.status,
                bookingTime: booking.bookingTime,
                attendedAt: booking.attendedAt,
                cancelledAt: booking.cancelledAt,
                isAttended: !!booking.attendanceLog
            }));

            res.json({
                success: true,
                count: bookings.length,
                bookings: formattedBookings
            });
        }
        catch(error){
            console.error('getBookings error:', error);
            req.status(500).json({error: 'Ошибка при получении записей на занятие'});
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
                            fullName: true,
                            email: true,
                            phone: true
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
                                    visitCount: true,
                                    isUnlimited: true
                                }
                            }
                        }
                    },
                    attendanceLog: {
                        select: {
                            id: true,
                            markedAt: true,
                            notes: true
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
                    isUnlimited: booking.membership.membershipType.isUnlimited
                },
                attendanceLog: booking.attendanceLog ? {
                    markedAt: booking.attendanceLog.markedAt,
                    notes: booking.attendanceLog.notes
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
            req.status(500).json({error: 'Ошибка при получении записей на занятие'});
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
                            fullName: true
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
                                    fullName: true
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

            if(!membership.membershipType.isUnlimited && membership.remainingVisits !== null){
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
                        trainer: booking.schedule.trainer.fullName,
                        hall: booking.schedule.hall.name
                    },
                    status: booking.status,
                    bookingTime: booking.bookingTime,
                    membership: {
                        id: booking.membership.id,
                        typeName: booking.membership.membershipType.name,
                        remainingVisits: membership.membershipType.isUnlimited 
                            ? 'Безлимит' 
                            : (membership.remainingVisits - 1)
                    }
                }
            });
        }
        catch(error){
            console.error('createBooking error:', error);
            req.status(500).json({error: 'Ошибка при записи на занятие'});
        }
    }

    async cancelBooking(req, res){
        try{
            let {id} = req.params;
            let {role, id: userId} = req.user;
            let {reason} = req.body;

            let booking = await prisma.booking.findUnique({
                
            })
        }
        catch(error){
            console.error('cancelBooking error:', error);
            req.status(500).json({error: 'Ошибка при отмене занятия'});
        }
    }

    markAttendance(req, res){

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //история посещений
    getHistory(req, res){

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //аналитика
    getPopularClasses(req, res){

    }

    getTrainersStats(req, res){

    }

    getFinancialStats(req, res){

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //залы и стили танцев
    getHalls(req, res){

    }

    getDanceStyles(req, res){

    }
}

module.exports = Controler;