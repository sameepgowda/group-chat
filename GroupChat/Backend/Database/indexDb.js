import {User} from "./userDb.js";
import { Chat, ArchivedChat } from "./chatDb.js";
import { Group } from "./group.js";
import { PersonalChat, ArchivedPersonalChat } from "./personalChatDb.js";
import { sequelize } from "./db.js";
import { DataTypes } from "sequelize";

User.hasMany(Chat,{
});
Chat.belongsTo(User,{
}
);

Group.hasMany(Chat);
Chat.belongsTo(Group);

User.hasMany(ArchivedChat,{
});
ArchivedChat.belongsTo(User,{
}
);

Group.hasMany(ArchivedChat);
ArchivedChat.belongsTo(Group);



User.hasMany(PersonalChat, {
    foreignKey: "senderId"
    
});

PersonalChat.belongsTo(User, {
    foreignKey: "senderId"
});

User.hasMany(ArchivedPersonalChat, {
    foreignKey: "senderId"
    
});

ArchivedPersonalChat.belongsTo(User, {
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

UserGroup.belongsTo(Group, {
    foreignKey: "GroupId"
});

Group.hasMany(UserGroup, {
    foreignKey: "GroupId"
});



export {User,Chat, Group, UserGroup};
