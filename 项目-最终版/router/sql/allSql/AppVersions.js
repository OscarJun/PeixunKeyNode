
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var AppVersions = sequelize.define('AppVersions',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    URL:{
    	type:Sequelize.STRING(200)
    },
    Description:{
    	type:Sequelize.STRING(500)
    },
    VersionNumber:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    Version:{
    	type:Sequelize.STRING(50)
    },
    Size:{
    	type:Sequelize.STRING(50)
    },
    IsUpdate:{
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
    LastModificationTime:{
    	type:Sequelize.DATE
    },
    LastModifierUserId:{
    	type:Sequelize.BIGINT
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = AppVersions;
