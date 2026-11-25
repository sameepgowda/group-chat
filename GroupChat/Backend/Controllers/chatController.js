import { Chat, User } from "../Database/indexDb.js";
import { PersonalChat } from "../Database/personalChatDb.js";
import { Op } from "sequelize";
import { PutObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { s3 } from "../Services/s3.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import geminiAiService from "../Services/geminiAiService.js";
import { equal } from "assert";



const storeMessage = async (req , res , next) => {
    if(!req.UserId || !req.body.text){
        return res.status(400).json({message:"Bad request"});
    }
    try{
    const UserId = req.UserId;
    const message = req.body.text;
    await Chat.create({UserId,message});
    res.status(201).json({message:"Message succesfully stored"});
    }catch(err){
        next(err);
    }
    
}

const fetchMessages= async (req,res,next)=>{
    console.log("HII")
     if(!req.UserId || !req.body.groupId){
        return res.status(400).json({message:"Bad request"});
    }
    try{
    const messages = await Chat.findAll({where:{GroupGroupId:req.body.groupId},raw:true,include:[
        {model:User, attributes:["username"]}
    ]});

   let resMessages = await Promise.all(
    messages.map(async (val) => {
        const url = val.mediaKey
            ? await getSignedUrl(
                s3,
                new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: val.mediaKey
                })
            )
            : null;

        return {
            ...val,
            mediaUrl: url
        };
    })
);
    
    res.status(200).json({UserId:req.UserId,messages:resMessages});
    }catch(err){
        next(err);
    }
}

const fetchPersonalMessages= async (req,res,next)=>{
    
     if(!req.UserId || !req.body.senderId){
        return res.status(400).json({message:"Bad request"});
    }
    try{
   const existing_messages = await PersonalChat.findAll({where:{[Op.or]:[{[Op.and]:[{senderId:req.UserId},{receiverId:req.body.senderId}]},{
    [Op.and]:[{senderId:req.body.senderId},{receiverId:req.UserId}]
   }]},raw:true,include:[{model:User,attributes:["username"]}]});

 let resMessages = await Promise.all(
    existing_messages.map(async (val) => {
        const url = val.mediaKey
            ? await getSignedUrl(
                s3,
                new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: val.mediaKey
                })
            )
            : null;

        return {
            ...val,
            mediaUrl: url
        };
    })
);
    
    res.status(200).json({UserId:req.UserId,messages:resMessages});
    }catch(err){
        next(err);
    }
}



const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please select a file"
            });
        }

        const fileKey = `${req.file.originalname}/${randomUUID()}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        });

        await s3.send(command);

        const url = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileKey
            })
        );

        res.status(201).json({
            message: "File uploaded successfully",
            fileURL : url,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            key:fileKey
        });

    } catch (err) {
        next(err);
    }
};

const generateReplyUsingAI = async (req, res, next) => {

 
  if(!req.body.isPersonal){
    try{
    const messages = await Chat.findAll({where:{GroupGroupId:req.body.groupId},raw:true,
    limit: 6,
    order: [["createdAt", "DESC"]]});
    const texts = messages.map((val) => val.UserId==req.UserId?`me, ${val.message}`: val.message);
    const strigifiedTexts = JSON.stringify(texts);
    console.log(texts);
    const response = await geminiAiService.ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `These are the last 6 messages(latest first) in a group chat:${strigifiedTexts}. 
      The messages sent by the user are marked as me. 
      Suggest 3 appropriate replies separated by | after carefully considering the messages.
      Only keep the replies in your response. No additional text`,
    });
    res.status(200).json({replies:response.text});
    }catch(err){
        console.log(err);
        next(err);
    }
      
  }else{
    try{
    const messages = await PersonalChat.findAll({where:{[Op.or]:[{[Op.and]:[{senderId:req.UserId},{receiverId:req.body.senderId}]},{
    [Op.and]:[{senderId:req.body.senderId},{receiverId:req.UserId}]
   }]},raw:true, limit:6, order: [["createdAt", "DESC"]] });
   const texts = messages.map((val) => val.senderId==req.UserId?`me, ${val.message}`: val.message);
    const strigifiedTexts = JSON.stringify(texts);
    console.log(texts);
    const response = await geminiAiService.ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `These are the last 6 messages(latest first) of a one on one chat:${strigifiedTexts}. 
      The messages sent by the user are marked as me. 
      Suggest 3 appropriate replies separated by | after carefully considering the messages.
      Only keep the replies in your response. No additional text`,
    });
    res.status(200).json({replies:response.text});
    }catch(err){
        next(err);
    }
  }
  

};


export default {storeMessage,fetchMessages, fetchPersonalMessages, uploadFile, generateReplyUsingAI};