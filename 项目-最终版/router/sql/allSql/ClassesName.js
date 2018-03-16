
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var ClassesName = sequelize.define('ClassesName',//定义model名称
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    ClassesName:{
    	type:Sequelize.STRING(128),
    	allowNull:false
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});


module.exports = ClassesName;
