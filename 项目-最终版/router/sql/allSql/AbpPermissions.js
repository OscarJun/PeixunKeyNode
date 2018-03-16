
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var AbpPermissions = sequelize.define('AbpPermissions',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Name:{
    	type:Sequelize.STRING(128),
    	allowNull:false
    },
    IsGranted:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    CreationTime:{
    	type:Sequelize.DATE,
    	allowNull:false
    },
    CreatorUserId:{
    	type:Sequelize.BIGINT
    },
    UserId:{
    	type:Sequelize.BIGINT
    },
    RoleId:{
    	type:Sequelize.INTEGER
    },
    Discriminator:{
    	type:Sequelize.STRING(128),
    	allowNull:false
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});


module.exports = AbpPermissions;
