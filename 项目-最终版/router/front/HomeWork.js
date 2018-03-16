var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var JoinToHomeWorkResult = require('./AddHomeWorkData.js')
var Notification = require('./AddNotification.js')

router.post('/CreateHomeWork',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId,IsDeleted:false}}).then(function(TeachingTaskData){
		if (TeachingTaskData) {
			if (TeachingTaskData.dataValues.CreatorUserId == decoded.Id) {
				var AnswerDataDesc = ''
				var Title = ''
				var Desc = ''
				if (req.body.AnswerData && req.body.AnswerData.Desc) {
					AnswerDataDesc = req.body.AnswerData.Desc
				}
				if (req.body.Title) {
					Title = req.body.Title
				}
				if (req.body.Desc) {
					Desc = req.body.Desc
				}
				if (AnswerDataDesc.length < 1024 && Title.length < 1024 && Desc.length < 1024) {
					routeSql.HomeWorkAnswer.create({Desc:AnswerDataDesc}).then(function(HomeWorkAnswerData){
						// console.log(req.body)
						var AnswerDataResources = []
						if (req.body.AnswerData.Resources) {
							AnswerDataResources = req.body.AnswerData.Resources
						}
						HomeWorkImage(AnswerDataResources)
						function HomeWorkImage(Resources){
							var ResourceId = Resources.shift()
							if (ResourceId) {
								routeSql.HomeWorkImage.findOne({where:{WorkType:2,WorkId:HomeWorkAnswerData.dataValues.Id,ResourceId:ResourceId}}).then(function(ImageData){
									if (!ImageData) {
										routeSql.HomeWorkImage.create({WorkType:2,WorkId:HomeWorkAnswerData.dataValues.Id,ResourceId:ResourceId}).then(function(){
											HomeWorkImage(Resources)
										})
									} else {
										HomeWorkImage(Resources)
									}
								})
							} else {
								// res.send({error:0,result:{AnswerId:HomeWorkAnswerData.dataValues.Id}})
								routeSql.HomeWork.create({Title:Title,Desc:Desc,EndDate:new Date(req.body.EndDate),CreatorUserId:decoded.Id,AnswerId:HomeWorkAnswerData.dataValues.Id}).then(function(HomeWorkData){
									var Resources = []
									if (req.body.Resources) {
										Resources = req.body.Resources
									}
									HomeWorkImage(Resources)
									function HomeWorkImage(Resources){
										var ResourceId = Resources.shift()
										if (ResourceId) {
											routeSql.HomeWorkImage.findOne({where:{WorkType:0,WorkId:HomeWorkData.dataValues.Id,ResourceId:ResourceId}}).then(function(ImageData){
												if (!ImageData) {
													routeSql.HomeWorkImage.create({WorkType:0,WorkId:HomeWorkData.dataValues.Id,ResourceId:ResourceId}).then(function(){
														HomeWorkImage(Resources)
													})
												} else {
													HomeWorkImage(Resources)
												}
											})
										} else {
											routeSql.TeachingDetail.create({Title:req.body.Title,Type:2,ModelId:HomeWorkData.dataValues.Id,TeachingTaskId:req.body.TeachingTaskId,TeachingActivityId:req.body.ActivityId}).then(function(DetailData){
												routeSql.TeachingDetail.findAll({where:{TeachingTaskId:req.body.TeachingTaskId},attributes:['Title','Type','ModelId']}).then(function(data){
													JoinToHomeWorkResult()
													Notification.Notification()
													Notification.TeacherNotification()
												    routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId},attributes:['Id','Title','Desc']}).then(function(Taskdata){
												        // console.log(data)
												        searchDetail(req.body.TeachingTaskId,req,res,Taskdata,decoded)
												        // JoinToExamResult()
												        // JoinToHomeWorkResult()
												    })
												})
											})
											// res.send({error:0,result:{Id:HomeWorkData.dataValues.Id,Type:2,Title:HomeWorkData.dataValues.Title}})
										}
										// routeSql.HomeWorkImage.create({WorkType:0,WorkId:HomeWorkData.dataValues.Id,ResourceId:ResourceId})
									}
								})
							}
						}
					})
				} else {
					// console.log('00000000000000000000000000000')
					res.send({error:2,result:{msg:'文字不得超过1024'}})
				}
			} else {
				res.send({error:1,result:{msg:'你没有权限往该任务添加作业'}})
			}
		} else {
			res.send({error:2,result:{msg:'该任务不存在'}})
		}
	})
	// if (decoded.Id > 0) {
	// 	console.log(new Date(req.body.EndDate))
	// 	routeSql.HomeWork.create({Title:req.body.Title,Desc:req.body.Desc,EndDate:new Date(req.body.EndDate),CreatorUserId:decoded.Id}).then(function(HomeWorkData){
	// 		HomeWorkImage(req.body.Resources)
	// 		function HomeWorkImage(Resources){
	// 			var ResourceId = Resources.shift()
	// 			if (ResourceId) {
	// 				routeSql.HomeWorkImage.create({WorkType:0,WorkId:HomeWorkData.dataValues.Id,ResourceId:ResourceId}).then(function(){
	// 					HomeWorkImage(Resources)
	// 				})
	// 			} else {
	// 				if (req.body.AnswerId) {
	// 					routeSql.HomeWork.update({AnswerId:req.body.AnswerId},{where:{Id:HomeWorkData.dataValues.Id}})
	// 				}
	// 				res.send({error:0,result:{Id:HomeWorkData.dataValues.Id,Title:HomeWorkData.dataValues.Title}})
	// 			}
	// 			// routeSql.HomeWorkImage.create({WorkType:0,WorkId:HomeWorkData.dataValues.Id,ResourceId:ResourceId})
	// 		}
	// 	})
	// } else {
	// 	res.send({error:1,result:{msg:'你没有权限操作创建作业'}})
	// }
})

