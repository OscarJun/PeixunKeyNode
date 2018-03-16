
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var TrainCourseSections = sequelize.define('TrainCourseSections',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Title:{
    	type:Sequelize.STRING(20)
    },
    Seq:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CourseId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    IsRelease:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    courseType:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CreationTime:{
    	type:Sequelize.DATE,
    	allowNull:false,
        defaultValue:Sequelize.NOW
    },
    CreatorUserId:{
    	type:Sequelize.BIGINT
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = TrainCourseSections
