const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./route/routes')
const {authMiddleware} = require('./middleware/auth')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//app.use('/', route);

// Middleware
app.use(cors());
app.use(express.json());

// Публичные маршруты (не требуют авторизации)
app.use('/api/auth', require('./routes/auth')); // если выделили auth отдельно

// Защищенные маршруты
app.use('/api', authMiddleware, routes);

// Тестовый маршрут для проверки
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));