
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var ExamResult = sequelize.define('ExamResult',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    UserId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    StartDate:{
    	type:Sequelize.DATE
    },
    EndDate:{
    	type:Sequelize.DATE
    },
    Score:{
    	type:Sequelize.INTEGER
    },
    State:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    Passed:{
    	type:Sequelize.BOOLEAN
    },
    ScoreMsg:{
    	type:Sequelize.STRING
    },
    ExamId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    IsDeleted:{
        type:Sequelize.BOOLEAN,
        defaultValue:false
    },
    DeleterUserId:{
        type:Sequelize.BIGINT
    },
    DeletionTime:{
        type:Sequelize.DATE
    },
    LastModifierUserId:{
        type:Sequelize.BIGINT
    },
    LastModificationTime:{
        type:Sequelize.DATE
    },
    CreationTime:{
        type:Sequelize.DATE,
        allowNull:false,
        defaultValue:Sequelize.NOW
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = ExamResult;


