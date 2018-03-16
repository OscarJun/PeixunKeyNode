
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var schedule = require('node-schedule')
var JoinToExamResult = require('./AddExamData.js')
var Notification = require('./AddNotification.js')
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig

// JoinToExamResult()
router.post('/ReleaseExam',function(req,res){
	// console.log(req.body)
	// console.log(new Date(req.body.StartDate) + ' ' + new Date(req.body.EndDate))
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log('11111111111111111111111111111111111111')
	// console.log(req.body)
	if (new Date() < new Date(req.body.StartDate)) {
		if (new Date(DateAdd("M",5,new Date(req.body.StartDate))) < new Date(req.body.EndDate)) {
			routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId,IsDeleted:false}}).then(function(TeachingTaskData){
				if (TeachingTaskData) {
					routeSql.MyExamBase.findOne({where:{Id:req.body.MyExamBaseId}}).then(function(ExamBaseData){
						if (TeachingTaskData.dataValues.CreatorUserId == decoded.Id) {
							var ExamTitle = ExamBaseData.dataValues.Title
							if (req.body.Title) {
								ExamTitle = req.body.Title
							}
							routeSql.MyExam.create({Title:ExamTitle,StartDate:new Date(req.body.StartDate),EndDate:new Date(req.body.EndDate),TimeLong:req.body.TimeLong,MyExamBaseId:req.body.MyExamBaseId}).then(function(MyExamData){
								routeSql.TeachingDetail.create({Title:ExamTitle,Type:1,ModelId:MyExamData.dataValues.Id,TeachingTaskId:req.body.TeachingTaskId,TeachingActivityId:req.body.ActivityId}).then(function(DetailData){
									routeSql.TeachingDetail.findAll({where:{TeachingTaskId:req.body.TeachingTaskId},attributes:['Title','Type','ModelId']}).then(function(data){
										JoinToExamResult()
										Notification.Notification()
										Notification.TeacherNotification()
									    routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId},attributes:['Id','Title','Desc']}).then(function(Taskdata){
									        // console.log(Taskdata)
									        searchDetail(req.body.TeachingTaskId,res,Taskdata,decoded)
									        // JoinToExamResult()
									        // JoinToHomeWorkResult()
									    })
									})
								})
								// res.send({error:0,result:{Id:MyExamData.dataValues.Id,Title:MyExamData.dataValues.Title}})
							})
						} else {
							res.send({error:1,result:{msg:'你没有权限往该任务添加考试'}})
						}
					})
				} else {
					res.send({error:2,result:{msg:'该任务不存在'}})
				}
				// console.log(decoded)
				// console.log(TeachingTaskData.dataValues.CreatorUserId)
			})
		} else {
			res.send({error:3,result:{msg:'结束时间必须大于开始时间5分钟'}})
		}
	} else {
		res.send({error:3,result:{msg:'开始时间必须大于当前时间'}})
	}
	// res.send('请求成功')
})

router.post('/EditMyExam',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log('11111111111111111111111')
	// console.log(req.body)
	routeSql.TeachingDetail.findOne({where:{ModelId:req.body.ModelId,Type:1}}).then(function(DetailData){
		// console.log(DetailData)
		routeSql.TeachingTask.findOne({where:{Id:DetailData.dataValues.TeachingTaskId}}).then(function(TaskData){
			if (TaskData.dataValues.CreatorUserId == decoded.Id) {
				routeSql.MyExam.findOne({where:{Id:req.body.ModelId}}).then(function(ExamData){
					if (new Date() > new Date(ExamData.dataValues.StartDate)) {
						res.send({error:2,result:{msg:'考试已经开始，不能再编辑考试了'}})
					} else {
						if (new Date() < new Date(req.body.StartDate)) {
							if (new Date(DateAdd("M",5,new Date(req.body.StartDate))) < new Date(req.body.EndDate)) {
								routeSql.MyExam.update({Title:req.body.Title,StartDate:new Date(req.body.StartDate),EndDate:new Date(req.body.EndDate),TimeLong:req.body.TimeLong},{where:{Id:req.body.ModelId}}).then(function(){
									routeSql.TeachingDetail.update({Title:req.body.Title},{where:{ModelId:req.body.ModelId,Type:1}}).then(function(){
										routeSql.TeachingDetail.findAll({where:{TeachingTaskId:DetailData.dataValues.TeachingTaskId},attributes:['Title','Type','ModelId']}).then(function(data){
											JoinToExamResult()
											Notification.upDateExamNotification(req.body.ModelId)
											Notification.TeacherNotification()
										    routeSql.TeachingTask.findOne({where:{Id:DetailData.dataValues.TeachingTaskId},attributes:['Id','Title','Desc']}).then(function(Taskdata){
										        // console.log(data)
										        searchDetail(req.body.TeachingTaskId,res,Taskdata,decoded)
										        // JoinToExamResult()
										        // JoinToHomeWorkResult()
										    })
										})
									})
								})
							} else {
								res.send({error:3,result:{msg:'结束时间必须大于开始时间5分钟'}})
							}
						} else {
							res.send({error:3,result:{msg:'开始时间必须大于当前时间'}})
						}
					}
				})
			} else {
				res.send({error:1,result:{msg:'你没有权限编辑考试'}})
			}
		})
	})
})

