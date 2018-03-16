
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var TrainPeriods = sequelize.define('TrainPeriods',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Title:{
    	type:Sequelize.STRING(30)
    },
    Seq:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CourseSectionId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    IsRelease:{
    	type:Sequelize.BOOLEAN,
    	allowNull:false
    },
    assetType:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    ResourceId:{
    	type:Sequelize.BIGINT
    },
    CreationTime:{
    	type:Sequelize.DATE,
    	allowNull:false
    },
    CreatorUserId:{
    	type:Sequelize.BIGINT
    },
    IsPreview:{
    	type:Sequelize.INTEGER('tiny'),
    	allowNull:false
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})


module.exports = TrainPeriods
