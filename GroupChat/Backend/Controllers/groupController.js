import {Group} from "../Database/indexDb.js";
import {User} from "../Database/indexDb.js";
import { sequelize } from "../Database/db.js";
import { UserGroup } from "../Database/indexDb.js";


const createGroup = async (req,res) => {
    if(!req.UserId || !req.body.groupName){
       return res.status(400).json({Message:"Bad request"});
    }
    try{
         const t1 = await sequelize.transaction();
         const group = await Group.create({groupName:req.body.groupName},{transaction:t1});
         const user = await User.findByPk(req.UserId);

         await user.addGroup(group,{transaction:t1});  

         await t1.commit();
         return res.status(201).json({Message:"Group created successfully"});

    }catch(err){
        await t1.rollback();
        next(err);
    }

}

const joinGroup = async (req,res) => {
    if(!req.UserId || !req.body.groupId){
       return res.status(400).json({Message:"Bad request"});
    }
    try{       
         const user = await User.findByPk(req.UserId);
         const group = await Group.findByPk(req.body.groupId);

         await user.addGroup(group);  
         return res.status(201).json({Message:"User joined successfully"});

    }catch(err){
        next(err);
    }

}

const fetchGroups = async (req,res) => {
    if(!req.UserId){
        return res.status(400).json({Message:"Bad request"});
    }
    try{
        const user = await User.findByPk(req.UserId, {
    include: [{
        model: Group,
        as: "groups",
        attributes:['groupId','groupName']

    }],
     });
     let groupArray = user.groups.map((val)=>val.dataValues);
         console.log(groupArray);
         res.status(200).json({groups:groupArray});
    }catch(err){
        next(err);
    }
}


const fetchAllGroups = async (req,res) => {
    if(!req.UserId){
        return res.status(400).json({Message:"Bad request"});
    }
    try{
       const groups = await Group.findAll({raw:true});
       const exisitingGroups = await UserGroup.findAll({where:{UserId:req.UserId},raw:true});
       let existingGroupsIds = exisitingGroups.map((val)=>val.goupId);

       let resArray = groups.filter((val)=>!existingGroupsIds.includes(val.grouId));
       
         res.status(200).json({groups:resArray})
    }catch(err){
        next(err);
    }
}


export default {createGroup,joinGroup, fetchGroups, fetchAllGroups};