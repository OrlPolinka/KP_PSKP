const jwt = require('jsonwebtoken');

let authMiddleware = (req, res, next) => {
    let authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({error: 'Нет токена авторизации'});
    }

    let token = authHeader.split(' ')[1];

    try{
        let decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
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