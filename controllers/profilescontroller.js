const fs = require('fs');
const path = require('path');

const profilescontroller = {};
// profilescontroller.profile = (req, res) => {
//     const userId = req.params.id;

//     req.getConnection((err, conn) => {
//         if (err) return res.status(500).json(err);

//         conn.query('SELECT * FROM users WHERE id = ?', [userId], (err, rows) => {
//             if (err) return res.status(500).json(err);

//             if (rows.length === 0) {
//                 return res.status(404).send('User not found');
//             }

//             res.render('user/profile_picture', { user: rows[0] }); 
//         });
//     });
// };


profilescontroller.profile_picture = (req, res) => {
    const userId = req.params.id;
    const imageFileName = req.file?.filename;

    if (!imageFileName) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    req.getConnection((err, conn) => {
        if (err) return res.status(500).json(err);

        conn.query('SELECT profile_picture FROM users WHERE id = ?', [userId], (err, rows) => {
            if (err) return res.status(500).json(err);

            const oldProfilePic = rows[0]?.profile_picture;

            if (oldProfilePic && oldProfilePic !== '/images/default.png') {
                const oldFilePath = path.join(__dirname, '../public', oldProfilePic);
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                        console.error('Failed to delete old profile picture:', unlinkErr);
                    }
                });
            }

            const profilePicPath = '/images/profiles/' + imageFileName;
            conn.query('UPDATE users SET profile_picture = ? WHERE id = ?', [profilePicPath, userId], (err, results) => {
                if (err) return res.status(500).json(err);

                // ส่ง JSON กลับไป
                res.json({ success: true, profile_picture: profilePicPath });
            });
        });
    });
};

module.exports = profilescontroller;
