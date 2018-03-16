
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
var fs = require('fs')
var qrImage = require('qr-image')
app.set('jwtTokenSecret','JingGe');//设置token加密字段

router.post('/CreateProjectByModel',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body)
    if (decoded.UserType >= 1) {
    	fun1();
        function fun1(){
        	var str = Math.random().toString(36).substr(2,6);
        	// console.log(str)headers
            routeSql.TeachingActivity.findOne({where:{Id:req.body.ModelActivityId}}).then(function(ModelActivityData) {
            	routeSql.TeachingActivity.findAll({where:{IsDeleted:false,InviteCode:str}}).then(function(arr){
            		if(arr.length == 0){
                        routeSql.TeachingActivity.create({
                            Title:ModelActivityData.dataValues.Title,
                            Desc:ModelActivityData.dataValues.Desc,
                            InviteCode:str,
                            CreatorUserId:decoded.Id,
                            IsPublic:false,
                            Img:ModelActivityData.dataValues.Img
                        }).then(function(data){
                            var sData = {Info:{id:data.dataValues.Id,InviteCode:str},Command:2,uid:null};
                            var s = new Buffer(JSON.stringify(sData)).toString('base64');
                            if (!fs.existsSync('./www/Activity')) {fs.mkdirSync('./www/Activity')}
                            var tempQrcode = qrImage.image(Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/SharePages/Activity.html?jsonstr=' + s,{type:'png'});
                            var imgName = `${data.dataValues.InviteCode}.png`
                            tempQrcode.pipe(fs.createWriteStream('./www/Activity/' + imgName))
                            routeSql.TeachingActivity.update({CodePath:'/Activity/' + data.dataValues.InviteCode + '.png'},{where:{Id:data.dataValues.Id}}).then(function(){
                            	// res.send({error:0,result:{msg:'创建成功',ActivityId:data.dataValues.Id}})
                            	routeSql.TeachingLink.findAll({where:{TeachingActivityId:req.body.ModelActivityId,IsDeleted:false},order:[['ShowSort','ASC']]}).then(function(AllLink){
                            		copyLink(AllLink)
                            		function copyLink(AllLink){
                            			var LinkData = AllLink.shift()
                            			if (LinkData) {
                            				routeSql.TeachingLink.create({Title:LinkData.dataValues.Title,ShowSort:LinkData.dataValues.ShowSort,TaskCount:LinkData.dataValues.TaskCount,Desc:LinkData.dataValues.Desc,TeachingActivityId:data.dataValues.Id,CreatorUserId:decoded.Id}).then(function(newLinkData){
                            					routeSql.TeachingTask.findAll({where:{TeachingLinkId:LinkData.dataValues.Id,IsDeleted:false},order:[['ShowSort','ASC']]}).then(function(AllTask){
                            						copyTask(AllTask)
                            						function copyTask(AllTask){
                            							var TaskData = AllTask.shift()
                            							if (TaskData) {
    	                        							routeSql.TeachingTask.create({TeachingLinkId:newLinkData.dataValues.Id,Title:TaskData.dataValues.Title,ShowSort:TaskData.dataValues.ShowSort,Desc:TaskData.dataValues.Desc,CreatorUserId:decoded.Id}).then(function(newTaskData){
    	                        								routeSql.TeachingDetail.findAll({where:{TeachingTaskId:TaskData.dataValues.Id}}).then(function(AllDetail){
    	                        									copyDetail(AllDetail)
    	                        									function copyDetail(AllDetail){
    	                        										var DetailData = AllDetail.shift()
    	                        										if (DetailData) {
    	                        											if (DetailData.dataValues.Type == 0) {
    	                        												routeSql.TeachingDetail.create({Title:DetailData.dataValues.Title,Type:DetailData.dataValues.Type,ModelId:DetailData.dataValues.ModelId,TeachingActivityId:data.dataValues.Id,TeachingTaskId:newTaskData.dataValues.Id}).then(function(){
    	                        													copyDetail(AllDetail)
    	                        												})
    	                        											} else if (DetailData.dataValues.Type == 1) {
                                                                                routeSql.MyExam.findOne({where:{Id:DetailData.dataValues.ModelId}}).then(function(MyExamData){
                                                                                    routeSql.MyExamBase.findOne({where:{Id:MyExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
                                                                                        routeSql.MyExamBase.create({Title:ExamBaseData.dataValues.Title,PassScore:ExamBaseData.dataValues.PassScore,CountScore:ExamBaseData.dataValues.CountScore,CreatorUserId:decoded.Id,CreationTime:new Date()}).then(function(newExamBaseData){
                                                                                            routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:MyExamData.dataValues.MyExamBaseId}}).then(function(ExamQuesArr){
                                                                                                copyQuestionArr(ExamQuesArr)
                                                                                                function copyQuestionArr(ExamQuesArr){
                                                                                                    var ExamQuesData = ExamQuesArr.shift()
                                                                                                    if (ExamQuesData) {
                                                                                                        routeSql.MyQuestions.findOne({where:{Id:ExamQuesData.dataValues.QuestionId}}).then(function(QuesData){
                                                                                                            routeSql.MyQuestions.create({Title:QuesData.dataValues.Title,Pattern:QuesData.dataValues.Pattern,CreatorUserId:decoded.Id,ExamQuestionofMyQuestions:[{MyExamBaseId:newExamBaseData.dataValues.Id,ShowOrder:ExamQuesData.dataValues.ShowOrder,ScoreValue:ExamQuesData.dataValues.ScoreValue,Pattern:ExamQuesData.dataValues.Pattern}]},{include:[{model:routeSql.MyExamQuestion,as:'ExamQuestionofMyQuestions'}]}).then(function(newQuesData){
                                                                                                                if (newQuesData.dataValues.Pattern == 0) {
                                                                                                                    routeSql.MyQuestionOption.create({Title:'选项一',IsAnswer:true,QuestionId:newQuesData.dataValues.Id,ShowOrder:1})
                                                                                                                    routeSql.MyQuestionOption.create({Title:'选项二',IsAnswer:false,QuestionId:newQuesData.dataValues.Id,ShowOrder:2})
                                                                                                                } else if (newQuesData.dataValues.Pattern == 1) {
                                                                                                                    routeSql.MyQuestionOption.create({Title:'选项一',IsAnswer:true,QuestionId:newQuesData.dataValues.Id,ShowOrder:1})
                                                                                                                    routeSql.MyQuestionOption.create({Title:'选项二',IsAnswer:false,QuestionId:newQuesData.dataValues.Id,ShowOrder:2})
                                                                                                                    routeSql.MyQuestionOption.create({Title:'选项三',IsAnswer:false,QuestionId:newQuesData.dataValues.Id,ShowOrder:3})
                                                                                                                } else {
                                                                                                                    routeSql.MyQuestionOption.create({Title:'正确',IsAnswer:true,QuestionId:newQuesData.dataValues.Id,ShowOrder:1})
                                                                                                                    routeSql.MyQuestionOption.create({Title:'错误',IsAnswer:false,QuestionId:newQuesData.dataValues.Id,ShowOrder:2})
                                                                                                                }
                                                                                                                copyQuestionArr(ExamQuesArr)
                                                                                                            })
                                                                                                        })
                                                                                                    } else {
                                                                                                        routeSql.MyExam.create({Title:MyExamData.dataValues.Title,EndDate:new Date(DateAdd('d',32,new Date(new Date().toString()))),TimeLong:MyExamData.dataValues.TimeLong,MyExamBaseId:newExamBaseData.dataValues.Id,StartDate:new Date(DateAdd('d',31,new Date(new Date().toString())))}).then(function(newMyExamData){
                                                                                                            routeSql.TeachingDetail.create({Title:newMyExamData.dataValues.Title,Type:DetailData.dataValues.Type,ModelId:newMyExamData.dataValues.Id,TeachingActivityId:data.dataValues.Id,TeachingTaskId:newTaskData.dataValues.Id}).then(function(){
                                                                                                                copyDetail(AllDetail)
                                                                                                            })
                                                                                                        })
                                                                                                    }
                                                                                                }
                                                                                            })
                                                                                        })
                                                                                    })
                                                                                })
                                                                            } else if (DetailData.dataValues.Type == 2) {
    	                        												routeSql.HomeWork.findOne({where:{Id:DetailData.dataValues.ModelId},include:[{model:routeSql.HomeWorkAnswer,as:'HomeWorkAnswer'}]}).then(function(HomeWorkData){
                                                                                    console.log(HomeWorkData.dataValues)
                                                                                    routeSql.HomeWorkAnswer.create({Desc:HomeWorkData.dataValues.HomeWorkAnswer.Desc}).then(function(AnswerData){
                                                                                        routeSql.HomeWork.create({Title:HomeWorkData.dataValues.Title,Desc:HomeWorkData.dataValues.Desc,EndDate:new Date(DateAdd('q',1,new Date(new Date().toString()))),CreatorUserId:decoded.Id,AnswerId:AnswerData.dataValues.Id}).then(function(newHomeWorkData){
                                                                                            routeSql.TeachingDetail.create({Title:HomeWorkData.dataValues.Title,Type:2,ModelId:newHomeWorkData.dataValues.Id,TeachingActivityId:data.dataValues.Id,TeachingTaskId:newTaskData.dataValues.Id}).then(function(){
                                                                                                copyDetail(AllDetail)
                                                                                            })
                                                                                        })
                                                                                    })
    	                        													// routeSql.HomeWork.create({Title:HomeWorkData.dataValues.Title,Desc:HomeWorkData.dataValues.Desc,EndDate:new Date(DateAdd('q',1,new Date(new Date().toString()))),CreatorUserId:decoded.Id,HomeWorkAnswer:[{Desc:HomeWorkData.dataValues.HomeWorkAnswer.Desc}]}).then(function(newHomeWorkData){
    	                        													// 	routeSql.TeachingDetail.create({Title:HomeWorkData.dataValues.Title,Type:2,ModelId:newHomeWorkData.dataValues.Id,TeachingActivityId:data.dataValues.Id,TeachingTaskId:newTaskData.dataValues.Id}).then(function(){
    	                        													// 		copyDetail(AllDetail)
    	                        													// 	})
    	                        													// })
    	                        												})
    	                        											} else {
    	                        												routeSql.Questionnaires.findOne({where:{Id:DetailData.dataValues.ModelId}}).then(function(QuesData){
    	                        													fun1()
    																				function fun1(){
    																					var str = Math.random().toString(36).substr(2,6);
    																					routeSql.Questionnaires.findOne({where:{Code:str}}).then(function(QuestionnairesData){
    																						if (QuestionnairesData) {
    																							fun1()
    																						} else {
    																							routeSql.Questionnaires.create({Title:QuesData.dataValues.Title,Code:str,CreatorUserId:decoded.Id}).then(function(newQuesData){
    																								var sData = {Info:newQuesData.dataValues.Code}
    																								var s = new Buffer(JSON.stringify(sData)).toString('base64')
    																								if (!fs.existsSync('./www/Ques')) {fs.mkdirSync('./www/Ques')}
    																								var tempQrcode = qrImage.image(Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/SharePages/Questionnaires.html?jsonstr=' + s,{type:'png'})
    																								var imgName = `${newQuesData.dataValues.Code}.png`
    																								tempQrcode.pipe(fs.createWriteStream('./www/Ques/' + imgName))
    																								routeSql.Questionnaires.update({CodePath:'/Ques/' + newQuesData.dataValues.Code + '.png'},{where:{Id:newQuesData.dataValues.Id}}).then(function(){
    																									routeSql.TeachingDetail.create({Title:QuesData.dataValues.Title,Type:3,ModelId:newQuesData.dataValues.Id,TeachingTaskId:newTaskData.dataValues.Id,TeachingActivityId:data.dataValues.Id}).then(function(){
    																										routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:QuesData.dataValues.Id}}).then(function(QuesSurArr){
    																											copyQuesSur(QuesSurArr)
    																											function copyQuesSur(QuesSurArr){
    																												var QuesSurData = QuesSurArr.shift()
    																												if(QuesSurData){
    																													routeSql.QuestionSurveies.create({QuestionnaireId:newQuesData.dataValues.Id,Title:QuesSurData.dataValues.Title,OptionA:QuesSurData.dataValues.OptionA,OptionB:QuesSurData.dataValues.OptionB,OptionC:QuesSurData.dataValues.OptionC,OptionD:QuesSurData.dataValues.OptionD,Index:QuesSurData.dataValues.Index}).then(function(newQuesSurData){
    																														routeSql.QuestionnaireResults.create({QuestionSurveiesId:newQuesSurData.dataValues.Id,CountA:0,CountB:0,CountC:0,CountD:0}).then(function(){
    																															copyQuesSur(QuesSurArr)
    																														})
    																													})
    																												}else{
    																													copyDetail(AllDetail)
    																												}
    																											}
    																										})
    																									})
    																								})
    																							})
    																						}
    																					})
    																				}
    	                        												})
    	                        											}
    	                        										} else {
    	                        											copyTask(AllTask)
    	                        										}
    	                        									}
    	                        								})
    	                        							})
                            							} else {
                            								copyLink(AllLink)
                            							}
                            						}
                            					})
                            				})
                            			} else {
                            				res.send({error:0,result:{msg:'根据模板创建成功',ActivityId:data.dataValues.Id}})
                            			}
                            		}
                            	})
                            })
        			    })
            		}else{
            			fun1();
            		}
            	})
            })
        }
    } else {
        res.send({error:1,result:{msg:'你没有创建教学活动的权限'}})
    }
})


