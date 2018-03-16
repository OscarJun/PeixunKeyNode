
var express = require('express');
var router = express.Router();
var fs = require('fs')
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var qrImage = require('qr-image')
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')

router.post('/CreateQuestionnaires',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
   	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId}}).then(function(TeachingTaskData){
		if (TeachingTaskData) {
			if (TeachingTaskData.dataValues.CreatorUserId == decoded.Id) {
				if (req.body.QuestionnairesId == 0) {
					fun1();
				} else {
					routeSql.Questionnaires.update({Title:req.body.Title},{where:{Id:req.body.QuestionnairesId}}).then(function(){
						routeSql.TeachingDetail.update({Title:req.body.Title},{where:{Type:3,ModelId:req.body.QuestionnairesId}}).then(function(DetailData){
							res.send({error:0,result:{Title:req.body.Title,Type:3,ModelId:req.body.QuestionnairesId,TeachingDetailId:DetailData.dataValues.Id}})
						})
					})
				}
				function fun1(){
					var str = Math.random().toString(36).substr(2,6);
					routeSql.Questionnaires.findOne({where:{Code:str}}).then(function(QuestionnairesData){
						if (QuestionnairesData) {
							fun1()
						} else {
							routeSql.Questionnaires.create({Title:req.body.Title,Code:str,CreatorUserId:decoded.Id}).then(function(data){
								var sData = {Info:{id:data.dataValues.Id,QuesCode:data.dataValues.Code},Command:2,uid:null}
								var s = new Buffer(JSON.stringify(sData)).toString('base64')
								if (!fs.existsSync('./www/Ques')) {fs.mkdirSync('./www/Ques')}
								var tempQrcode = qrImage.image(Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/SharePages/Questionnaires.html?jsonstr=' + s,{type:'png'})
								var imgName = `${data.dataValues.Code}.png`
								tempQrcode.pipe(fs.createWriteStream('./www/Ques/' + imgName))
								routeSql.Questionnaires.update({CodePath:'/Ques/' + data.dataValues.Code + '.png'},{where:{Id:data.dataValues.Id}}).then(function(QuesData){
									routeSql.TeachingDetail.create({Title:req.body.Title,Type:3,ModelId:data.dataValues.Id,TeachingTaskId:req.body.TeachingTaskId,TeachingActivityId:req.body.ActivityId}).then(function(DetailData){
										res.send({error:0,result:{Title:DetailData.dataValues.Title,Type:DetailData.dataValues.Type,ModelId:DetailData.dataValues.ModelId,CodePath:CodePathIp + '/Ques/' + data.dataValues.Code + '.png',TeachingDetailId:DetailData.dataValues.Id}})
									})
								})
							})
						}
					})
				}
				
			} else {
				res.send({error:1,result:{msg:'你没有权限往该任务添加问卷'}})
			}
		} else {
			res.send({error:2,result:{msg:'该任务不存在'}})
		}
	})
})

router.post('/CreateQuestionSurveies',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.Questionnaires.findOne({where:{Id:req.body.QuestionnaireId}}).then(function(QuestionnaireData){
		if (QuestionnaireData) {
			if (QuestionnaireData.dataValues.CreatorUserId == decoded.Id) {
				createSurveies(req.body.Surveies)
				function createSurveies(Surveies){
					var Surve = Surveies.shift()
					if (Surve) {
						routeSql.QuestionSurveies.max(['Index'],{where:{QuestionnaireId:req.body.QuestionnaireId}}).then(function(MaxIndex){
							var Index = 0;
							if (MaxIndex) {Index = MaxIndex}
							routeSql.QuestionSurveies.create({QuestionnaireId:req.body.QuestionnaireId,Title:Surve.Title,Index:Index + 1,OptionsA:Surve.OptionsA,OptionsB:Surve.OptionsB,OptionsC:Surve.OptionsC,OptionsD:Surve.OptionsD}).then(function(SurveiesData){
								// console.log(SurveiesData.dataValues)
								routeSql.QuestionnaireResults.create({QuestionSurveiesId:SurveiesData.dataValues.Id,CountA:0,CountB:0,CountC:0,CountD:0}).then(function(){
									createSurveies(Surveies)
								})
							})
						})
					} else {
						res.send({error:0,result:{msg:'问卷试题创建成功'}})
					}
				}
			} else {
				res.send({error:1,result:{msg:'你没有权限往该问卷添加问题'}})
			}
		} else {
			res.send({error:2,result:{msg:'该问卷不存在'}})
		}
	})
})

