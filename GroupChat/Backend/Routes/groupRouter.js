import express from "express";
import groupController from "../Controllers/groupController.js";
import authMiddleware from "../Middleware/authMiddleware.js";


const groupRouter = express.Router();

groupRouter.post("/createGroup", authMiddleware, groupController.createGroup);

groupRouter.post("/joinGroup",authMiddleware, groupController.joinGroup);

groupRouter.get("/fetchGroups", authMiddleware, groupController.fetchGroups);

groupRouter.get("/fetchAllGroups", authMiddleware, groupController.fetchAllGroups);





export {groupRouter};