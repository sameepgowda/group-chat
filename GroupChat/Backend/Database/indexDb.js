import {User} from "./userDb.js";
import { Chat } from "./chatDb.js";
import { Group } from "./group.js";
import { PersonalChat } from "./personalChatDb.js";
import { sequelize } from "./db.js";
import { DataTypes } from "sequelize";

User.hasMany(Chat,{
});
Chat.belongsTo(User,{
}
);

Group.hasMany(Chat);
Chat.belongsTo(Group);

User.hasMany(PersonalChat, {
    foreignKey: "senderId"
    
});

PersonalChat.belongsTo(User, {
    foreignKey: "senderId"
});


const UserGroup = sequelize.define("UserGroup", {
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    GroupId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: "UserGroups",
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ["UserId", "GroupId"]
        }
    ]
});


User.belongsToMany(Group, {
    through: UserGroup,
    foreignKey: "UserId",
    otherKey: "GroupId",
    as: "groups"
});

Group.belongsToMany(User, {
    through: UserGroup,
    foreignKey: "GroupId",
    otherKey: "UserId",
    as: "members"
});



export {User,Chat, Group, UserGroup};