router.post('/JoinExam',function(req,res){
	console.log('11111111111111111111111111111111111111111111')
	console.log(req.body)
	console.log('11111111111111111111111111111111111111111111')
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var result = {}
	if (decoded.UserType == 0) {
		routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(MyExamData){
			routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:req.body.ExamId}}).then(function(ExamResultData){
				if (ExamResultData) {
					routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(MyExamData){
						if (new Date(MyExamData.dataValues.EndDate) > new Date()) {
							if (ExamResultData.dataValues.State == 1 || Date(ExamResultData.dataValues.EndDate) < new Date()) {
								res.send({error:4,result:{msg:'你的考试已经结束，不能在参加考试了'}})
							} else {
					    		routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId},attributes:['Id','Title','CountScore','PassScore']}).then(function(ExamData){
					    			result.ExamData = ExamData.dataValues
									routeSql.MyExamQuestion.count({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:0}}).then(function(SingleCount){
										result.ExamData.SingleCount = SingleCount
									})
									routeSql.MyExamQuestion.count({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:1}}).then(function(MultipleCount){
										result.ExamData.MultipleCount = MultipleCount
									})
									routeSql.MyExamQuestion.count({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:2}}).then(function(JudgeCount){
										result.ExamData.JudgeCount = JudgeCount
									})
									routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:0}}).then(function(SingleData){
										if (SingleData) {
											result.ExamData.SingleScoreValue = SingleData.dataValues.ScoreValue
										} else {
											result.ExamData.SingleScoreValue = 0;
										}
									})
									routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:1}}).then(function(SingleData){
										if (SingleData) {
											result.ExamData.MultipleScoreValue = SingleData.dataValues.ScoreValue
										} else {
											result.ExamData.MultipleScoreValue = 0;
										}
									})
									routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:2}}).then(function(SingleData){
										if (SingleData) {
											result.ExamData.JudgeScoreValue = SingleData.dataValues.ScoreValue
										} else {
											result.ExamData.JudgeScoreValue = 0;
										}
									})
									routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamData.dataValues.Id}}).then(function(QuestionCount){
										result.QuestionCount = QuestionCount;
							    		routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:ExamData.dataValues.Id},attributes:['ScoreValue','Pattern'],
							    			order:[['ShowOrder','ASC'],[{model:routeSql.MyQuestions,as:'ExamQuestionofMyQuestions'},{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']],
							    			include:[{model:routeSql.MyQuestions,as:'ExamQuestionofMyQuestions',attributes:['Id','Title'],where:{IsDeleted:false},required:false,include:[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions',attributes:['Id','Title'],where:{IsDeleted:false},required:false}]}]}).then(function(QuesAndOption){
						    				result.QuesAndOption = QuesAndOption
						    				// res.send({error:0,result:result})
						    				if (!ExamResultData.StartDate) {
						    					var nowDate = new Date()
						    					// console.log(nowDate)
						    					var TimeLong = MyExamData.dataValues.TimeLong
						    					var EndDate = DateAdd("M",TimeLong,nowDate)
						    					// console.log(EndDate)
						    					if (EndDate > MyExamData.dataValues.EndDate) {
						    						EndDate = MyExamData.dataValues.EndDate
						    					}
						    					var SubmitEndDate = EndDate;
						    					// EndDate = DateAdd("M",1,EndDate)
						    					// console.log(EndDate)
						    					// console.log('++++++++++++')
						    					routeSql.ExamResult.update({StartDate:new Date(),EndDate:SubmitEndDate},{where:{Id:ExamResultData.dataValues.Id}}).then(function(){
						    						result.LastTimeLong = parseInt((Date.parse(SubmitEndDate) - Date.parse(new Date()))/1000)
						    						res.send({error:0,result:result})
						    					})
						    				}else{
						    					var nowDate = new Date()
						    					// console.log(nowDate)
						    					var TimeLong = MyExamData.dataValues.TimeLong
						    					var EndDate = DateAdd("M",TimeLong,nowDate)
						    					// console.log(EndDate)
						    					if (MyExamData.dataValues.EndDate) {
						    						EndDate = MyExamData.dataValues.EndDate
						    					}
						    					// var SubmitEndDate = EndDate;
						    					// console.log(EndDate)
						    					// console.log(Date.parse(EndDate))
						    					// console.log(Date.parse(new Date()))
						    					result.LastTimeLong = parseInt((Date.parse(EndDate) - new Date().getTime())/1000)
						    					// console.log(result.LastTimeLong)
						    					res.send({error:0,result:result})
						    				}
										})
									})
					    		})
							}
						} else {
							res.send({error:3,result:{msg:'考试时间已经过去，你不能再参加考试了'}})
						}
					})
				} else {
					res.send({error:2,result:{msg:'考试还没有开始',result}})
				}
			})
		})
	} else {
		routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(MyExamData){
			routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId}}).then(function(EData){
				if (decoded.Id == EData.dataValues.CreatorUserId) {
		    		routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId},attributes:['Id','Title','CountScore','PassScore']}).then(function(ExamData){
		    			// console.log(ExamData.dataValues)
		    			result.ExamData = ExamData.dataValues
						routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamData.dataValues.Id}}).then(function(QuestionCount){
							result.QuestionCount = QuestionCount;
				    		routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:ExamData.dataValues.Id},attributes:['ScoreValue','Pattern'],
				    			order:[['ShowOrder','ASC'],[{model:routeSql.MyQuestions,as:'ExamQuestionofMyQuestions'},{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']],
				    			include:[{model:routeSql.MyQuestions,as:'ExamQuestionofMyQuestions',attributes:['Id','Title'],where:{IsDeleted:false},required:false,include:[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions',attributes:['Id','Title'],where:{IsDeleted:false},required:false}]}]}).then(function(QuesAndOption){
			    				result.QuesAndOption = QuesAndOption
			    				res.send({error:0,result:result})
							})
						})
		    		})
				} else {
					res.send({error:1,result:{msg:'你不是该活动成员'}})
				}
			})
		})
	}
})

router.post('/GetExam',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var result = {}
	// console.log(req.body)
	if (decoded.UserType == 0) {
		routeSql.TeachingActivityUser.findOne({where:{UserId:decoded.Id,TeachingActivityId:req.body.TeachingActivityId}}).then(function(IsMemberData){
			if (IsMemberData) {
				routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(MyExamData){
					routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:req.body.ExamId}}).then(function(ExamResultData){
						if (ExamResultData) {
							// console.log(req.body.ExamId)
							routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(MyExamData){
								if (new Date(MyExamData.dataValues.EndDate) > new Date()) {
									// console.log(Date(ExamResultData.dataValues.EndDate))
									if (ExamResultData.dataValues.State == 1 || Date(ExamResultData.dataValues.EndDate) < new Date()) {
										routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId},attributes:['Id']}).then(function(ExamData){
											// console.log(ExamData.dataValues)
											routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamData.dataValues.Id}}).then(function(QuestionCount){
												res.send({error:4,result:{State:2,msg:'你已经参加过考试了，不能再次参加考试了',QuestionCount,Title:MyExamData.dataValues.Title,TimeLong:MyExamData.dataValues.TimeLong,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,ExamId:MyExamData.dataValues.Id,MyExamBaseId:MyExamData.dataValues.MyExamBaseId}})
											});
										})
									} else {
										routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId},attributes:['Id']}).then(function(ExamData){
											// console.log(ExamData.dataValues)
											routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamData.dataValues.Id}}).then(function(QuestionCount){
												res.send({error:0,result:{State:0,msg:'考试开始了，你可以参加考试',QuestionCount,Title:MyExamData.dataValues.Title,TimeLong:MyExamData.dataValues.TimeLong,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,ExamId:MyExamData.dataValues.Id,MyExamBaseId:MyExamData.dataValues.MyExamBaseId}})
											});
										})
									}
								} else {
									routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId},attributes:['Id']}).then(function(ExamData){
										routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamData.dataValues.Id}}).then(function(QuestionCount){
											res.send({error:3,result:{State:1,msg:'考试时间已经过去，你不能再参加考试了',QuestionCount,Title:MyExamData.dataValues.Title,TimeLong:MyExamData.dataValues.TimeLong,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,ExamId:MyExamData.dataValues.Id,MyExamBaseId:MyExamData.dataValues.MyExamBaseId}})
										})
									})
								}
							})
						} else {
							routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId},attributes:['Id']}).then(function(ExamData){
								// console.log(ExamData.dataValues)
								routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamData.dataValues.Id}}).then(function(QuestionCount){
									res.send({error:2,result:{State:3,msg:'考试还没有开始',QuestionCount,Title:MyExamData.dataValues.Title,TimeLong:MyExamData.dataValues.TimeLong,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,ExamId:MyExamData.dataValues.Id,MyExamBaseId:MyExamData.dataValues.MyExamBaseId}})
								});
							})
						}
					})
				})
			} else {
				res.send({error:1,result:{msg:'你不是该活动成员'}})
			}
		})
	} else {
		routeSql.TeachingActivity.findOne({where:{Id:req.body.TeachingActivityId,IsDeleted:false}}).then(function(ActivityData){
			if (ActivityData) {
				if (decoded.Id == ActivityData.dataValues.CreatorUserId) {
					routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(MyExamData){
						if (MyExamData) {
							routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId},attributes:['Id']}).then(function(ExamData){
								if (ExamData) {
									routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamData.dataValues.Id}}).then(function(QuestionCount){
										res.send({error:0,result:{CanGetQues:true,msg:'',QuestionCount,Title:MyExamData.dataValues.Title,TimeLong:MyExamData.dataValues.TimeLong,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,ExamId:MyExamData.dataValues.Id,MyExamBaseId:MyExamData.dataValues.MyExamBaseId}})
									});
								} else {
									res.send({error:2,result:{msg:'该试卷不存在'}})
								}
								// console.log(ExamData.dataValues)
							})
						} else {
							res.send({error:2,result:{msg:'该考试不存在'}})
						}
					})
				} else {
					res.send({error:1,result:{msg:'你不是该活动成员'}})
				}
			} else {
				res.send({error:2,result:{msg:'该活动不存在'}})
			}
			// console.log(ActivityData)
		})
	}
})

