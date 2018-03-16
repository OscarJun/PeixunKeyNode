
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var Labels = sequelize.define('Labels',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Name:{
    	type:Sequelize.STRING("MAX")
    },
    FatherId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    Type:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    DeleterUserId:{
    	type:Sequelize.BIGINT
    },
    DeletionTime:{
    	type:Sequelize.DATE
    },
    IsDeleted:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    TenantId:{
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


module.exports = Labels;
