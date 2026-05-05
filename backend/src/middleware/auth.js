const jwt = require('jsonwebtoken');
const prisma = require('../controler/prisma');

let authMiddleware = async (req, res, next) => {
    let authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({error: 'Нет токена авторизации'});
    }

    let token = authHeader.split(' ')[1];

    try{
        let decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Проверяем, активен ли пользователь
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, isActive: true }
        });
        
        if(!user){
            return res.status(401).json({error: 'Пользователь не найден'});
        }
        
        if(!user.isActive){
            return res.status(403).json({error: 'Аккаунт заблокирован. Обратитесь к администратору'});
        }
        
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        next();
    }
    catch(error){
        return res.status(401).json({error: 'Недействительный токен'});
    }
};

let roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if(!req.user){
            return res.status(401).json({error: 'Не авторизован'});
        }
        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({error: 'Доступ запрещен'});
        }

        next();
    };
};

module.exports = {authMiddleware, roleMiddleware};