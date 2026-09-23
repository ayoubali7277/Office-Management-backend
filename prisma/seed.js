import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

const hashedPassword = await bcrypt.hash("Ayoub@123", 10);

const superAdmin = await prisma.user.create({
    data: {
        name: "Ayoub Ali",
        email: "ayoub.aliofficial@gmail.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        organizationId: null,
    },
});