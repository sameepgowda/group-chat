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
  }
})