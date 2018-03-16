
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

// 分类表

var TrainCourseCategories = sequelize.define('TrainCourseCategories',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Name:{
    	type:Sequelize.STRING(20)//分类名称
    },
    FatherId:{
    	type:Sequelize.INTEGER,//父级分类，默认为1
        allowNull:false,
        defaultValue:1
    },
    Credit:{
    	type:Sequelize.INTEGER//学分
    },
    DeleterUserId:{
    	type:Sequelize.BIGINT//删除者
    },
    DeletionTime:{
    	type:Sequelize.DATE//删除时间
    },
    IsDeleted:{
    	type:Sequelize.BOOLEAN,//是否删除
    	allowNull:false
    },
    CreationTime:{
    	type:Sequelize.DATE,//创建时间
    	allowNull:false
    },
    CreatorUserId:{
    	type:Sequelize.BIGINT//创建者
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = TrainCourseCategories
