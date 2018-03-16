
var Sequelize = require('sequelize');
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var mssql = require('mssql');

var sequelize = new Sequelize(
		Ipconfig.Sql.SqlName,//数据库名称
		Ipconfig.Sql.SqlUserName,//数据库用户名
		Ipconfig.Sql.SqlPassword,//数据库密码 Password1
		{
			dialect:'mssql',//数据库链接使用的包
			host:Ipconfig.Sql.SqlIpHost,//数据库网址192.168.50.179
			port:Ipconfig.Sql.SqlIpPort,//数据库端口号
			quoteIdentifiers:true,
			pool:{
				min:0,
				max:50,
				idleTimeoutMillis:3000
			}//数据库连接池
		}
);

sequelize.authenticate().then(function (err) {
	if (err) {
		console.log(err);
	} else {
		console.log('数据库连接成功');
	}
});//判断数据库是否链接成功

module.exports = sequelize;
