
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段

router.get('/AllExam',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var msg = req.query.msg ? req.query.msg:''
	var a = req.query.limit?req.query.limit:0;
	var limit = parseInt(a)
	var page = req.query.page?req.query.page:1;
	var offset = (page -1) * limit;
	var TotolCount = 0;
    if (decoded.UserType == 0) {
		res.send({error:1,result:{msg:'你没有权限操作使用试卷库'}})
    } else {
    	routeSql.MyExamBase.count({where:{CreatorUserId:decoded.Id,Title:{$like:'%' + msg + '%'}}}).then(function(count){
    		TotolCount = count
	    	routeSql.MyExamBase.findAll({where:{CreatorUserId:decoded.Id,Title:{$like:'%' + msg + '%'}},offset:offset,limit:limit,attributes:['Id','Title','CreationTime'],order:[['CreationTime','DESC']]}).then(function(ExamBaseData){
	    		res.send({error:0,result:ExamBaseData,TotolCount:TotolCount})
	    	})
    	})
    }
})

// router.get('/SearchExam',function(req,res){
//     var token = req.headers.token;
//     var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
//     var msg = req.query.Msg
//     if (decoded.UserType == 0) {
// 		res.send({error:1,result:{msg:'你没有权限操作使用试卷库'}})
//     } else {
//     	routeSql.MyExamBase.findAll({where:{CreatorUserId:decoded.Id,Title:{$like:'%' + msg + '%'}},attributes:['Id','Title','CreationTime'],order:[['CreationTime','DESC']]}).then(function(ExamBaseData){
//     		res.send({error:0,result:ExamBaseData})
//     	})
//     }
// })

router.post('/DestroyExam',function(req,res){
	console.log(req.body)
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.MyExamBase.findOne({where:{Id:req.body.ExamBaseId}}).then(function(ExamBaseData){
    	// console.log('1111')
    	if (ExamBaseData.dataValues.CreatorUserId == decoded.Id) {
    		routeSql.MyExamQuestion.destroy({where:{MyExamBaseId:req.body.ExamBaseId}}).then(function(){
    			routeSql.MyExam.findAll({where:{MyExamBaseId:req.body.ExamBaseId}}).then(function(MyExamDataArr){
    				ExamDataArrEach(MyExamDataArr)
    				function ExamDataArrEach(MyExamDataArr){
    					var MyExamData = MyExamDataArr.shift();
    					if (MyExamData) {
	    					routeSql.ExamResult.update({IsDeleted:true},{where:{ExamId:MyExamData.dataValues.Id}}).then(function(){
	    						routeSql.MyExam.destroy({where:{Id:MyExamData.dataValues.Id}}).then(function(){
	    							ExamDataArrEach(MyExamDataArr)
	    						})
	    					})
    					} else {
				    		routeSql.MyExamBase.destroy({where:{Id:req.body.ExamBaseId}}).then(function(){
				    			// console.log('2222')
				    			res.send({error:0,result:{msg:'删除成功'}})
				    		})
    					}
    				}
    			})
    		})
    	} else {
    		res.send({error:1,result:{msg:'你没有权限操作使用该试卷'}})
    	}
    })
})