router.post('/CreateHomeWorkAnswer',function(req,res){
	if (req.body.Desc.length < 1024) {
		if (req.body.AnswerId == 0) {
			routeSql.HomeWorkAnswer.create({Desc:req.body.Desc}).then(function(HomeWorkAnswerData){
				// console.log(req.body)
				var Resources = []
				if (req.body.Resources) {
					Resources = req.body.Resources
				}
				HomeWorkImage(Resources)
				function HomeWorkImage(Resources){
					var ResourceId = Resources.shift()
					if (ResourceId) {
						routeSql.HomeWorkImage.findOne({where:{WorkType:2,WorkId:HomeWorkAnswerData.dataValues.Id,ResourceId:ResourceId}}).then(function(ImageData){
							if (!ImageData) {
								routeSql.HomeWorkImage.create({WorkType:2,WorkId:HomeWorkAnswerData.dataValues.Id,ResourceId:ResourceId}).then(function(){
									HomeWorkImage(Resources)
								})
							} else {
								HomeWorkImage(Resources)
							}
						})
					} else {
						res.send({error:0,result:{AnswerId:HomeWorkAnswerData.dataValues.Id}})
					}
				}
			})
		} else {
			routeSql.HomeWorkAnswer.update({Desc:req.body.Desc},{where:{Id:req.body.AnswerId}}).then(function(){
				routeSql.HomeWorkImage.destroy({where:{WorkType:2,WorkId:req.body.AnswerId,ResourceId:req.body.DestroyResources}})
				var AddResources = []
				if (req.body.AddResources) {
					AddResources = req.body.AddResources
				}
				HomeWorkImage(AddResources)
				function HomeWorkImage(Resources){
					var ResourceId = Resources.shift()
					if (ResourceId) {
						routeSql.HomeWorkImage.findOne({where:{WorkType:2,WorkId:req.body.AnswerId,ResourceId:ResourceId}}).then(function(ImageData){
							if (!ImageData) {
								routeSql.HomeWorkImage.create({WorkType:2,WorkId:req.body.AnswerId,ResourceId:ResourceId}).then(function(){
									HomeWorkImage(Resources)
								})
							} else {
								HomeWorkImage(Resources)
							}
						})
					} else {
						res.send({error:0,result:{AnswerId:HomeWorkAnswerData.dataValues.Id}})
					}
				}
			})
		}
	} else {
		res.send({error:2,result:{msg:'文字不得超过1024'}})
	}
})

router.post('/ActivityHomeWork',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	if (decoded.UserType == 0) {
		routeSql.HomeWorkResult.findOne({where:{UserId:decoded.Id,HomeWorkId:req.body.HomeWorkId}}).then(function(HomeWorkResultData){
			if (HomeWorkResultData) {
				routeSql.HomeWork.findOne({where:{Id:req.body.HomeWorkId},include:[{model:routeSql.HomeWorkAnswer,as:'HomeWorkAnswer',attributes:['Desc']}]}).then(function(HomeWorkData){
					// console.log(req.body.HomeWorkId)
					routeSql.HomeWorkImage.findAll({where:{WorkId:req.body.HomeWorkId,WorkType:0},attributes:['ResourceId']}).then(function(HomeWorkFile){
						// console.log(HomeWorkFile)
						getFileArr(HomeWorkFile)
						function getFileArr(arr){
							var HomeWorkFiles = []
							FindAllResource(arr)
							function FindAllResource(arr){
								var HomeWorkImageData = arr.shift()
								if (HomeWorkImageData) {
									var ResourceId = HomeWorkImageData.dataValues.ResourceId;
									routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
										var HomeWorkResource = {}
										HomeWorkResource.FileName = ResourceData.dataValues.FileName;
										HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
										HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
										HomeWorkFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
										FindAllResource(arr)
									})
								} else {
									// console.log('++++++++++')
									routeSql.HomeWorkImage.findAll({where:{WorkId:HomeWorkResultData.dataValues.Id,WorkType:1},attributes:['ResourceId']}).then(function(HomeWorkResultFile){
										getFileArr(HomeWorkResultFile)
										function getFileArr(arr){
											var HomeWorkResultFiles = []
											FindAllResource(arr)
											function FindAllResource(arr){
												var HomeWorkImageData = arr.shift()
												if (HomeWorkImageData) {
													var ResourceId = HomeWorkImageData.dataValues.ResourceId;
													routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
														var HomeWorkResource = {}
														HomeWorkResource.FileName = ResourceData.dataValues.FileName;
														HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
														HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
														HomeWorkResultFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
														FindAllResource(arr)
													})
												} else {
													// console.log('===========')
													routeSql.HomeWorkImage.findAll({where:{WorkId:HomeWorkData.dataValues.AnswerId,WorkType:2},attributes:['ResourceId']}).then(function(HomeWorkAnswerFile){
														getFileArr(HomeWorkAnswerFile)
														function getFileArr(arr){
															var HomeWorkAnswerFiles = []
															FindAllResource(arr)
															function FindAllResource(arr){
																var HomeWorkImageData = arr.shift()
																if (HomeWorkImageData) {
																	var ResourceId = HomeWorkImageData.dataValues.ResourceId;
																	routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
																		var HomeWorkResource = {}
																		HomeWorkResource.FileName = ResourceData.dataValues.FileName;
																		HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
																		HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
																		HomeWorkAnswerFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
																		FindAllResource(arr)
																	})
																} else {
																	// console.log('--------------')
																	var IsHomeWorkEnd;
																	if (new Date() > new Date(HomeWorkData.dataValues.EndDate)) {
																		IsHomeWorkEnd = true
																	} else {
																		IsHomeWorkEnd = false
																	}
																	res.send({error:0,result:{
																		IsHomeWorkEnd:IsHomeWorkEnd,
																		HomeWorkResultData:{Answer:HomeWorkResultData.dataValues.Answer,State:HomeWorkResultData.dataValues.State,Evaluate:HomeWorkResultData.dataValues.Evaluate,HomeWorkId:HomeWorkResultData.dataValues.HomeWorkId,HandInDate:HomeWorkResultData.dataValues.HandInDate},HomeWorkResultFiles:HomeWorkResultFiles,
																		HomeWorkData:{Title:HomeWorkData.dataValues.Title,Desc:HomeWorkData.dataValues.Desc,EndDate:HomeWorkData.dataValues.EndDate,AnswerId:HomeWorkData.dataValues.AnswerId,HomeWorkAnswer:HomeWorkData.dataValues.HomeWorkAnswer,HomeWorkAnswerFiles:HomeWorkAnswerFiles},HomeWorkFiles:HomeWorkFiles
																	}})
																}
															}
														}
													})
												}
											}
										}
									})
								}
							}
						}
					})
				})
			} else {
				res.send({error:1,result:{msg:'你未参与该作业'}})
			}
		})
	} else {
		// console.log(req.body.HomeWorkId)
		routeSql.HomeWork.findOne({where:{Id:req.body.HomeWorkId},include:[{model:routeSql.HomeWorkAnswer,as:'HomeWorkAnswer',attributes:['Desc']}]}).then(function(HomeWorkData){
			// console.log(HomeWorkData)
			if (HomeWorkData) {
				if (HomeWorkData.dataValues.CreatorUserId == decoded.Id) {
					routeSql.HomeWorkImage.findAll({where:{WorkType:0,WorkId:req.body.HomeWorkId},attributes:['ResourceId']}).then(function(HomeWorkFile){
						getFileArr(HomeWorkFile)
						function getFileArr(arr){
							var HomeWorkFiles = []
							FindAllResource(arr)
							function FindAllResource(arr){
								var HomeWorkImageData = arr.shift()
								if (HomeWorkImageData) {
									var ResourceId = HomeWorkImageData.dataValues.ResourceId;
									routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
										var HomeWorkResource = {}
										HomeWorkResource.FileName = ResourceData.dataValues.FileName;
										HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
										HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
										HomeWorkFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
										FindAllResource(arr)
									})
								} else {
									routeSql.HomeWorkResult.findAll({where:{HomeWorkId:req.body.HomeWorkId,State:0},attributes:['UserId','State'],include:[{model:routeSql.AbpUsers,as:'HomeWorkResultAbpUser',attributes:['Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}]}).then(function(HomeWorkResultUnDoneArray){
										routeSql.HomeWorkResult.findAll({where:{HomeWorkId:req.body.HomeWorkId,State:{$ne:0}},attributes:['UserId','State','HandInDate'],include:[{model:routeSql.AbpUsers,as:'HomeWorkResultAbpUser',attributes:['Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}]}).then(function(
											HomeWorkResultDoneArray){
											routeSql.HomeWorkImage.findAll({where:{WorkId:HomeWorkData.dataValues.AnswerId,WorkType:2},attributes:['ResourceId']}).then(function(HomeWorkAnswerFile){
												getFileArr(HomeWorkAnswerFile)
												function getFileArr(arr){
													var HomeWorkAnswerFiles = []
													FindAllResource(arr)
													function FindAllResource(arr){
														var HomeWorkImageData = arr.shift()
														if (HomeWorkImageData) {
															var ResourceId = HomeWorkImageData.dataValues.ResourceId;
															routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
																var HomeWorkResource = {}
																HomeWorkResource.FileName = ResourceData.dataValues.FileName;
																HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
																HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
																HomeWorkAnswerFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
																FindAllResource(arr)
															})
														} else {
															var IsHomeWorkEnd;
															if (new Date() > new Date(HomeWorkData.dataValues.EndDate)) {
																IsHomeWorkEnd = true
															} else {
																IsHomeWorkEnd = false
															}
															routeSql.HomeWorkResult.count({where:{HomeWorkId:req.body.HomeWorkId}}).then(function(count){
																res.send({error:0,result:{IsHomeWorkEnd:IsHomeWorkEnd,HomeWorkData:{HomeWorkId:HomeWorkData.dataValues.Id,Title:HomeWorkData.dataValues.Title,Desc:HomeWorkData.dataValues.Desc,EndDate:HomeWorkData.dataValues.EndDate,AnswerId:HomeWorkData.dataValues.AnswerId,HomeWorkAnswer:HomeWorkData.dataValues.HomeWorkAnswer,HomeWorkAnswerFiles:HomeWorkAnswerFiles},HomeWorkFiles:HomeWorkFiles,HomeWorkResultUnDoneArray,HomeWorkResultDoneArray,AllStuNum:count}})
															})
														}
													}
												}
											})
										})
									})
								}
							}
						}
					})
				} else {
					res.send({error:1,result:{msg:'你没有权限查看操作该作业'}})
				}
			} else {
				res.send({error:1,result:{msg:'该作业已不存在'}})
			}
		})
	}
})

