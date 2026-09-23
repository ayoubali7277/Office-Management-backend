export const employeeOnly = (req, res, next) => {
  if (req.user.role !== "EMPLOYEE") {
    return res.status(403).json({
      message: "Only employees can access this route",
    });
  }

  next();
};