router.get('/CreateNewExam',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (decoded.UserType == 0) {
    	res.send({error:1,result:{msg:'你没有权限操作使用试卷库'}})
    } else {
    	routeSql.MyExamBase.create({Title:'试卷名称',CountScore:5,PassScore:3,CreatorUserId:decoded.Id}).then(function(ExamData){
    		routeSql.MyExamQuestion.max(['ShowOrder'],{where:{MyExamBaseId:ExamData.dataValues.Id}}).then(function(ShowOrder){
    			if (!ShowOrder) {ShowOrder = 0}
    			routeSql.MyQuestions.create({Title:'请输入题目',Pattern:0,CreatorUserId:decoded.Id,ExamQuestionofMyQuestions:[{MyExamBaseId:ExamData.dataValues.Id,ShowOrder:ShowOrder+1,ScoreValue:5,Pattern:0}]},{include:[{model:routeSql.MyExamQuestion,as:'ExamQuestionofMyQuestions'}]}).then(function(QuesData){
					routeSql.MyQuestionOption.create({Title:'选项一',IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
					routeSql.MyQuestionOption.create({Title:'选项二',IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
		    		res.send({error:0,result:{Id:ExamData.dataValues.Id,Title:ExamData.dataValues.Title}})
    			})
    		})
    	})
    }
})

function UpdateScore(Id){
	var CountScore = 0;
	routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:Id},attributes:['ScoreValue']}).then(function(QuestionsValueArr){
		sumScore(QuestionsValueArr)
	})
	function sumScore(QuestionsValueArr){
		var valueData = QuestionsValueArr.shift()
		if (valueData) {
			CountScore += valueData.dataValues.ScoreValue
			sumScore(QuestionsValueArr)
		} else {
			var PassScore = Math.round(parseInt(CountScore) * 0.6)//四舍五入
			// console.log(PassScore+' '+CountScore)
			routeSql.MyExamBase.update({PassScore:PassScore,CountScore:CountScore},{where:{Id:Id}})
		}
	}
}

router.post('/EditExam',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.MyExamBase.findOne({where:{Id:req.body.ExamBaseId}}).then(function(ExamBaseData){
		if (decoded.Id == ExamBaseData.dataValues.CreatorUserId) {
			if (req.body.ExamBaseTitle == '' || req.body.ExamBaseTitle == null) {
                    res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
                } else {
                    if (req.body.ExamBaseTitle.length <= 50) {
						// var PassScore = Math.round(parseInt(req.body.ExamCountScore)*0.6)//四舍五入
						routeSql.MyExamBase.update({Title:req.body.ExamBaseTitle},{where:{Id:req.body.ExamBaseId}}).then(function(ExamData){
							res.send({error:0,result:{msg:'试卷题目修改成功'}})
						})
                    } else {
	                    res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
	                }
                }
		} else {
			res.send({error:1,result:{msg:'你没有权限操作使用试卷库'}})
		}
	})
})

router.post('/CreateNewQuestions',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	routeSql.MyExamBase.findOne({where:{Id:req.body.ExamBaseId}}).then(function(ExamBaseData){
		// console.log()
		if (decoded.Id == ExamBaseData.dataValues.CreatorUserId) {
			// if (req.body.Pattern == 0) {} else if (req.body.Pattern == 1) {} else {}
			routeSql.MyExamQuestion.max(['ShowOrder'],{where:{MyExamBaseId:req.body.ExamBaseId}}).then(function(ShowOrder){
				if (!ShowOrder) {ShowOrder = 0}
				// if (true) {} else if (true) {} else {}
				routeSql.MyQuestions.create({Title:'请输入题目',Pattern:req.body.Pattern,CreatorUserId:decoded.Id,ExamQuestionofMyQuestions:[{MyExamBaseId:req.body.ExamBaseId,ShowOrder:ShowOrder+1,ScoreValue:req.body.ScoreValue,Pattern:req.body.Pattern}]},{include:[{model:routeSql.MyExamQuestion,as:'ExamQuestionofMyQuestions'}]}).then(function(QuesData){
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
					UpdateScore(req.body.ExamBaseId)
					res.send({error:0,result:{msg:'创建成功'}})
				})
			})
		} else {
			res.send({error:1,result:{msg:'你没有权限操作该试卷'}})
		}
	})
})

router.post('/EditQuestion',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.MyQuestions.findOne({where:{Id:req.body.MyQuestionsId}}).then(function(MyQuestionData){
		if (MyQuestionData.dataValues.CreatorUserId == decoded.Id) {
			if (req.body.Title == '' || req.body.Title == null) {
				res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
			} else {
				if (req.body.Title.length <= 100) {
					routeSql.MyQuestions.update({Title:req.body.Title,LastModificationTime:new Date(),LastModifierUserId:decoded.Id},{where:{Id:req.body.MyQuestionsId,IsDeleted:false}}).then(function(){
						res.send({error:0,result:{msg:'题目修改成功'}})
					})
				} else {
					res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
				}
			}
		} else {
			res.send({error:1,result:{msg:'你没有权限操作该试题'}})
		}
	})
})

