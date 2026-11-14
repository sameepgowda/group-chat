import { Chat } from "../Database/indexDb.js";

const msgs = await Chat.findAll({raw:true,order:[["createdAt","desc"]]});
console.log(msgs);

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
     if(!req.UserId){
        return res.status(400).json({message:"Bad request"});
    }
    try{
    const messages = await Chat.findAll({where:{UserId},raw:true});
    const resMessages = messages.map((val)=>{return{
        ...val,text:val.message
    }})
    res.status(200).json({messages:resMessages});
    }catch(err){
        next(err);
    }
}


export default {storeMessage,fetchMessages};