router.post('/ActivityHomeWorkforWeb',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	if (decoded.UserType == 0) {
		routeSql.HomeWorkResult.findOne({where:{UserId:decoded.Id,HomeWorkId:req.body.HomeWorkId}}).then(function(HomeWorkResultData){
			if (HomeWorkResultData) {
				routeSql.HomeWork.findOne({where:{Id:req.body.HomeWorkId},include:[{model:routeSql.HomeWorkAnswer,as:'HomeWorkAnswer',attributes:['Desc']}]}).then(function(HomeWorkData){
					// console.log(req.body.HomeWorkId)
					routeSql.HomeWorkImage.findAll({where:{WorkId:req.body.HomeWorkId,WorkType:0},attributes:['ResourceId']}).then(function(HomeWorkFile){
						// console.log(HomeWorkFile)
						getFileArr(HomeWorkFile)
						function getFileArr(arr){
							var HomeWorkFiles = []
							FindAllResource(arr)
							function FindAllResource(arr){
								var HomeWorkImageData = arr.shift()
								if (HomeWorkImageData) {
									var ResourceId = HomeWorkImageData.dataValues.ResourceId;
									routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
										var HomeWorkResource = {}
										HomeWorkResource.FileName = ResourceData.dataValues.FileName;
										HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
										HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
										HomeWorkFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
										FindAllResource(arr)
									})
								} else {
									// console.log('++++++++++')
									routeSql.HomeWorkImage.findAll({where:{WorkId:HomeWorkResultData.dataValues.Id,WorkType:1},attributes:['ResourceId']}).then(function(HomeWorkResultFile){
										getFileArr(HomeWorkResultFile)
										function getFileArr(arr){
											var HomeWorkResultFiles = []
											FindAllResource(arr)
											function FindAllResource(arr){
												var HomeWorkImageData = arr.shift()
												if (HomeWorkImageData) {
													var ResourceId = HomeWorkImageData.dataValues.ResourceId;
													routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
														var HomeWorkResource = {}
														HomeWorkResource.FileName = ResourceData.dataValues.FileName;
														HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
														HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
														HomeWorkResultFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
														FindAllResource(arr)
													})
												} else {
													// console.log('===========')
													routeSql.HomeWorkImage.findAll({where:{WorkId:HomeWorkData.dataValues.AnswerId,WorkType:2},attributes:['ResourceId']}).then(function(HomeWorkAnswerFile){
														getFileArr(HomeWorkAnswerFile)
														function getFileArr(arr){
															var HomeWorkAnswerFiles = []
															FindAllResource(arr)
															function FindAllResource(arr){
																var HomeWorkImageData = arr.shift()
																if (HomeWorkImageData) {
																	var ResourceId = HomeWorkImageData.dataValues.ResourceId;
																	routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
																		var HomeWorkResource = {}
																		HomeWorkResource.FileName = ResourceData.dataValues.FileName;
																		HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
																		HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
																		HomeWorkAnswerFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
																		FindAllResource(arr)
																	})
																} else {
																	// console.log('--------------')
																	var IsHomeWorkEnd;
																	if (new Date() > new Date(HomeWorkData.dataValues.EndDate)) {
																		IsHomeWorkEnd = true
																	} else {
																		IsHomeWorkEnd = false
																	}
																	res.send({error:0,result:{
																		IsHomeWorkEnd:IsHomeWorkEnd,
																		HomeWorkResultData:{Answer:HomeWorkResultData.dataValues.Answer,State:HomeWorkResultData.dataValues.State,Evaluate:HomeWorkResultData.dataValues.Evaluate,HomeWorkId:HomeWorkResultData.dataValues.HomeWorkId,HandInDate:HomeWorkResultData.dataValues.HandInDate
																		},HomeWorkResultFiles:HomeWorkResultFiles,
																		HomeWorkData:{Title:HomeWorkData.dataValues.Title,Desc:HomeWorkData.dataValues.Desc,EndDate:HomeWorkData.dataValues.EndDate,AnswerId:HomeWorkData.dataValues.AnswerId,HomeWorkAnswer:HomeWorkData.dataValues.HomeWorkAnswer,HomeWorkAnswerFiles:HomeWorkAnswerFiles},HomeWorkFiles:HomeWorkFiles
																	}})
																}
															}
														}
													})
												}
											}
										}
									})
								}
							}
						}
					})
				})
			} else {
				res.send({error:1,result:{msg:'你没有权限查看该作业'}})
			}
		})
	} else {
		// console.log(req.body.HomeWorkId)
		routeSql.HomeWork.findOne({where:{Id:req.body.HomeWorkId},include:[{model:routeSql.HomeWorkAnswer,as:'HomeWorkAnswer',attributes:['Desc']}]}).then(function(HomeWorkData){
			// console.log(HomeWorkData)
			if (HomeWorkData) {
				if (HomeWorkData.dataValues.CreatorUserId == decoded.Id) {
					routeSql.HomeWorkImage.findAll({where:{WorkType:0,WorkId:req.body.HomeWorkId},attributes:['ResourceId']}).then(function(HomeWorkFile){
						getFileArr(HomeWorkFile)
						function getFileArr(arr){
							var HomeWorkFiles = []
							FindAllResource(arr)
							function FindAllResource(arr){
								var HomeWorkImageData = arr.shift()
								if (HomeWorkImageData) {
									var ResourceId = HomeWorkImageData.dataValues.ResourceId;
									routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
										var HomeWorkResource = {}
										HomeWorkResource.FileName = ResourceData.dataValues.FileName;
										HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
										HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
										HomeWorkFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
										FindAllResource(arr)
									})
								} else {
									routeSql.HomeWorkResult.findAll({where:{HomeWorkId:req.body.HomeWorkId,State:0},attributes:['UserId','State'],include:[{model:routeSql.AbpUsers,as:'HomeWorkResultAbpUser',attributes:['Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}]}).then(function(HomeWorkResultUnDoneArray){
										routeSql.HomeWorkResult.findAll({where:{HomeWorkId:req.body.HomeWorkId,State:{$ne:0}},attributes:['UserId','State'],include:[{model:routeSql.AbpUsers,as:'HomeWorkResultAbpUser',attributes:['Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}]}).then(function(
											HomeWorkResultDoneArray){
											routeSql.HomeWorkResult.findAll({where:{HomeWorkId:req.body.HomeWorkId,State:{$ne:0}},attributes:['Id','UserId','State','HandInDate','Answer','Evaluate'],include:[{model:routeSql.AbpUsers,as:'HomeWorkResultAbpUser',attributes:['Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}]}).then(function(HomeWorkDoneResult){
												var HomeWorkDoneResultPart = []
												doneResult(HomeWorkDoneResult)
												function doneResult(HomeWorkDoneResult){
													var HomeWorkResultData = HomeWorkDoneResult.shift()
													if (HomeWorkResultData) {
														routeSql.HomeWorkImage.findAll({where:{WorkType:1,WorkId:HomeWorkResultData.dataValues.Id},attributes:['ResourceId']}).then(function(HomeWorkResultFiles){
															var HomeWorkResultFilesArr = []
															FindAllResource(HomeWorkResultFiles)
															// function getFileArr(arr){
																// FindAllResource(arr)
															function FindAllResource(HomeWorkResultFiles){
																var HomeWorkImageData = HomeWorkResultFiles.shift()
																if (HomeWorkImageData) {
																	var ResourceId = HomeWorkImageData.dataValues.ResourceId;
																	routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
																		var HomeWorkResource = {}
																		HomeWorkResource.FileName = ResourceData.dataValues.FileName;
																		HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
																		HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
																		HomeWorkResultFilesArr.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
																		FindAllResource(HomeWorkResultFiles)
																	})
																} else {
																	HomeWorkDoneResultPart.push({HomeWorkResultData:HomeWorkResultData,HomeWorkResultFilesArr:HomeWorkResultFilesArr})
																	doneResult(HomeWorkDoneResult)
																}
															// }
															}
														})
													} else {
														routeSql.HomeWorkImage.findAll({where:{WorkId:HomeWorkData.dataValues.AnswerId,WorkType:2},attributes:['ResourceId']}).then(function(HomeWorkAnswerFile){
															getFileArr(HomeWorkAnswerFile)
															function getFileArr(arr){
																var HomeWorkAnswerFiles = []
																FindAllResource(arr)
																function FindAllResource(arr){
																	var HomeWorkImageData = arr.shift()
																	if (HomeWorkImageData) {
																		var ResourceId = HomeWorkImageData.dataValues.ResourceId;
																		routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
																			var HomeWorkResource = {}
																			HomeWorkResource.FileName = ResourceData.dataValues.FileName;
																			HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
																			HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
																			HomeWorkAnswerFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
																			FindAllResource(arr)
																		})
																	} else {
																		var IsHomeWorkEnd;
																		if (new Date() > new Date(HomeWorkData.dataValues.EndDate)) {
																			IsHomeWorkEnd = true
																		} else {
																			IsHomeWorkEnd = false
																		}
																		routeSql.HomeWorkResult.count({where:{HomeWorkId:req.body.HomeWorkId}}).then(function(count){
																			res.send({error:0,result:{IsHomeWorkEnd:IsHomeWorkEnd,HomeWorkData:{HomeWorkId:HomeWorkData.dataValues.Id,Title:HomeWorkData.dataValues.Title,Desc:HomeWorkData.dataValues.Desc,EndDate:HomeWorkData.dataValues.EndDate,AnswerId:HomeWorkData.dataValues.AnswerId,HomeWorkAnswer:HomeWorkData.dataValues.HomeWorkAnswer,HomeWorkAnswerFiles:HomeWorkAnswerFiles}
																				,HomeWorkFiles:HomeWorkFiles
																				,HomeWorkDoneResultPart:HomeWorkDoneResultPart
																				,HomeWorkResultUnDoneArray,HomeWorkResultDoneArray
																				,AllStuNum:count}})
																		})
																	}
																}
															}
														})
														
													}
												}
											})
										})
									})
								}
							}
						}
					})
				} else {
					res.send({error:1,result:{msg:'你没有权限查看操作该作业'}})
				}
			} else {
				res.send({error:1,result:{msg:'该作业已不存在'}})
			}
		})
	}
})


router.post('/StudentHomeWorkResult',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.HomeWork.findOne({where:{Id:req.body.HomeWorkId}}).then(function(HomeWorkData){
		if (HomeWorkData.CreatorUserId == decoded.Id) {
			routeSql.HomeWorkResult.findOne({where:{UserId:req.body.UserId,HomeWorkId:req.body.HomeWorkId},include:[{model:routeSql.AbpUsers,as:'HomeWorkResultAbpUser',attributes:['Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}]}).then(function(HomeWorkResultData){
				routeSql.HomeWorkImage.findAll({where:{WorkType:1,WorkId:HomeWorkResultData.dataValues.Id},attributes:['ResourceId']}).then(function(HomeWorkResultFile){
					getFileArr(HomeWorkResultFile)
					function getFileArr(arr){
						var HomeWorkResultFiles = []
						FindAllResource(arr)
						function FindAllResource(arr){
							var HomeWorkImageData = arr.shift()
							if (HomeWorkImageData) {
								var ResourceId = HomeWorkImageData.dataValues.ResourceId;
								routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
									var HomeWorkResource = {}
									HomeWorkResource.FileName = ResourceData.dataValues.FileName;
									HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
									HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
									HomeWorkResultFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
									FindAllResource(arr)
								})
							} else {
								routeSql.HomeWorkImage.findAll({where:{WorkType:0,WorkId:HomeWorkData.dataValues.Id},attributes:['ResourceId']}).then(function(HomeWorkFile){
									getFileArr(HomeWorkFile)
									function getFileArr(arr){
										var HomeWorkFiles = []
										FindAllResource(arr)
										function FindAllResource(arr){
											var HomeWorkImageData = arr.shift()
											if (HomeWorkImageData) {
												var ResourceId = HomeWorkImageData.dataValues.ResourceId;
												routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
													var HomeWorkResource = {}
													HomeWorkResource.FileName = ResourceData.dataValues.FileName;
													HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
													HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
													HomeWorkFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
													FindAllResource(arr)
												})
											} else {
												res.send({error:0,result:{
													HomeWorkData:{HomeWorkId:HomeWorkData.dataValues.Id,Title:HomeWorkData.dataValues.Title,Desc:HomeWorkData.dataValues.Desc,EndDate:HomeWorkData.dataValues.EndDate,HomeWorkFiles:HomeWorkFiles},
													HomeWorkResultData:{UserId:HomeWorkResultData.dataValues.UserId,Answer:HomeWorkResultData.dataValues.Answer,State:HomeWorkResultData.dataValues.State,Evaluate:HomeWorkResultData.dataValues.Evaluate,HandInDate:HomeWorkResultData.dataValues.HandInDate,
														UserInfo:{Name:HomeWorkResultData.dataValues.HomeWorkResultAbpUser.Name,HeadImage:HomeWorkResultData.dataValues.HomeWorkResultAbpUser.HeadImage}
													,HomeWorkResultFiles:HomeWorkResultFiles}}})
											}
										}
									}
								})
							}
						}
					}
				})
			})
		} else {
			res.send({error:1,result:{msg:'你没有权限查看该作业'}})
		}
	})
})