router.post('/RemoveQuestion',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.MyExamBase.findOne({where:{Id:req.body.ExamBaseId}}).then(function(ExamBaseData){
		if (decoded.Id == ExamBaseData.dataValues.CreatorUserId) {
			routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:req.body.ExamBaseId}}).then(function(ExamQuesArr){
				if (ExamQuesArr.length > 1) {
					routeSql.MyExamQuestion.destroy({where:{MyExamBaseId:req.body.ExamBaseId,QuestionId:req.body.QuestionId}}).then(function(){
						UpdateScore(req.body.ExamBaseId)
						res.send({error:0,result:{msg:'试题从此试卷删除成功'}})
					})
				} else {
					res.send({error:2,result:{msg:'每张试卷必须保留一道题'}})
				}
			})
		} else {
			res.send({error:1,result:{msg:'你没有权限操作该试题'}})
		}
	})
})

router.post('/ChangeQuesPosition',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var ExchangeShowOrder;
	var CurrentShowOrder;
	routeSql.MyExamQuestion.max(['ShowOrder'],{where:{MyExamBaseId:req.body.ExamBaseId}}).then(function(ShowOrder){
		ExchangeShowOrder = ShowOrder;
	})
	routeSql.MyExamBase.findOne({where:{Id:req.body.ExamBaseId}}).then(function(ExamBaseData){
		if (decoded.Id == ExamBaseData.dataValues.CreatorUserId) {
			routeSql.MyExamQuestion.findAll({where:{QuestionId:req.body.ExchangeQuestionId,MyExamBaseId:req.body.ExamBaseId}}).then(function(ExchangeData){
				if (ExchangeData.length > 0) {
					ExchangeShowOrder = ExchangeData[0].dataValues.ShowOrder
				}
				routeSql.MyExamQuestion.findOne({where:{QuestionId:req.body.CurrentQuestionId,MyExamBaseId:req.body.ExamBaseId}}).then(function(CurrentData){
					CurrentShowOrder = CurrentData.dataValues.ShowOrder;
					if (CurrentShowOrder > ExchangeShowOrder) {
						routeSql.MyExamQuestion.update({ShowOrder:ExchangeShowOrder},{where:{QuestionId:req.body.CurrentQuestionId,MyExamBaseId:req.body.ExamBaseId}}).then(function(){
							routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:req.body.ExamBaseId,ShowOrder:{$gte:ExchangeShowOrder},QuestionId:{$ne:req.body.CurrentQuestionId}}}).then(function(arr){
								ChangeQuesPosition(arr)
							})
						})
					} else {
						routeSql.MyExamQuestion.update({ShowOrder:ExchangeShowOrder + 1},{where:{QuestionId:req.body.CurrentQuestionId,MyExamBaseId:req.body.ExamBaseId}})
							routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:req.body.ExamBaseId,ShowOrder:{$gt:ExchangeShowOrder},QuestionId:{$ne:req.body.CurrentQuestionId}}}).then(function(arr){
								ChangeQuesPosition(arr)
							})
					}
				})
			})
		} else {
			res.send({error:1,result:{msg:'你没有权限操作该试题'}})
		}
	})
	function ChangeQuesPosition(arr){
		var data = arr.shift()
		if (data) {
			routeSql.MyExamQuestion.update({ShowOrder:data.dataValues.ShowOrder + 1},{where:{Id:data.dataValues.Id}}).then(function(){ChangeQuesPosition(arr)})
		} else {
			res.send({error:0,result:{msg:'位置调换成功'}})
		}
	}
})

