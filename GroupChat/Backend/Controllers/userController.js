import {User} from "../Database/indexDb.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

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
                    success: true
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

export default {signUp,login};