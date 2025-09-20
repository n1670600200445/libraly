const express = require("express");
const router = express.Router();
const manageusercontrollers = require("../controllers/manageusercontroller");

// หน้าจัดการผู้ใช้ (เฉพาะ Admin)
router.get("/users", manageusercontrollers.getAllUsers);

// เส้นทางแสดงฟอร์มเพิ่มผู้ใช้
// router.get("/usersadd", (req, res) => {
//     res.render("usersadd", { session: req.session });
// });
router.get("/usersadd", manageusercontrollers.addForm);
router.post("/usersadd", manageusercontrollers.addUser);

router.get("/usersedit/:id", manageusercontrollers.editUserForm);
router.post("/usersedit/:id", manageusercontrollers.editUser);

// GET: ฟอร์มแก้ไขผู้ใช้
router.get("/user/uedit/:id", manageusercontrollers.ueditForm);5
// POST: บันทึกข้อมูลที่แก้ไข
router.post("/user/uedit/:id", manageusercontrollers.uedit);
router.get("/user/account1/:id?", manageusercontrollers.account1);

router.get("/deleteusers/:id", manageusercontrollers.confirmDelete);
router.post("/deleteusers/:id", manageusercontrollers.deleteUser);




module.exports = router;
