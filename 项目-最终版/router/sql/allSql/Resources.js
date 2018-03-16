
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var Resources = sequelize.define('Resources',//定义model名称
{
    Id:{
    	type:Sequelize.BIGINT,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    FileName:{
    	type:Sequelize.STRING,
    	allowNull:false
    },
    FileExtension:{
    	type:Sequelize.STRING
    },
    FileCategory:{
    	type:Sequelize.INTEGER
    },
    FileUrl:{
    	type:Sequelize.STRING(1024),
    	allowNull:false
    },
    FileSize:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    FileHashCode:{
    	type:Sequelize.STRING(256)
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
    },
    LastModifierUserId:{
        type:Sequelize.BIGINT
    },
    LastModificationTime:{
        type:Sequelize.DATE
    },
    CreatorUserId:{
        type:Sequelize.BIGINT
    },
    CreationTime:{
        type:Sequelize.DATE,
        allowNull:false,
        defaultValue:Sequelize.NOW
    },
    PdfFileUrl:{
        type:Sequelize.STRING(1024)
    }
},//定义model里面属性及属性存储格式
{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
});

module.exports = Resources;


