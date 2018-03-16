
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段

router.get('/AllMyQueClassify',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (decoded.UserType == 0) {
		res.send({error:1,result:{msg:'你没有权限操作使用试卷库'}})
    } else {
		routeSql.MyQueClassify.findAll({where:{CreatorUserId:decoded.Id,IsDeleted:false},attributes:['Id','Title'],order:[['CreationTime','ASC'],['Id','ASC']]}).then(function(MyQueClassify){
			res.send({error:0,result:MyQueClassify})
		})
    }
})

router.post('/createMyQueClassify',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	if (req.body.Title == '' || req.body.Title == null || req.body.Title.length > 50) {
		res.send({error:1,result:{msg:'请输入正确的名称'}})
	} else {
		routeSql.MyQueClassify.findOne({where:{CreatorUserId:decoded.Id,IsDeleted:false,Title:req.body.Title}}).then(function(data){
			if (data) {
				res.send({error:1,result:{msg:'该问题分类已经存在'}})
			} else {
				routeSql.MyQueClassify.create({CreatorUserId:decoded.Id,Title:req.body.Title}).then(function(){
					res.send({error:0,result:{msg:'问题分类创建成功'}});
				})
			}
		})
	}
})

router.post('/editMyQueClassify',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	console.log(req.body)
	if (req.body.Title == '' || req.body.Title == null || req.body.Title.length > 50) {
		res.send({error:1,result:{msg:'请输入正确的名称'}})
	} else {
		routeSql.MyQueClassify.findOne({where:{CreatorUserId:decoded.Id,IsDeleted:false,Title:req.body.Title}}).then(function(data){
			if (data) {
				res.send({error:1,result:{msg:'该问题分类已经存在'}})
			} else {
				routeSql.MyQueClassify.update({Title:req.body.Title},{where:{Id:req.body.Id}}).then(function(){
					res.send({error:0,result:{msg:'问题分类修改成功'}});
				})
			}
		})		
	}
})

router.post('/destroyMyQueClassify',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.MyQueClassify.update({IsDeleted:true},{where:{Id:req.body.Id,CreatorUserId:decoded.Id}}).then(function(){
		routeSql.MyQuestions.update({ClassifyId:null},{where:{ClassifyId:req.body.Id}}).then(function(){
			res.send({error:0,result:{msg:'问题分类删除成功'}})
		})
	})
})

module.exports = router;



