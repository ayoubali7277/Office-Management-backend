export const managerOnly = (req, res, next) => {
  if (req.user.role !== "MANAGER") {
    return res.status(403).json({
      message: "Only managers can access this route",
    });
  }

  next();
};