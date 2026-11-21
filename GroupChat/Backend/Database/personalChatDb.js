import { sequelize } from "./db.js";
import { DataTypes } from "sequelize";


const PersonalChat = sequelize.define("PersonalChat",{
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  message:{
    type:DataTypes.STRING,
    allowNull:false
  },
  senderId:{
    type:DataTypes.INTEGER,
    allowNull:false
  },
  receiverId:{
    type:DataTypes.INTEGER,
    allowNull:false
  }
})

export {PersonalChat};