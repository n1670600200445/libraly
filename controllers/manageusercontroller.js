const manageusercontrollers = {};
const bcrypt = require("bcryptjs"); // สำหรับการเข้ารหัสรหัสผ่าน

// ดึงข้อมูลผู้ใช้ทั้งหมด
manageusercontrollers.getAllUsers = (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.json(err);
    conn.query("SELECT * FROM users", (err, users) => {
      if (err) return res.json(err);
      res.render("users", { users });
    });
  });
};

manageusercontrollers.addForm = (req, res) => {
  req.getConnection((err, conn) => {
    if (err) {
      console.error("Database connection error:", err);
      res.status(500).json(err);
      return;
    }
    res.render("usersadd", {
      session: req.session,
    });
  });
};

// เพิ่มผู้ใช้
manageusercontrollers.addUser = async (req, res) => {
  const {
    username,
    password,
    name,
    email,
    phone,
    address,
    role,
  } = req.body;

  // ตรวจสอบค่า Checkbox ถ้าไม่ได้ติ๊กให้เป็น 0
  const can_add_book = req.body.can_add_book ? 2 : 0;
  const can_edit_book = req.body.can_edit_book ? 2 : 0;
  const can_delete_book = req.body.can_delete_book ? 2 : 0;
  const can_manage_users = req.body.can_manage_users ? 2 : 0;

  const hashedPassword = await bcrypt.hash(password, 10); // ลดรอบ Hash เป็น 10 เพื่อประสิทธิภาพ
  const membershipDate = new Date().toISOString().split("T")[0]; // วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD

  req.getConnection((err, conn) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    const query = `INSERT INTO users 
    (username, password, name, email, phone, address, membership_date, role, 
     can_add_book, can_edit_book, can_delete_book, can_manage_users) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      username,
      hashedPassword,
      name,
      email,
      phone,
      address,
      membershipDate,  // ใช้วันที่ปัจจุบัน
      role,
      can_add_book,
      can_edit_book,
      can_delete_book,
      can_manage_users,
    ];

    conn.query(query, values, (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).json({ message: "มีผู้ใช้ชื่อนี้อยู่แล้ว กรุณากดย้อนกลับ" });
      }
      console.log("User added successfully");
      res.redirect("/users");
    });
  });
};
manageusercontrollers.editUserForm = (req, res) => {
  const id = req.params.id; // รับ id จาก params

  req.getConnection((err, conn) => {
    if (err) return res.json(err);

    conn.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
      if (err) return res.json(err);

      // ส่งข้อมูลผู้ใช้ไปยัง view
      res.render("usersedit", { user: result[0], session: req.session });
    });
  });
};

// แก้ไขผู้ใช้
manageusercontrollers.editUser = async (req, res) => {
    const {
      username,
      password,
      name,
      email,
      phone,
      address,
      role,
      can_add_book,
      can_edit_book,
      can_delete_book,
      can_manage_users,
    } = req.body;
  
    const id = req.params.id;
  
    // 🔹 If no password is provided, we don't hash a new password
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10); // Hash new password if provided
    }
  
    // 🔹 Construct the SQL query
    const query = password
      ? `UPDATE users SET 
                username = ?, 
                password = ?, 
                name = ?, 
                email = ?, 
                phone = ?, 
                address = ?, 
                role = ?, 
                can_add_book = ?, 
                can_edit_book = ?, 
                can_delete_book = ?, 
                can_manage_users = ? 
               WHERE id = ?`
      : `UPDATE users SET 
                username = ?, 
                name = ?, 
                email = ?, 
                phone = ?, 
                address = ?, 
                role = ?, 
                can_add_book = ?, 
                can_edit_book = ?, 
                can_delete_book = ?, 
                can_manage_users = ? 
               WHERE id = ?`;
  
    // 🔹 Prepare the values array
    const values = password
      ? [
          username,
          hashedPassword,
          name,
          email,
          phone,
          address,
          role,
          (can_add_book === '2' || can_add_book === 2) ? 2 : 0,  // Ensure 0 or 2
          (can_edit_book === '2' || can_edit_book === 2) ? 2 : 0, // Ensure 0 or 2
          (can_delete_book === '2' || can_delete_book === 2) ? 2 : 0, // Ensure 0 or 2
          (can_manage_users === '2' || can_manage_users === 2) ? 2 : 0, // Ensure 0 or 2
          id,
        ]
      : [
          username,
          name,
          email,
          phone,
          address,
          role,
          (can_add_book === '2' || can_add_book === 2) ? 2 : 0,  // Ensure 0 or 2
          (can_edit_book === '2' || can_edit_book === 2) ? 2 : 0, // Ensure 0 or 2
          (can_delete_book === '2' || can_delete_book === 2) ? 2 : 0, // Ensure 0 or 2
          (can_manage_users === '2' || can_manage_users === 2) ? 2 : 0, // Ensure 0 or 2
          id,
        ];
  
    req.getConnection((err, conn) => {
      if (err) {
        console.error("Database connection error:", err);
        return res.status(500).json({ message: "Database connection error" });
      }
  
      conn.query(query, values, (err) => {
        if (err) {
          console.error("Error updating user:", err);
          console.log("Query:", query);
          console.log("Values:", values);
          return res.status(500).json({ message: "มีผู้ใช้ชื่อนี้อยู่แล้ว กรุณากดย้อนกลับ" });
        }
        console.log("User updated successfully");
        res.redirect("/users");
      });
    });
  };    
   
  // userแก้ไขบัญชีตนเอง
  manageusercontrollers.ueditForm = (req, res) => {
    const id = req.params.id; // รับ id จาก params
  
    req.getConnection((err, conn) => {
      if (err) return res.json(err);
  
      conn.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
        if (err) return res.json(err);
  
        // ส่งข้อมูลผู้ใช้ไปยัง view
        res.render("user/uedit", { user: result[0], session: req.session });
      });
    });
  };

  manageusercontrollers.uedit = async (req, res) => {
    const {
        username,
        name,
        email,
        phone,
        address,
        role,
        can_add_book,
        can_edit_book,
        can_delete_book,
        can_manage_users,
    } = req.body;

    const id = req.params.id;

    // 🔹 Construct the SQL query (ไม่มี password)
    const query = `UPDATE users SET 
                    username = ?, 
                    name = ?, 
                    email = ?, 
                    phone = ?, 
                    address = ?, 
                    role = ?, 
                    can_add_book = ?, 
                    can_edit_book = ?, 
                    can_delete_book = ?, 
                    can_manage_users = ? 
                   WHERE id = ?`;

    // 🔹 Prepare the values array
    const values = [
        username,
        name,
        email,
        phone,
        address,
        role,
        (can_add_book === '2' || can_add_book === 2) ? 2 : 0,  // Ensure 0 or 2
        (can_edit_book === '2' || can_edit_book === 2) ? 2 : 0, // Ensure 0 or 2
        (can_delete_book === '2' || can_delete_book === 2) ? 2 : 0, // Ensure 0 or 2
        (can_manage_users === '2' || can_manage_users === 2) ? 2 : 0, // Ensure 0 or 2
        id,
    ];

    req.getConnection((err, conn) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json({ message: "Database connection error" });
        }

        conn.query(query, values, (err) => {
            if (err) {
                console.error("Error updating user:", err);
                console.log("Query:", query);
                console.log("Values:", values);
                return res.status(500).json({ message: "มีผู้ใช้ชื่อนี้อยู่แล้ว กรุณากดย้อนกลับ" });
            }
            console.log("User updated successfully");
            res.redirect("/user/account1");
        });
    });
};

// ✅ แสดงหน้าบัญชีผู้ใช้
manageusercontrollers.account1 = async (req, res) => {
  let id = req.params.id || (req.session.user ? req.session.user.id : null);
  if (!id) {
      return res.redirect("/login");
  }

  req.getConnection((err, conn) => {
      if (err) {
          console.error("Database connection error:", err);
          return res.status(500).json({ message: "Database connection error" });
      }

      const query = "SELECT * FROM users WHERE id = ?";
      conn.query(query, [id], (err, results) => {
          if (err || results.length === 0) {
              console.error("User not found or query error:", err);
              return res.redirect("/login");
          }

          const user = results[0];
          console.log("User data:", user); // ✅ Debug
          res.render("user/account1", { user, session: req.session });
      });
  });
};


// แสดงหน้า Confirm การลบ
manageusercontrollers.confirmDelete = (req, res) => {
  const { id } = req.params; // ดึง id จาก params
  req.getConnection((err, conn) => {
    if (err) {
      res.json(err);
      return;
    }
    conn.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
      if (err) {
        res.json(err);
        return;
      }
      if (result.length === 0) {
        return res.status(404).send("User not found");
      }
      res.render("deleteusers", { user: result[0], session: req.session });
    });
  });
};

// ลบผู้ใช้
manageusercontrollers.deleteUser = (req, res) => {
  const id = req.params.id;

  req.getConnection((err, conn) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    // ลบ borrowed_book ก่อน
    conn.query("DELETE FROM borrowed_book WHERE user_id = ?", [id], (err, result) => {
      if (err) {
        console.error("Error deleting borrowed books:", err);
        return res.status(500).json({ message: "Database query error (borrowed_book)" });
      }

      // แล้วค่อยลบ users
      conn.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
        if (err) {
          console.error("Error deleting user:", err);
          return res.status(500).json({ message: "Database query error (users)" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).send("User not found");
        }

        console.log("User deleted successfully");
        res.redirect("/users");
      });
    });
  });
};


module.exports = manageusercontrollers;
