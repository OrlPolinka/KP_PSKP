const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./route/routes')
const {authMiddleware} = require('./middleware/auth')
const passport = require('./middleware/googleAuth')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(passport.initialize());

// Публичные маршруты (не требуют авторизации)
//app.use('/api/auth', require('./route/auth')); // если выделили auth отдельно

// Защищенные маршруты
//app.use('/api', authMiddleware, routes);

app.use('/', routes);

// Тестовый маршрут для проверки
app.get('/api/health', (req, res) => {
     res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));