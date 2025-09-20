const express = require('express');
const router = express.Router();
const profilescontroller = require('../controllers/profilescontroller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตั้งค่าโฟลเดอร์สำหรับเก็บไฟล์
const uploadDir = path.join(__dirname, '../public/images/profiles/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ตั้งค่า Multer สำหรับอัปโหลดไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const validExtensions = ['.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!validExtensions.includes(ext)) {
            return cb(new Error('อนุญาตเฉพาะไฟล์ .jpg, .jpeg, .png เท่านั้น'));
        }
        cb(null, true);
    }
});

// ใช้ :id เป็นตัวแปร dynamic route parameter
// upload profile picture
router.post('/user/profile_picture/:id', upload.single('profile_picture'), profilescontroller.profile_picture);
// router.get('/user/profile_picture/:id', profilescontroller.profile);


module.exports = router;
