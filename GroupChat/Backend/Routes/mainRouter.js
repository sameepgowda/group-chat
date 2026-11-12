import express from "express";
import { userRouter } from "./userRouter.js";

const mainRouter = express.Router();

mainRouter.use("/user",userRouter);

mainRouter.use((req,res,next)=>{
    res.status(404).json({message:"Page not found"});
})

export {mainRouter};