router.post('/QuesUpAndDown',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var nowOrder = 0,preOrder = 0,nextOrder = 0;
	routeSql.MyExamBase.findOne({where:{Id:req.body.ExamBaseId}}).then(function(ExamBaseData){
		if (ExamBaseData.dataValues.CreatorUserId == decoded.Id) {
			routeSql.MyExamQuestion.findOne({where:{QuestionId:req.body.QuestionId,MyExamBaseId:req.body.ExamBaseId}}).then(function(nowData){
				nowOrder=nowData.dataValues.ShowOrder;
				if (req.body.upAndDown == 0) {
					routeSql.MyExamQuestion.max(['ShowOrder'],{where:{MyExamBaseId:req.body.ExamBaseId,ShowOrder:{$lt:nowOrder}}}).then(function(ShowOrder){
						if (!ShowOrder) {
							res.send({error:2,result:{msg:'已经是第一个了，不能再上了'}})
						} else {
							preOrder = ShowOrder;
							routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:req.body.ExamBaseId,ShowOrder:preOrder}}).then(function(preData){
								routeSql.MyExamQuestion.update({ShowOrder:nowOrder},{where:{Id:preData.dataValues.Id}})
								routeSql.MyExamQuestion.update({ShowOrder:preOrder},{where:{Id:nowData.dataValues.Id}}).then(function(){
									res.send({error:0,result:{msg:'交换成功'}})
								})
							})
						}
					})
				} else {
					routeSql.MyExamQuestion.min(['ShowOrder'],{where:{MyExamBaseId:req.body.ExamBaseId,ShowOrder:{$gt:nowOrder}}}).then(function(ShowOrder){
						if (!ShowOrder) {
							res.send({error:2,result:{msg:'已经是最后一个了，不能再下了'}})
						} else {
							nextOrder = ShowOrder;
							routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:req.body.ExamBaseId,ShowOrder:nextOrder}}).then(function(nextData){
								routeSql.MyExamQuestion.update({ShowOrder:nowOrder},{where:{Id:nextData.dataValues.Id}})
								routeSql.MyExamQuestion.update({ShowOrder:nextOrder},{where:{Id:nowData.dataValues.Id}}).then(function(){
									res.send({error:0,result:{msg:'交换成功'}})
								})
							})
						}
					})
				}
			})
		} else {
			res.send({error:1,result:{msg:'你没有权限操作该试题'}})
		}
	})
})

router.post('/AddNewOption',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.MyQuestions.findOne({where:{Id:req.body.QuestionId,IsDeleted:false}}).then(function(QuestionData){
		if (QuestionData.dataValues.CreatorUserId == decoded.Id) {
			routeSql.MyQuestionOption.max(['ShowOrder'],{where:{QuestionId:req.body.QuestionId}}).then(function(OptionShowOrder){
				if (!OptionShowOrder) {OptionShowOrder = 0}
					if (QuestionData.dataValues.Pattern != 2) {
						routeSql.MyQuestionOption.create({Title:'新建选项',IsAnswer:false,QuestionId:req.body.QuestionId,ShowOrder:OptionShowOrder + 1}).then(function(){
							res.send({error:0,result:{msg:'新建选项成功'}})
						})
					} else {
						res.send({error:1,result:{msg:'判断题不能添加选项'}})
					}
			})
		} else {
			res.send({error:1,result:{msg:'你没有权限操作使用试卷库'}})
		}
	})
})

router.post('/EditOption',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	routeSql.MyQuestionOption.findOne({where:{Id:req.body.OptionId,IsDeleted:false}}).then(function(OptionData){
		routeSql.MyQuestions.findOne({where:{Id:OptionData.dataValues.QuestionId,IsDeleted:false}}).then(function(QuestionData){
			if (QuestionData.dataValues.CreatorUserId == decoded.Id) {
				if (req.body.Title == '' || req.body.Title == null) {
					res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
				} else {
					if (req.body.Title.length <= 100) {
						routeSql.MyQuestionOption.update({Title:req.body.Title,LastModificationTime:new Date(),LastModifierUserId:decoded.Id},{where:{Id:req.body.OptionId,IsDeleted:false}}).then(function(){
							res.send({error:0,result:{msg:'试题选项修改成功'}})
						})
					} else {
						res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
					}
				}

			} else {
				res.send({error:1,result:{msg:'你没有权限操作该试题答案'}})
			}
		})
		// console.log(OptionData.dataValues)
		// console.log(decoded)
	})
})

