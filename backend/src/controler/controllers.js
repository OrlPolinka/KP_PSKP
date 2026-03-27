const { error } = require('console');
const prisma = require('./prisma');
const bcrypt = require('bcriptjs');
const { stat } = require('fs');
const jwt = require('jsonwebtoken');
const { start } = require('repl');

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
                    error: 'Аккаунт заблокированю Обратитесь к администратору'
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
            const { id } = req.params;
            const {
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
            
            const existingSchedule = await prisma.schedule.findUnique({
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
                const danceStyle = await prisma.danceStyle.findUnique({
                    where: { id: danceStyleId }
                });
                if (!danceStyle) {
                    return res.status(404).json({ error: 'Танцевальное направление не найдено' });
                }
            }
            
            const newDate = date ? new Date(date) : existingSchedule.date;
            const newStartTime = startTime 
                ? new Date(`1970-01-01T${startTime}`) 
                : existingSchedule.startTime;
            const newEndTime = endTime 
                ? new Date(`1970-01-01T${endTime}`) 
                : existingSchedule.endTime;
            const newHallId = hallId || existingSchedule.hallId;
            const newTrainerId = trainerId || existingSchedule.trainerId;
            
            if (trainerId && trainerId !== existingSchedule.trainerId) {
                const trainer = await prisma.user.findFirst({
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
            
            const needCheckHall = (hallId && hallId !== existingSchedule.hallId) ||
                (date && date !== existingSchedule.date.toISOString().split('T')[0]) ||
                (startTime && startTime !== existingSchedule.startTime.toISOString().split('T')[1].slice(0, 8)) ||
                (endTime && endTime !== existingSchedule.endTime.toISOString().split('T')[1].slice(0, 8));
            
            if (needCheckHall) {
                const hallSchedule = await prisma.schedule.findFirst({
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
            
            const needCheckTrainer = (trainerId && trainerId !== existingSchedule.trainerId) ||
                (date && date !== existingSchedule.date.toISOString().split('T')[0]) ||
                (startTime && startTime !== existingSchedule.startTime.toISOString().split('T')[1].slice(0, 8)) ||
                (endTime && endTime !== existingSchedule.endTime.toISOString().split('T')[1].slice(0, 8));
            
            if (needCheckTrainer) {
                const trainerSchedule = await prisma.schedule.findFirst({
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
            
            const newMaxCapacity = maxCapacity !== undefined ? maxCapacity : existingSchedule.maxCapacity;
            const newCurrentBookings = currentBookings !== undefined ? currentBookings : existingSchedule.currentBookings;
            
            if (newCurrentBookings > newMaxCapacity) {
                return res.status(400).json({
                    error: `Количество записей (${newCurrentBookings}) не может превышать максимальную вместимость (${newMaxCapacity})`
                });
            }
            
            const scheduleUpdateData = {};
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
            
            const updatedSchedule = await prisma.schedule.update({
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

    updateMembership(req, res){

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //типы абонементов
    getMembershipTypes(req, res){

    }

    createMembershipType(req, res){

    }

    updateMembershipType(req, res){

    }

    deleteMembershipType(req, res){

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //запись на занятия
    getBookings(req, res){

    }

    getBookingsBySchedule(req, res){

    }

    createBooking(req, res){

    }

    cancelBooking(req, res){

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