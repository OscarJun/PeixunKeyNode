
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var Collects = sequelize.define('Collects',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    CourseId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CreatorUserId:{
    	type:Sequelize.BIGINT
    },
    CreationTime:{
    	type:Sequelize.DATE,
    	allowNull:false
    },
    CourseType:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	defaultValue:1
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})
;
module.exports = Collects;
