import express from "express";
import userController from "../Controllers/userController.js";
import authMiddleware from "../Middleware/authMiddleware.js";


const userRouter = express.Router();

userRouter.post("/signup",userController.signUp);
userRouter.post("/login",userController.login);
userRouter.post("/fetchusers",authMiddleware,userController.fetchUsers);
userRouter.get("/fetchExistingUsers", authMiddleware,userController.fetchExistingUsers);


export {userRouter};