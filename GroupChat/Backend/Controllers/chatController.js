import { Chat } from "../Database/indexDb.js";



const storeMessage = async (req , res , next) => {
    if(!req.UserId || !req.body.message){
        return res.status(400).json({message:"Bad request"});
    }
    try{
    const UserId = req.UserId;
    const message = req.body.message;
    await Chat.insert({UserId,message});
    }catch(err){
        next(err);
    }
    
}


export default {storeMessage};