// router.get('/ssss',function(req,res){
// 	routeSql.ExamResult.update({StartDate:null,EndDate:null},{where:{ExamId:6}})
// })

router.post('/UpDateExam',function(req,res){
	// console.log(req.body)
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(token)
	var ResultRecords = []
	ResultRecords = req.body.ResultRecords;
	var TotalScore = 0;
	routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:req.body.ExamId}}).then(function(ExamResultData){
		if (ExamResultData) {
			if (new Date() > Date(DateAdd("s",30,ExamResultData.dataValues.EndDate))) {
				res.send({error:1,result:{msg:'考试已经结束，你不能再提交考试了'}})
			} else if (ExamResultData.dataValues.State == 1) {
				res.send({error:2,result:{msg:'你已经提交过了考试，不能再次提交了'}})
			} else {
				routeSql.ExamResult.update({EndDate:new Date(),State:1},{where:{ExamId:req.body.ExamId,UserId:decoded.Id}}).then(function(){
					QuesOption(ResultRecords)
				})
			}
		} else {
			res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
		}
		function QuesOption(ResultRecords){
			var QuesAndOption = ResultRecords.shift()
			routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(MyExamData){
				if (QuesAndOption) {
					var QuestionId = QuesAndOption.QuestionId
					var OptionArr = QuesAndOption.OptionArr;
					if (OptionArr.length > 0) {
						routeSql.MyQuestionOption.findAll({where:{IsAnswer:true,IsDeleted:false,QuestionId:QuestionId},attributes:['Id']}).then(function(TureOption){
							var TureOptionArr = []
							for (var i = 0; i < TureOption.length; i++) {
								TureOptionArr.push(TureOption[i].dataValues.Id)
							}
							if (TureOptionArr.sort().toString() == OptionArr.sort().toString()) {
								routeSql.MyExamQuestion.findOne({where:{QuestionId:QuestionId,MyExamBaseId:MyExamData.dataValues.MyExamBaseId}}).then(function(ExamQuesData){
									var Score = ExamQuesData.dataValues.ScoreValue
									TotalScore += Score
									routeSql.ExamResultRecord.create({QuestionId:QuestionId,QuestionOptionId:OptionArr.sort().toString(),ExamResultId:ExamResultData.dataValues.Id,TrueOrFalse:true}).then(function(){
										QuesOption(ResultRecords)
									})
								})
							}else{
								routeSql.ExamResultRecord.create({QuestionId:QuestionId,QuestionOptionId:OptionArr.sort().toString(),ExamResultId:ExamResultData.dataValues.Id,TrueOrFalse:false}).then(function(){
									QuesOption(ResultRecords)
								})
							}
						})
					} else {
						QuesOption(ResultRecords)
					}
				} else {
					routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
						var Passed;
						if (TotalScore >= ExamBaseData.dataValues.PassScore) {
							Passed = 1;
						} else {
							Passed = 0;
						}
						routeSql.ExamResult.update({Score:TotalScore,Passed:Passed},{where:{ExamId:req.body.ExamId,UserId:decoded.Id}}).then(function(data){
							res.send({error:0,result:{msg:'试卷提交成功'}})
						})
					})
				}
			})
		}
	})
})

