export const superAdminOnly = (req,res,next) => {
    if(req.user.role !== "SUPER_ADMIN"){
        return res.status(403).json({
            message: "Access Denied. Super Admin Only",
        })
    }

    next();
};