
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var MyQuestionOption = sequelize.define('MyQuestionOption',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Title:{
    	type:Sequelize.STRING(128),
    	allowNull:false
    },
    ShowOrder:{
    	type:Sequelize.STRING(128),
    	allowNull:false
    },
    IsAnswer:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    QuestionId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    IsDeleted:{
        type:Sequelize.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    DeleterUserId:{
        type:Sequelize.BIGINT
    },
    DeletionTime:{
        type:Sequelize.DATE
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = MyQuestionOption;

