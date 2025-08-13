import express from "express";
import {
  insertMessage,
  getConversations,
  updateStatus,
  createConversation,
} from "../Controllers/MessageController.js";

const router = express.Router();

router.post("/new", insertMessage);
router.get("/conversations", getConversations);
router.put("/status", updateStatus);

// 🔹 Create new conversation without messages
router.post("/conversation", createConversation);

export default router;
