
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var PhoneValidates = sequelize.define('PhoneValidates',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    PhoneNumber:{
    	type:Sequelize.STRING(15)
    },
    ValidateCode:{
    	type:Sequelize.STRING(30)
    },
    CreationTime:{
    	type:Sequelize.DATE,
    	allowNull:false
    },
    LastModificationTime:{
    	type:Sequelize.DATE
    },
    TenantId:{
    	type:Sequelize.INTEGER
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = PhoneValidates
