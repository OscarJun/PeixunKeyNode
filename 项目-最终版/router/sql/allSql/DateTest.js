

var Sequelize = require('sequelize');
var sequelize = require('../sqlConnect.js')

var DateTest = sequelize.define('DateTest',//定义model名称
{
id: {
  type: Sequelize.INTEGER,
  primaryKey: true,
  autoIncrement: true
},
TenantId:{
  type:Sequelize.INTEGER
},
DeleterUserId:{
  type:Sequelize.BIGINT
},

CreationTime:{
  type: 'TIMESTAMP',
  // defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  allowNull: false
},
CreatorUserId:{
  type:Sequelize.BIGINT
}
},//定义model里面属性及属性存储格式
{
timestamps:false,//不增加 TIMESTAMP 属性  (updatedAt, createdAt)
freezeTableName:true//Model 对应的表名将与model名相同
});


module.exports = DateTest;