router.post('/SubmitHomeWork',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	if (decoded.UserType == 0) {
		routeSql.HomeWork.findOne({where:{Id:req.body.HomeWorkId}}).then(function(HomeWorkData){
			var Answer = ''
			if (req.body.Answer) {
				Answer = req.body.Answer
			} else {}
			if (new Date() > new Date(HomeWorkData.dataValues.EndDate)) {
				res.send({error:2,result:{msg:'已经过了作业提交时间，不能再提交作业了'}})
			} else {
				if (Answer.length < 1024) {
					routeSql.HomeWorkResult.findOne({where:{UserId:decoded.Id,HomeWorkId:req.body.HomeWorkId}}).then(function(HomeWorkResultData){
						if (HomeWorkResultData) {
							if (HomeWorkResultData.dataValues.State == 0) {
								var newDate = new Date()
								routeSql.HomeWorkResult.update({Answer:Answer,State:1,HandInDate:newDate},{where:{Id:HomeWorkResultData.dataValues.Id}}).then(function(){
									var Resources = []
									if (req.body.AddResources) {
										Resources = req.body.AddResources
									}
									HomeWorkSaveFile(Resources)
									function HomeWorkSaveFile(Resources){
										var ResourceId = Resources.shift()
										if (ResourceId) {
											routeSql.HomeWorkImage.findOne({where:{WorkType:1,WorkId:HomeWorkResultData.dataValues.Id,ResourceId:ResourceId}}).then(function(ImageData){
												if (!ImageData) {
													routeSql.HomeWorkImage.create({WorkType:1,WorkId:HomeWorkResultData.dataValues.Id,ResourceId:ResourceId}).then(function(){
														HomeWorkSaveFile(Resources)
													})
												} else {
													HomeWorkSaveFile(Resources)
												}
											})
										} else {
											res.send({error:0,result:{msg:'作业提交成功'}})
										}
									}
								})
							} else if (HomeWorkResultData.dataValues.State == 1) {
								var newDate = new Date()
								routeSql.HomeWorkResult.update({Answer:Answer,HandInDate:newDate},{where:{Id:HomeWorkResultData.dataValues.Id}}).then(function(){
									routeSql.HomeWorkImage.destroy({where:{WorkType:1,WorkId:HomeWorkResultData.dataValues.Id,ResourceId:req.body.DestroyResources}})
									var AddResources = []
									if (req.body.AddResources) {
										AddResources = req.body.AddResources
									}
									HomeWorkImage(AddResources)
									function HomeWorkImage(Resources){
										var ResourceId = Resources.shift()
										if (ResourceId) {
											routeSql.HomeWorkImage.findOne({where:{WorkType:1,WorkId:HomeWorkResultData.dataValues.Id,ResourceId:ResourceId}}).then(function(ImageData){
												if (!ImageData) {
													routeSql.HomeWorkImage.create({WorkType:1,WorkId:HomeWorkResultData.dataValues.Id,ResourceId:ResourceId}).then(function(){
														HomeWorkImage(Resources)
													})
												} else {
													HomeWorkImage(Resources)
												}
											})
										} else {
											res.send({error:0,result:{msg:'作业回答修改成功'}})
										}
									}
								})
							} else {
								res.send({error:2,result:{msg:'老师已经评价，不能再次修改'}})
							}
						} else {
							res.send({error:1,result:{msg:'你没有权限操作该作业'}})
						}
					})
				} else {
					res.send({error:2,result:{msg:'文字不得超过1024'}})
				}
			}
		})
	} else {
		routeSql.HomeWork.findOne({where:{Id:req.body.HomeWorkId}}).then(function(HomeWorkData){
			var Evaluate = ''
			if (req.body.Evaluate) {
				Evaluate = req.body.Evaluate
			} else {}
			if (decoded.Id == HomeWorkData.CreatorUserId) {
				if (Evaluate.length < 1024) {
					routeSql.HomeWorkResult.findOne({where:{UserId:req.body.UserId,HomeWorkId:req.body.HomeWorkId}}).then(function(HomeWorkResultData){
						if (HomeWorkResultData.dataValues.State == 1) {
							var newDate = new Date()
							routeSql.HomeWorkResult.update({AuditDate:newDate,Evaluate:Evaluate,State:2},{where:{UserId:req.body.UserId,HomeWorkId:req.body.HomeWorkId}}).then(function(){
								res.send({error:0,result:{msg:'评价成功'}})
							})
						} else if (HomeWorkResultData.dataValues.State == 2) {
							var newDate = new Date()
							// console.log(newDate)
							routeSql.HomeWorkResult.update({AuditDate:newDate,Evaluate:Evaluate},{where:{UserId:req.body.UserId,HomeWorkId:req.body.HomeWorkId}}).then(function(){
								res.send({error:0,result:{msg:'修改评价成功'}})
							})
						} else {
							res.send({error:3,result:{msg:'学生还未提交作业，现在不能评价'}})
						}
					})
				} else {
					res.send({error:2,result:{msg:'文字不得超过1024'}})
				}
			} else {
				res.send({error:1,result:{msg:'你没有权限操作该作业'}})
			}
		})
	}
})

