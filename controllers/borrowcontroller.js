const borrowcontroller = {};
borrowcontroller.showborrow = (req, res) => {
    req.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json(err);
        }

        // ดึงข้อมูล borrowed_book และข้อมูลผู้ใช้
        const query = `
            SELECT borrowed_book.*, users.username,users.phone, book.title, book.image
            FROM borrowed_book
            JOIN users ON borrowed_book.user_id = users.id
            JOIN book ON borrowed_book.book_id = book.id
        `;
        connection.query(query, (err, borrowed_bookResults) => {
            if (err) {
                console.error("borrowed_book Query Error:", err);
                return res.status(500).json(err);
            }

            // ส่งข้อมูลไปยังวิว
            res.render('borrow', {
                borrowed_books: borrowed_bookResults, // ส่งข้อมูล borrowed_book มา
                session: req.session,
            });
        });
    });
};

borrowcontroller.returnBook = (req, res) => {
    const id = req.params.id;
    req.getConnection((err, connection) => {
        if (err) return res.status(500).send(err);

        connection.query('SELECT * FROM borrowed_book WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).send(err);

            if (result.length === 0) {
                return res.status(404).send("ไม่พบข้อมูลการยืมหนังสือ");
            }

            res.render('return', {
                borrowed_book: result[0],
                session: req.session
            });
        });
    });
};

borrowcontroller.confirmReturn = (req, res) => {
    const id = req.params.id;

    req.getConnection((err, connection) => {
        if (err) return res.status(500).send('Database connection error');

        // หา book_id จาก borrowed_books ก่อน
        connection.query('SELECT book_id FROM borrowed_book WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).send('Error fetching borrowed book');
            if (results.length === 0) return res.status(404).send('Borrowed book not found');

            const bookId = results[0].book_id;

            // อัปเดต borrowed_books เป็นคืนแล้ว
            connection.query('UPDATE borrowed_book SET status = ? WHERE id = ?', ['คืนแล้ว', id], (err2, result2) => {
                if (err2) return res.status(500).send('Error updating borrowed_books');

                // อัปเดต quantity ของหนังสือ +1
                connection.query('UPDATE book SET quantity = quantity + 1 WHERE id = ?', [bookId], (err3, result3) => {
                    if (err3) return res.status(500).send('Error updating books quantity');

                    res.sendStatus(200); // สำเร็จ
                });
            });
        });
    });
};



// แสดงหน้าให้เลือกหนังสือและผู้ใช้
borrowcontroller.showAddBooks = (req, res) => {
    req.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json(err);
        }

        // ดึงข้อมูลผู้ใช้
        connection.query('SELECT id, username, phone FROM users', (err, userResults) => {
            if (err) {
                console.error("User Query Error:", err);
                return res.status(500).json(err);
            }

            // ดึงข้อมูลหนังสือ
            connection.query('SELECT id, title, image, quantity FROM book', (err, bookResults) => {
                if (err) {
                    console.error("Book Query Error:", err);
                    return res.status(500).json(err);
                }

                res.render('records', {
                    users: userResults,
                    books: bookResults,
                    session: req.session,
                });
            });
        });
    });
};

// บันทึกข้อมูลการยืมหนังสือ
borrowcontroller.recordsBook = (req, res) => {
    const data = req.body;
  
    const bookData = {
        book_id: data.book_id,
        user_id: data.user_id,
        status: data.status,
        borrow_date: data.borrow_date,
        return_date: data.return_date,
        quantity_id: data.quantity_id
    };
  
    req.getConnection((err, conn) => {
        if (err) {
            console.error("Database Connection Error:", err);
            return res.status(500).json({ message: 'Database connection failed.' });
        }
  
        // ตรวจสอบจำนวนหนังสือที่ผู้ใช้ยืมอยู่
        const checkLimitQuery = `
          SELECT COUNT(*) AS borrowCount 
          FROM borrowed_book 
          WHERE user_id = ? AND status = 'กำลังยืม'
        `;
        
        conn.query(checkLimitQuery, [data.user_id], (err, limitResult) => {
          if (err) {
            console.error("Check Limit Error:", err);
            return res.redirect('/records?alert=limit_check_error');
          }
        
          const borrowCount = limitResult[0].borrowCount;
          if (borrowCount >= 3) {
            return res.redirect('/records?alert=limit');
          }
        
          // ตรวจสอบว่าเคยยืมเล่มนี้แล้วยังไม่คืนหรือไม่
          const checkDuplicateQuery = `
            SELECT * 
            FROM borrowed_book 
            WHERE user_id = ? AND book_id = ? AND status = 'กำลังยืม'
          `;
          conn.query(checkDuplicateQuery, [data.user_id, data.book_id], (err, dupResult) => {
            if (err) {
              console.error("Check Duplicate Error:", err);
              return res.redirect('/records?alert=duplicate_check_error');
            }
        
            if (dupResult.length > 0) {
              return res.redirect('/records?alert=duplicate');
            }
        
            // ดำเนินการตามปกติ
            conn.beginTransaction(err => {
              if (err) {
                console.error("Transaction Begin Error:", err);
                return res.redirect('/records?alert=transaction_error');
              }
        
              conn.query('INSERT INTO borrowed_book SET ?', bookData, (err, result) => {
                if (err) {
                  return conn.rollback(() => {
                    console.error("Insert Borrow Error:", err);
                    res.redirect('/records?alert=insert_failed');
                  });
                }
        
                const updateQuery = `
                  UPDATE book 
                  SET quantity = quantity - 1
                  WHERE id = ? AND quantity >= 1
                `;
                conn.query(updateQuery, [data.book_id], (err, result) => {
                  if (err) {
                    return conn.rollback(() => {
                      console.error("Update Book Quantity Error:", err);
                      res.redirect('/records?alert=update_failed');
                    });
                  }
        
                  if (result.affectedRows === 0) {
                    return conn.rollback(() => {
                      console.error("Not enough quantity to borrow.");
                      res.redirect('/records?alert=quantity');
                    });
                  }
        
                  conn.commit(err => {
                    if (err) {
                      return conn.rollback(() => {
                        console.error("Commit Error:", err);
                        res.redirect('/records?alert=commit_failed');
                      });
                    }
                                res.redirect('/records');
                            });
                        });
                    });
                });
            });
        });
    });
  };
  
    
borrowcontroller.list = (req, res) => {
    req.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json(err);
        }

        const userId = req.params.id; // ดึง id มาจาก URL

        const query = `
            SELECT borrowed_book.*, users.username, users.phone, book.title, book.image
            FROM borrowed_book
            JOIN users ON borrowed_book.user_id = users.id
            JOIN book ON borrowed_book.book_id = book.id
            WHERE users.id = ?
        `;

        connection.query(query, [userId], (err, borrowed_bookResults) => {
            if (err) {
                console.error("borrowed_book Query Error:", err);
                return res.status(500).json(err);
            }

            // แยกข้อมูลเป็น 2 ส่วน
            const notReturnedBooks = borrowed_bookResults.filter(book => book.status !== 'คืนแล้ว');
            const returnedBooks = borrowed_bookResults.filter(book => book.status === 'คืนแล้ว');

            // ส่งข้อมูลที่แยกแล้วไปยังวิว
            res.render('../views/user/list', {
                notReturnedBooks: notReturnedBooks, // ข้อมูลที่ยังไม่ได้คืน
                returnedBooks: returnedBooks, // ข้อมูลที่คืนแล้ว
                session: req.session,
            });
        });
    });
};


module.exports = borrowcontroller;
