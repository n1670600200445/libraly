const express = require('express');
const router = express.Router();
const { isAdmin } = require("../middlewares/auth"); // ✅ นำเข้า middleware
const userscontrollers = require('../controllers/userscontroller.js'); // ตรวจสอบพาธ

router.get('/category', userscontrollers.category);
router.get('/books', userscontrollers.books);
router.get('/apply', userscontrollers.apply);
router.post('/apply', userscontrollers.apply1);

router.get('/login', userscontrollers.login);
router.post('/loginpost', userscontrollers.loginUser);

router.get("/user/account/:id", userscontrollers.account);

router.get('/create-admin', (req, res) => {
    res.render('create-admin', { message: null });
});
router.post('/create-admin', userscontrollers.createAdmin);

router.get("/logout", userscontrollers.logoutUser);



module.exports = router;