// router.post('/EditHomeWorkResult',function(req,res){
// 	var token = req.headers.token
// 	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
// })

router.get('/AllMyHomeWork',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var msg = req.query.msg ? req.query.msg:''
	var a = req.query.limit?req.query.limit:10;
	var limit = parseInt(a)
	var page = req.query.page?req.query.page:1;
	var offset = (page -1) * limit;
	// console.log('111111111111111')
	// console.log(limit)
	var TotolCount = 0
	if (decoded.UserType == 0) {
		routeSql.HomeWorkResult.count({where:{UserId:decoded.Id}}).then(function(count){
			TotolCount = count
			routeSql.HomeWorkResult.findAll({where:{UserId:decoded.Id},offset:offset,limit:limit,order:[['Id','DESC']]}).then(function(HomeWorkResultArr){
				var result = []
				GetActivity(HomeWorkResultArr)
				function GetActivity(HomeWorkResultArr){
					var HomeWorkResultData = HomeWorkResultArr.shift()
					if (HomeWorkResultData) {
						routeSql.TeachingDetail.findOne({where:{Type:2,ModelId:HomeWorkResultData.dataValues.HomeWorkId}}).then(function(DetailData){
							routeSql.TeachingActivity.findOne({where:{Id:DetailData.dataValues.TeachingActivityId,IsDeleted:false},attributes:['Title','Id']}).then(function(ActivityData){
								if (ActivityData) {
									routeSql.HomeWork.findOne({where:{Id:HomeWorkResultData.dataValues.HomeWorkId,Title:{$like:'%' + msg + '%'}}}).then(function(HomeWorkData){
										if (HomeWorkData) {
											var EndState
											if (new Date() > new Date(HomeWorkData.dataValues.EndDate)) {
												EndState = 1;//作业时间截止
											} else {
												EndState = 0;
											}
											result.push({TeachingDetailId:DetailData.dataValues.Id,HomeWorkId:HomeWorkData.dataValues.Id,EndState:EndState,ActivityId:ActivityData.dataValues.Id,ActivityTitle:ActivityData.dataValues.Title,HomeWorkTitle:HomeWorkData.dataValues.Title,EndDate:HomeWorkData.dataValues.EndDate,State:HomeWorkResultData.dataValues.State})
											GetActivity(HomeWorkResultArr)
										} else {
											GetActivity(HomeWorkResultArr)
										}
									})
								} else {
									GetActivity(HomeWorkResultArr)
								}
							})
						})
					} else {
						res.send({error:0,result:result,TotolCount:TotolCount})
					}
				}
			})
		})
	} else {
		routeSql.HomeWork.count({where:{CreatorUserId:decoded.Id,Title:{$like:'%' + msg + '%'}}}).then(function(count){
			TotolCount = count
			routeSql.HomeWork.findAll({where:{CreatorUserId:decoded.Id,Title:{$like:'%' + msg + '%'}},offset:offset,limit:limit,order:[['Id','DESC']]}).then(function(HomeWorkArr){
				var result = []
				AllHomeWork(HomeWorkArr)
				function AllHomeWork(HomeWorkArr){
					var HomeWorkData = HomeWorkArr.shift()
					if (HomeWorkData) {
						// routeSql.HomeWork.findOne({where:{Id:HomeWorkData.dataValues.Id}}).then(function(HomeWorkData){
							routeSql.HomeWorkResult.count({where:{HomeWorkId:HomeWorkData.dataValues.Id}}).then(function(AllStudNum){
								routeSql.HomeWorkResult.count({where:{HomeWorkId:HomeWorkData.dataValues.Id,State:0}}).then(function(AllNotSubmitStudNum){
									var EndState;
									if (new Date() > new Date(HomeWorkData.dataValues.EndDate)) {
										EndState = 1;
									} else {
										EndState = 0;
									}
									routeSql.TeachingDetail.findOne({where:{Type:2,ModelId:HomeWorkData.dataValues.Id}}).then(function(DetailData){
										// console.log(DetailData)
										if (DetailData) {
											routeSql.TeachingActivity.findOne({where:{Id:DetailData.dataValues.TeachingActivityId}}).then(function(ActivityData){
												if (ActivityData) {
													result.push({TeachingDetailId:DetailData.dataValues.Id,HomeWorkId:HomeWorkData.dataValues.Id,ActivityTitle:ActivityData.dataValues.Title,HomeWorkTitle:HomeWorkData.dataValues.Title,EndDate:HomeWorkData.dataValues.EndDate,EndState:EndState,AllStudNum:AllStudNum,SubmitStudNum:AllStudNum - AllNotSubmitStudNum})
												}
												AllHomeWork(HomeWorkArr)
											})
										} else {
											AllHomeWork(HomeWorkArr)
										}
									})
								})
							})
						// })
					} else {
						res.send({error:0,result:result,TotolCount:TotolCount})
					}
				}
			})
		})
		// routeSql.TeachingActivity.findAll({where:{CreatorUserId:decoded.Id}}).then(function(ActivityArr){
		// 	var result = []
		// 	AllMyHomeWork(ActivityArr)
		// 	function AllMyHomeWork(ActivityArr){
		// 		var ActivityData = ActivityArr.shift()
		// 		if (ActivityData) {
		// 			routeSql.TeachingDetail.findAll({where:{Type:2,TeachingActivityId:ActivityData.dataValues.Id},order:[['Id','DESC']]}).then(function(DetailArr){
		// 			})
		// 		} else {
		// 			res.send({error:0,result:result})
		// 		}
		// 	}
		// })
	}
})


