
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var TCourseRecords = sequelize.define('TCourseRecords',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    UserId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    TrainCourseId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    Mark:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CreditScore:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CompletedPeriodCount:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    TotalPeriodCount:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = TCourseRecords
