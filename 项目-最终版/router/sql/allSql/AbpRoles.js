
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var AbpRoles = sequelize.define('AbpRoles',//定义model名称
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    DisplayName:{
    	type:Sequelize.STRING(64),
    	allowNull:false
    },
    IsStatic:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    IsDefault:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    TenantId:{
    	type:Sequelize.INTEGER
    },
    Name:{
    	type:Sequelize.STRING(32),
    	allowNull:false
    },
    IsDeleted:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    DeleterUserId:{
    	type:Sequelize.BIGINT
    },
    DeletionTime:{
    	type:Sequelize.DATE
    },
    LastModificationTime:{
    	type:Sequelize.DATE
    },
    LastModifierUserId:{
    	type:Sequelize.BIGINT
    },
    CreationTime:{
    	type:Sequelize.DATE,
    	allowNull:false
    },
    CreatorUserId:{
    	type:Sequelize.BIGINT
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});


module.exports = AbpRoles;