router.post('/ExamReport',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	if (decoded.UserType == 0) {
		routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:req.body.ExamId}}).then(function(ExamResultData){
			if (ExamResultData) {
				routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(ExamData){
					var State;
					var QuestionAndOptionData = []
					var TotalScore = 0;
					var TotalQuesCount = 0
					var AnsQuesCount = 0
					var TotalStuCount
					var SurpassStuCount
					routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:ExamData.dataValues.MyExamBaseId},order:[['ShowOrder','ASC']]}).then(function(ExamQuesArr){
						routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
							// console.log(ExamBaseData.dataValues.CountScore)
							TotalScore = ExamBaseData.dataValues.CountScore;
						})
						routeSql.ExamResult.count({where:{ExamId:req.body.ExamId,IsDeleted:false}}).then(function(TotalStuCount){
							TotalStuCount = TotalStuCount
							routeSql.ExamResult.count({where:{ExamId:req.body.ExamId,IsDeleted:false,Score:{$lte:ExamResultData.dataValues.Score,$eq:null}}}).then(function(SurpassStuCount){
								// console.log('_____________________')
								SurpassStuCount = SurpassStuCount - 1
								getAllQuesAndAns(ExamQuesArr)
								function getAllQuesAndAns(ExamQuesArr){
									var ExamQuesData = ExamQuesArr.shift()
									if (ExamQuesData) {
										TotalQuesCount++;
										routeSql.ExamResultRecord.findOne({where:{QuestionId:ExamQuesData.dataValues.QuestionId,ExamResultId:ExamResultData.dataValues.Id}}).then(function(ExamRecordData){
											if (ExamRecordData) {
												if (ExamRecordData.dataValues.TrueOrFalse) {
													State = 0;
												} else {
													State = 1;
												}
												AnsQuesCount ++;
											} else {
												State = 2;
											}
											routeSql.MyQuestions.findOne({where:{Id:ExamQuesData.dataValues.QuestionId},order:[[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']],attributes:['Id','Title','Pattern'],include:[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions',attributes:['Id','Title','ShowOrder','IsAnswer'],where:{IsDeleted:false},required:false}]}).then(function(data){
												if (ExamRecordData) {
													if (ExamRecordData.dataValues.QuestionOptionId) {
														QuesOption = ExamRecordData.dataValues.QuestionOptionId.split(",")
													} else {
														QuesOption = []
													}
												} else {
													QuesOption = []
												}
												QuestionAndOptionData.push({State,QuesOption:QuesOption,data})
												getAllQuesAndAns(ExamQuesArr)
											})
										})
									} else {
										// (Date.parse(EndDate) - Date.parse(new Date()))/1000
										if (!ExamResultData.dataValues.State) {
											ResultState = 2//表示没做
										} else {
											if (ExamResultData.dataValues.Passed) {
												ResultState = 0//表示通过
											} else {
												ResultState = 1//表示未通过
											}
										}
										var TimeLong = (- Date.parse(new Date(ExamResultData.dataValues.StartDate)) + Date.parse(new Date(ExamResultData.dataValues.EndDate)))/1000
										// console.log(Date.parse(new Date(ExamResultData.dataValues.StartDate)))
										// console.log(Date.parse(new Date(ExamResultData.dataValues.EndDate)))
										// console.log(TimeLong)
										res.send({error:0,result:{Score:ExamResultData.dataValues.Score,TimeLong:TimeLong,TotalQuesCount,AnsQuesCount,TotalStuCount,SurpassStuCount,QuestionAndOptionData,ResultState:ResultState,TotalScore:TotalScore}})
									}
								}
							})
						})
					})
				})
			} else {
				res.send({error:0,result:{msg:'你没有该考试的记录'}})
			}
		})
	} else {
		routeSql.ExamResult.findAll({where:{ExamId:req.body.ExamId,IsDeleted:false},order:[['Score','DESC']],attributes:['UserId','Score'],include:[{model:routeSql.AbpUsers,as:'ExamResultUsers',attributes:['Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}]}).then(function(RankingArray){
			var AllStudNum = RankingArray.length
			var SubmitStudNum;
			var TotalScore
			var AverageScore = 0
			for (var i = 0; i < RankingArray.length; i++) {
				var PersonScore;
				if (!RankingArray[i].dataValues.Score) {PersonScore = 0}else{PersonScore = RankingArray[i].dataValues.Score}
					// console.log(PersonScore)
				AverageScore += PersonScore
			}
			AverageScore =  Math.round(AverageScore / AllStudNum*100)/100;
			// console.log(req.body)
			routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(ExamData){
				routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
					TotalScore = ExamBaseData.dataValues.CountScore
					routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:ExamData.dataValues.MyExamBaseId},order:[['ShowOrder','ASC']]}).then(function(ExamQuesArr){
						var QuesAccuracy = []
						getAllQuesAccuracy(ExamQuesArr)
						function getAllQuesAccuracy(ExamQuesArr){
							var ExamQuesData = ExamQuesArr.shift()
							if (ExamQuesData) {
								routeSql.ExamResult.findAll({where:{ExamId:req.body.ExamId,IsDeleted:false}}).then(function(AllUser){
									var Accuracy = 0;
									AccuracyNum(AllUser)
									function AccuracyNum(AllUser){
										var UserData = AllUser.shift()
										if (UserData) {
											routeSql.ExamResultRecord.findOne({where:{QuestionId:ExamQuesData.dataValues.QuestionId,ExamResultId:UserData.dataValues.Id,TrueOrFalse:true}}).then(function(ExamResultRecordData){
												if (ExamResultRecordData) {
													Accuracy ++;
												}
												AccuracyNum(AllUser)
											})
										} else {
											routeSql.MyQuestions.findOne({where:{Id:ExamQuesData.dataValues.QuestionId},order:[[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']],attributes:['Id','Title','Pattern'],include:[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions',attributes:['Id','Title','ShowOrder','IsAnswer'],where:{IsDeleted:false},required:false}]}).then(function(data){
												QuesAccuracy.push({Accuracy:Accuracy,data:data})
												getAllQuesAccuracy(ExamQuesArr)
											})
										}
									}
								})
							} else {
								routeSql.ExamResult.count({where:{ExamId:req.body.ExamId,State:1}}).then(function(SubmitStudNum){
									SubmitStudNum = SubmitStudNum
									// console.log(RankingArray[1].ExamResultUsers)
									res.send({error:0,result:{TotalScore:TotalScore,AverageScore:AverageScore,AllStudNum:AllStudNum,SubmitStudNum:SubmitStudNum,QuesAccuracy:QuesAccuracy,RankingArray:RankingArray}})
								})
							}
						}
					})
				})
			})
		})
	}
})

router.post('/LastTimeLong',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(decoded)
	routeSql.ExamResult.findOne({where:{ExamId:req.body.ExamId,UserId:decoded.Id}}).then(function(ResultData){
		// routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(ExamData){})
		if (ResultData.dataValues.EndDate) {
			var nowDate = new Date();
			// console.log(ResultData.dataValues)
			if (nowDate > ResultData.dataValues.EndDate) {
				res.send({error:2,result:{msg:'你的考试已经结束，你不能再参加考试了'}})
			} else {
				var LastTimeLong = parseInt((Date.parse(ResultData.dataValues.EndDate) - Date.parse(nowDate))/1000)
				res.send({error:0,result:{LastTimeLong:LastTimeLong}})
			}
		} else {
			res.send({error:1,result:{msg:'你没有参与该考试'}})
		}
	})
})

