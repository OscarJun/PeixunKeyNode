
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var ExamResultRecord = sequelize.define('ExamResultRecord',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    QuestionOptionId:{
        type:Sequelize.STRING,
        allowNull:false
    },
    QuestionId:{
        type:Sequelize.BIGINT,
        allowNull:false
    },
    ExamResultId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    TrueOrFalse:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = ExamResultRecord;


