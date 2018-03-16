
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var AbpTenants = sequelize.define('AbpTenants',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    TenancyName:{
    	type:Sequelize.STRING(64),
    	allowNull:false
    },
    EditionId:{
    	type:Sequelize.INTEGER
    },
    Name:{
    	type:Sequelize.STRING(64),
    	allowNull:false
    },
    IsActive:{
    	type:Sequelize.BOOLEAN,
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
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = AbpTenants;

