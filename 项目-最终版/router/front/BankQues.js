var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段


router.post('/AllBankQues',function(req,res){
	var token = req.headers.token;
	console.log('------------------------------------')
	console.log(req.body)
	var a = req.body.limit?req.body.limit:0;
	var limit = parseInt(a)
	var page = req.body.page?req.body.page:1;
	var offset = (page -1) * limit;
	var data = {}
	var msg = req.body.msg ? req.body.msg:''
	var BankQuesArr = []
	var MyQueClassify = req.body.MyQueClassify ? req.body.MyQueClassify : null;
	if (req.body.Pattern && req.body.Pattern != '') {
		data = {Title:{$like:'%' + msg + '%'},Pattern:req.body.Pattern,ClassifyId:MyQueClassify}
	} else {
		data = {Title:{$like:'%' + msg + '%'},ClassifyId:MyQueClassify}
	}
	if (!req.body.MyQueClassify) {
		delete data.ClassifyId;
	}
	// var Pattern = req.body.Pattern ? req.body.Pattern:''
	// console.log(data)
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var includeModel = [{model:routeSql.MyQuestions,as:'QuesBankQuestions',where:data,attributes:['Id','Title','Pattern','CreationTime','ClassifyId'],required:true}]
	var ordermsg = [[{model:routeSql.MyQuestions,as:'QuesBankQuestions'},'Id','DESC'],['Id']]
	routeSql.QuesBank.count({where:{CreatorUserId:decoded.Id},include:[{model:routeSql.MyQuestions,as:'QuesBankQuestions',where:data}]}).then(function(count){
		routeSql.QuesBank.findAll({where:{CreatorUserId:decoded.Id},attributes:[],include:includeModel,order:ordermsg,offset:offset,limit:limit}).then(function(AllBankQues){
			// res.send({error:0,result:AllBankQues})
			getClassify(AllBankQues)
			function getClassify(AllBankQues){
				var bankQues = AllBankQues.shift()
				if (bankQues) {
					// console.log(bankQues.QuesBankQuestions.dataValues.Id)
					routeSql.MyQueClassify.findOne({where:{Id:bankQues.QuesBankQuestions.dataValues.ClassifyId}}).then(function(ClassifyData){
						// console.log(ClassifyData)
						var ClassifyName = ''
						if (ClassifyData) {
							ClassifyName = ClassifyData.dataValues.Title
						}
						// console.log(bankQues.QuesBankQuestions.dataValues.ClassifyId)
						var data = {Id:bankQues.QuesBankQuestions.dataValues.Id,Title:bankQues.QuesBankQuestions.dataValues.Title,Pattern:bankQues.QuesBankQuestions.dataValues.Pattern,CreationTime:bankQues.QuesBankQuestions.dataValues.CreationTime,ClassifyId:bankQues.QuesBankQuestions.dataValues.ClassifyId,ClassifyName:ClassifyName}
						// console.log(data)
						BankQuesArr.push({QuesBankQuestions:data})
						getClassify(AllBankQues)
					})
				} else {
					res.send({error:0,result:{AllBankQues:BankQuesArr,count:count}})
				}
			}
		})
	})
})

router.get('/BankQuesAndOption',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token[[{model:routeSql.TrainCourses},'Title',(req.body.order.sort) ? 'ASC':'DESC']]....,[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']
	routeSql.MyQuestions.findOne({where:{Id:req.query.MyQuestionId,IsDeleted:false},order:[[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']],attributes:['Id','Title','Pattern','CreationTime','ClassifyId'],include:{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions',attributes:['Id','Title','IsAnswer'],where:{IsDeleted:false},required:false}}).then(function(data){
		routeSql.MyQueClassify.findOne({where:{Id:data.dataValues.ClassifyId}}).then(function(ClassifyData){
			var ClassifyName = ''
			if (ClassifyData) {
				ClassifyName = ClassifyData.dataValues.Title
			}
			res.send({Id:data.dataValues.Id,Title:data.dataValues.Title,Pattern:data.dataValues.Pattern,CreationTime:data.dataValues.CreationTime,ClassifyId:data.dataValues.ClassifyId,ClassifyName:ClassifyName,QuestionOptiontoMyQuestions:data.dataValues.QuestionOptiontoMyQuestions})
		})
		// res.send(data)
	})
})

router.post('/DestroyBankQues',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	if (decoded.UserType > 0) {
		routeSql.QuesBank.destroy({where:{QuestionId:req.body.QuestionId,CreatorUserId:decoded.Id}}).then(function(){
			res.send({error:0,result:{msg:'该试题从题库删除成功'}})
		})
	} else {
		res.send({error:1,result:{msg:'你没有权限操作该试题'}})
	}
})

