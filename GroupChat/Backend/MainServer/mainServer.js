import express, { json } from "express";
import { mainRouter } from "../Routes/mainRouter.js";
import { errorHandler } from "../Middleware/errorHandler.js";
import dotenv from "dotenv";
import { sequelize } from "../Database/db.js";
import cors from "cors";
import {createServer} from "http";
import cookieParser from "cookie-parser";
import { initializeSocket } from "../Websockets/ChatHandler.js";

dotenv.config();

await sequelize.authenticate();

await sequelize.sync({ alter: true });

const app = express();


const httpServer = createServer(app);

initializeSocket(httpServer);

app.use(express.json());

app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use("/groupChat",mainRouter);

app.use("/groupChat",errorHandler);

app.use((req,res,next)=>{
    res.status(404).json({message:"Page not found"});
})

httpServer.listen(Number(process.env.SERVER_PORT));