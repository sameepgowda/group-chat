import { Chat, User } from "../Database/indexDb.js";
import { PersonalChat } from "../Database/personalChatDb.js";
import { Op } from "sequelize";



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
    
    res.status(200).json({UserId:req.UserId,messages});
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
 
    
    res.status(200).json({UserId:req.UserId,messages:existing_messages});
    }catch(err){
        next(err);
    }
}


export default {storeMessage,fetchMessages, fetchPersonalMessages};