// router.get('/AllMyExam',function(req,res){
// 	var token = req.headers.token
// 	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
// 	// console.log(req.body)
// 	if (decoded.UserType == 0) {
// 		routeSql.ExamResult.findAll({where:{UserId:decoded.Id,IsDeleted:false},order:[['Id','DESC']]}).then(function(MyExamResultArr){
// 			var result = []
// 			// console.log('+++++++++++++')
// 			// console.log(MyExamResultArr)
// 			GetActivity(MyExamResultArr)
// 			function GetActivity(MyExamResultArr){
// 				var MyExamResultdata = MyExamResultArr.shift()
// 				if (MyExamResultdata) {
// 				// console.log(MyExamResultdata)
// 					routeSql.TeachingDetail.findOne({where:{ModelId:MyExamResultdata.dataValues.ExamId,Type:1},order:[['Id','DESC']]}).then(function(DetailData){
// 						if (DetailData) {
// 							routeSql.TeachingActivity.findOne({where:{Id:DetailData.dataValues.TeachingActivityId},attributes:['Title','Id']}).then(function(ActivityData){
// 								if (ActivityData) {
// 									routeSql.MyExam.findOne({where:{Id:MyExamResultdata.dataValues.ExamId,IsDeleted:false}}).then(function(MyExamData){
// 										var State = 3;
// 										routeSql.ExamResult.findOne({where:{ExamId:DetailData.dataValues.ModelId,UserId:decoded.Id}}).then(function(ResultData){
// 											if (new Date(MyExamData.dataValues.StartDate) > new Date()) {
// 												State = 3//考试还未开始
// 											} else if (new Date(MyExamData.dataValues.StartDate) < new Date() && new Date(MyExamData.dataValues.EndDate) > new Date()) {
// 												if (ResultData) {
// 													if (ResultData.dataValues.State == 1) {
// 														State = 2//已经提交过了或者考试时长已经过了考试未结束
// 													} else {
// 														State = 0//可以开始考试
// 													}
// 												} else {
// 													State = 5//不能参加该考试
// 												}
// 											} else {
// 												if (ResultData) {
// 													if (ResultData.dataValues.State == 0) {
// 														State = 4//缺考
// 													} else {
// 														State = 1//考试已经结束
// 													}
// 												} else {
// 													State = 5//不能参加该考试
// 												}
// 											}
// 		                                    // if (new Date(MyExamData.dataValues.EndDate) > new Date()) {
// 		                                    //     if (ResultData) {
// 			                                   //      if (ResultData.dataValues.State == 1 || Date(ResultData.dataValues.EndDate) < new Date()) {
// 			                                   //          State = 2//已经提交过了或者考试时长已经过了考试未结束
// 			                                   //      } else {
// 			                                   //          State = 0//可以开始考试
// 			                                   //      }
// 		                                    //     } else {
// 		                                    //         State = 3//考试还未开始或不能参加该考试
// 		                                    //     }
// 		                                    // } else {
// 		                                    // 	if (ResultData) {
// 		                                    //         if (new Date(MyExamData.dataValues.EndDate) < new Date() && ResultData.dataValues.State == 0) {
// 		                                    //             State = 4//缺考
// 		                                    //         } else {
// 		                                    //             State = 1//考试已经结束
// 		                                    //         }
// 		                                    //     }
// 		                                    // }
// 		                                    // console.log(MyExamResultdata.dataValues.Passed)
// 		                                    // console.log('------------------------------')
// 											var ExamData = {ExamId:DetailData.dataValues.ModelId,ExamTitle:MyExamData.dataValues.Title,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,State:State,Score:MyExamResultdata.dataValues.Score,Passed:MyExamResultdata.dataValues.Passed,ActivityTitle:ActivityData.dataValues.Title,TeachingActivityId:ActivityData.dataValues.Id,ExamBaseId:MyExamData.dataValues.MyExamBaseId}
// 											result.push(ExamData)
// 											GetActivity(MyExamResultArr)
// 										})
// 									})
// 								} else {
// 									GetActivity(MyExamResultArr)
// 								}
// 							})
// 						} else {
// 							GetActivity(MyExamResultArr)
// 						}
// 					})
// 				} else {
// 					// console.log(result)
// 					res.send({error:0,result:result})
// 				}
// 			}
// 		})
// 	} else {
// 		routeSql.TeachingActivity.findAll({where:{CreatorUserId:decoded.Id,IsDeleted:false}}).then(function(ActivityArr){
// 			var result = []
// 			AllMyExam(ActivityArr)
// 			function AllMyExam(ActivityArr){
// 				var ActivityData = ActivityArr.shift()
// 				if (ActivityData) {
// 					routeSql.TeachingDetail.findAll({where:{Type:1,TeachingActivityId:ActivityData.dataValues.Id}}).then(function(DetailArr){
// 						AllExam(DetailArr)
// 						function AllExam(DetailArr){
// 							var DetailData = DetailArr.shift()
// 							if (DetailData) {
// 								routeSql.MyExam.findOne({where:{Id:DetailData.dataValues.ModelId,IsDeleted:false}}).then(function(MyExamData){
// 									var State;
// 									if (MyExamData) {
// 										// console.log(new Date())
// 										// console.log(new Date(MyExamData.dataValues.StartDate))
// 										// console.log(new Date(MyExamData.dataValues.EndDate))
// 										if (new Date() > new Date(MyExamData.dataValues.EndDate)) {
// 											State = 1
// 										} else if (new Date() > new Date(MyExamData.dataValues.StartDate) && new Date() < new Date(MyExamData.dataValues.EndDate)) {
// 											State = 0
// 										} else {
// 											State = 2
// 										}
// 										routeSql.ExamResult.count({where:{ExamId:DetailData.dataValues.ModelId}}).then(function(AllStudNum){
// 											routeSql.ExamResult.count({where:{ExamId:DetailData.dataValues.ModelId,State:1}}).then(function(SubmitStudNum){
// 												result.push({TeachingDetailId:DetailData.dataValues.Id,ExamId:DetailData.dataValues.ModelId,ExamTitle:MyExamData.dataValues.Title,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,State:State,SubmitStudNum:SubmitStudNum,AllStudNum:AllStudNum,ActivityTitle:ActivityData.dataValues.Title,TeachingActivityId:ActivityData.dataValues.Id,ExamBaseId:MyExamData.dataValues.MyExamBaseId})
// 												AllExam(DetailArr)
// 											})
// 										})
// 									} else {
// 										AllExam(DetailArr)
// 									}
// 								})
// 							} else {
// 								AllMyExam(ActivityArr)
// 							}
// 						}
// 					})
// 				} else {
// 					result.sort(function(a,b){return b.ExamId - a.ExamId;})
// 					res.send({error:0,result:result})
// 				}
// 			}
// 		})
// 	}
// })

