import { sequelize } from "./db.js";
import { DataTypes } from "sequelize";

const Group = sequelize.define("Group",{
    groupId:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
    },
    groupName:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

export {Group};
