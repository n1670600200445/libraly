const express = require('express');
const router = express.Router();
const categoriescontrollers = require('../controllers/categoriescontroller');

router.get('/categories', categoriescontrollers.categories);  // Use '/' for correct matching
// router.post('/categories', categoriescontrollers.categories); // Use '/' for correct matching

// แสดงหน้าเพิ่มหนังสือ
router.get('/addcat', categoriescontrollers.addForm);
// เพิ่มหนังสือ
router.post('/categories', categoriescontrollers.add);

// แสดงหน้า Confirm การลบ
router.get('/categories/delete/:id', categoriescontrollers.confirmDelete);
// ลบหนังสือ
router.post('/categories/delete/:id', categoriescontrollers.deleteBook);

// แสดงหน้าแก้ไขหนังสือ
router.get('/categories/edit/:id', categoriescontrollers.editForm);
// อัปเดตข้อมูลหนังสือ
router.post('/categories/update/:id', categoriescontrollers.updateBook);

// เพิ่ม route นี้ใน router.js
router.get('/category/:code', categoriescontrollers.categoryDetail);


module.exports = router;
