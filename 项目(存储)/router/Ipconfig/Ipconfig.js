
var express = require('express');
var router = express.Router();
var app = express();
var http = require('http')
var request = require('request')

os = require('os');  
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
		SqlName:'PeiXunTYuJun',//数据库名称
		SqlUserName:'sa',//数据库用户名
		SqlPassword:'Password1',//数据库密码 Password1
		SqlIpHost:'192.168.50.179',
		SqlIpPort:1433,
	},
	Local:{
		LocalIpHost:'http://192.168.31.70',
		LocalIpPort:9801
	},
	RunServer:{
		RunServerIpHost:'http://192.168.31.70',
		LocalIpPort:9800
	},
	InSertIp:{
		InSertIpHost:'http://192.168.31.70',
		InSertIpPort:9801
	}
}

module.exports = {Host,ip,Ipconfig}


