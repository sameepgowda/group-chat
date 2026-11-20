
import { Server } from "socket.io";
import { Chat } from "../Database/chatDb.js";
import { User } from "../Database/userDb.js";
import { parse } from "cookie";
import jwt from 'jsonwebtoken';

function initializeSocket(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    });
        io.use((socket, next) => {

        try {

            // 1. Get the cookie header.
            const cookieHeader = socket.handshake.headers.cookie;

            console.log(cookieHeader)

            // 2. Parse the cookies.
            const cookies = parse(cookieHeader || "");

            // 3. Extract the JWT.
            console.log(cookies);
            const token = cookies.token; // Replace jwt with your actual cookie name.

            if (!token) {
                return next(new Error("Authentication required"));
            }

            // 4. Verify the JWT.
            const decoded = jwt.verify(
                token,
                process.env.JWT_KEY
            );

            // 5. Attach authenticated user information to socket.
            socket.user = decoded;

            next();

        } catch (err) {

            console.error("Socket authentication failed:", err.message);

            next(new Error("Invalid or expired token"));

        }

    });

    io.on("connection", (socket) => {

        console.log("Client connected:", socket.id);

        // Join the requested group room.
        socket.on("joinGroup", (groupId) => {

            const roomName = `group_${groupId}`;

            socket.join(roomName);

            console.log(`${socket.id} joined ${roomName}`);

        });

        // Receive and broadcast a message.
        socket.on("sendMessage", async (data) => {

            try {

                // Retrieve the sender from the database.
                const sender = await User.findByPk(data.senderId);

                if (!sender) {
                    socket.emit("messageError", {
                        message: "Sender not found"
                    });
                    return;
                }

                // Save the message.
                const savedMessage = await Chat.create({
                    message: data.text,
                    GroupGroupId: data.groupId,
                    UserId: sender.id
                });

                // Construct the message with the actual username.
                const message = {
                    id: savedMessage.id,
                    senderId: sender.id,
                    senderName: sender.username,
                    text: savedMessage.message,
                    groupId: data.groupId,
                    createdAt: savedMessage.createdAt
                };

                console.log("Broadcasting message:", message);

                // Send the message to everyone in this group.
                io.to(`group_${data.groupId}`).emit(
                    "receiveMessage",
                    message
                );

            } catch (err) {

                console.error("Error sending message:", err);

                socket.emit("messageError", {
                    message: "Could not send message"
                });

            }

        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });

    });

    return io;
}

export { initializeSocket };
