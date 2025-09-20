const userscontrollers = {};
const bcrypt = require("bcryptjs"); // สำหรับการเข้ารหัสรหัสผ่าน
const { validationResult } = require("express-validator"); // สำหรับตรวจสอบ validation

// คอนโทรลเลอร์ - แสดงรายการหมวดหมู่
userscontrollers.category = (req, res) => {
  req.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send("Database connection error");
    }

    const query = "SELECT * FROM categories";

    connection.query(query, (err, results) => {
      if (err) {
        return res.status(500).send("Error fetching categories");
      }
      res.render("../views/user/category", {
        categories: results,
        session: req.session,
      });
    });
  });
};

// คอนโทรลเลอร์ - แสดงรายการหนังสือ
userscontrollers.books = (req, res) => {
  req.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send("Database connection error");
    }

    const query =
      "SELECT book.*, categories.name AS category_name FROM book JOIN categories ON book.category_id = categories.id";

    connection.query(query, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).send("Error fetching book");
      }
      res.render("../views/user/books", {
        book: results,
        session: req.session,
      });
    });
  });
};

// ฟังก์ชันแสดงฟอร์มสมัครสมาชิก
userscontrollers.apply = (req, res) => {
  res.render("apply", { message: null });
};

// คอนโทรลเลอร์ - สมัครสมาชิกผู้ใช้
// ฟังก์ชันแปลงวันที่ไทยเป็น ค.ศ.
function convertThaiDateToGregorian(thaiDate) {
  const [day, month, year] = thaiDate.split("/");
  const gregorianYear = parseInt(year) - 543;
  return `${gregorianYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

userscontrollers.apply1 = async (req, res) => {
  const { username, password, name, email, phone, address } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("apply", {
      message: errors
        .array()
        .map((error) => error.msg)
        .join(", "),
    });
  }

  if (!username || !password || !name || !email || !phone || !address) {
    return res.render("apply", { message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  req.getConnection(async (err, connection) => {
    if (err) {
      return res.render("apply", {
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล",
      });
    }

    // ✅ ตรวจสอบว่ามี username ซ้ำหรือไม่
    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
      if (err) {
        return res.render("apply", {
          message: "เกิดข้อผิดพลาดในการตรวจสอบชื่อผู้ใช้",
        });
      }

      if (results.length > 0) {
        return res.render("apply", {
          error: "มีผู้ใช้ชื่อนี้แล้ว",
          formData: req.body
        });
      }

      // ถ้าไม่มีผู้ใช้ซ้ำ ให้ทำการสมัครสมาชิก
      const hashedPassword = await bcrypt.hash(password, 10);
      const membershipDate = new Date().toISOString().split("T")[0];

      const query = `INSERT INTO users (username, password, name, email, phone, address, membership_date, role, can_add_book, can_edit_book, can_delete_book, can_manage_users)
                     VALUES (?, ?, ?, ?, ?, ?, ?, '0', 0, 0, 0, 0)`;
      const values = [
        username,
        hashedPassword,
        name,
        email,
        phone,
        address,
        membershipDate,
      ];

      connection.query(query, values, (err) => {
        if (err) {
          return res.render("apply", {
            message: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
          });
        }
        res.redirect("/login");
      });
    });
  });
};


// ฟังก์ชันการเข้าสู่ระบบ (POST)
userscontrollers.login1 = async (req, res) => {
  const { username, password } = req.body;

  try {
    req.getConnection((err, connection) => {
      if (err) {
        console.error(err);
        return res.render("login", {
          message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล",
        });
      }

      connection.query(
        "SELECT * FROM library.users WHERE username = ?",
        [username],
        async (err, results) => {
          if (err) {
            console.error(err);
            return res.render("login", {
              message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
            });
          }

          if (results.length === 0) {
            return res.render("login", {
              message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
            });
          }

          const user = results[0];

          // ตรวจสอบรหัสผ่าน
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.render("login", {
              message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
            });
          }

          // ถ้าผ่านการตรวจสอบเข้าสู่ระบบสำเร็จ
          req.session.user = user; // เก็บข้อมูลผู้ใช้ใน session
          res.redirect("/category"); // ไปที่หน้าแดชบอร์ดหรือหน้าที่ต้องการ
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.render("login", { message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
  }
};
// ฟังก์ชันแปลงวันที่
function convertThaiDateToGregorian(thaiDate) {
  const [day, month, year] = thaiDate.split("/");
  const gregorianYear = parseInt(year) - 543; // แปลงจาก พ.ศ. เป็น ค.ศ.
  return `${gregorianYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// คอนโทรลเลอร์ - สร้างแอดมิน
userscontrollers.createAdmin = async (req, res) => {
  const { username, password, name, email, phone, address } = req.body; // ✅ เพิ่ม address
  if (!username || !password || !name || !email || !phone || !address) {
    return res.render("create-admin", { message: "กรุณากรอกข้อมูลให้ครบ" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const membershipDate = new Date().toISOString().split("T")[0]; // ✅ กำหนดค่าก่อนใช้

  req.getConnection((err, connection) => {
    if (err) {
      return res.render("create-admin", { message: "เกิดข้อผิดพลาดฐานข้อมูล" });
    }

    const query = `INSERT INTO users (username, password, name, email, phone, address, membership_date, role, can_add_book, can_edit_book, can_delete_book, can_manage_users)
                   VALUES (?, ?, ?, ?, ?, ?, ?, '1', 2, 2, 2, 2)`;
    const values = [
      username,
      hashedPassword,
      name,
      email,
      phone,
      address,
      membershipDate,
    ]; // ✅ ตรงกับ query

    connection.query(query, values, (err) => {
      if (err) {
        return res.render("create-admin", {
          message: "ไม่สามารถสมัครแอดมินได้",
        });
      }
      res.redirect("/login");
    });
  });
};

userscontrollers.login = (req, res) => {
    res.render("../views/login", {
      session: req.session,
    });
  };

  userscontrollers.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.errors = errors;
        req.session.success = false;
        return res.render("login", { session: req.session });
    }

    const { username, password } = req.body;

    req.getConnection((err, conn) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json({ error: "Database connection failed" });
        }

        const query = "SELECT * FROM users WHERE username = ?";
        conn.query(query, [username], async (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ error: "Database query failed" });
            }

            if (results.length === 0) {
                return res.render("login", { message: "Invalid username or password" });
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.render("login", { message: "Invalid username or password" });
            }

            // ✅ บันทึก session
            req.session.user = user;

            // ✅ กำหนดเส้นทางสำหรับ User และ Admin
            if (user.role === 1) {
                // Admin จะไปที่ /users
                return res.redirect("/users");
            } else {
                // User จะไปที่ /books
                return res.redirect("/books");
            }
        });
    });
};


// ✅ แสดงหน้าบัญชีผู้ใช้
userscontrollers.account = async (req, res) => {
    const userId = req.params.id;

    if (!req.session.user) {
        return res.redirect("/login");
    }

    req.getConnection((err, conn) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json({ message: "Database connection error" });
        }

        const query = "SELECT * FROM users WHERE id = ?";
        conn.query(query, [userId], (err, results) => {
            if (err || results.length === 0) {
                return res.redirect("/login");
            }

            const user = results[0];
            res.render("user/account", { user, session: req.session }); // ✅ ส่ง session ไป view
        });
    });
};

  userscontrollers.logoutUser = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.json({ error: "Logout failed" });
      }
      res.redirect("/login"); // หลัง logout ให้กลับไปที่หน้า login
    });
  };
  

module.exports = userscontrollers;
