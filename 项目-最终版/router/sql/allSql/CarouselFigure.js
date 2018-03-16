
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var CarouselFigure = sequelize.define('CarouselFigure',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Link:{
    	type:Sequelize.STRING("MAX")
    },
    Queue:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    CarouselFigureType:{
    	type:Sequelize.INTEGER
    },
    LinkId:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    },
    FileUrl:{
    	type:Sequelize.STRING("MAX")
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})
;;

module.exports = CarouselFigure;