// router.post('/DestoryQuestionnaires',function(req,res){
// 	var token = req.headers.token;
// 	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
// 	routeSql.Questionnaires.findOne({where:{Id:req.body.QuestionnaireId}}).then(function(QuestionnaireData){
// 		if (QuestionnaireData) {
// 			routeSql.TeachingDetail.findOne({where:{ModelId:req.body.QuestionnaireId,Type:3}}).then(function(DetailData){
// 				// console.log('====')
// 				if (DetailData) {
// 					routeSql.TeachingDetail.destroy({where:{ModelId:req.body.QuestionnaireId,Type:3}}).then(function(){
// 					// routeSql.Questionnaires.destroy({where:{Id:req.body.QuestionnaireId}}).then(function(){
// 								// console.log('====')
// 						routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:req.body.QuestionnaireId}}).then(function(QuestionSurveiesArr){
// 							destroyQuestionSurveies(QuestionSurveiesArr)
// 							function destroyQuestionSurveies(QuestionSurveiesArr){
// 								var QuestionSurveiesData = QuestionSurveiesArr.shift()
// 								if (QuestionSurveiesData) {
// 									routeSql.QuestionnaireResults.destroy({where:{QuestionSurveiesId:QuestionSurveiesData.dataValues.Id}}).then(function(){
// 										routeSql.QuestionSurveies.destroy({where:{Id:QuestionSurveiesData.dataValues.Id}})
// 										destroyQuestionSurveies(QuestionSurveiesArr)
// 									})
// 								} else {
// 									routeSql.Questionnaires.destroy({where:{Id:QuestionSurveiesData.dataValues.Id}}).then(function(){
// 										res.send({error:0,result:{msg:'删除成功'}})
// 									})
// 								}
// 							}
// 						})
// 					// })
// 					}).catch(function(err){
// 						res.send(err)
// 					})
// 				} else {
// 					routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:req.body.QuestionnaireId}}).then(function(QuestionSurveiesArr){
// 						destroyQuestionSurveies(QuestionSurveiesArr)
// 						function destroyQuestionSurveies(QuestionSurveiesArr){
// 							// console.log('-----------')
// 							var QuestionSurveiesData = QuestionSurveiesArr.shift()
// 							if (QuestionSurveiesData) {
// 								routeSql.QuestionnaireResults.destroy({where:{QuestionSurveiesId:QuestionSurveiesData.dataValues.Id}}).then(function(){
// 									routeSql.QuestionSurveies.destroy({where:{Id:QuestionSurveiesData.dataValues.Id}})
// 									destroyQuestionSurveies(QuestionSurveiesArr)
// 								})
// 							} else {
// 								routeSql.Questionnaires.destroy({where:{Id:req.body.QuestionnaireId}}).then(function(){
// 									res.send({error:0,result:{msg:'删除成功'}})
// 								})
// 							}
// 						}
// 					})
// 				}
// 			})
// 		} else {
// 			res.send({error:1,result:{msg:'该问卷不存在'}})
// 		}
// 	})
// })

router.get('/AllQuestionnaires',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var msg = req.query.msg ? req.query.msg:''
	var a = req.query.limit?req.query.limit:0;
	var limit = parseInt(a)
	var page = req.query.page?req.query.page:1;
	var offset = (page -1) * limit;
	var TotolCount = 0;
	if (decoded.UserType != 0) {
		routeSql.Questionnaires.count({where:{CreatorUserId:decoded.Id,Title:{$like:'%' + msg + '%'}}}).then(function(count){
			TotolCount = count;
			routeSql.Questionnaires.findAll({where:{CreatorUserId:decoded.Id,Title:{$like:'%' + msg + '%'}},offset:offset,limit:limit,order:[['CreationTime','DESC']]}).then(function(QuesArr){
				var result = []
				AllQuestionnaires(QuesArr)
				function AllQuestionnaires(QuesArr){
					var QuesData = QuesArr.shift()
					if (QuesData) {
						routeSql.TeachingDetail.findOne({where:{ModelId:QuesData.dataValues.Id,Type:3}}).then(function(DetailData){
							if (DetailData) {
								routeSql.TeachingActivity.findOne({where:{Id:DetailData.dataValues.TeachingActivityId,IsDeleted:false}}).then(function(ActivityData){
									if (ActivityData) {
										result.push({TeachingDetailId:DetailData.dataValues.Id,Title:QuesData.dataValues.Title,Count:QuesData.dataValues.Count,ActivityTitle:ActivityData.dataValues.Title,CreationTime:QuesData.dataValues.CreationTime,CodePath:CodePathIp + QuesData.dataValues.CodePath,ModelId:DetailData.dataValues.ModelId})
									}
									AllQuestionnaires(QuesArr)
								})
							} else {
								AllQuestionnaires(QuesArr)
							}
						})
					} else {
						res.send({error:0,result:result,TotolCount:TotolCount})
					}
				}
			})
		})
	} else {
		res.send({error:0,result:{msg:'你没有权限查看问卷'}})
	}
})

