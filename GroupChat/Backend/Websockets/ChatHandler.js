
import { Server } from "socket.io";
import { Chat } from "../Database/chatDb.js";
import { User } from "../Database/userDb.js";

function initializeSocket(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
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
