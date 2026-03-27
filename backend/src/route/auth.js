const express = require('express');
const Controller = require('../controler/controllers');
const router = express.Router();
const controller = new Controller();

router.post('/register', (req, res) => controller.register(req, res));
router.post('/login', (req, res) => controller.login(req, res));

module.exports = router;