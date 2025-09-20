const isAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.redirect("/category"); // เปลี่ยนเส้นทางไปหน้าหมวดหมู่
    }
    next();
  };
  
  module.exports = { isAdmin };  