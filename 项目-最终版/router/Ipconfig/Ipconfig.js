

var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var schedule = require('node-schedule')
var http = require('http')
var request = require('request')

var os = require('os');  
function Host() {
	console.log(os.networkInterfaces())
	request.get({url:'http://ifconfig.me/ip'},function(err,result,data) {
		console.log(data)
	})
	// console.log(os.hostname());
}
var os = require('os');
var ip = function() {
    console.log('obtain an IP address');
}

// ip.prototype.address = function() {
// var network = os.networkInterfaces();
// for (var key in network){
//     for(var i = 0; i < network[key].length; i++){
//         if(network[key][i].family === 'IPv4'){
//             logger.info(network[key][i].address);
//         }
//     }
// }}
// module.exports = ip;
// 

Ipconfig = {
	Sql:{
		SqlName:'PeiXunTYuJun',//数据库名称PeiXunTYuJun 'PeiXunKeyT'
		SqlUserName:'sa',//数据库用户名
		SqlPassword:'Password1',//数据库密码 Password1'yujun'
		SqlIpHost:'192.168.50.179',//192.168.50.179'192.168.31.68'
		SqlIpPort:1433,
	},
	Local:{
		LocalIpHost:'http://192.168.31.70',//外网ip
		// DomainName:'http://www.spzxedu.com',//域名
		LocalIpPort:9800//运行端口
	},
	SaveServer:{
		SaveServerIpHost:'http://192.168.31.70',//外网ip
		SaveServerIpPort:9801//存储端口
	},
	InSertIp:{
		InSertIpHost:'http://192.168.31.70',//内网Ip
		InSertIpPort:9801//存储端口
	},
	InSertCodePathIp:{
		InSertCodePathIpHost:'http://192.168.31.70',//内网Ip
		InSertCodePathIpPort:9800//运行端口
	}
}

module.exports = {Host,ip,Ipconfig}


