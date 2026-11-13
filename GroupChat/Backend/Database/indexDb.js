import {User} from "./userDb.js";
import { Chat } from "./chatDb.js";

User.hasMany(Chat);
Chat.belongsTo(User);

export {User,Chat};