router.get('/AllMyExam',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var msg = req.query.msg ? req.query.msg:''
	var a = req.query.limit?req.query.limit:10;
	var limit = parseInt(a)
	var page = req.query.page?req.query.page:1;
	var offset = (page -1) * limit;
	// console.log(req.body)
	if (decoded.UserType == 0) {
		routeSql.ExamResult.findAll({where:{UserId:decoded.Id,IsDeleted:false},offset:offset,limit:limit,order:[['Id','DESC']]}).then(function(MyExamResultArr){
			var result = []
			// console.log('+++++++++++++')
			// console.log(MyExamResultArr)
			GetActivity(MyExamResultArr)
			function GetActivity(MyExamResultArr){
				var MyExamResultdata = MyExamResultArr.shift()
				if (MyExamResultdata) {
				// console.log(MyExamResultdata)
					routeSql.TeachingDetail.findOne({where:{ModelId:MyExamResultdata.dataValues.ExamId,Type:1},order:[['Id','DESC']]}).then(function(DetailData){
						if (DetailData) {
							routeSql.TeachingActivity.findOne({where:{Id:DetailData.dataValues.TeachingActivityId},attributes:['Title','Id']}).then(function(ActivityData){
								if (ActivityData) {
									routeSql.MyExam.findOne({where:{Id:MyExamResultdata.dataValues.ExamId,IsDeleted:false,Title:{$like:'%' + msg + '%'}}}).then(function(MyExamData){
										if (MyExamData) {
											var State = 3;
											routeSql.ExamResult.findOne({where:{ExamId:DetailData.dataValues.ModelId,UserId:decoded.Id}}).then(function(ResultData){
												if (new Date(MyExamData.dataValues.StartDate) > new Date()) {
													State = 3//考试还未开始
												} else if (new Date(MyExamData.dataValues.StartDate) < new Date() && new Date(MyExamData.dataValues.EndDate) > new Date()) {
													if (ResultData) {
														if (ResultData.dataValues.State == 1) {
															State = 2//已经提交过了或者考试时长已经过了考试未结束
														} else {
															State = 0//可以开始考试
														}
													} else {
														State = 5//不能参加该考试
													}
												} else {
													if (ResultData) {
														if (ResultData.dataValues.State == 0) {
															State = 4//缺考
														} else {
															State = 1//考试已经结束
														}
													} else {
														State = 5//不能参加该考试
													}
												}
			                                    // if (new Date(MyExamData.dataValues.EndDate) > new Date()) {
			                                    //     if (ResultData) {
				                                   //      if (ResultData.dataValues.State == 1 || Date(ResultData.dataValues.EndDate) < new Date()) {
				                                   //          State = 2//已经提交过了或者考试时长已经过了考试未结束
				                                   //      } else {
				                                   //          State = 0//可以开始考试
				                                   //      }
			                                    //     } else {
			                                    //         State = 3//考试还未开始或不能参加该考试
			                                    //     }
			                                    // } else {
			                                    // 	if (ResultData) {
			                                    //         if (new Date(MyExamData.dataValues.EndDate) < new Date() && ResultData.dataValues.State == 0) {
			                                    //             State = 4//缺考
			                                    //         } else {
			                                    //             State = 1//考试已经结束
			                                    //         }
			                                    //     }
			                                    // }
			                                    // console.log(MyExamResultdata.dataValues.Passed)
			                                    // console.log('------------------------------')
												var ExamData = {ExamId:DetailData.dataValues.ModelId,ExamTitle:MyExamData.dataValues.Title,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,State:State,Score:MyExamResultdata.dataValues.Score,Passed:MyExamResultdata.dataValues.Passed,ActivityTitle:ActivityData.dataValues.Title,TeachingActivityId:ActivityData.dataValues.Id,ExamBaseId:MyExamData.dataValues.MyExamBaseId}
												result.push(ExamData)
												GetActivity(MyExamResultArr)
											})
										} else {
											GetActivity(MyExamResultArr)
										}
									})
								} else {
									GetActivity(MyExamResultArr)
								}
							})
						} else {
							GetActivity(MyExamResultArr)
						}
					})
				} else {
					var TotolCount = result.length;
					// console.log(result)
					res.send({error:0,result:result,TotolCount:TotolCount})
				}
			}
		})
	} else {
		var whereStr = " where me.IsDeleted=0 and ta.IsDeleted=0 and meb.CreatorUserId = " + decoded.Id;
		// console.log(whereStr)
		if(msg != ''){
			msg = msg.replace("'","''");
			whereStr += " and me.Title like '%" + msg + "%'";
		}
		var sqlc = 	" select count(1) as RCount"
  			+ " from MyExam me"
 			+ " join MyExamBase meb on me.MyExamBaseId = meb.Id "
            + " join TeachingDetail td on td.ModelId= me.Id  and Type=1 "
 			+ " join TeachingActivity ta on td.TeachingActivityId = ta.Id "
			+ whereStr;
		var sql = " select td.Id  as TeachingDetailId,me.Id  as ExamId,me.Title as ExamTitle,me.EndDate as EndDate,me.StartDate as StartDate" 
			+ ",(case when me.EndDate < DATEADD(hh,-8,GetDate()) then 1 when me.EndDate > DATEADD(hh,-8,GetDate()) and me.StartDate < DATEADD(hh,-8,GetDate()) then 0 else 2 end) as State"
            // + " ,(case when me.EndDate < GetDate() then 1 when me.EndDate > GETDATE() and me.StartDate < GETDATE() then 0 else 2 end) as State" 
            + " , (select count(1) from ExamResult where ExamId = me.Id  and IsDeleted=0 and State=1) as SubmitStudNum" 
            + " ,(select count(1) from ExamResult where ExamId = me.Id  and IsDeleted=0) as AllStudNum"
 			+ " ,ta.Title as ActivityTitle,ta.Id  as TeachingActivityId ,meb.Id  as ExamBaseId"
 			+ " ,row_number() OVER (ORDER BY me.Id  desc) n"
  			+ " from MyExam me"
 			+ " join MyExamBase meb on me.MyExamBaseId = meb.Id  "
            + " join TeachingDetail td on td.ModelId= me.Id  and Type=1 "
 			+ " join TeachingActivity ta on td.TeachingActivityId = ta.Id "
			+ whereStr;
		var sqlp = " select ActivityTitle,TeachingActivityId,TeachingDetailId,ExamId,ExamTitle,EndDate,StartDate,State,SubmitStudNum,AllStudNum,ExamBaseId from ( "+ sql + " ) as t where t.n between " + (offset+1) + " and " + page*limit ;
		sequelize.query(sqlc,{ type: sequelize.QueryTypes.SELECT}).then(function(resCount) {
			sequelize.query(sqlp,{ type: sequelize.QueryTypes.SELECT}).then(function(resexam) {
				// console.log(('000000'))
				res.send({error:0,result:resexam,TotolCount:resCount[0].RCount})
			})
		})

		// routeSql.TeachingActivity.findAll({where:{CreatorUserId:decoded.Id,IsDeleted:false}}).then(function(ActivityArr){
		// 	var result = []
		// 	AllMyExam(ActivityArr)
		// 	function AllMyExam(ActivityArr){
		// 		var ActivityData = ActivityArr.shift()
		// 		if (ActivityData) {
		// 			routeSql.TeachingDetail.findAll({where:{Type:1,TeachingActivityId:ActivityData.dataValues.Id}}).then(function(DetailArr){
		// 				AllExam(DetailArr)
		// 				function AllExam(DetailArr){
		// 					var DetailData = DetailArr.shift()
		// 					if (DetailData) {
		// 						routeSql.MyExam.findOne({where:{Id:DetailData.dataValues.ModelId,IsDeleted:false,Title:{$like:'%' + msg + '%'}}}).then(function(MyExamData){
		// 							if (MyExamData) {
		// 								var State;
		// 								// console.log(new Date())
		// 								// console.log(new Date(MyExamData.dataValues.StartDate))
		// 								// console.log(new Date(MyExamData.dataValues.EndDate))
		// 								if (new Date() > new Date(MyExamData.dataValues.EndDate)) {
		// 									State = 1
		// 								} else if (new Date() > new Date(MyExamData.dataValues.StartDate) && new Date() < new Date(MyExamData.dataValues.EndDate)) {
		// 									State = 0
		// 								} else {
		// 									State = 2
		// 								}
		// 								routeSql.ExamResult.count({where:{ExamId:DetailData.dataValues.ModelId}}).then(function(AllStudNum){
		// 									routeSql.ExamResult.count({where:{ExamId:DetailData.dataValues.ModelId,State:1}}).then(function(SubmitStudNum){
		// 										result.push({TeachingDetailId:DetailData.dataValues.Id,ExamId:DetailData.dataValues.ModelId,ExamTitle:MyExamData.dataValues.Title,EndDate:MyExamData.dataValues.EndDate,StartDate:MyExamData.dataValues.StartDate,State:State,SubmitStudNum:SubmitStudNum,AllStudNum:AllStudNum,ActivityTitle:ActivityData.dataValues.Title,TeachingActivityId:ActivityData.dataValues.Id,ExamBaseId:MyExamData.dataValues.MyExamBaseId})
		// 										AllExam(DetailArr)
		// 									})
		// 								})
		// 							} else {
		// 								AllExam(DetailArr)
		// 							}
		// 						})
		// 					} else {
		// 						AllMyExam(ActivityArr)
		// 					}
		// 				}
		// 			})
		// 		} else {
		// 			var TotolCount = result.length
		// 			result.sort(function(a,b){return b.ExamId - a.ExamId;})
		// 			res.send({error:0,result:result,TotolCount:TotolCount})
		// 		}
		// 	}
		// })
	}
})

