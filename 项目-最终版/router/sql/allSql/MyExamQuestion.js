
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var MyExamQuestion = sequelize.define('MyExamQuestion',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    QuestionId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    MyExamBaseId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    ShowOrder:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    ScoreValue:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    Pattern:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = MyExamQuestion;


