import express from "express";
import chatController from "../Controllers/chatController.js";
import authMiddleware from "../Middleware/authMiddleware.js";


const chatRouter = express.Router();

chatRouter.post("/storeMessage", authMiddleware, chatController.storeMessage);

chatRouter.post("/fetchMessages",authMiddleware, chatController.fetchMessages);



export {chatRouter};