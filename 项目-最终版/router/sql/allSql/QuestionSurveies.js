
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var QuestionSurveies = sequelize.define('QuestionSurveies',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    QuestionnaireId:{
    	type:Sequelize.BIGINT,
    	allowNull:false
    },
    Title:{
    	type:Sequelize.STRING
    },
    OptionsA:{
    	type:Sequelize.STRING
    },
    OptionsB:{
    	type:Sequelize.STRING
    },
    OptionsC:{
    	type:Sequelize.STRING
    },
    OptionsD:{
    	type:Sequelize.STRING
    },
    Index:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    }

},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = QuestionSurveies;

