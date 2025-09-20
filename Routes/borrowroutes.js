const express = require('express');
const router = express.Router();
const borrowcontroller = require('../controllers/borrowcontroller');

// records
router.get('/records', borrowcontroller.showAddBooks);
router.post('/records/:id', borrowcontroller.recordsBook);

router.get('/borrow', borrowcontroller.showborrow);
router.get('/return/:id', borrowcontroller.returnBook);
router.post('/return/:id', borrowcontroller.confirmReturn);

router.get('/user/list/:id', borrowcontroller.list);
module.exports = router;
