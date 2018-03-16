
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var TeachingDetail = sequelize.define('TeachingDetail',//定义model名称
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
    Type:{
    	type:Sequelize.STRING,
    	allowNull:false
    },
    ModelId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    TeachingActivityId:{
        type:Sequelize.BIGINT,
        allowNull:false
    },
    TeachingTaskId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = TeachingDetail;


