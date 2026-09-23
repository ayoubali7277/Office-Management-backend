import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(401).json({
      message: "Invalid Email or Password",
    });
  }

  const matchPassword = await bcrypt.compare(
    password,
    user.password
  );

  if (!matchPassword) {
    return res.status(401).json({
      message: "Invalid Email or Password",
    });
  }

  if (!user.isActive) {
  return res.status(403).json({
    message: "Your account is inactive",
  });
}

   if (user.role !== "SUPER_ADMIN") {
    const platformSettings = await prisma.platformSetting.findFirst();

    if (platformSettings?.maintenanceMode) {
      return res.status(503).json({
        message: "Platform is currently under maintenance",
      });
    }
  }


  const tokenData = {
    userId: user.id,
    role: user.role,
  };

  if(user.role !=="SUPER_ADMIN"){
    tokenData.organizationId = user.organizationId;
  }

  const token = jwt.sign(
     tokenData,
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );

 res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 2 * 60 * 60 * 1000,
});
  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.role !== "SUPER_ADMIN" ? user.organizationId :null,
    },
  });
};

export const logout = async(req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE.ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Logout Successfully",
    });
  }
  catch (error) {
    return res.status(500).json({
      message: "Failed to logout"
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get current user",
    });
  }
};
