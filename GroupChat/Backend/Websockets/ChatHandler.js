

import { Chat } from "../Database/chatDb.js";
import { User } from "../Database/userDb.js";
import { PersonalChat } from "../Database/personalChatDb.js";
import { parse } from "cookie";
import jwt from 'jsonwebtoken';

function chatHandler(socket,io) {

        socket.on("joinGroup", (obj) => {
            if(obj.isPersonal){
    if (socket.userId) {
    socket.join(`user_${socket.userId}`);
  }

            const roomName = `user_${obj.groupId}`;

            socket.join(roomName);

            console.log(`${socket.id} joined ${roomName}`);
            console.log("joined room");

        }else{
            

   

            const roomName = `group_${obj.groupId}`;

            socket.join(roomName);

            console.log(`${socket.id} joined ${roomName}`);
            console.log("joined room");

        }});
        


    
    

        // Receive and broadcast a message.
        socket.on("sendMessage", async (data) => {

            try {
                console.log("DATA",data);

                // Retrieve the sender from the database.
                const sender = await User.findByPk(data.senderId);

                if (!sender) {
                    socket.emit("messageError", {
                        message: "Sender not found"
                    });
                    return;
                }

                // Save the message.
                let message;
                console.log("data",data);
                if(data.groupId){
                const savedMessage = await Chat.create({
                    message: data.text,
                    GroupGroupId: data.groupId,
                    UserId: sender.id
                });
                
                // Construct the message with the actual username.
                 message = {
                    id: savedMessage.id,
                    senderId: sender.id,
                    senderName: sender.username,
                    text: savedMessage.message,
                    groupId: data.groupId,
                    createdAt: savedMessage.createdAt
                };
            }else{
                const savedMessage = await PersonalChat.create({message:data.text,
                    senderId:data.senderId,receiverId:data.receiverId
                })
                  message = {
                    id: savedMessage.id,
                    senderId: sender.id,
                    senderName: sender.username,
                    text: savedMessage.message,
                    receiverId: data.receiverId,
                    createdAt: savedMessage.createdAt
                };
            }

                console.log("Broadcasting message:", message);

                // Send the message to everyone in this group.
                if (data.groupId) {
  io.to(`group_${data.groupId}`).emit("receiveMessage", message);
} else {
  // Personal message: deliver to the receiver and back to the sender
  io.to(`user_${data.receiverId}`)
    .to(`user_${sender.id}`)
    .emit("receiveMessage", message);
}

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


   
}

export { chatHandler };
