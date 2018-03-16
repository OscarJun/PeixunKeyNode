
var express = require('express');
var router = express.Router();
var fs = require('fs')
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var cookie = require('cookie-parser')
var app = express();
app.use(cookie())
app.set('jwtTokenSecret','JingGe');//设置token加密字段

router.get('/Questionnaires',function(req,res){
	var Id = req.query.QuestionnairesId
	routeSql.Questionnaires.findOne({where:{Id:Id}}).then(function(QuesData){
		if (QuesData) {
			routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:Id},order:[['Index','ASC']]}).then(function(data){
				// data.dataValue.QuesTitle = QuesData.dataValues.Title
				res.send({error:0,result:{data:data,QuesTitle:QuesData.dataValues.Title}})
			})
		} else {
			res.send({error:1,result:{msg:'当前问卷已不存在'}})
		}
		// console.log(QuesData.dataValue)
	})
})

router.post('/SubmitQuestionnaires',function(req,res){
	// console.log(req.headers)
	if (req.cookies[req.body.QuestionnairesId] == 'Questionnaires' + req.body.QuestionnairesId) {
		res.send({error:1,result:{msg:'你已经提交过了，不能再次提交'}})
	} else {
		// console.log(req.body)
		res.cookie(req.body.QuestionnairesId,'Questionnaires' + req.body.QuestionnairesId)
		routeSql.Questionnaires.findOne({where:{Id:req.body.QuestionnairesId}}).then(function(QuestionnairesData){
			Submit(req.body.Questionnaires)
			function Submit(Questionnaires){
				var Result = Questionnaires.shift()
				if (Result) {
					// console.log(Result.QuestionId)
					routeSql.QuestionnaireResults.findOne({where:{QuestionSurveiesId:Result.QuestionId}}).then(function(ResultData){
						var data = {}
						// console.log(Result.Choose)
						switch(Result.Choose){
							case 'A':
							data = {CountA:ResultData.dataValues.CountA + 1}
							break;
							case 'B':
							data = {CountB:ResultData.dataValues.CountB + 1}
							break;
							case 'C':
							data = {CountC:ResultData.dataValues.CountC + 1}
							break;
							case 'D':
							data = {CountD:ResultData.dataValues.CountD + 1}
							break;
							default:
						}
						routeSql.QuestionnaireResults.update(data,{where:{QuestionSurveiesId:Result.QuestionId}}).then(function(){
							Submit(Questionnaires)
						})
					})
				} else {
					// console.log(QuestionnairesData.dataValues)
					var Count = QuestionnairesData.dataValues.Count
					if (!QuestionnairesData.dataValues.Count) {Count = 0}
					routeSql.Questionnaires.update({Count:QuestionnairesData.dataValues.Count + 1},{where:{Id:req.body.QuestionnairesId}}).then(function(){
						res.send({error:0,result:{msg:'问卷提交成功'}})
					})
				}
			}
		})
	}
	// console.log(req.body)
})

router.post('/QuestionnairesReport',function(req,res) {
	// console.log(req.body)
	routeSql.Questionnaires.findOne({where:{Id:req.body.Id}}).then(function(QuesData) {
		if (QuesData) {
			routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:QuesData.dataValues.Id}}).then(function(QuesSurvArr) {
				var result = []
				findAllQuesSur(QuesSurvArr)
				function findAllQuesSur(QuesSurvArr) {
					var QuesSurData = QuesSurvArr.shift()
					if (QuesSurData) {
						routeSql.QuestionnaireResults.findOne({where:{QuestionSurveiesId:QuesSurData.dataValues.Id}}).then(function(QuesSurResultData){
							result.push({QuesSurData,QuesSurResultData})
							findAllQuesSur(QuesSurvArr)
						})
					} else {
						res.send({error:0,result:{result,QuesData}})
					}
				}
			})
		} else {
			res.send({error:1,result:{msg:'当前问卷已不存在'}})
		}
	})
})

module.exports = router;


