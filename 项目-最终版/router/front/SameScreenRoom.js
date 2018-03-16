
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var app = express();
var jwt = require('jwt-simple');//引入node的token生成验证包
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
app.set('jwtTokenSecret','JingGe');//设置token加密字段

router.post('/CreateScreenRoom',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	CreateNewRoom()
	function CreateNewRoom(){
		var str = Math.random().toString(36).substr(2,6);
		routeSql.SameScreenRoom.findOne({where:{RoomCode:str,IsDeleted:false}}).then(function(data){
			if (data) {
				CreateNewRoom()
			} else {
				routeSql.SameScreenRoom.create({CreatorUserId:decoded.Id,IpAddress:req.body.IpAddress,IpHost:req.body.IpHost,RoomCode:str,WifiName:req.body.WifiName}).then(function(RoomData){
					res.send({error:0,result:{IpAddress:req.body.IpAddress,IpHost:req.body.IpHost,RoomCode:str,WifiName:req.body.WifiName}})
				})
			}
		})
	}
})

router.post('/FindScreenRoom',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.SameScreenRoom.findOne({where:{RoomCode:req.body.RoomCode,IsDeleted:false}}).then(function(data){
		if (data) {
			res.send({error:0,result:{IpAddress:data.dataValues.IpAddress,IpHost:data.dataValues.IpHost,RoomCode:data.dataValues.RoomCode,WifiName:data.dataValues.WifiName}})
		} else {
			res.send({error:1,result:{msg:'该同屏房间不存在'}})
		}
	})
})

router.post('/destroyScreenRoom',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.SameScreenRoom.findOne({where:{RoomCode:req.body.RoomCode,IsDeleted:false}}).then(function(data){
		if (data) {
			if (data.dataValues.CreatorUserId == decoded.Id) {
				routeSql.SameScreenRoom.update({IsDeleted:true},{where:{Id:data.dataValues.Id}}).then(function(){
					res.send({error:0,result:{msg:'该同屏房间关闭成功'}})
				})
			} else {
				res.send({error:2,result:{msg:'你没有权限关闭该同屏房间'}})
			}
		} else {
			res.send({error:1,result:{msg:'该同屏房间不存在'}})
		}
	})
})


module.exports = router;

