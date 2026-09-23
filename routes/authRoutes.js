import express from "express";
import { login } from "../controllers/authController.js";
import { logout } from "../controllers/authController.js";
import { getCurrentUser } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/current-user", verifyToken, getCurrentUser);


export default router;