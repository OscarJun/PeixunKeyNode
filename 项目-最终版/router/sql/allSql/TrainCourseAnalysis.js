
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var TrainCourseAnalysis = sequelize.define('TrainCourseAnalysis',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    StudentNum:{
    	type:Sequelize.INTEGER,//学习人数
    	allowNull:false
    },
    Rating:{
    	type:Sequelize.FLOAT,//平均评分
    	allowNull:false
    },
    RatingNum:{
    	type:Sequelize.INTEGER,//评价数
    	allowNull:false
    },
    PeriodNum:{
    	type:Sequelize.INTEGER,//课时数
    	allowNull:false
    },
    CollectNum:{
    	type:Sequelize.INTEGER,//收藏数
    	allowNull:false
    },
    ShareNum:{
    	type:Sequelize.INTEGER,//分享数
    	allowNull:false
    },
    PraiseNum:{
    	type:Sequelize.INTEGER,//点赞数
    	allowNull:false
    },
    BrowseNum:{
    	type:Sequelize.INTEGER,//浏览数
    	allowNull:false
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = TrainCourseAnalysis
