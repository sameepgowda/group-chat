import express, { json } from "express";
import { mainRouter } from "../Routes/mainRouter.js";
import { errorHandler } from "../Middleware/errorHandler.js";
import dotenv from "dotenv";
import { sequelize } from "../Database/db.js";

dotenv.config();

await sequelize.authenticate();

await sequelize.sync();

const app = express();

app.use(express.json());

app.use("/groupChat",mainRouter);

app.use("/groupChat",errorHandler);

app.use((req,res,next)=>{
    res.status(404).json({message:"Page not found"});
})

app.listen(Number(process.env.SERVER_PORT));