router.post('/ExamReportforWeb',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var resultExamData = {}
	routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(MyExamData){
		routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId},attributes:['Id','Title','CountScore','PassScore']}).then(function(ExamData){
			resultExamData.ExamData = ExamData.dataValues
			routeSql.MyExamQuestion.count({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:0}}).then(function(SingleCount){
				resultExamData.ExamData.SingleCount = SingleCount
			})
			routeSql.MyExamQuestion.count({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:1}}).then(function(MultipleCount){
				resultExamData.ExamData.MultipleCount = MultipleCount
			})
			routeSql.MyExamQuestion.count({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:2}}).then(function(JudgeCount){
				resultExamData.ExamData.JudgeCount = JudgeCount
			})
			routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:0}}).then(function(SingleData){
				if (SingleData) {
					resultExamData.ExamData.SingleScoreValue = SingleData.dataValues.ScoreValue
				} else {
					resultExamData.ExamData.SingleScoreValue = 0;
				}
			})
			routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:1}}).then(function(SingleData){
				if (SingleData) {
					resultExamData.ExamData.MultipleScoreValue = SingleData.dataValues.ScoreValue
				} else {
					resultExamData.ExamData.MultipleScoreValue = 0;
				}
			})
			routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId,Pattern:2}}).then(function(SingleData){
				if (SingleData) {
					resultExamData.ExamData.JudgeScoreValue = SingleData.dataValues.ScoreValue
				} else {
					resultExamData.ExamData.JudgeScoreValue = 0;
				}
			})
			// console.log('--------------------------------------------------')
			// console.log(resultExamData)
			// console.log('--------------------------------------------------')
		})
	})
	if (decoded.UserType == 0) {
		routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:req.body.ExamId}}).then(function(ExamResultData){
			if (ExamResultData) {
				routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(ExamData){
					var State;
					var QuestionAndOptionData = []
					var TotalScore = 0;
					var TotalQuesCount = 0
					var AnsQuesCount = 0
					var TotalStuCount = 0
					var SurpassStuCount = 0
					routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:ExamData.dataValues.MyExamBaseId},order:[['ShowOrder','ASC']]}).then(function(ExamQuesArr){
						routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
							// console.log(ExamBaseData.dataValues.CountScore)
							TotalScore = ExamBaseData.dataValues.CountScore;
						})
						routeSql.ExamResult.count({where:{ExamId:req.body.ExamId,IsDeleted:false}}).then(function(TotalStuCount){
							TotalStuCount = TotalStuCount
							routeSql.ExamResult.count({where:{ExamId:req.body.ExamId,IsDeleted:false,Score:{$or:{$lte:ExamResultData.dataValues.Score,$eq:null}}}}).then(function(SurpassStuCount){
								// console.log('_____________________')
								// console.log(SurpassStuCount)
								SurpassStuCount = SurpassStuCount - 1
								getAllQuesAndAns(ExamQuesArr)
								function getAllQuesAndAns(ExamQuesArr){
									var ExamQuesData = ExamQuesArr.shift()
									if (ExamQuesData) {
										TotalQuesCount++;
										routeSql.ExamResultRecord.findOne({where:{QuestionId:ExamQuesData.dataValues.QuestionId,ExamResultId:ExamResultData.dataValues.Id}}).then(function(ExamRecordData){
											if (ExamRecordData) {
												if (ExamRecordData.dataValues.TrueOrFalse) {
													State = 0;
												} else {
													State = 1;
												}
												AnsQuesCount ++;
											} else {
												State = 2;
											}
											routeSql.MyQuestions.findOne({where:{Id:ExamQuesData.dataValues.QuestionId},order:[[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']],attributes:['Id','Title','Pattern'],include:[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions',attributes:['Id','Title','ShowOrder','IsAnswer'],where:{IsDeleted:false},required:false}]}).then(function(data){
												if (ExamRecordData) {
													if (ExamRecordData.dataValues.QuestionOptionId) {
														QuesOption = ExamRecordData.dataValues.QuestionOptionId.split(",")
													} else {
														QuesOption = []
													}
												} else {
													QuesOption = []
												}
												QuestionAndOptionData.push({State,QuesOption:QuesOption,data})
												getAllQuesAndAns(ExamQuesArr)
											})
										})
									} else {
										// (Date.parse(EndDate) - Date.parse(new Date()))/1000
										if (!ExamResultData.dataValues.State) {
											ResultState = 2//表示没做
										} else {
											if (ExamResultData.dataValues.Passed) {
												ResultState = 0//表示通过
											} else {
												ResultState = 1//表示未通过
											}
										}
										var TimeLong = (- Date.parse(new Date(ExamResultData.dataValues.StartDate)) + Date.parse(new Date(ExamResultData.dataValues.EndDate)))/1000
										// console.log(Date.parse(new Date(ExamResultData.dataValues.StartDate)))
										// console.log(Date.parse(new Date(ExamResultData.dataValues.EndDate)))
										// console.log(TimeLong)
										res.send({error:0,result:{Score:ExamResultData.dataValues.Score,TimeLong:TimeLong,TotalQuesCount:TotalQuesCount,AnsQuesCount,TotalStuCount,SurpassStuCount,QuestionAndOptionData,ResultState:ResultState,TotalScore:TotalScore,ExamData:resultExamData.ExamData}})
									}
								}
							})
						})
					})
				})
			} else {
				res.send({error:0,result:{msg:'你没有该考试的记录'}})
			}
		})
	} else {
		routeSql.ExamResult.findAll({where:{ExamId:req.body.ExamId,IsDeleted:false},order:[['Score','DESC']],attributes:['UserId','Score'],include:[{model:routeSql.AbpUsers,as:'ExamResultUsers',attributes:['Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}]}).then(function(RankingArray){
			var AllStudNum = RankingArray.length
			var SubmitStudNum;
			var TotalScore
			var AverageScore = 0
			var TotalQuesCount = 0
			for (var i = 0; i < RankingArray.length; i++) {
				var PersonScore;
				if (!RankingArray[i].dataValues.Score) {PersonScore = 0}else{PersonScore = RankingArray[i].dataValues.Score}
				AverageScore += PersonScore
			}
			AverageScore =  Math.round(AverageScore / AllStudNum*100)/100;
			// console.log(req.body)
			routeSql.MyExam.findOne({where:{Id:req.body.ExamId}}).then(function(ExamData){
				if (ExamData) {
					routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
						if (ExamBaseData) {
							TotalScore = ExamBaseData.dataValues.CountScore
							routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:ExamData.dataValues.MyExamBaseId},order:[['ShowOrder','ASC']]}).then(function(ExamQuesArr){
								var QuesAccuracy = []
								getAllQuesAccuracy(ExamQuesArr)
								function getAllQuesAccuracy(ExamQuesArr){
									var ExamQuesData = ExamQuesArr.shift()
									var Accuracy = 0;
									var ChartArr = []
									if (ExamQuesData) {
										TotalQuesCount ++;
										routeSql.ExamResult.findAll({where:{ExamId:req.body.ExamId,IsDeleted:false}}).then(function(AllUser){
											var Accuracy = 0;
											AccuracyNum(AllUser)
											function AccuracyNum(AllUser){
												var UserData = AllUser.shift()
												if (UserData) {
													routeSql.ExamResultRecord.findOne({where:{QuestionId:ExamQuesData.dataValues.QuestionId,ExamResultId:UserData.dataValues.Id,TrueOrFalse:true}}).then(function(ExamResultRecordData){
														if (ExamResultRecordData) {
															Accuracy ++;
														}
														AccuracyNum(AllUser)
													})
												} else {
													routeSql.MyQuestions.findOne({where:{Id:ExamQuesData.dataValues.QuestionId},attributes:['Id','Title','Pattern']}).then(function(QuestionData){
														routeSql.MyQuestionOption.findAll({where:{QuestionId:ExamQuesData.dataValues.QuestionId},attributes:['Id','Title','ShowOrder','IsAnswer'],order:[['ShowOrder','ASC']]}).then(function(OptionArr){
															var OptionDataArr = []
															ChartData(OptionArr)
															function ChartData(OptionArr){
																var OptionData = OptionArr.shift()
																if (OptionData) {
																	routeSql.ExamResult.findAll({where:{ExamId:req.body.ExamId,IsDeleted:false}}).then(function(AllUser){
																		var OptionCount = 0;
																		OptionNum(AllUser)
																		function OptionNum(AllUser){
																			var UserData = AllUser.shift()
																			if (UserData) {
																				routeSql.ExamResultRecord.findOne({where:{QuestionId:ExamQuesData.dataValues.QuestionId,ExamResultId:UserData.dataValues.Id}}).then(function(ExamResultRecordData){
																					if (ExamResultRecordData) {
																						var QuestionOptionArr = ExamResultRecordData.dataValues.QuestionOptionId.split(',')
																							if(QuestionOptionArr.indexOf(OptionData.dataValues.Id) >= 0){
																								OptionCount ++;
																							}
																						// function(OptionArr){
																						// 	var OptionData = OptionArr.shift()
																						// 	if (OptionData) {
																						// 	} else {}
																						// }
																					}
																					OptionNum(AllUser)
																				})
																			} else {
																				OptionDataArr.push(OptionData)
																				ChartArr.push(OptionCount)
																				ChartData(OptionArr)
																			}
																		}
																	})
																} else {
																	QuesAccuracy.push({Accuracy:Accuracy,QuestionData:QuestionData,OptionDataArr:OptionDataArr,ChartArr,ChartArr})
																	getAllQuesAccuracy(ExamQuesArr)
																}
															}
														})
													})
												}
											}
										})
									} else {
										routeSql.ExamResult.count({where:{ExamId:req.body.ExamId,IsDeleted:false,State:1}}).then(function(SubmitStudNum){
											SubmitStudNum = SubmitStudNum
											res.send({error:0,result:{TotalQuesCount:TotalQuesCount,TotalScore:TotalScore,AverageScore:AverageScore,AllStudNum:AllStudNum,SubmitStudNum:SubmitStudNum,QuesAccuracy:QuesAccuracy,RankingArray:RankingArray,ExamData:resultExamData.ExamData}})
										})
									}
								}
							})
						} else {
							res.send({error:2,result:{msg:'该试卷不存在'}})
						}
					})
				} else {
					res.send({error:2,result:{msg:'该考试不存在'}})
				}
			})
		})
	}
})


