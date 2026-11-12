import express from "express";
import userController from "../Controllers/userController.js";


const userRouter = express.Router();

userRouter.post("/signup",userController.signUp);
userRouter.post("/login",userController.login);


export {userRouter};