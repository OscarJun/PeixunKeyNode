
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

router.post('/RepetName',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var reg1 = /^(?![0-9]+$)[a-zA-Z0-9]{4,20}$/
	if (req.body.UserName && !reg1.test(req.body.UserName)) {
	    res.send({error:1,result:{msg:'请输入正确的用户名称'}})
	} else {
		routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
			if (UserData.dataValues.TenantId) {
				routeSql.AbpUsers.findOne({where:{UserName:req.body.UserName,IsDeleted:false}}).then(function(UserData){
					if (UserData) {
						res.send({error:1,result:{msg:'用户名已存在'}})
					} else {
						res.send({error:0,result:{msg:'用户名不存在，可以创建'}})
					}
				})
			} else {
				res.send({error:2,result:{msg:'你没有创建用户的权限'}})
			}
		})
	}
})

router.post('/CreateMyStudent',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var data = {};
	var reg1 = /^(?![0-9]+$)[a-zA-Z0-9]{4,20}$/
	var reg2 = /^[a-zA-Z0-9]{6,20}$/
	var reg3 = /^[a-zA-Z0-9\u4e00-\u9fa5]{2,10}$/
	var reg4 = /^1[34578]\d{9}$/
	var reg5 = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/
	if (req.body.UserName && !reg1.test(req.body.UserName)) {
	    res.send({error:1,result:{msg:'请输入正确的用户名称'}})
	} else if (req.body.Password && !reg2.test(req.body.Password)) {
	    res.send({error:1,result:{msg:'请输入正确的密码格式'}})
	} else if (req.body.Name && !reg3.test(req.body.Name)) {
	    res.send({error:1,result:{msg:'请输入正确的用户名'}})
	} else if (req.body.PhoneNumber && !reg4.test(req.body.PhoneNumber)) {
		res.send({error:1,result:{msg:'请输入正确的手机号码'}})
	} else if (req.body.EmailAddress && !reg5.test(req.body.EmailAddress)) {
		res.send({error:1,result:{msg:'请输入正确的手机号码'}})
	} else {
		routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
			if (UserData.dataValues.TenantId) {
				if (parseInt(req.body.Id)) {
					routeSql.AbpUsers.update({
						Name:req.body.Name,
						IsPhoneNumberConfirmed:true,
						Password:req.body.Password,
					    // TenantId:data.TenantId,
					    PhoneNumber:req.body.PhoneNumber,
						EmailAddress:req.body.EmailAddress,
					},{where:{Id:req.body.Id}}).then(function(data){
						res.send({error:0,result:{msg:'编辑学生成功'}})
					})
				} else {
					routeSql.AbpUsers.findOne({where:{UserName:req.body.UserName,IsDeleted:false}}).then(function(AbpUserData){
						if (AbpUserData) {
							res.send({error:1,result:{msg:'该用户名称已被注册'}})
						} else {
							routeSql.AbpUsers.create({
								UserName:req.body.UserName,
								Name:req.body.Name,
								IsPhoneNumberConfirmed:true,
								Password:req.body.Password,
							    TenantId:1,
							    PhoneNumber:req.body.PhoneNumber,
								EmailAddress:req.body.EmailAddress,
								IsEmailConfirmed:true,
								IsFoldUp:false,
								IsDeleted:false,
								CreationTime:new Date(),
								UserType:0,
								ClassName:UserData.dataValues.UserName,
								CreatorUserId:decoded.Id
							}).then(function(data){
								res.send({error:0,result:{msg:'学生创建成功'}})
							})
						}
					})
				}
			} else {
				res.send({error:2,result:{msg:'你没有创建用户的权限'}})
			}
		})
	}

})

router.post('/FindMyStudent',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
		if (UserData.dataValues.TenantId) {
			routeSql.AbpUsers.findAll({where:{ClassName:UserData.dataValues.UserName,IsDeleted:false},attributes:['Id','UserName','Name','Password','PhoneNumber','EmailAddress',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}).then(function(data){
				res.send({error:0,result:data})
			})
		} else {
			res.send({error:2,result:{msg:'你没有创建并查看用户的权限'}})
		}
	})
})

router.post('/destroyMyStudent',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
		if (UserData.dataValues.TenantId) {
			routeSql.AbpUsers.update({IsDeleted:true},{where:{Id:req.body.Id,IsDeleted:false,ClassName:UserData.dataValues.UserName}}).then(function(){
				res.send({error:0,result:{msg:'学生删除成功'}})
			})
		} else {
			res.send({error:2,result:{msg:'你没有查看并删除用户的权限'}})
		}
	})
})


module.exports = router;

