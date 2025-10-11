//theme.route.js
import express from "express";
import { getThemeWords } from "../controllers/theme.controller.js";

const router = express.Router();

router.get("/:theme/words", getThemeWords);

export default router;
