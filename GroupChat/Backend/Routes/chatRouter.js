import express from "express";
import chatController from "../Controllers/chatController.js";
import authMiddleware from "../Middleware/authMiddleware.js";
import {upload} from "../Middleware/multer.js";



const chatRouter = express.Router();



chatRouter.post("/storeMessage", authMiddleware, chatController.storeMessage);

chatRouter.post("/fetchMessages",authMiddleware, chatController.fetchMessages);

chatRouter.post("/fetchPersonalMessages", authMiddleware, chatController.fetchPersonalMessages);

chatRouter.post("/uploadMedia", authMiddleware, upload.single('file'), chatController.uploadFile);

chatRouter.post("/generateReplyUsingAI", authMiddleware, chatController.generateReplyUsingAI);



export {chatRouter};