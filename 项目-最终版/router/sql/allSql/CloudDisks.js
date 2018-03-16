
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var CloudDisks = sequelize.define('CloudDisks',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Name:{
    	type:Sequelize.STRING
    },
    Size:{
    	type:Sequelize.BIGINT
    },
    UsedSize:{
    	type:Sequelize.BIGINT
    },
    CreatorUserId:{
        type:Sequelize.BIGINT,
        allowNull:false
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

module.exports = CloudDisks;


