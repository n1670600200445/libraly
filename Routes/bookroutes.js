const express = require('express');
const router = express.Router();
const bookcontrollers = require('../controllers/bookcontroller');

router.get('/book', bookcontrollers.book);  

// แสดงหน้าเพิ่มหนังสือ
router.get('/addbook', bookcontrollers.showAddBook);
// เพิ่มหนังสือ
router.post('/book', bookcontrollers.addBook);

// แสดงหน้า Confirm การลบ
router.get('/book/delete/:id', bookcontrollers.confirmDelete);
// ลบหนังสือ
router.post('/book/delete/:id', bookcontrollers.deleteBook);

// แสดงหน้าแก้ไขหนังสือ
router.get('/book/edit/:id', bookcontrollers.editBook);
// อัปเดตข้อมูลหนังสือ
router.post('/book/update/:id', bookcontrollers.updateBook); 

module.exports = router;


