const bookcontrollers = {};
const path = require('path');
const fs = require('fs');
const multer = require('multer');

bookcontrollers.book = (req, res) => {
    req.getConnection((err, connection) => {
        if (err) {
            return res.status(500).send('Database connection error');
        }

        const query = 'SELECT book.*, categories.name AS category_name,categories.code AS category_code  FROM book JOIN categories ON book.category_id = categories.id';


        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);  
                return res.status(500).send('Error fetching book');
            }
            res.render('../views/book', { 
                book: results,
                session: req.session,
             });
        });
        
    });
};

bookcontrollers.showAddBook = (req, res) => {
    req.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            res.status(500).json(err);
            return;
        }

        connection.query('SELECT id, name, code FROM categories', (err, results) => {
            if (err) {
                console.error("Query error:", err);
                res.status(500).json(err);
                return;
              }
            res.render('../views/addbook', {
                 categories: results,
                 session: req.session,
            });
        });
    });
};

// ตั้งค่าโฟลเดอร์สำหรับเก็บไฟล์
const uploadDir = path.join(__dirname, '../public/images/');
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
}).single('image'); // ต้องแน่ใจว่า input file มี name="image"

// ฟังก์ชันเพิ่มหนังสือ
bookcontrollers.addBook = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error("Multer Error:", err);
            return res.status(400).json({ message: err.message });
        }

        console.log("📸 อัปโหลดไฟล์:", req.file); // ✅ ตรวจสอบไฟล์ที่อัปโหลด
        console.log("📑 ข้อมูลที่ได้รับ:", req.body); // ✅ ตรวจสอบข้อมูลฟอร์ม

        const data = req.body;
        const category_id = Array.isArray(data.category_id) ? data.category_id[0] : data.category_id || null;
        const imageFileName = req.file ? req.file.filename : ""; // ✅ ป้องกันค่า null

        const bookData = {
            title: data.title,
            author: data.author,
            category_id: category_id,
            year: data.year,
            isbn: data.isbn,
            image: imageFileName, // ✅ บันทึกชื่อไฟล์
            story: data.story,
            quantity:data.quantity,
        };

        req.getConnection((err, conn) => {
            if (err) {
                console.error("Database Connection Error:", err);
                return res.status(500).json({ message: 'Database connection failed.' });
            }

            conn.query('INSERT INTO book SET ?', bookData, (err) => {
                if (err) {
                    console.error("Database Insert Error:", err);
                    return res.status(500).json({ message: 'Database insert failed.' });
                }
                console.log("✅ บันทึกหนังสือสำเร็จ:", bookData);
                res.redirect('/book');
            });
        });
    });
};


// แสดงหน้า Confirm การลบ
bookcontrollers.confirmDelete = (req, res) => {
    const {id} = req.params; // Destructure id from req.params
    req.getConnection((err, conn) => {
        if (err) {
            res.json(err);
            return;
        }
        conn.query('SELECT * FROM library.book WHERE id = ?', [id], (err, result) => {
            if (err) {
                console.error("Query error:", err);
                res.json(err);
                return;
            }
            if (result.length === 0) {
                return res.status(404).send("Not found");
            }
            res.render('bookdel', {
                book: result[0],
                session: req.session,
            });
        });
    });
};

bookcontrollers.deleteBook = (req, res) => {
    const {id} = req.params; // Destructure id from req.params
    req.getConnection((err, conn) => {
        if (err) {
            res.json(err);
            return;
        }
        conn.query('DELETE FROM library.book WHERE id = ?', [id], (err) => {
            if (err) {
                res.json(err);
                return;
            }
            res.redirect('/book');
        });
    });
};



// แสดงหน้าแก้ไขหนังสือ
bookcontrollers.editBook = (req, res) => {
    const {id} = req.params; // เข้าถึง id โดยตรงจาก req.params
    req.getConnection((err, conn) => {
        if (err) {
            console.error("Database connection error:", err);
            res.json(err);
            return;
        }
        conn.query('SELECT * FROM library.book WHERE id = ?', [id], (err, bookResult) => {
            if (err) {
                console.error("Query error:", err);
                res.json(err);
                return;
            }
            conn.query('SELECT * FROM library.categories', (err, categoryResult) => {
                if (err) {
                    console.error("Query error:", err);
                    res.json(err);
                    return;
                }
                res.render('editbook', { book: bookResult[0], categories: categoryResult });
            });
        });
    });
};

// อัปเดตข้อมูลหนังสือH
bookcontrollers.updateBook = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error("Multer Error:", err);
            return res.status(400).json({ message: err.message });
        }

        const id = req.params.id;
        const { title, author, category, year, isbn,story,quantity } = req.body;
        const imageFileName = req.file ? req.file.filename : null;

        req.getConnection((err, conn) => {
            if (err) {
                console.error("Database connection error:", err);
                return res.status(500).json({ message: 'Database connection failed.' });
            }

            const query = imageFileName
                ? 'UPDATE library.book SET title = ?, author = ?, category_id = ?, year = ?, isbn = ?, image = ?,story = ?,quantity = ? WHERE id = ?'
                : 'UPDATE library.book SET title = ?, author = ?, category_id = ?, year = ?, isbn = ?,story = ?,quantity = ? WHERE id = ?';

            const values = imageFileName
                ? [title, author, category, year, isbn, imageFileName,story,quantity, id]
                : [title, author, category, year, isbn,story,quantity, id];

            conn.query(query, values, (err) => {
                if (err) {
                    console.error("Query error:", err);
                    return res.status(500).json({ message: 'Update failed.' });
                }
                console.log(`✅ Book ID ${id} updated successfully.`);
                res.redirect('/book');
            });
        });
    });
};

  
module.exports = bookcontrollers;
