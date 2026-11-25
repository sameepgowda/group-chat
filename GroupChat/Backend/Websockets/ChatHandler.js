import { Chat } from "../Database/chatDb.js";
import { User } from "../Database/userDb.js";
import { PersonalChat } from "../Database/personalChatDb.js";
import { Group, UserGroup } from "../Database/indexDb.js";
import { Op } from "sequelize";

// Attachments must be files that were uploaded to our own S3 bucket.
// Adjust the URL to match the one your uploadMedia route returns.
const MEDIA_TYPES = ["image/", "video/", "application/pdf"];

function isValidMedia(url, type) {
    const prefix = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

    return (
        typeof url === "string" &&
        url.startsWith(prefix) &&
        typeof type === "string" &&
        MEDIA_TYPES.some((allowed) => type.startsWith(allowed))
    );
}

function chatHandler(socket,io) {

    socket.on("joinGroup", (obj) => {
        if(obj.notification){
            socket.join(`notification_${socket.user}`)
        }
    });

        socket.on("joinGroup", (obj) => {
            if(obj.isPersonal){
    if (socket.user) {
    socket.join(`user_${socket.user}`);
  }

            const roomName = `user_${obj.groupId}`;

            socket.join(roomName);

            console.log(`${socket.id} joined ${roomName}`);
            console.log("joined room");

        }else if(!obj.notification){
        
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

                // If there is an attachment, make sure it is one of ours.
                if (data.mediaUrl && !isValidMedia(data.mediaUrl, data.mediaType)) {
                    socket.emit("messageError", {
                        message: "Invalid attachment"
                    });
                    return;
                }

                // Save the message.
                let message;
                console.log("data",data);
                if(data.groupId){
                const savedMessage = await Chat.create({
                    message: data.text,
                    mediaKey: data.mediaKey ?? null,
                    mediaType: data.mediaType ?? null,
                    GroupGroupId: data.groupId,
                    UserId: sender.id
                });
                
                // Construct the message with the actual username.
                 message = {
                    id: savedMessage.id,
                    senderId: sender.id,
                    senderName: sender.username,
                    text: savedMessage.message,
                    mediaUrl: data.mediaUrl,
                    mediaType: savedMessage.mediaType,
                    groupId: data.groupId,
                    createdAt: savedMessage.createdAt
                };
            }else{
                const savedMessage = await PersonalChat.create({message:data.text,
                    mediaKey: data.mediaKey ?? null,
                    mediaType: data.mediaType ?? null,
                    senderId:data.senderId,receiverId:data.receiverId
                })
                  message = {
                    id: savedMessage.id,
                    senderId: sender.id,
                    senderName: sender.username,
                    text: savedMessage.message,
                    mediaUrl: data.mediaUrl,
                    mediaType: savedMessage.mediaType,
                    receiverId: data.receiverId,
                    createdAt: savedMessage.createdAt
                };
            }

                console.log("Broadcasting message:", message);

                // Send the message to everyone in this group.
                if (data.groupId) {

                const userIds = await UserGroup.findAll({where:{[Op.and]:[{GroupId:data.groupId},{UserId:{[Op.ne]:sender.id}}]},include:[{model:Group,attributes:["groupName"]}],raw:true});
                    io.to(`group_${data.groupId}`).emit("receiveMessage", message);
                    console.log("GROUP",userIds);
                for(let user of userIds){
io.to(`notification_${user.UserId}`).emit("receiveNotification",{userName:sender.username,group:user["Group.groupName"]});

                }
  
} else {
  // Personal message: deliver to the receiver and back to the sender
  io.to(`user_${data.receiverId}`)
    .to(`user_${sender.id}`)
    .emit("receiveMessage", message);
    io.to(`notification_${data.receiverId}`).emit("receiveNotification",{userName:sender.username});

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