// router.get('/getExamInfo',function(req,res){
// 	var token = req.headers.token;
// 	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
// 	if (decoded.UserType == 0) {
// 		routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:req.body.ModelId,State:0}}).then(function(data){
// 			if (data) {} else {res.send({error:0,result:{msg:'现在无法参加考试'}})}
// 			console.log()
// 		})
// 	} else {}
// 	var result = {}
//     routeSql.MyExamBase.findOne({where:{Id:req.query.ExamBaseId}}).then(function(ExamBaseData){
//     	if (ExamBaseData.dataValues.CreatorUserId == decoded.Id) {
//     		UpdateScore(req.query.ExamBaseId)
//     		routeSql.MyExamBase.findOne({where:{Id:req.query.ExamBaseId},attributes:['Id','Title','CountScore','PassScore']}).then(function(ExamData){
//     			result.ExamData = ExamData.dataValues
// 				routeSql.MyExamQuestion.count({where:{MyExamBaseId:req.query.ExamBaseId}}).then(function(QuestionCount){
// 					result.QuestionCount = QuestionCount;
// 		    		routeSql.MyExamQuestion.findAll({where:{MyExamBaseId:req.query.ExamBaseId},attributes:['ShowOrder','ScoreValue','Pattern'],
// 		    			order:[['ShowOrder','ASC'],[{model:routeSql.MyQuestions,as:'ExamQuestionofMyQuestions'},{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions'},'ShowOrder','ASC']],
// 		    			include:[{model:routeSql.MyQuestions,as:'ExamQuestionofMyQuestions',attributes:['Id','Title','Pattern'],where:{IsDeleted:false},required:false,include:[{model:routeSql.MyQuestionOption,as:'QuestionOptiontoMyQuestions',attributes:['Id','Title','ShowOrder','IsAnswer'],where:{IsDeleted:false},required:false}]}]}).then(function(data){
// 		    				result.data = data
// 		    				res.send({error:0,result:result})
// 		    			})
					
// 				})
//     		})
//     	} else {
//     		res.send({error:1,result:{msg:'你没有权限操作使用该试卷'}})
//     	}
//     })
// })

// router.post('/EditExam',function(req,res){})

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