router.post('/EditHomeWork',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.TeachingDetail.findOne({where:{ModelId:req.body.ModelId,Type:2}}).then(function(DetailData){
		if (DetailData) {
			routeSql.TeachingTask.findOne({where:{Id:DetailData.dataValues.TeachingTaskId}}).then(function(TaskData){
				if (TaskData.dataValues.CreatorUserId == decoded.Id) {
					routeSql.HomeWork.findOne({where:{Id:req.body.ModelId}}).then(function(HomeWorkData) {
						var Title = ''
						var Desc = ''
						if (req.body.Title) {
							Title = req.body.Title
						}
						if (req.body.Desc) {
							Desc = req.body.Desc
						}
						if (new Date(HomeWorkData.dataValues.EndDate) > new Date()) {
							if (Title.length < 1024 && Desc.length < 1024) {
								routeSql.HomeWork.update({Title:Title,EndDate:new Date(req.body.EndDate),Desc:Desc},{where:{Id:req.body.ModelId}}).then(function(){
									routeSql.TeachingDetail.update({Title:Title},{where:{ModelId:req.body.ModelId,Type:2}})
									routeSql.HomeWorkImage.destroy({where:{WorkType:0,WorkId:req.body.ModelId,ResourceId:req.body.DestroyResources}})
									var AddResources = []
									if (req.body.AddResources) {
										AddResources = req.body.AddResources
									}
									HomeWorkImage(AddResources)
									function HomeWorkImage(Resources){
										var ResourceId = Resources.shift()
										if (ResourceId) {
											routeSql.HomeWorkImage.findOne({where:{WorkType:0,WorkId:req.body.ModelId,ResourceId:ResourceId}}).then(function(ImageData){
												if (!ImageData) {
													routeSql.HomeWorkImage.create({WorkType:0,WorkId:req.body.ModelId,ResourceId:ResourceId}).then(function(){
														HomeWorkImage(Resources)
													})
												} else {
													HomeWorkImage(Resources)
												}
											})
										} else {
											Notification.upDateHomeWorkNotification(req.body.ModelId)
											Notification.TeacherNotification()
										    routeSql.TeachingTask.findOne({where:{Id:DetailData.dataValues.TeachingTaskId},attributes:['Id','Title','Desc']}).then(function(Taskdata){
										        // console.log(data)
										        searchDetail(req.body.TeachingTaskId,req,res,Taskdata,decoded)
										        // JoinToExamResult()
										        // JoinToHomeWorkResult()
										    })
										}
									}
								})
							} else {
								res.send({error:2,result:{msg:'文字不得超过1024'}})
							}
						} else {
							res.send({error:2,result:{msg:'作业已经结束，不能再编辑作业了'}})
						}
					})
				} else {
					res.send({error:1,result:{msg:'你没有权限编辑该作业'}})
				}
			})
		} else {
			res.send({error:3,result:{msg:'该子任务不存在'}})
		}
	})
})

