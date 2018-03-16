
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var AbpUserRoles = sequelize.define('AbpUserRoles',
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    UserId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    RoleId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CreationTime:{
    	type:Sequelize.DATE,
    	allowNull:false
    },
    CreatorUserId:{
    	type:Sequelize.BIGINT
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = AbpUserRoles;
