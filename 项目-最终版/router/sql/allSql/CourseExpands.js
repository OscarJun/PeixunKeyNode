
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var CourseExpands = sequelize.define('CourseExpands',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Price:{
    	type:Sequelize.FLOAT,
    	allowNull:false
    },
    SellingPrice:{
    	type:Sequelize.FLOAT,
    	allowNull:false
    },
    PayType:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CourseId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    TrainCourseType:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = CourseExpands;
