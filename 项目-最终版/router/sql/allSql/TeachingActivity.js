
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var TeachingActivity = sequelize.define('TeachingActivity',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Title:{
    	type:Sequelize.STRING,
    	allowNull:false
    },
    Desc:{
    	type:Sequelize.STRING
    },
    IsPublic:{
        type:Sequelize.BOOLEAN,
        defaultValue:false
    },
    ResourceId:{
        type:Sequelize.BIGINT
    },
    InviteCode:{
        type:Sequelize.STRING,
    },
    CodePath:{
        type:Sequelize.STRING
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
    LastModifierUserId:{
        type:Sequelize.BIGINT
    },
    LastModificationTime:{
        type:Sequelize.DATE
    },
    CreatorUserId:{
        type:Sequelize.BIGINT
    },
    CreationTime:{
        type:Sequelize.DATE,
        allowNull:false,
        defaultValue:Sequelize.NOW
    },
    Img:{
        type:Sequelize.STRING
    },
    BrowNum:{
        type:Sequelize.BIGINT,
        defaultValue:0
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = TeachingActivity;


