const axios = require('axios');

async function testApi() {
    try {
        // 1. Логин
        console.log('1. Логин...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@dancestudio.ru',
            password: '123456'
        });
        
        const token = loginRes.data.token;
        console.log('Токен получен:', token.substring(0, 50) + '...');
        
        // 2. Проверка тренеров
        console.log('\n2. Проверка тренеров...');
        const trainersRes = await axios.get('http://localhost:5000/api/trainers', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Тренеры:', trainersRes.data);
        console.log('Количество тренеров:', trainersRes.data.trainers?.length || 0);
        
        // 3. Проверка пользователей
        console.log('\n3. Проверка пользователей...');
        const usersRes = await axios.get('http://localhost:5000/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Пользователи:', usersRes.data.users?.length || 0);
        
        // 4. Проверка расписания
        console.log('\n4. Проверка расписания...');
        const scheduleRes = await axios.get('http://localhost:5000/api/schedule', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Расписание:', scheduleRes.data.schedule?.length || 0);
        
    } catch (error) {
        console.error('Ошибка:', error.response?.data || error.message);
    }
}

testApi();