import { sequelize } from "./db.js";
import { DataTypes } from "sequelize";


const Chat = sequelize.define("Chat",{
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  message:{
    type:DataTypes.STRING,
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

const ArchivedChat = sequelize.define("ArchivedChat",{
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  message:{
    type:DataTypes.STRING,
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

export {Chat, ArchivedChat};