router.post('/EditQuesClassify',function(req,res){
	console.log(req.body)
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.MyQuestions.findOne({where:{Id:req.body.MyQuestionsId,IsDeleted:false,CreatorUserId:decoded.Id}}).then(function(QuesData){
		if (QuesData) {
			if (req.body.MyQueClassifyId) {
				routeSql.MyQueClassify.findOne({where:{Id:req.body.MyQueClassifyId,IsDeleted:false,CreatorUserId:decoded.Id}}).then(function(ClassifyData){
					if (ClassifyData) {
						routeSql.MyQuestions.update({ClassifyId:req.body.MyQueClassifyId},{where:{Id:req.body.MyQuestionsId}}).then(function(){
							res.send({error:0,result:{msg:'试题分类修改完成'}})
						})
					} else {
						res.send({error:1,result:{msg:'没有该试题分类'}})
					}
				})
			} else {
				routeSql.MyQuestions.update({ClassifyId:req.body.MyQueClassifyId},{where:{Id:req.body.MyQuestionsId}}).then(function(){
					res.send({error:0,result:{msg:'试题分类修改完成'}})
				})
			}
		} else {
			res.send({error:1,result:{msg:'没有该试题'}});
		}
	})
})

router.post('/ChangeTrueOption',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	routeSql.MyQuestionOption.findOne({where:{Id:req.body.OptionId}}).then(function(OptionData){
		routeSql.MyQuestions.findOne({where:{Id:OptionData.dataValues.QuestionId,IsDeleted:false}}).then(function(QuestionData){
			// console.log('6666')
			// console.log(QuestionData.dataValues)
			// console.log(decoded)
			if (QuestionData.dataValues.CreatorUserId == decoded.Id) {
				if (QuestionData.dataValues.Pattern == 1) {
					// console.log('00000')
					routeSql.MyQuestionOption.findAll({where:{IsAnswer:true,QuestionId:QuestionData.dataValues.Id,IsDeleted:false}}).then(function(OptionTrueData){
						if (OptionTrueData.length == 1 && OptionTrueData[0].dataValues.Id == req.body.OptionId) {
							res.send({error:2,result:{msg:'最低要有一个正确选项'}})
							// console.log('222222')
						} else {
							routeSql.MyQuestionOption.update({IsAnswer:!OptionData.dataValues.IsAnswer},{where:{Id:req.body.OptionId,QuestionId:QuestionData.dataValues.Id}}).then(function(){
								res.send({error:0,result:{msg:'更改答案选项成功'}})
								// console.log('111111')
							})
						}
					})
				} else {
					// console.log('5555')
					routeSql.MyQuestionOption.update({IsAnswer:false},{where:{QuestionId:QuestionData.dataValues.Id}}).then(function(){
						// console.log('888')
						routeSql.MyQuestionOption.update({IsAnswer:true},{where:{Id:req.body.OptionId,QuestionId:QuestionData.dataValues.Id}}).then(function(){
							res.send({error:0,result:{msg:'更改答案选项成功'}})
							// console.log('33333')
						})
					})
				}
			} else {
				// console.log('44444')
				res.send({error:1,result:{msg:'你没有权限操作该试题答案'}})
			}
		})
	})
})

router.post('/DestroyOption',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.MyQuestionOption.findOne({where:{Id:req.body.OptionId}}).then(function(OptionData){
		routeSql.MyQuestions.findOne({where:{Id:OptionData.dataValues.QuestionId}}).then(function(QuestionData){
			if (decoded.Id == QuestionData.dataValues.CreatorUserId) {
				routeSql.MyQuestionOption.findAll({where:{IsAnswer:true,QuestionId:OptionData.dataValues.QuestionId,IsDeleted:false}}).then(function(OptionTrueData){
					if (OptionTrueData.length == 1 && OptionTrueData[0].dataValues.Id == req.body.OptionId) {
						res.send({error:2,result:{msg:'最少有有一个正确选项'}})
					} else {
						routeSql.MyQuestionOption.update({IsDeleted:true},{where:{Id:req.body.OptionId,QuestionId:OptionData.dataValues.QuestionId}}).then(function(){
							res.send({error:0,result:{msg:'选项从此试题删除成功'}})
						})
					}
				})
			} else {
				res.send({error:1,result:{msg:'你没有权限操作该试题'}})
			}
		})
	})
})

