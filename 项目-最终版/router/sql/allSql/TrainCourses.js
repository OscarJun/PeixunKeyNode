
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

// 课程表

var TrainCourses = sequelize.define('TrainCourses',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Title:{
    	type:Sequelize.STRING(30)//标题
    },
    Credit:{
    	type:Sequelize.INTEGER//学分
    },
    Thumb:{
    	type:Sequelize.STRING("MAX")//文件路径
    },
    IsRelease:{
    	type:Sequelize.BOOLEAN
    },
    TenantId:{
    	type:Sequelize.INTEGER
    },
    TrainCourseCategoryId:{
    	type:Sequelize.INTEGER//分类id
    },
    TrainCourseAnalysisId:{
    	type:Sequelize.INTEGER//附属内容
    },
    IsDeleted:{
    	type:Sequelize.BOOLEAN,//是否删除
    	allowNull:false
    },
    DeleterUserId:{
    	type:Sequelize.BIGINT//删除者
    },
    DeletionTime:{
    	type:Sequelize.DATE//删除时间
    },
    LastModificationTime:{
    	type:Sequelize.DATE//最后修改时间
    },
    LastModifierUserId:{
    	type:Sequelize.BIGINT//最后修改者
    },
    CreationTime:{
    	type:Sequelize.DATE,//创建时间
    	allowNull:false
    },
    CreatorUserId:{
    	type:Sequelize.BIGINT//创建者
    },
    Summary:{
    	type:Sequelize.STRING("MAX")//课程详情
    },
    ResourceId:{
    	type:Sequelize.BIGINT
    },
    IsPublic:{
        type:Sequelize.BOOLEAN,
        defaultValue:true
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = TrainCourses
