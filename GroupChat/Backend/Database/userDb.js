import { sequelize } from "./db.js";
import { DataTypes } from "sequelize";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username:{
    type:DataTypes.STRING,
    allowNull:false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber :{
    type:DataTypes.STRING,
    allowNull:false,
    unique:true
  }
});

// const ForgotPasswordRequest = sequelize.define("ForgotPasswordRequest", {
//   id: {
//     type: DataTypes.STRING,
//     unique: true,
//     allowNull: false,
//     primaryKey: true,
//   },
//   isActive: {
//     type: DataTypes.BOOLEAN,
//     allowNull: false,
//     defaultValue: false,
//   },
// });

export { User };
