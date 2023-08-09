import express from "express";

import { login, signup } from "../controllers/auth.js";
import { getAllUsers, updateProfile,fogetPassword, resetPassword, userLoginInfo } from "../controllers/users.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password",fogetPassword)
router.patch("/reset-password",resetPassword)
router.get("/getLoginInfo/:id",userLoginInfo)
router.get("/getAllUsers", getAllUsers);
router.patch("/update/:id", auth, updateProfile);

export default router;
