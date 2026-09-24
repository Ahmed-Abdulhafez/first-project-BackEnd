module.exports.isAdmin = (req, res, next) => {
  
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access Denied! You must be an admin to perform this action.",
    });
  }
  next();
};