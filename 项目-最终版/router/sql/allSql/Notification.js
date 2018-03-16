
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var Notification = sequelize.define('Notification',//定义model名称
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
    Type:{
    	type:Sequelize.STRING,
    	allowNull:false
    },
    ModelId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    UserId:{
        type:Sequelize.BIGINT,
        allowNull:false
    },
    Status:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    IsDeleted:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    DeletionTime:{
        type:Sequelize.DATE
    },
    CreationTime:{
        type:Sequelize.DATE,
        allowNull:false,
        defaultValue:Sequelize.NOW
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = Notification;


