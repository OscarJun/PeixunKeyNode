
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var TrainPeriodRecords = sequelize.define('TrainPeriodRecords',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    UserId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    PeriodId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    Status:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    ProgressTime:{
    	type:Sequelize.INTEGER
    },
    CourseId:{
        type:Sequelize.INTEGER,
        allowNull:false
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = TrainPeriodRecords
