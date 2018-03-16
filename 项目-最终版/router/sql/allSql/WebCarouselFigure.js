
var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var WebCarouselFigure = sequelize.define('WebCarouselFigure',
{
    Id:{
    	type:Sequelize.INTEGER,
    	allowNull:false,
    	primaryKey:true,
    	autoIncrement:true
    },
    Url:{
    	type:Sequelize.STRING("MAX")
    },
    Link:{
    	type:Sequelize.STRING("MAX")
    },
    Queue:{
    	type:Sequelize.INTEGER,
    	allowNull:false
    }
},{
    timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
    freezeTableName:true//Model 对应的表名将与model名相同
})
;;

module.exports = WebCarouselFigure;
