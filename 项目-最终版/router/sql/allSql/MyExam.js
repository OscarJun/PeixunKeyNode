
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var MyExam = sequelize.define('MyExam',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Title:{
    	type:Sequelize.STRING,
    	allowNull:false
    },
    EndDate:{
        type:Sequelize.DATE,
        allowNull:false
    },
    StartDate:{
        type:Sequelize.DATE,
        allowNull:false
    },
    TimeLong:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    MyExamBaseId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    IsDeleted:{
        type:Sequelize.BOOLEAN,
        // allowNull:false,
        defaultValue:false
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = MyExam;

