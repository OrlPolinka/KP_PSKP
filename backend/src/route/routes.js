const express = require('express');
const Controller = require('../controler/controllers');
const {authMiddleware, roleMiddleware} = require('../middleware/auth');
const passportModule = require('../middleware/googleAuth');
const passport = passportModule;
const jwt = require('jsonwebtoken');
const router = express.Router();
let controler = new Controller();

// Google OAuth routes
router.get('/api/auth/google', (req, res, next) => {
    if (!passportModule.hasGoogleCreds) {
        return res.redirect('http://localhost:3000/login?error=google_not_configured');
    }
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    })(req, res, next);
});

router.get('/api/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', {
        session: false,
        failWithError: true,
    }, (err, user, info) => {
        if (err || !user) {
            console.error('Google callback error:', err?.message || info?.message);
            return res.redirect('http://localhost:3000/login?error=google_failed');
        }
        try {
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            const { password: _, ...userWithoutPassword } = user;
            const params = new URLSearchParams({
                token,
                user: JSON.stringify(userWithoutPassword)
            });
            res.redirect(`http://localhost:3000/auth/google/success?${params.toString()}`);
        } catch (error) {
            console.error('Google token error:', error);
            res.redirect('http://localhost:3000/login?error=google_failed');
        }
    })(req, res, next);
});

const routes = [
    //авторизация/регистрация
    {method: 'post',               path: '/auth/register',                         action: 'register',            public: true},
    {method: 'post',               path: '/auth/login',                            action: 'login',               public: true},
    {method: 'get',                path: '/auth/me',                               action: 'getMe'},

    //пользователи(админ)
    {method: 'get',                path: '/users',                                 action: 'getUsers'},
    {method: 'get',                path: '/users/:id',                             action: 'getUserById'},
    {method: 'put',                path: '/users/:id/block',                       action: 'blockUser'},
    {method: 'put',                path: '/users/:id/profile',                     action: 'updateUserProfile'},
    {method: 'delete',             path: '/users/:id',                             action: 'deleteUser'},

    //тренеры(админ)
    {method: 'get',                path: '/trainers',                              action: 'getTrainers'},
    {method: 'post',               path: '/trainers',                              action: 'createTrainer'},
    {method: 'put',                path: '/trainers/:id',                          action: 'updateTrainer'},
    {method: 'delete',             path: '/trainers/:id',                          action: 'deleteTrainer'},

    //расписание
    {method: 'post',               path: '/schedule/complete-passed',              action: 'completePassedSchedules'},
    {method: 'post',               path: '/schedule',                              action: 'createSchedule'},
    {method: 'put',                path: '/schedule/:id',                          action: 'updateSchedule'},
    {method: 'delete',             path: '/schedule/:id',                          action: 'deleteSchedule'},
    {method: 'get',                path: '/schedule',                              action: 'getSchedule'},
    {method: 'get',                path: '/schedule/:id',                          action: 'getScheduleById'},

    //абонементы клиентов
    {method: 'get',                path: '/memberships',                           action: 'getMemberships'},
    {method: 'get',                path: '/memberships/:id',                       action: 'getMembershipById'},
    {method: 'post',               path: '/memberships',                           action: 'createMembership'},
    {method: 'put',                path: '/memberships/:id/pause',                 action: 'pauseMembership'},
    {method: 'put',                path: '/memberships/:id',                       action: 'updateMembership'},

    //типы абонементов
    {method: 'get',                path: '/membership-types',                      action: 'getMembershipTypes'},
    {method: 'post',               path: '/membership-types',                      action: 'createMembershipType'},
    {method: 'put',                path: '/membership-types/:id',                  action: 'updateMembershipType'},
    {method: 'delete',             path: '/membership-types/:id',                  action: 'deleteMembershipType'},

    //запись на занятия
    {method: 'get',                path: '/bookings',                              action: 'getBookings'},
    {method: 'get',                path: '/bookings/schedule/:scheduleId',         action: 'getBookingsBySchedule'},
    {method: 'post',               path: '/bookings',                              action: 'createBooking'},
    {method: 'put',                path: '/bookings/:id/cancel',                   action: 'cancelBooking'},
    {method: 'put',                path: '/bookings/:id/attend',                   action: 'markAttendance'},

    //история посещений
    {method: 'get',                path: '/history',                               action: 'getHistory'},

    //аналитика
    {method: 'get',                path: '/analytics/popular',                     action: 'getPopularClasses'},
    {method: 'get',                path: '/analytics/trainers',                    action: 'getTrainersStats'},
    {method: 'get',                path: '/analytics/financial',                   action: 'getFinancialStats'},

    //залы
    {method: 'get',                path: '/halls',                                 action: 'getHalls'},
    {method: 'post',               path: '/halls',                                 action: 'createHall'},
    {method: 'put',                path: '/halls/:id',                             action: 'updateHall'},
    {method: 'delete',             path: '/halls/:id',                             action: 'deleteHall'},

    //стили танцев
    {method: 'get',                path: '/dance-styles',                          action: 'getDanceStyles'},
    {method: 'post',               path: '/dance-styles',                          action: 'createDanceStyle'},
    {method: 'put',                path: '/dance-styles/:id',                      action: 'updateDanceStyle'},
    {method: 'delete',             path: '/dance-styles/:id',                      action: 'deleteDanceStyle'}
    
];

routes.forEach(route => {
    let handlers = [];
    if(!route.public){
        handlers.push(authMiddleware);
    }
    if(route.roles && route.roles.length > 0){
        handlers.push(roleMiddleware(...route.roles));
    }
    handlers.push((req, res) => controler[route.action](req, res));

    router[route.method](`/api${route.path}`, ...handlers);
});

module.exports = router;