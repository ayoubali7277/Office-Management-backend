export const organizationAdminOnly = (req,res,next) => {
    if(req.user.role !== "ORGANIZATION_ADMIN"){
        return res.status(403).json({
            message: "Only access to organization admin",
        });
    }

    next();
};