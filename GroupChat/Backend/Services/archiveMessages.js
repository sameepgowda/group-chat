import cron from "node-cron";
import {Chat,ArchivedChat} from "../Database/chatDb.js";
import { PersonalChat, ArchivedPersonalChat } from "../Database/personalChatDb.js";
import { sequelize } from "../Database/db.js";
import { Op } from "sequelize";

async function archiveMessages(){
cron.schedule("0 0 * * *", async () => {

    const t1 = await sequelize.transaction();

    const cutoffDate = new Date(
    Date.now() - 24 * 60 * 60 * 1000
);
    const oldMessages = await Chat.findAll({
    where: {
        createdAt: {
            [Op.lt]: cutoffDate
        }
    },
    raw: true
});

console.log("OLD",oldMessages);

try{
await ArchivedChat.bulkCreate(oldMessages,{transaction:t1});
await Chat.destroy({
    where: {
        createdAt: {
            [Op.lt]: cutoffDate
        }
    }
, transaction:t1});

await t1.commit();
}catch(err){
console.log(err);
await t1.rollback();
}

 const oldPersonalMessages = await PersonalChat.findAll({
    where: {
        createdAt: {
            [Op.lt]: cutoffDate
        }
    },
    raw: true
});

try{
    const t2 = await sequelize.transaction();
await ArchivedPersonalChat.bulkCreate(oldPersonalMessages,{transaction:t2});
await PersonalChat.destroy({
    where: {
        createdAt: {
            [Op.lt]: cutoffDate
        }
    }
, transaction:t2});

await t2.commit();
}catch(err){
console.log(err);
await t2.rollback();
}

});
}

export {archiveMessages};
