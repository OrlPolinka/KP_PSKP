const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./route/routes');
const { authMiddleware } = require('./middleware/auth');
const passport = require('./middleware/googleAuth');
const { setupChat } = require('./socket/chatSocket');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS
const corsOptions = {
    origin: function(origin, callback) {
        // Разрешаем запросы без origin (мобильные, Postman) и любые https/http
        if (!origin) return callback(null, true);
        // В Docker все запросы идут через nginx, origin будет тот же хост
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use('/', routes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.io
const io = new Server(server, {
    cors: {
        origin: '*',
        credentials: false,
        methods: ['GET', 'POST']
    },
    path: '/socket.io'
});

setupChat(io);

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