router.post('/GroupDestroyBankQues',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	if (decoded.UserType > 0) {
		DestroyQues(req.body.QuestionArr)
	} else {
		res.send({error:1,result:{msg:'你没有权限操作该试题'}})
	}
	function DestroyQues(QuestionArr){
		var QuestionId = QuestionArr.shift()
		if (QuestionId) {
			routeSql.QuesBank.destroy({where:{QuestionId:QuestionId,CreatorUserId:decoded.Id}}).then(function(){
				DestroyQues(QuestionArr)
			})
		} else {
			res.send({error:0,result:{msg:'试题从题库删除成功'}})
		}
	}
})


router.post('/CreateNewBankQues',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	if (decoded.UserType > 0) {
		routeSql.MyQuestions.create({Title:'请输入题目',Pattern:req.body.Pattern,CreatorUserId:decoded.Id,QuesBankQuestions:[{CreatorUserId:decoded.Id}]},{include:[{model:routeSql.QuesBank,as:'QuesBankQuestions'}]}).then(function(QuesData){
			if (req.body.Pattern == 0) {
				routeSql.MyQuestionOption.create({Title:'选项一',IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
				routeSql.MyQuestionOption.create({Title:'选项二',IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
			} else if (req.body.Pattern == 1) {
				routeSql.MyQuestionOption.create({Title:'选项一',IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
				routeSql.MyQuestionOption.create({Title:'选项二',IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
				routeSql.MyQuestionOption.create({Title:'选项三',IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:3})
			} else {
				routeSql.MyQuestionOption.create({Title:'正确',IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
				routeSql.MyQuestionOption.create({Title:'错误',IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
			}
			res.send({error:0,result:{MyQuestionId:QuesData.dataValues.Id}})
		})
	} else {
		res.send({error:1,result:{msg:'你没有权限操作题库'}})
	}
})

router.post('/CreateNewBankQuesforWeb',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	console.log(req.body);
	var ShowOrder = 0
	var ClassifyId = req.body.ClassifyId ? req.body.ClassifyId:null;
	var data = {Title:req.body.Title,Pattern:req.body.pattern,ClassifyId:req.body.ClassifyId,CreatorUserId:decoded.Id,QuesBankQuestions:[{CreatorUserId:decoded.Id}]}
	if (!ClassifyId) {
		delete data.ClassifyId
	}
	if (decoded.UserType > 0) {
		if (req.body.Title.length > 0 && req.body.Title.length < 512) {
			routeSql.MyQuestions.create(data,{include:[{model:routeSql.QuesBank,as:'QuesBankQuestions'}]}).then(function(QuesData){
				CreateOption(req.body.Options,ShowOrder)
				function CreateOption(Options,ShowOrder){
					var option = Options.shift()
					if (option) {
						ShowOrder++;
						console.log()
						routeSql.MyQuestionOption.create({Title:option.Title,IsAnswer:option.IsAnswer,QuestionId:QuesData.dataValues.Id,ShowOrder:parseInt(option.ShowOrder)}).then(function(){
							CreateOption(Options,ShowOrder)
						})
					} else {
						res.send({error:0,result:{msg:'试题创建完成'}})
					}
				}
			})
		} else {
			res.send({error:1,result:{msg:'问题字数限制'}})
		}
	} else {
		res.send({error:1,result:{msg:'你没有权限操作题库'}})
	}
	// routeSql.MyQuestionOption.bulkCreate{}//创建多条数据
})

module.exports = router;



