
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var RecommendCourse = sequelize.define('RecommendCourse',
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
    Queue:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    Cover:{
    	type:Sequelize.STRING("MAX")
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})
;;

module.exports = RecommendCourse;
