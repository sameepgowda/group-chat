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
  },
   mediaType:{
      type:DataTypes.STRING,
      allowNull:true,
      defaultValue:null
    },
    mediaKey:{
      type:DataTypes.TEXT,
      allowNull:true,
      defaultValue:null
    }
})

const ArchivedPersonalChat = sequelize.define("ArchivedPersonalChat",{
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
  },
   mediaType:{
      type:DataTypes.STRING,
      allowNull:true,
      defaultValue:null
    },
    mediaKey:{
      type:DataTypes.TEXT,
      allowNull:true,
      defaultValue:null
    }
})

export {PersonalChat, ArchivedPersonalChat};