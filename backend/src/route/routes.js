const express = require('express');
const Controller = require('../controler/controllers');
const router = express.Router();
let controler = new Controller();

const routes = [
    //авторизация/регистрация
    {method: 'post',               path: '/auth/register',                         action: 'register'},
    {method: 'post',               path: '/auth/login',                            action: 'login'},
    {method: 'get',                path: '/auth/me',                               action: 'getMe'},

    //пользователи(админ)
    {method: 'get',                path: '/users',                                 action: 'getUsers'},
    {method: 'get',                path: '/users/:id',                             action: 'getUserById'},
    {method: 'put',                path: '/users/:id/block',                       action: 'blockUser'},
    {method: 'delete',             path: '/users/:id',                             action: 'deleteUser'},

    //тренеры(админ)
    {method: 'get',                path: '/trainers',                              action: 'getTrainers'},
    {method: 'post',               path: '/trainers',                              action: 'createTrainer'},
    {method: 'put',                path: '/trainers/:id',                          action: 'updateTrainer'},
    {method: 'delete',             path: '/trainers/:id',                          action: 'deleteTrainer'},

    //расписание
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
    {method: 'post',               path: '/membershiptypes',                       action: 'createMembershipType'},
    {method: 'put',                path: '/membershiptypes/:id',                   action: 'updateMembershipType'},
    {method: 'delete',             path: '/membershiptypes/:id',                   action: 'deleteMembershipType'},

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

    //залы и стили танцев
    {method: 'get',                path: '/halls',                                 action: 'getHalls'},
    {method: 'get',                path: '/dance-styles',                          action: 'getDanceStyles'}
    
];

routes.forEach(route => {
    router[route.method](`/api${route.path}`, (req, res) => {
        controler[route.action](req, res);
    });
});

module.exports = router;