module.exports = router;


function DateAdd(interval, number, date) {
    switch (interval) {
    case "y": {
        date.setFullYear(date.getFullYear() + number);
        return date;
        break;
    }
    case "q": {
        date.setMonth(date.getMonth() + number);
        return date;
        break;
    }
    case "w": {
        date.setDate(date.getDate() + number * 7);
        return date;
        break;
    }
    case "d": {
        date.setDate(date.getDate() + number);
        return date;
        break;
    }
    case "h": {
        date.setHours(date.getHours() + number);
        return date;
        break;
    }
    case "M": {
        date.setMinutes(date.getMinutes() + number);
        return date;
        break;
    }
    case "s ": {
        date.setSeconds(date.getSeconds() + number);
        return date;
        break;
    }
    default: {
        date.setDate(date.getDate() + number);
        return date;
        break;
    }
    }
}


function searchDetail(TeachingTaskId,res,TaskData,decoded) {
    routeSql.TeachingDetail.findAll({where:{TeachingTaskId:TeachingTaskId}}).then(function(TeachingDetailArr){
        var ModelArray = []
        getAllModel(TeachingDetailArr)
        function getAllModel(TeachingDetailArr){
            var TeachingDetailData = TeachingDetailArr.shift()
            if (TeachingDetailData) {
                var TeachingDetailDataValues = TeachingDetailData.dataValues
                if (TeachingDetailDataValues.Type == 0) {
                    routeSql.CloudDiskFiles.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory','FileUrl','FileSize','CreationTime']}]}).then(function(ModelData){
                        ModelArray.push({TeachingDetailData:{Id:TeachingDetailData.dataValues.Id,Type:TeachingDetailData.dataValues.Type,ModelId:TeachingDetailData.dataValues.ModelId},ModelData:{FileName:ModelData.dataValues.FileName,ResourceId:ModelData.dataValues.ResourceId,FileCategory:ModelData.dataValues.DiskFilesResourceId.FileCategory,FileUrl:ModelData.dataValues.DiskFilesResourceId.FileUrl,FileSize:ModelData.dataValues.DiskFilesResourceId.FileSize}})
                        getAllModel(TeachingDetailArr)
                    })
                } else if (TeachingDetailDataValues.Type == 1) {
                    routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ExamData){
                        routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
                            routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:TeachingDetailDataValues.ModelId}}).then(function(ExamResultData){
                                routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamBaseData.dataValues.Id}}).then(function(QuestionCount){
                                    var State;
                                    var TeacherPaperState;
                                        if (new Date(ExamData.dataValues.EndDate) > new Date()) {
                                    if (ExamResultData) {
                                            if (ExamResultData.dataValues.State == 1 || Date(ExamResultData.dataValues.EndDate) < new Date()) {
                                                State = 2//已经提交过了或者考试时长已经过了考试未结束
                                            } else {
                                                State = 0//可以开始考试
                                            }
                                    } else {
                                        State = 3//考试还未开始或不能参加该考试
                                    }
                                        } else {
                                            State = 1//考试已经结束
                                        }
                                        if (new Date(ExamData.dataValues.StartDate) > new Date()) {
                                            TeacherPaperState = 2;
                                        } else if (new Date(ExamData.dataValues.StartDate) < new Date() && new Date(ExamData.dataValues.EndDate) > new Date()) {
                                            TeacherPaperState = 0;
                                        } else {
                                            TeacherPaperState = 1;
                                        }
                                    ModelArray.push({TeachingDetailData:TeachingDetailData,ModelData:{State:State,CountScore:ExamBaseData.dataValues.CountScore,PassScore:ExamBaseData.dataValues.PassScore,StartDate:ExamData.dataValues.StartDate,EndDate:ExamData.dataValues.EndDate,TimeLong:ExamData.dataValues.TimeLong,MyExamBaseId:ExamData.dataValues.MyExamBaseId,QuestionCount:QuestionCount,TeacherPaperState:TeacherPaperState}})
                                    getAllModel(TeachingDetailArr)
                                })
                            })
                        })
                    })
                    // routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.MyExamBase,as:'TestPaper',attributes:['PassScore','CountScore']}]}).then(function(ModelData){
                    //     ModelArray.push({TeachingDetailData,ModelData})
                    //     getAllModel(TeachingDetailArr)
                    // })
                } else if (TeachingDetailDataValues.Type == 2) {
                    routeSql.HomeWork.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ModelData){
                        if (new Date() > new Date(ModelData.dataValues.EndDate)) {
                            ModelData.dataValues.IsEnd = true
                        } else {
                            ModelData.dataValues.IsEnd = false
                        }
                        ModelArray.push({TeachingDetailData,ModelData})
                        getAllModel(TeachingDetailArr)
                    })
                } else if (TeachingDetailDataValues.Type == 3) {
                    routeSql.Questionnaires.findOne({where:{Id:TeachingDetailDataValues.ModelId},attributes:['Title','Code','CodePath','Count']}).then(function(ModelData){
                        if (decoded.UserType != 0) {
                            ModelArray.push({TeachingDetailData,ModelData})
                        } else {
                            ModelArray.push({TeachingDetailData,ModelData:{}})
                        }
                        getAllModel(TeachingDetailArr)
                    })
                }
            } else {
            	// console.log('chenggongle')
                res.send({error:0,result:{ModelArray,TaskData}})
            }
        }
    })
}

