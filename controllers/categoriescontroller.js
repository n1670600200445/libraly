const categoriescontrollers = {};

categoriescontrollers.categories = (req, res) => {
  req.getConnection((err, connection) => {
    if (err) {
      return res.status(500).send("Database connection error");
    }

    const query = "SELECT * FROM categories";

    connection.query(query, (err, results) => {
      if (err) {
        return res.status(500).send("Error fetching categories");
      }
      res.render("categories", { 
        categories: results,
        session: req.session,
       });
    });
  });
};

categoriescontrollers.addForm = (req, res) => {
    req.getConnection((err, conn) => {
      if (err) {
        console.error("Database connection error:", err);
        res.status(500).json(err);
        return;
      }
      res.render("addcat", {
        session: req.session,
      });
    });
  };
  

// เพิ่มข้อมูล
categoriescontrollers.add = (req, res) => {
  const data = {
    name: req.body.name,
    description: req.body.description,
    code: req.body.code,
  };

  req.getConnection((err, conn) => {
    if (err) {
      res.json(err);
      return;
    }

    conn.query("INSERT INTO library.categories SET ?", [data], (err) => {
      if (err) {
        console.error("Insert query error:", err);
        res.json(err);
        return;
      }
      res.redirect("/categories");
    });
  });
};


// แสดงหน้า Confirm การลบ
categoriescontrollers.confirmDelete = (req, res) => {
    const {id} = req.params; // Destructure id from req.params
    req.getConnection((err, conn) => {
        if (err) {
            res.json(err);
            return;
        }
        conn.query('SELECT * FROM library.categories WHERE id = ?', [id], (err, result) => {
            if (err) {
                console.error("Query error:", err);
                res.json(err);
                return;
            }
            if (result.length === 0) {
                return res.status(404).send("Not found");
            }
            res.render('delcat', {
                categories: result[0],
                session: req.session,
            });
        });
    });
};

categoriescontrollers.deleteBook = (req, res) => {
    const {id} = req.params; // Destructure id from req.params
    req.getConnection((err, conn) => {
        if (err) {
            res.json(err);
            return;
        }
        conn.query('DELETE FROM library.categories WHERE id = ?', [id], (err) => {
            if (err) {
                res.json(err);
                return;
            }
            res.redirect('/categories');
        });
    });
};



// แสดงหน้าแก้ไขหนังสือ
categoriescontrollers.editForm = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, conn) => {
        if (err) {
            console.error("Database connection error:", err);
            res.json(err);
            return;
        }
        conn.query('SELECT * FROM library.categories WHERE id = ?', [id], (err, result) => {
            if (err) {
                console.error("Query error:", err);
                res.json(err);
                return;
            }
            if (result.length === 0) {
                return res.status(404).send("Category not found");
            }
            // Pass the category data to the EJS template
            res.render('editcat', { categories: result[0], session: req.session });
        });
    });
};


// อัปเดตข้อมูลหนังสือH
categoriescontrollers.updateBook = (req, res) => {
    const id = req.params.id; // เข้าถึง id โดยตรงจาก req.params
    const { name, description,code } = req.body;

    req.getConnection((err, conn) => {
        if (err) {
            console.error("Database connection error:", err);
            res.json(err);
            return;
        }
        conn.query(
            'UPDATE library.categories SET name = ?, description = ?,code = ? WHERE id = ?',
            [name, description,code, id], // ใช้ id ที่นี่ ไม่ใช่ bookId
            (err) => {
                if (err) {
                    console.error("Query error:", err);
                    res.json(err);
                    return;
                }
                console.log(`categories ID ${id} updated successfully.`);
                res.redirect('/categories');
            }
        );
    });
};

categoriescontrollers.categoryDetail = (req, res) => {
  const categoryCode = req.params.code; // ดึงรหัสหมวดหมู่จาก URL

  req.getConnection((err, connection) => {
      if (err) {
          return res.status(500).send('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
      }

      // Query เพื่อดึงข้อมูลหมวดหมู่ที่ตรงกับ code ที่เลือก
      const categoryQuery = 'SELECT * FROM categories WHERE code = ?';

      connection.query(categoryQuery, [categoryCode], (err, categoryResults) => {
          if (err) {
              console.error('เกิดข้อผิดพลาดในการรัน Query หมวดหมู่:', err);  
              return res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่');
          }
          
          // ตรวจสอบว่าเจอหมวดหมู่ที่ตรงกับรหัสหรือไม่
          if (categoryResults.length === 0) {
              return res.status(404).send('ไม่พบหมวดหมู่ที่ต้องการ');
          }

          // Query เพื่อดึงข้อมูลหนังสือที่อยู่ในหมวดหมู่นี้ รวมถึง image_url
          const booksQuery = 'SELECT * FROM book WHERE category_id = ?';

          connection.query(booksQuery, [categoryResults[0].id], (err, bookResults) => {
              if (err) {
                  console.error('เกิดข้อผิดพลาดในการรัน Query หนังสือ:', err);  
                  return res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ');
              }

              // ส่งข้อมูลหมวดหมู่และหนังสือไปยังหน้าวิว
              res.render('user/categoryDetail', { 
                  category: categoryResults[0], // ส่งข้อมูลหมวดหมู่ที่ตรงกับรหัส
                  books: bookResults, // ส่งข้อมูลหนังสือที่อยู่ในหมวดหมู่นั้น
                  session: req.session,
              });
          });
      });
  });
};


module.exports = categoriescontrollers;