router.post('/OptionUpAndDown',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	var nowOrder = 0,preOrder = 0,nextOrder = 0;
	routeSql.MyQuestions.findOne({where:{Id:req.body.QuestionId}}).then(function(QuesData){
		// console.log(QuesData)
		if (QuesData.dataValues.CreatorUserId == decoded.Id) {
			routeSql.MyQuestionOption.findOne({where:{Id:req.body.OptionId}}).then(function(nowData){
				nowOrder = nowData.dataValues.ShowOrder;
				if (req.body.upAndDown == 0) {
					routeSql.MyQuestionOption.max(['ShowOrder'],{where:{ShowOrder:{$lt:nowOrder},QuestionId:req.body.QuestionId}}).then(function(ShowOrder){
						if (!ShowOrder) {
							res.send({error:2,result:{msg:'已经是第一个了，不能再上了'}})
						} else {
							preOrder = ShowOrder;
							routeSql.MyQuestionOption.findOne({where:{ShowOrder:preOrder,QuestionId:req.body.QuestionId}}).then(function(preData){
								routeSql.MyQuestionOption.update({ShowOrder:nowOrder},{where:{Id:preData.dataValues.Id}})
								routeSql.MyQuestionOption.update({ShowOrder:preOrder},{where:{Id:nowData.dataValues.Id}}).then(function(){
									res.send({error:0,result:{msg:'交换成功'}})
								})
							})
						}
					})
				} else {
					routeSql.MyQuestionOption.min(['ShowOrder'],{where:{ShowOrder:{$gt:nowOrder},QuestionId:req.body.QuestionId}}).then(function(ShowOrder){
						if (!ShowOrder) {
							res.send({error:2,result:{msg:'已经是最后一个了，不能再下了'}})
						} else {
							nextOrder = ShowOrder;
							routeSql.MyQuestionOption.findOne({where:{ShowOrder:nextOrder,QuestionId:req.body.QuestionId}}).then(function(nextData){
								routeSql.MyQuestionOption.update({ShowOrder:nowOrder},{where:{Id:nextData.dataValues.Id}})
								routeSql.MyQuestionOption.update({ShowOrder:nextOrder},{where:{Id:nowData.dataValues.Id}}).then(function(){
									res.send({error:0,result:{msg:'交换成功'}})
								})
							})
						}
					})
				}
			})
		} else {
			res.send({error:1,result:{msg:'你没有权限操作该试题'}})
		}
	})
})

router.get('/ChooseBankQues',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var msg = req.query.Msg
	routeSql.QuesBank.findAll({where:{CreatorUserId:decoded.Id},attributes:[],include:[{model:routeSql.MyQuestions,as:'QuesBankQuestions',where:{Pattern:req.query.Pattern,Title:{$like:'%' + msg + '%'}},attributes:['Id','Title']}]}).then(function(arr){
		res.send({error:0,result:arr})
	})
})
router.post('/ChooseBankQues',function(req,res){
	var QuestionsIdArr = req.body.QuestionsIdArr
	SavetoExam(QuestionsIdArr)
	function SavetoExam(QuestionsIdArr){
		var QuestionId = QuestionsIdArr.shift()
		var ShowOrder
		if (QuestionId) {
			routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:req.body.ExamBaseId,QuestionId:QuestionId}}).then(function(ExistQues){
				if (!ExistQues) {
					routeSql.MyExamQuestion.max(['ShowOrder'],{where:{MyExamBaseId:req.body.ExamBaseId}}).then(function(ShowOrder){
						if (!ShowOrder) {ShowOrder = 0}
						routeSql.MyQuestions.findOne({where:{Id:QuestionId,IsDeleted:false}}).then(function(QuestionData){
							var ScoreValue;
							if (QuestionData.dataValues.Pattern == 0) {
								ScoreValue = req.body.SingleScoreValue
							} else if (QuestionData.dataValues.Pattern == 1) {
								ScoreValue = req.body.MultipleScoreValue
							} else {
								ScoreValue = req.body.JudgeScoreValue
							}
							routeSql.MyExamQuestion.create({QuestionId:QuestionId,MyExamBaseId:req.body.ExamBaseId,ShowOrder:ShowOrder + 1,ScoreValue:ScoreValue,Pattern:QuestionData.dataValues.Pattern}).then(function(){
								SavetoExam(QuestionsIdArr);
							})
						})
					})
				} else {
					SavetoExam(QuestionsIdArr);
				}
			})
		} else {
			UpdateScore(req.body.ExamBaseId)
			res.send({error:0,result:{msg:'试题添加到试卷中成功'}})
		}
	}
})