router.get('/AllQuestionSurveies',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.query)
	routeSql.Questionnaires.findOne({where:{Id:req.query.QuestionnairesId}}).then(function(QuestionnairesData){
		if (QuestionnairesData) {
			if (decoded.Id == QuestionnairesData.dataValues.CreatorUserId) {
				routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:QuestionnairesData.dataValues.Id},order:[['Index','ASC']],attributes:['Id','Index','Title','OptionsA','OptionsB','OptionsC','OptionsD']}).then(function(SurveiesArr){
					res.send({error:0,result:{SurveiesArr:SurveiesArr,QuesData:{Id:QuestionnairesData.dataValues.Id,Title:QuestionnairesData.dataValues.Title,Code:QuestionnairesData.dataValues.Code,CodePath:CodePathIp + QuestionnairesData.dataValues.CodePath,Count:QuestionnairesData.dataValues.Count ? QuestionnairesData.dataValues.Count:0}}})
				})
			} else {
				res.send({error:0,result:{msg:'你没有权限查看该问卷'}})
			}
		} else {
			res.send({error:1,result:{msg:'该问卷不存在'}})
		}
	})
})

router.post('/EditQuestionSurveies',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	// console.log('11111111')
	// console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
	routeSql.Questionnaires.findOne({where:{Id:req.body.QuestionnaireId}}).then(function(QuesData){
		if (QuesData.dataValues.CreatorUserId == decoded.Id) {
			// console.log(req.body.destroySurveiesArr)
			// console.log('-----')
			upDate(req.body.destroySurveiesArr)
		} else {
			res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
		}
	})
	function upDate(destroySurveiesArr){
		if (destroySurveiesArr) {
			var destroySurveiesData = destroySurveiesArr.shift()
			if (destroySurveiesData) {
				routeSql.QuestionSurveies.findOne({where:{QuestionnaireId:req.body.QuestionnaireId,Id:destroySurveiesData}}).then(function(IndexData){
					var Index = IndexData.dataValues.Index;
					routeSql.QuestionnaireResults.destroy({where:{QuestionSurveiesId:destroySurveiesData}}).then(function(){
						routeSql.QuestionSurveies.destroy({where:{QuestionnaireId:req.body.QuestionnaireId,Id:destroySurveiesData}}).then(function(){
							routeSql.QuestionSurveies.findAll({where:{Index:{$gt:Index},QuestionnaireId:req.body.QuestionnaireId}}).then(function(IndexArr){
								DecreaseIndex(IndexArr)
								function DecreaseIndex(IndexArr){
									var DecreaseData = IndexArr.shift()
									if (DecreaseData) {
										routeSql.QuestionSurveies.update({Index:DecreaseData.dataValues.Index - 1},{where:{Id:DecreaseData.dataValues.Id}}).then(function(){
											DecreaseIndex(IndexArr)
										})
									} else {
										upDate(destroySurveiesArr)
									}
								}
							})
						// console.log(destroySurveiesData)
							// console.log('11111111')
						})
					})
				})
			} else {
				upDateSurveies(req.body.upDateSurveiesArr)
			}
		} else {
			upDateSurveies(req.body.upDateSurveiesArr)
		}
		// })
	}
	function upDateSurveies(SurveiesArr){
		var SurveiesData = SurveiesArr.shift()
		if (SurveiesData) {
			routeSql.QuestionSurveies.max(['Index'],{where:{QuestionnaireId:req.body.QuestionnaireId}}).then(function(MaxIndex){
				var Index = 0;
				if (MaxIndex) {Index = MaxIndex}
				if (SurveiesData.SurveiesId == 0) {
						routeSql.QuestionSurveies.create({QuestionnaireId:req.body.QuestionnaireId,Title:SurveiesData.Title,Index:Index + 1,OptionsA:SurveiesData.OptionsA,OptionsB:SurveiesData.OptionsB,OptionsC:SurveiesData.OptionsC,OptionsD:SurveiesData.OptionsD}).then(function(SurveiesData){
							routeSql.QuestionnaireResults.create({QuestionSurveiesId:SurveiesData.dataValues.Id,CountA:0,CountB:0,CountC:0,CountD:0}).then(function(){
								upDateSurveies(SurveiesArr)
							})
						})
				} else {
						routeSql.QuestionSurveies.update({Title:SurveiesData.Title,OptionsA:SurveiesData.OptionsA,OptionsB:SurveiesData.OptionsB,OptionsC:SurveiesData.OptionsC,OptionsD:SurveiesData.OptionsD},{where:{Id:SurveiesData.SurveiesId}}).then(function(){
							upDateSurveies(SurveiesArr)
						})
				}
			})
		} else {
			res.send({error:0,result:{msg:'编辑成功'}})
		}
	}
})

module.exports = router;




