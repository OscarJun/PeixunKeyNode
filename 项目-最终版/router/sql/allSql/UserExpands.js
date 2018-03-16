
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var UserExpands = sequelize.define('UserExpands',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Sex:{
    	type:Sequelize.INTEGER('tiny'),
    	allowNull:false
    },
    QQ:{
    	type:Sequelize.STRING(16)
    },
    Introduction:{
    	type:Sequelize.STRING(500)
    },
    Experience:{
    	type:Sequelize.STRING("MAX")
    },
    Positional:{
    	type:Sequelize.STRING(256)
    },
    Duty:{
    	type:Sequelize.STRING(256)
    },
    IM_User:{
    	type:Sequelize.STRING("MAX")
    },
    SchoolName:{
    	type:Sequelize.STRING("MAX")
    },
    Specialty:{
    	type:Sequelize.STRING("MAX")
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = UserExpands