router.post('/SaveToBank',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log('000000000000000000000000000000')
	if (decoded.UserType > 0) {
		var SaveToBankArr = []
		if (req.body.SaveToBankArr) {
			SaveToBankArr = req.body.SaveToBankArr
		}
		// console.log('111111111111111111111111')
		// console.log(req.body.SaveToBankArr)
		SaveToBank(SaveToBankArr)
	} else {
		res.send({error:1,result:{msg:'你没有操作权限'}})
	}
    function SaveToBank(arr){
    	var QuestionId = arr.shift()
    	// console.log(QuestionId)
    	if (QuestionId) {
    		// console.log('111111111111111111111111')
	    	routeSql.QuesBank.findOne({where:{QuestionId:QuestionId,CreatorUserId:decoded.Id}}).then(function(BankArr){
	    		if (!BankArr) {
	    			// console.log('222222222222222')
	    			// console.log(typeof(QuestionId))
	    			var Id = parseInt(QuestionId)
	    			routeSql.QuesBank.create({QuestionId:Id,CreatorUserId:decoded.Id}).then(function(){
	    				// console.log('33333333333333333333333333')
	    				SaveToBank(arr)
	    			})
	    		} else {SaveToBank(arr)}
	    	})
    	} else {
    		res.send({error:0,result:{msg:'保存成功'}})
    	}
    }
})

router.post('/ChangeQuesVal',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.MyExamBase.findOne({where:{Id:req.body.ExamBaseId}}).then(function(ExamBaseData){
    	if (ExamBaseData.dataValues.CreatorUserId == decoded.Id) {
    		routeSql.MyExamQuestion.update({ScoreValue:req.body.ScoreValue},{where:{MyExamBaseId:req.body.ExamBaseId,Pattern:req.body.Pattern}}).then(function(){
    			UpdateScore(req.body.ExamBaseId)
    			res.send({error:0,result:{msg:'题目分数修改成功'}})
    		})
    	}else{
    		res.send({error:1,result:{msg:'你没有权限操作使用该试卷'}})
    	}
    })
})

// 不用了
// router.post('/CreateExam',function(req,res){
//     var token = req.headers.token;
//     var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
//     var Questions = req.body.Questions
//     var ExamDataId
//     if (decoded.UserType == 0) {
//     	res.send({error:1,result:{msg:'你没有权限操作使用试卷库'}})
//     } else {
//     	routeSql.MyExamBase.create({Title:req.body.ExamTitle,CountScore:req.body.ExamCountScore,PassScore:req.body.ExamPassScore,CreatorUserId:decoded.Id}).then(function(ExamData){
// 		    var QuesCount = 1;
// 		    ExamDataId = ExamData.dataValues.Id
//     		CreateQues(ExamDataId,Questions,QuesCount)
//     	})
//     }
//     function CreateQues(ExamDataId,Questions,QuesCount){
//     	var Ques = Questions.shift()
//     	if (Ques) {
//     		routeSql.MyQuestions.create({Title:Ques.Title,Pattern:Ques.Pattern,CreatorUserId:decoded.Id,ExamQuestionofMyQuestions:[{MyExamBaseId:ExamDataId,ShowOrder:QuesCount,ScoreValue:Ques.ScoreValue,Pattern:Ques.Pattern}]},{include:[{model:routeSql.MyExamQuestion,as:'ExamQuestionofMyQuestions'}]}).then(function(QuesData){
//     			QuesCount++;
//     			var ShowOrder = 1
//     			// console.log(ExamDataId)
//     			CreateOption(Ques.Options,QuesData,ShowOrder,ExamDataId,QuesCount)
//     			// CreateQues(ExamData,Questions)
//     		})
//     	} else {
//     		res.send({error:0,result:{msg:'试卷创建成功'}})
//     	}
//     }
//     function CreateOption(Options,QuesData,ShowOrder,ExamDataId,QuesCount){
//     	var option = Options.shift()
//     	if (option) {
//     		routeSql.MyQuestionOption.create({Title:option.Title,IsAnswer:option.IsAnswer,QuestionId:QuesData.dataValues.Id,ShowOrder:ShowOrder}).then(function(){
//     			ShowOrder++;
//     			CreateOption(Options,QuesData,ShowOrder,ExamDataId,QuesCount)
//     		})
//     	} else {
//     		CreateQues(ExamDataId,Questions,QuesCount)
//     	}
//     }
// })

