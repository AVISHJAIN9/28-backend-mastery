class RoleCheckController {
  static requireRole(role) {
    return (req, res, next) => {
      if (!req.user || req.user.role !== role) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          requiredRole: role,
          userRole: req.user?.role
        });
      }
      next();
    };
  }

  static getAdminData(req, res) {
    res.json({
      data: 'Admin only data',
      user: req.user?.username,
      role: req.user?.role
    });
  }
}

module.exports = RoleCheckController;