router.post('/EditHomeWorkAnswer',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var Desc = ''
	if(req.body.Desc){
		Desc = req.body.Desc
	}
	if (Desc.length < 1024) {
		routeSql.HomeWork.findOne({where:{AnswerId:req.body.AnswerId}}).then(function(HomeWorkData){
			if (HomeWorkData.dataValues.CreatorUserId == decoded.Id) {
				if (new Date(HomeWorkData.dataValues.EndDate) > new Date()) {
					routeSql.HomeWorkAnswer.update({Desc:Desc},{where:{Id:req.body.AnswerId}}).then(function(){
						routeSql.HomeWorkImage.destroy({where:{WorkType:2,WorkId:req.body.AnswerId,ResourceId:req.body.DestroyResources}})
						var AddResources = []
						if (req.body.AddResources) {
							AddResources = req.body.AddResources
						}
						HomeWorkImage(AddResources)
						function HomeWorkImage(Resources){
							var ResourceId = Resources.shift()
							if (ResourceId) {
								routeSql.HomeWorkImage.findOne({where:{WorkType:2,WorkId:req.body.AnswerId,ResourceId:ResourceId}}).then(function(ImageData){
									if (!ImageData) {
										routeSql.HomeWorkImage.create({WorkType:2,WorkId:req.body.AnswerId,ResourceId:ResourceId}).then(function(){
											HomeWorkImage(Resources)
										})
									} else {
										HomeWorkImage(Resources)
									}
								})
							} else {
								res.send({error:0,result:{msg:'作业答案编辑成功'}})
							}
						}
					})
				} else {
					res.send({error:2,result:{msg:'作业已经结束，不能再编辑作业了'}})
				}
			} else {
				res.send({error:1,result:{msg:'你没有权限修改作业答案'}})
			}
		})
	} else {
		res.send({error:2,result:{msg:'文字不得超过1024'}})
	}
})

router.post('/EditActivityHomeWorkforWeb',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log('99999999999999999999999999999999999999999')
	// console.log(req.body)
	if (decoded.UserType == 0) {
		res.send({error:1,result:{msg:'只有教师端才能编辑作业'}})
	} else {
		routeSql.HomeWork.findOne({where:{Id:req.body.HomeWorkId},include:[{model:routeSql.HomeWorkAnswer,as:'HomeWorkAnswer',attributes:['Desc']}]}).then(function(HomeWorkData){
			// console.log(HomeWorkData)
			if (HomeWorkData.dataValues.CreatorUserId == decoded.Id) {
				routeSql.HomeWorkImage.findAll({where:{WorkType:0,WorkId:req.body.HomeWorkId},attributes:['ResourceId']}).then(function(HomeWorkFile){
					getFileArr(HomeWorkFile)
					function getFileArr(arr){
						var HomeWorkFiles = []
						FindAllResource(arr)
						function FindAllResource(arr){
							var HomeWorkImageData = arr.shift()
							if (HomeWorkImageData) {
								var ResourceId = HomeWorkImageData.dataValues.ResourceId;
								routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
									var HomeWorkResource = {}
									HomeWorkResource.FileName = ResourceData.dataValues.FileName;
									HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
									HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
									HomeWorkFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
									FindAllResource(arr)
								})
							} else {
								routeSql.HomeWorkImage.findAll({where:{WorkId:HomeWorkData.dataValues.AnswerId,WorkType:2},attributes:['ResourceId']}).then(function(HomeWorkAnswerFile){
									getFileArr(HomeWorkAnswerFile)
									function getFileArr(arr){
										var HomeWorkAnswerFiles = []
										FindAllResource(arr)
										function FindAllResource(arr){
											var HomeWorkImageData = arr.shift()
											if (HomeWorkImageData) {
												var ResourceId = HomeWorkImageData.dataValues.ResourceId;
												routeSql.Resources.findOne({where:{Id:ResourceId,IsDeleted:false},attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileCategory']}).then(function(ResourceData){
													var HomeWorkResource = {}
													HomeWorkResource.FileName = ResourceData.dataValues.FileName;
													HomeWorkResource.FileUrl = ResourceData.dataValues.FileUrl
													HomeWorkResource.FileCategory = ResourceData.dataValues.FileCategory
													HomeWorkAnswerFiles.push({ResourceId:ResourceId,HomeWorkResource:HomeWorkResource})
													FindAllResource(arr)
												})
											} else {
												var IsHomeWorkEnd;
												if (new Date() > new Date(HomeWorkData.dataValues.EndDate)) {
													IsHomeWorkEnd = true
												} else {
													IsHomeWorkEnd = false
												}
													res.send({error:0,result:{IsHomeWorkEnd:IsHomeWorkEnd,HomeWorkData:{HomeWorkId:HomeWorkData.dataValues.Id,Title:HomeWorkData.dataValues.Title,Desc:HomeWorkData.dataValues.Desc,EndDate:HomeWorkData.dataValues.EndDate,AnswerId:HomeWorkData.dataValues.AnswerId,HomeWorkAnswer:HomeWorkData.dataValues.HomeWorkAnswer,HomeWorkAnswerFiles:HomeWorkAnswerFiles},HomeWorkFiles:HomeWorkFiles}})
											}
										}
									}
								})
							}
						}
					}
				})
			} else {
				res.send({error:1,result:{msg:'你没有权限查看操作该作业'}})
			}
		})
	}
})

