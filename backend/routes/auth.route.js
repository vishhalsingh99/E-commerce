import express from "express";
import {login, signup, logout, refreshToken, getProfile} from '../controllers/auth.controller.js'
import { protectRoute } from './../middlewares/auth.middleware.js';

const router = express.Router();


router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/profile", protectRoute, getProfile);

export default router