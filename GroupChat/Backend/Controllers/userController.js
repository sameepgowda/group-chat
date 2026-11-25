import {User} from "../Database/indexDb.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { PersonalChat } from "../Database/personalChatDb.js";

dotenv.config();

const signUp = async (req,res,next) => {
    const {email,phoneNumber,password,username} = req.body;
    if(!email || !phoneNumber || !password || !username){
        return res.status(400).json({Message:"Bad request"});
    }
    try{
        const hashedPassword = await bcrypt.hash(password,10);
        await User.create({
            email,phoneNumber,username,password:hashedPassword
        });
        return res.status(201).json({Message:"User created successfully"});
    }catch(err){
        next(err);
    }
}

const login = async (req,res,next) => {
    const password = req.body.password;
    const userInfo = req.body.phoneNumber?req.body.phoneNumber:req.body.email;
    if(!userInfo || !password){
        return res.status(400).json({Message:"Bad request"});
    }
    try{
        let user = null;
        if(req.body.phoneNumber){
            user = await User.findOne({where:{phoneNumber:req.body.phoneNumber},raw:true});
        }else{
            user = await User.findOne({where:{email:req.body.email},raw:true});
        }
        if(!user){
            return res.status(404).json({Message:"User not found"});
        }
        const isValidUser = await bcrypt.compare(password,user.password);
        if (isValidUser) {
                  const token = jwt.sign({ UserId: user.id }, process.env.JWT_KEY, {
                    expiresIn: "1h",
                  });
                  res.cookie("token", token, {
                    httpOnly: true,
                    maxAge: 60 * 60 * 1000,
                  });
                  return res.status(200).json({
                    message: "Login successful",
                    success: true,
                    UserId:user.id
                  });
                } else {
                  return res
                    .status(401)
                    .json({ message: "User not authorized", success: false });
                }
    }catch(err){
        next(err);
    }
}

const fetchUsers = async (req,res,next) => {
    const email = (req.body.email || "").trim();


  try {
    const users = await User.findAll({
      where: {
        email: { [Op.like]: `${email}%` },   // prefix match
        id: { [Op.ne]: req.UserId },          // exclude yourself
      },
      attributes: ["id", "username"],   // never return passwords etc.
      limit: 10,
      raw:true
    });

    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

const fetchExistingUsers = async (req,res,next)=> {
    try{
        console.log("BLAH BLAH",req.UserId)
const existing_messages = await PersonalChat.findAll({where:{[Op.or]:[{senderId:req.UserId},{receiverId:req.UserId}]},raw:true});
console.log(existing_messages);
    const existing_users = existing_messages.map((val)=>val.senderId==req.UserId?val.receiverId:val.senderId);
   
    let userList = [];
    if(existing_users.length>0) {
        userList = await User.findAll({
    where: {
        [Op.and]: [
            {
                id: {
                    [Op.in]: existing_users
                }
            },
            {
                id: {
                    [Op.ne]: req.UserId
                }
            }
        ]
    },
    raw: true,
    attributes: ["id", "username"]
});
    }
         console.log(userList)
    res.status(200).json({userList});
    }catch(err){
        next(err);
    }
    
}


export default {signUp, login, fetchUsers, fetchExistingUsers};