
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var SameScreenRoom = sequelize.define('SameScreenRoom',
{
    Id:{
        type:Sequelize.BIGINT,
        allowNull:false,
        primaryKey:true,
        autoIncrement:true
    },
    IpAddress:{
        type:Sequelize.STRING(64)
    },
    IpHost:{
        type:Sequelize.STRING(32)
    },
    RoomCode:{
        type:Sequelize.STRING(16)
    },
    WifiName:{
        type:Sequelize.STRING(256)
    },
    IsDeleted:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    DeleterUserId:{
        type:Sequelize.BIGINT
    },
    DeletionTime:{
        type:Sequelize.DATE
    },
    CreationTime:{
        type:Sequelize.DATE,
        allowNull:false,
        defaultValue:Sequelize.NOW
    },
    CreatorUserId:{
        type:Sequelize.BIGINT
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = SameScreenRoom;
