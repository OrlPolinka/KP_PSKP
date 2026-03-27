const prisma = require('./prisma');
const bcrypt = require('bcriptjs');
const jwt = require('jsonwebtoken');

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

            let user = await prisma.findUnique({
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
                were: {
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
    createSchedule(req, res){

    }

    updateSchedule(req, res){

    }

    deleteSchedule(req, res){

    }

    getSchedule(req, res){

    }

    getScheduleById(req, res){

    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //абонементы клиентов
    getMemberships(req, res){

    }

    getMembershipById(req, res){

    }

    createMembership(req, res){

    }

    pauseMembership(req, res){

    }

    activateMembership(req, res){

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