router.post('/EditHomeWorkforWeb',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	routeSql.TeachingDetail.findOne({where:{ModelId:req.body.ModelId,Type:2}}).then(function(DetailData){
		routeSql.TeachingTask.findOne({where:{Id:DetailData.dataValues.TeachingTaskId}}).then(function(TaskData){
			if (TaskData.dataValues.CreatorUserId == decoded.Id) {
				routeSql.HomeWork.findOne({where:{Id:req.body.ModelId}}).then(function(HomeWorkData) {
					var Title = ''
					var Desc = ''
					var AnswerDataDesc = ''
					if (req.body.Title) {
						Title = req.body.Title
					}
					if (req.body.Desc) {
						Desc = req.body.Desc
					}
					if (req.body.AnswerData.Desc) {
						AnswerDataDesc = req.body.AnswerData.Desc
					}
					if (AnswerDataDesc.length < 1024 && Title.length < 1024 && Desc.length < 1024) {
						if (new Date(HomeWorkData.dataValues.EndDate) > new Date()) {
							routeSql.HomeWork.update({Title:Title,EndDate:new Date(req.body.EndDate),Desc:Desc},{where:{Id:req.body.ModelId}}).then(function(){
								routeSql.TeachingDetail.update({Title:Title},{where:{ModelId:req.body.ModelId,Type:2}})
								routeSql.HomeWorkImage.destroy({where:{WorkType:0,WorkId:req.body.ModelId,ResourceId:req.body.DestroyResources}})
								// console.log(req.body.AddResources)
								var AddResources = []
								if (req.body.AddResources) {
									AddResources = req.body.AddResources
								}
								HomeWorkImage(AddResources)
								function HomeWorkImage(Resources){
									var ResourceId = Resources.shift()
									if (ResourceId) {
										routeSql.HomeWorkImage.findOne({where:{WorkType:0,WorkId:req.body.ModelId,ResourceId:ResourceId}}).then(function(ImageData){
											if (!ImageData) {
												routeSql.HomeWorkImage.create({WorkType:0,WorkId:req.body.ModelId,ResourceId:ResourceId}).then(function(){
													HomeWorkImage(Resources)
												})
											} else {
												HomeWorkImage(Resources)
											}
										})
									} else {
										routeSql.HomeWorkAnswer.update({Desc:AnswerDataDesc},{where:{Id:HomeWorkData.dataValues.AnswerId}}).then(function(){
											routeSql.HomeWorkImage.destroy({where:{WorkType:2,WorkId:HomeWorkData.dataValues.AnswerId,ResourceId:req.body.AnswerData.DestroyResources}})
											var AnswerDataAddResources = []
											if (req.body.AnswerData.AddResources) {
												AnswerDataAddResources = req.body.AnswerData.AddResources
											}
											HomeWorkImage(AnswerDataAddResources)
											function HomeWorkImage(Resources){
												var ResourceId = Resources.shift()
												if (ResourceId) {
													routeSql.HomeWorkImage.findOne({where:{WorkType:2,WorkId:HomeWorkData.dataValues.AnswerId,ResourceId:ResourceId}}).then(function(ImageData){
														if (!ImageData) {
															routeSql.HomeWorkImage.create({WorkType:2,WorkId:HomeWorkData.dataValues.AnswerId,ResourceId:ResourceId}).then(function(){
																HomeWorkImage(Resources)
															})
														} else {
															HomeWorkImage(Resources)
														}
													})
												} else {
													// res.send({error:0,result:{msg:'试题编辑成功'}})
													Notification.upDateHomeWorkNotification()
													Notification.TeacherNotification()
												    routeSql.TeachingTask.findOne({where:{Id:DetailData.dataValues.TeachingTaskId},attributes:['Id','Title','Desc']}).then(function(Taskdata){
												        // console.log(data)
												        searchDetail(req.body.TeachingTaskId,req,res,Taskdata,decoded)
												        // JoinToExamResult()
												        // JoinToHomeWorkResult()
												    })
												}
											}
										})
									}
								}
							})
						} else {
							res.send({error:2,result:{msg:'作业已经结束，不能再编辑作业了'}})
						}
					} else {
						res.send({error:2,result:{msg:'文字不得超过1024'}})
					}
				})
			} else {
				res.send({error:1,result:{msg:'你没有权限编辑该作业'}})
			}
		})
	})
})


module.exports = router;



function searchDetail(TeachingTaskId,req,res,TaskData,decoded) {
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    routeSql.TeachingDetail.findAll({where:{TeachingTaskId:TeachingTaskId}}).then(function(TeachingDetailArr){
        var ModelArray = []
        getAllModel(TeachingDetailArr)
        function getAllModel(TeachingDetailArr){
            var TeachingDetailData = TeachingDetailArr.shift()
            if (TeachingDetailData) {
                var TeachingDetailDataValues = TeachingDetailData.dataValues
                if (TeachingDetailDataValues.Type == 0) {
                    routeSql.CloudDiskFiles.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(ModelData){
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
                    routeSql.Questionnaires.findOne({where:{Id:TeachingDetailDataValues.ModelId},attributes:['Title','Code',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),InSertIp),'CodePath'],'Count']}).then(function(ModelData){
                        if (decoded.UserType != 0) {
                            ModelArray.push({TeachingDetailData,ModelData})
                        } else {
                            ModelArray.push({TeachingDetailData,ModelData:{}})
                        }
                        getAllModel(TeachingDetailArr)
                    })
                }
            } else {
                res.send({error:0,result:{ModelArray,TaskData}})
            }
        }
    })
}


