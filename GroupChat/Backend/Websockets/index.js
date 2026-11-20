import { socketAuth } from "./Middleware.js";
import { chatHandler } from "./ChatHandler.js";
import { Server } from "socket.io";

function initializeSocket(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    });

    socketAuth(io);

    io.on("connection", (socket) => {

        console.log("Client connected:", socket.id);

        chatHandler(socket,io);
        
    });


    return io;
}

export {initializeSocket};