const jwt = require("jsonwebtoken");

// 1. دالة المصادقة (تتأكد من وجود التوكن وصحته فقط)
module.exports  = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "غير مصرح: يرجى تسجيل الدخول أولاً" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken; // تمرير بيانات المستخدم للدالة التالية

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    const errorMessage = error.name === "TokenExpiredError" 
      ? "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً" 
      : "توكن غير صالح";
      
    res.status(401).json({ message: errorMessage });
  }
};