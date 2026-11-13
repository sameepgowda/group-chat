import express from "express";
import { userRouter } from "./userRouter.js";
import { chatRouter } from "./chatRouter.js";

const mainRouter = express.Router();

mainRouter.use("/user",userRouter);
mainRouter.use("/chat",chatRouter);

mainRouter.use((req,res,next)=>{
    res.status(404).json({message:"Page not found"});
})

export {mainRouter};