router.get('/PreviewExam',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var result = {}
	// console.log(req.query.ExamBaseId)
    routeSql.MyExamBase.findOne({where:{Id:req.query.ExamBaseId}}).then(function(ExamBaseData){
    	// console.log(ExamBaseData)
    	if (ExamBaseData) {
	    	if (ExamBaseData.dataValues.CreatorUserId == decoded.Id) {
	    		UpdateScore(req.query.ExamBaseId)
	    		routeSql.MyExamBase.findOne({where:{Id:req.query.ExamBaseId},attributes:['Id','Title','CountScore','PassScore']}).then(function(ExamData){
	    			result.ExamData = ExamData.dataValues
					routeSql.MyExamQuestion.count({where:{MyExamBaseId:req.query.ExamBaseId,Pattern:0}}).then(function(SingleCount){
						result.ExamData.SingleCount = SingleCount
					})
					routeSql.MyExamQuestion.count({where:{MyExamBaseId:req.query.ExamBaseId,Pattern:1}}).then(function(MultipleCount){
						result.ExamData.MultipleCount = MultipleCount
					})
					routeSql.MyExamQuestion.count({where:{MyExamBaseId:req.query.ExamBaseId,Pattern:2}}).then(function(JudgeCount){
						result.ExamData.JudgeCount = JudgeCount
					})
					routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:req.query.ExamBaseId,Pattern:0}}).then(function(SingleData){
						if (SingleData) {
							result.ExamData.SingleScoreValue = SingleData.dataValues.ScoreValue
						} else {
							result.ExamData.SingleScoreValue = 5;
						}
					})
					routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:req.query.ExamBaseId,Pattern:1}}).then(function(SingleData){
						if (SingleData) {
							result.ExamData.MultipleScoreValue = SingleData.dataValues.ScoreValue
						} else {
							result.ExamData.MultipleScoreValue = 5;
						}
					})
					routeSql.MyExamQuestion.findOne({where:{MyExamBaseId:req.query.ExamBaseId,Pattern:2}}).then(function(SingleData){
						if (SingleData) {
							result.ExamData.JudgeScoreValue = SingleData.dataValues.ScoreValue
						} else {
							result.ExamData.JudgeScoreValue = 5;
						}
					})
					routeSql.MyExamQuestion.count({where:{MyExamBaseId:req.query.ExamBaseId}}).then(function(QuestionCount){
						result.QuestionCount = QuestionCount;
			    		routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:req.query.ExamBaseId},attributes:['ShowOrder','ScoreValue','Pattern'],
			    			order:[['ShowOrder','ASC'],[{model:routeSql.MyQuestions,as:'ExamQuestionofMyQuestions'},{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']],
			    			include:[{model:routeSql.MyQuestions,as:'ExamQuestionofMyQuestions',attributes:['Id','Title','Pattern','Desc'],where:{IsDeleted:false},required:false,include:[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions',attributes:['Id','Title','ShowOrder','IsAnswer'],where:{IsDeleted:false},required:false}]}]}).then(function(data){
			    				result.data = data
			    				res.send({error:0,result:result})
			    			})
						
					})
	    		})
	    	} else {
	    		res.send({error:1,result:{msg:'你没有权限操作使用该试卷'}})
	    	}
    	} else {
    		res.send({error:2,result:{msg:'该试卷不存在'}})
    	}
    })
})

// router.post('/EditExam',function(req,res){})

module.exports = router;



