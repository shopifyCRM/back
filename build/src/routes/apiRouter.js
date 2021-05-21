"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adminService_1 = require("../services/adminService/adminService");
const authService_1 = require("../services/authService/authService");
const router = require('express').Router();
const authRoutes = new authService_1.AuthRouter();
const adminRoutes = new adminService_1.AdminService();
//Auth routes
router.get('/', authRoutes.getUser);
router.post('/register', authRoutes.register);
router.post('/login', authRoutes.login);
router.post('/validToken', authRoutes.validToken);
//Admin routes
router.get('/getStaff', adminRoutes.getStaff.bind(adminRoutes));
router.put('/blockUser', adminRoutes.blockUser.bind(adminRoutes));
module.exports = router;
