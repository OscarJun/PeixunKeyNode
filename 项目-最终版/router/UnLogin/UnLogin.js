var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var fs = require('fs')
var jwt = require('jwt-simple'); //引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret', 'JingGe'); //设置token加密字段
var qrImage = require('qr-image')
var fs = require('fs')
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')

router.get('/api/HomePage', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	// console.log(req.headers)
	if(req.headers.token && req.headers.token != '' && req.headers.token != 'null') {
		// console.log('1111111111')
		var token = req.headers.token;
		var decoded = jwt.decode(token, app.get('jwtTokenSecret'))
		var result = {}
		result.AllPublicNum = 0;
		routeSql.AbpUsers.findOne({
			where: {
				UserType: 2
			}
		}).then(function(SuperAdmin) {
			routeSql.TeachingActivity.findAll({
				where: {
					CreatorUserId: SuperAdmin.dataValues.Id,
					IsDeleted: false
				},
				attributes: ['Id', 'Title', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'BrowNum']
			}).then(function(ModelActivityArr) {
				// result.ModelActivityArr = ModelActivityArr;
				if(decoded.UserType == 2) {
					result.ModelActivityArr = []
				} else {
					result.ModelActivityArr = ModelActivityArr;
				}
				routeSql.TeachingActivity.findAll({
					where: {
						IsDeleted: false,
						IsPublic: true,
						CreatorUserId: {
							$ne: SuperAdmin.dataValues.Id
						}
					},
					limit: 8,
					offset: 0,
					order: [
						['CreationTime', 'DESC']
					],
					attributes: ['Id', 'Title', 'Desc', 'IsPublic', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'],
						[sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'CreationTime', 'InviteCode', 'BrowNum'
					],
					include: [{
						model: routeSql.AbpUsers,
						as: 'ActivityCreatorUser',
						attributes: ['Id', 'Name']
					}]
				}).then(function(PublicArr) {
					routeSql.TeachingActivity.count({
						where: {
							IsDeleted: false,
							IsPublic: true,
							CreatorUserId: {
								$ne: SuperAdmin.dataValues.Id
							}
						}
					}).then(function(AllPublicNum) {
						result.AllPublicNum = AllPublicNum;
					})
					// result.PublicArr = PublicArr;
					var resultPublicArr = []
					// console.log('++++++++++++++++')
					// console.log(PublicArr)
					AddPublic(PublicArr)

					function AddPublic(PublicArr) {
						var PublicData = PublicArr.shift()
						if(PublicData) {
							var Public = PublicData.dataValues
							routeSql.TeachingActivityUser.count({
								where: {
									TeachingActivityId: Public.Id
								}
							}).then(function(count) {
								Public.Count = count;
								resultPublicArr.push(Public)
								// console.log('----------------')
								// console.log(resultPublicArr)
								AddPublic(PublicArr)
							})
						} else {
							// console.log('================')
							// console.log(resultPublicArr)
							result.PublicArr = resultPublicArr
							if(decoded.UserType != 0) {
								routeSql.TeachingActivity.findAll({
									where: {
										IsDeleted: false,
										CreatorUserId: decoded.Id
									},
									order: [
										['CreationTime', 'DESC']
									],
									attributes: ['Id', 'Title', 'Desc', 'IsPublic', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'],
										[sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'CreationTime', 'InviteCode', 'BrowNum'
									],
									include: [{
										model: routeSql.AbpUsers,
										as: 'ActivityCreatorUser',
										attributes: ['Id', 'Name']
									}]
								}).then(function(ActivityArr) {
									var arr = [];
									AddUserNum(ActivityArr);

									function AddUserNum(ActivityArr) {
										var ActivityData = ActivityArr.shift();
										if(ActivityData) {
											var Activity = ActivityData.dataValues
											routeSql.TeachingActivityUser.count({
												where: {
													TeachingActivityId: Activity.Id
												}
											}).then(function(count) {
												Activity.Count = count;
												arr.push(Activity)
												AddUserNum(ActivityArr)
											})
										} else {
											result.OwnArr = arr
											res.send({
												error: 0,
												result: result
											})
										}
									}
								})
							}
							// else if (decoded.UserType == 2){
							//     routeSql.TeachingActivity.findAll({where:{IsDeleted:false},order:[['CreationTime','DESC']],attributes:['Id','Title','Desc','IsPublic','CodePath','Img','CreationTime','InviteCode','BrowNum'],include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(ActivityArr){
							//         var arr = [];
							//         AddUserNum(ActivityArr);
							//         function AddUserNum(ActivityArr){
							//             var ActivityData = ActivityArr.shift();
							//             if (ActivityData) {
							//                 Activity = ActivityData.dataValues
							//                 routeSql.TeachingActivityUser.count({where:{TeachingActivityId:Activity.Id}}).then(function(count){
							//                     Activity.Count = count;
							//                     arr.push(Activity)
							//                     AddUserNum(ActivityArr)
							//                 })
							//             } else {
							//                 result.OwnArr = arr
							//                 res.send({error:0,result:result})
							//             }
							//         }
							//     })
							// }
							else {
								routeSql.TeachingActivityUser.findAll({
									where: {
										UserId: decoded.Id
									},
									order: [
										[{
											model: routeSql.TeachingActivity,
											as: 'UserTeachingActivityId'
										}, 'CreationTime', 'DESC']
									],
									include: [{
										model: routeSql.TeachingActivity,
										as: 'UserTeachingActivityId',
										attributes: ['Id', 'Title', 'Desc', 'IsPublic', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'],
											[sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'CreationTime', 'InviteCode', 'BrowNum'
										]
									}]
								}).then(function(ActivityArr) {
									var arr = [];
									AddUserNum(ActivityArr);

									function AddUserNum(ActivityArr) {
										var ActivityData = ActivityArr.shift();
										if(ActivityData) {
											routeSql.TeachingActivity.findOne({
												where: {
													Id: ActivityData.dataValues.TeachingActivityId,
													IsDeleted: false
												},
												attributes: ['Id', 'Title', 'Desc', 'IsPublic', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'],
													[sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'CreationTime', 'InviteCode', 'BrowNum'
												],
												order: [
													['CreationTime', 'DESC']
												],
												include: [{
													model: routeSql.AbpUsers,
													as: 'ActivityCreatorUser',
													attributes: ['Id', 'Name']
												}]
											}).then(function(data) {
												if(data) {
													var Activity = data.dataValues;
													routeSql.TeachingActivityUser.count({
														where: {
															TeachingActivityId: Activity.Id
														}
													}).then(function(count) {
														Activity.Count = count;
														arr.push(Activity)
														AddUserNum(ActivityArr)
													})
												} else {
													AddUserNum(ActivityArr)
												}
											})
										} else {
											result.OwnArr = arr
											res.send({
												error: 0,
												result: result
											})
										}
									}
								})
							}
						}
					}
				})
			})
		})
	} else {
		// console.log('---')
		routeSql.AbpUsers.findOne({
			where: {
				UserType: 2
			}
		}).then(function(SuperAdmin) {
			routeSql.TeachingActivity.findAll({
				where: {
					CreatorUserId: SuperAdmin.dataValues.Id,
					IsDeleted: false
				},
				attributes: ['Id', 'Title', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'BrowNum']
			}).then(function(ModelActivityArr) {
				routeSql.TeachingActivity.findAll({
					where: {
						IsDeleted: false,
						IsPublic: true,
						CreatorUserId: {
							$ne: SuperAdmin.dataValues.Id
						}
					},
					limit: 8,
					offset: 0,
					order: [
						['CreationTime', 'DESC']
					],
					attributes: ['Id', 'Title', 'Desc', 'IsPublic', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'],
						[sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'CreationTime', 'InviteCode', 'BrowNum'
					],
					include: [{
						model: routeSql.AbpUsers,
						as: 'ActivityCreatorUser',
						attributes: ['Id', 'Name']
					}]
				}).then(function(PublicArr) {
					routeSql.TeachingActivity.count({
						where: {
							IsDeleted: false,
							IsPublic: true,
							CreatorUserId: {
								$ne: SuperAdmin.dataValues.Id
							}
						}
					}).then(function(AllPublicNum) {
						res.send({
							error: 0,
							result: {
								AllPublicNum: AllPublicNum,
								PublicArr: PublicArr,
								ModelActivityArr: ModelActivityArr,
								OwnArr: []
							}
						})
					})
				})
				// res.send({error:0,result:ModelActivityArr})
			})
		})
	}
})

// 我的项目
router.get('/api/PublicProject', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	var result = {}
	routeSql.AbpUsers.findOne({
		where: {
			UserType: 2
		}
	}).then(function(SuperAdmin) {
		routeSql.TeachingActivity.findAll({
			where: {
				IsDeleted: false,
				IsPublic: true,
				CreatorUserId: {
					$ne: SuperAdmin.dataValues.Id
				}
			},
			limit: 8,
			offset: 0,
			order: [
				['CreationTime', 'DESC']
			],
			attributes: ['Id', 'Title', 'Desc', 'IsPublic', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'],
				[sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'CreationTime', 'InviteCode'
			],
			include: [{
				model: routeSql.AbpUsers,
				as: 'ActivityCreatorUser',
				attributes: ['Id', 'Name']
			}]
		}).then(function(PublicArr) {
			// result.PublicArr = PublicArr;
			result.PublicArr = []
			AddPublic(PublicArr)

			function AddPublic(PublicArr) {
				var PublicData = PublicArr.shift()
				if(PublicData) {
					var Public = PublicData.dataValues
					routeSql.TeachingActivityUser.count({
						where: {
							TeachingActivityId: Activity.Id
						}
					}).then(function(count) {
						Public.Count = count;
						result.PublicArr.push(Public)
						AddPublic(PublicArr)
					})
				} else {
					res.send({
						error: 0,
						result: result
					})
				}
			}
		})
	})
})

router.get('/api/ModelActivity', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	// var token = req.headers.token
	// var decoded = jwt.decode(token,app.get('jwtTokenSecret'))
	ModelActivity()

	function ModelActivity() {
		routeSql.AbpUsers.findOne({
			where: {
				UserType: 2
			}
		}).then(function(SuperAdmin) {
			routeSql.TeachingActivity.findAll({
				where: {
					CreatorUserId: SuperAdmin.dataValues.Id,
					IsDeleted: false
				},
				attributes: ['Id', 'Title', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'BrowNum']
			}).then(function(ModelActivityArr) {
				res.send({
					error: 0,
					result: ModelActivityArr
				})
			})
		})
	}
})

router.get('/api/AllPublicActivity', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	routeSql.AbpUsers.findOne({
		where: {
			UserType: 2
		}
	}).then(function(SuperAdmin) {
		routeSql.TeachingActivity.findAll({
			where: {
				IsDeleted: false,
				IsPublic: true,
				CreatorUserId: {
					$ne: SuperAdmin.dataValues.Id
				}
			},
			order: [
				['CreationTime', 'DESC']
			],
			attributes: ['Id', 'Title', 'Desc', 'IsPublic', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'],
				[sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img'], 'CreationTime', 'InviteCode', 'BrowNum'
			],
			include: [{
				model: routeSql.AbpUsers,
				as: 'ActivityCreatorUser',
				attributes: ['Id', 'Name']
			}]
		}).then(function(PublicArr) {
			res.send({
				error: 0,
				result: PublicArr
			})
		})
	})
})

router.get('/api/TeachingActivityforWeb', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	// console.log(req.query)
	var Id = req.query.Id
	if(req.headers.token && req.headers.token != '' && req.headers.token != 'null') {
		var token = req.headers.token;
		var decoded = jwt.decode(token, app.get('jwtTokenSecret')) //解析token
		// console.log(Id)
		routeSql.TeachingActivity.findOne({
			where: {
				Id: Id
			}
		}).then(function(ActivityData) {
			routeSql.AbpUsers.findOne({
				where: {
					UserType: 2
				}
			}).then(function(SuperAdmin) {
				routeSql.TeachingActivityUser.findOne({
					where: {
						UserId: decoded.Id,
						TeachingActivityId: Id
					}
				}).then(function(User) {
					if(decoded.UserType != 0 && decoded.Id == ActivityData.dataValues.CreatorUserId) {
						var State = 0
						searchActivity(State)
					} else if(User) {
						var State = 1
						searchActivity(State)
					} else if(ActivityData.dataValues.IsPublic || SuperAdmin.dataValues.Id == ActivityData.dataValues.CreatorUserId) {
						var State = 2
						searchActivity(State)
					} else {
						res.send({
							error: 1,
							result: {
								msg: '你没有权限查看该活动'
							}
						})
					}
				})
			})
		})
	} else {
		// console.log(Id)
		routeSql.TeachingActivity.findOne({
			where: {
				Id: req.query.Id
			}
		}).then(function(ActivityData) {
			// console.log(ActivityData)
			routeSql.AbpUsers.findOne({
				where: {
					Id: ActivityData.dataValues.CreatorUserId
				}
			}).then(function(UserData) {
				if(UserData.dataValues.UserType == 2) {
					searchActivity(2)
				} else {
					if(ActivityData.dataValues.IsPublic) {
						searchActivity(2)
					} else {
						res.send({
							error: 1,
							result: {
								msg: '你没有权限查看该活动'
							}
						})
					}
				}
			})
		})
	}

	function searchActivity(UserState) {
		// console.log(Id)
		routeSql.TeachingActivity.findOne({
			where: {
				Id: req.query.Id,
				IsDeleted: false
			},
			attributes: ['Id', 'Title', 'Desc', 'IsPublic', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'], 'InviteCode', 'BrowNum', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Img')), InSertIp), 'Img']]
		}).then(function(ActivityData) {
			// console.log(ActivityData)
			var ActivityArray = []
			if(ActivityData) {
				if(UserState != 0) {
					var BrowseNum = parseInt(ActivityData.dataValues.BrowNum)
					routeSql.TeachingActivity.update({
						BrowNum: BrowseNum + 1
					}, {
						where: {
							Id: Id
						}
					})
					// routeSql.TeachingActivity.update({BrowNum:ActivityData.dataValues.BrowNum + 1},{where:{Id:Id}})
				}
				routeSql.TeachingLink.findAll({
					where: {
						TeachingActivityId: Id,
						IsDeleted: false
					},
					attributes: ['Id', 'Title', 'Desc', 'TaskCount', 'ShowSort'],
					order: [
						['ShowSort', 'ASC']
					]
				}).then(function(TeachingLinkArr) {
					getAllLink(TeachingLinkArr)

					function getAllLink(TeachingLinkArr) {
						var TeachingLinkData = TeachingLinkArr.shift()
						var TeachingLinkDataValues = {}
						if(TeachingLinkData) {
							TeachingLinkDataValues = TeachingLinkData.dataValues;
							routeSql.TeachingTask.findAll({
								where: {
									TeachingLinkId: TeachingLinkDataValues.Id,
									IsDeleted: false
								},
								attributes: ['Id', 'Title', 'Desc', 'ShowSort', 'IsDeleted'],
								order: [
									['ShowSort', 'ASC']
								]
							}).then(function(TeachingTaskArr) {
								var TaskArray = []
								getAllTask(TeachingTaskArr)

								function getAllTask(TeachingTaskArr) {
									var TeachingTaskData = TeachingTaskArr.shift()
									if(TeachingTaskData) {
										var TeachingTaskDataValues = TeachingTaskData.dataValues;
										routeSql.TeachingDetail.findAll({
											where: {
												TeachingTaskId: TeachingTaskDataValues.Id
											}
										}).then(function(TeachingDetailArr) {
											var ModelArray = []
											getAllModel(TeachingDetailArr)

											function getAllModel(TeachingDetailArr) {
												var TeachingDetailData = TeachingDetailArr.shift()
												if(TeachingDetailData) {
													var TeachingDetailDataValues = TeachingDetailData.dataValues
													if(TeachingDetailDataValues.Type == 0) {
														// console.log(TeachingDetailDataValues)
														// console.log('-----')
														routeSql.CloudDiskFiles.findOne({
															where: {
																Id: TeachingDetailDataValues.ModelId
															},
															include: [{
																model: routeSql.Resources,
																as: 'DiskFilesResourceId',
																attributes: ['FileCategory', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('FileUrl')), InSertIp), 'FileUrl'], 'FileSize', 'CreationTime']
															}]
														}).then(function(ModelData) {
															// console.log(ModelData)
															// console.log(ModelData.dataValues)
															ModelArray.push({
																TeachingDetailData: TeachingDetailData,
																ModelData: {
																	FileName: ModelData.dataValues.FileName,
																	ResourceId: ModelData.dataValues.ResourceId,
																	FileCategory: ModelData.dataValues.DiskFilesResourceId.FileCategory,
																	FileUrl: ModelData.dataValues.DiskFilesResourceId.FileUrl,
																	FileSize: ModelData.dataValues.DiskFilesResourceId.FileSize
																}
															})
															getAllModel(TeachingDetailArr)
														})
													} else if(TeachingDetailDataValues.Type == 1) {
														routeSql.MyExam.findOne({
															where: {
																Id: TeachingDetailDataValues.ModelId
															}
														}).then(function(ExamData) {
															routeSql.MyExamBase.findOne({
																where: {
																	Id: ExamData.dataValues.MyExamBaseId
																}
															}).then(function(ExamBaseData) {
																if(UserState != 2) {
																	routeSql.ExamResult.findOne({
																		where: {
																			UserId: decoded.Id,
																			ExamId: TeachingDetailDataValues.ModelId
																		}
																	}).then(function(ExamResultData) {
																		routeSql.MyExamQuestion.count({
																			where: {
																				MyExamBaseId: ExamBaseData.dataValues.Id
																			}
																		}).then(function(QuestionCount) {
																			var State;
																			var TeacherPaperState;
																			if(new Date(ExamData.dataValues.EndDate) > new Date()) {
																				if(ExamResultData) {
																					if(ExamResultData.dataValues.State == 1 || Date(ExamResultData.dataValues.EndDate) < new Date()) {
																						State = 2 //已经提交过了或者考试时长已经过了考试未结束
																					} else {
																						State = 0 //可以开始考试
																					}
																				} else {
																					State = 3 //考试还未开始或不能参加该考试
																				}
																			} else {
																				State = 1 //考试已经结束
																			}
																			if(new Date(ExamData.dataValues.StartDate) > new Date()) {
																				TeacherPaperState = 2;
																			} else if(new Date(ExamData.dataValues.StartDate) < new Date() && new Date(ExamData.dataValues.EndDate) > new Date()) {
																				TeacherPaperState = 0;
																			} else {
																				TeacherPaperState = 1;
																			}
																			ModelArray.push({
																				TeachingDetailData: TeachingDetailData,
																				ModelData: {
																					State: State,
																					CountScore: ExamBaseData.dataValues.CountScore,
																					PassScore: ExamBaseData.dataValues.PassScore,
																					StartDate: ExamData.dataValues.StartDate,
																					EndDate: ExamData.dataValues.EndDate,
																					TimeLong: ExamData.dataValues.TimeLong,
																					MyExamBaseId: ExamData.dataValues.MyExamBaseId,
																					QuestionCount: QuestionCount,
																					TeacherPaperState: TeacherPaperState
																				}
																			})
																			getAllModel(TeachingDetailArr)
																		})
																	})
																} else {
																	ModelArray.push({
																		TeachingDetailData: TeachingDetailData,
																		ModelData: {}
																	})
																	getAllModel(TeachingDetailArr)
																}
															})
														})
														// routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.MyExamBase,as:'TestPaper',attributes:['PassScore','CountScore']}]}).then(function(ModelData){
														//     ModelArray.push({TeachingDetailData,ModelData})
														//     getAllModel(TeachingDetailArr)
														// })
													} else if(TeachingDetailDataValues.Type == 2) {
														routeSql.HomeWork.findOne({
															where: {
																Id: TeachingDetailDataValues.ModelId
															}
														}).then(function(ModelData) {
															if(new Date() > new Date(ModelData.dataValues.EndDate)) {
																ModelData.dataValues.IsEnd = true
															} else {
																ModelData.dataValues.IsEnd = false
															}
															ModelArray.push({
																TeachingDetailData,
																ModelData
															})
															getAllModel(TeachingDetailArr)
														})
													} else if(TeachingDetailDataValues.Type == 3) {
														routeSql.Questionnaires.findOne({
															where: {
																Id: TeachingDetailDataValues.ModelId
															},
															attributes: ['Title', 'Code', [sequelize.fn('Nullif', sequelize.fn("CONCAT", CodePathIp, sequelize.col('CodePath')), CodePathIp), 'CodePath'], 'Count']
														}).then(function(ModelData) {
															if(UserState == 0) {
																ModelArray.push({
																	TeachingDetailData,
																	ModelData
																})
															} else {
																ModelArray.push({
																	TeachingDetailData,
																	ModelData: {}
																})
															}
															getAllModel(TeachingDetailArr)
														})
													}
												} else {
													TaskArray.push({
														TeachingTaskDataValues,
														ModelArray
													})
													getAllTask(TeachingTaskArr);
												}
											}
										})
									} else {
										ActivityArray.push({
											TeachingLinkDataValues,
											TaskArray
										})
										getAllLink(TeachingLinkArr)
									}
								}
							})
						} else {
							// console.log(ActivityArray)
							res.send({
								error: 0,
								result: {
									ActivityData,
									ActivityArray,
									UserState: UserState
								}
							})
						}
					}
				})
			} else {
				// console.log(req.query)
				res.send({
					error: 2,
					result: {
						msg: '没找到该活动'
					}
				})
			}
		})
	}
})

router.get('/api/TrainCourseCategoriesforWeb', function(req, res) {
	var count;
	routeSql.TrainCourseCategories.count({
		where: {
			FatherId: {
				$ne: 0
			},
			IsDeleted: false,
			CreatorUserId: {
				$ne: 0
			}
		}
	}).then(function(c) {
		count = c;
	})
	routeSql.TrainCourseCategories.findAll({
		where: {
			FatherId: {
				$ne: 0
			},
			IsDeleted: false,
			CreatorUserId: {
				$ne: 0
			}
		},
		attributes: ['Id', 'Name']
	}).then(function(arr) {
		var data = {}
		data.error = 0;
		data.result = {
			count: count,
			arr: arr
		}
		res.send(data);
	})
})

router.get('/api/TrainCourseCenterforWeb', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	// console.log(req.query)
	if(req.headers.token && req.headers.token != '' && req.headers.token != 'null') {
		// console.log('1111111')
		var data = {
			IsDeleted: false
		}
		var msg = req.query.msg ? req.query.msg : '';
		req.query.typeId == 0 ? data : data.TrainCourseCategoryId = req.query.typeId;
		data.Title = {
			$like: '%' + msg + '%'
		}
		var page = req.query.page;
		var limit = parseInt(req.query.pageSize);
		var offset = (page - 1) * limit;
		var count;
		routeSql.TrainCourses.count({
			where: data
		}).then(function(c) {
			count = c;
		})
		var ordermsg;
		if(req.query.order == 1) {
			ordermsg = [
				[{
					model: routeSql.TrainCourseAnalysis,
					as: 'TrainCoursesTrainCourseAnalysisId',
					attributes: ['StudentNum']
				}, 'BrowseNum', 'DESC']
			]
		} else {
			ordermsg = [
				['CreationTime', 'DESC']
			]
		}
		// console.log(data)
		routeSql.TrainCourses.findAll({
			where: data,
			Title: {
				$like: '%' + msg + '%'
			},
			limit: limit,
			offset: offset,
			order: ordermsg,
			attributes: ['Id', 'Title', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Thumb')), InSertIp), 'Thumb'], 'TrainCourseAnalysisId'],
			include: [{
				model: routeSql.TrainCourseAnalysis,
				as: 'TrainCoursesTrainCourseAnalysisId',
				attributes: ['StudentNum', 'BrowseNum']
			}]
		}).then(function(arr) {
			var data = {}
			data.error = 0;
			data.result = {
				count: count,
				arr: arr
			}
			res.send(data);
		});
	} else {
		// console.log('22222')
		var data = {
			IsDeleted: false,
			IsPublic: true
		}
		var msg = req.query.msg ? req.query.msg : '';
		req.query.typeId == 0 ? data : data.TrainCourseCategoryId = req.query.typeId;
		data.Title = {
			$like: '%' + msg + '%'
		}
		var page = req.query.page;
		var limit = parseInt(req.query.pageSize);
		var offset = (page - 1) * limit;
		var count;
		routeSql.TrainCourses.count({
			where: data
		}).then(function(c) {
			count = c;
		})
		var ordermsg;
		if(req.query.order == 1) {
			ordermsg = [
				[{
					model: routeSql.TrainCourseAnalysis,
					as: 'TrainCoursesTrainCourseAnalysisId',
					attributes: ['StudentNum']
				}, 'BrowseNum', 'DESC']
			]
		} else {
			ordermsg = [
				['CreationTime', 'DESC']
			]
		}
		routeSql.TrainCourses.findAll({
			where: data,
			Title: {
				$like: '%' + msg + '%'
			},
			limit: limit,
			offset: offset,
			order: ordermsg,
			attributes: ['Id', 'Title', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Thumb')), InSertIp), 'Thumb'], 'TrainCourseAnalysisId'],
			include: [{
				model: routeSql.TrainCourseAnalysis,
				as: 'TrainCoursesTrainCourseAnalysisId',
				attributes: ['StudentNum', 'BrowseNum']
			}]
		}).then(function(arr) {
			var data = {}
			data.error = 0;
			data.result = {
				count: count,
				arr: arr
			}
			res.send(data);
		});
	}
})

router.get('/api/TrainCourseCenter/TrainCourseDetailsforWeb', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	if(req.headers.token && req.headers.token != '' && req.headers.token != 'null') {
		var token = req.headers.token;
		var decoded = jwt.decode(token, app.get('jwtTokenSecret')) //解析token
		routeSql.TrainCourses.findOne({
			where: {
				Id: req.query.CourseId
			},
			include: [{
				model: routeSql.TrainCourseAnalysis,
				as: 'TrainCoursesTrainCourseAnalysisId',
				attributes: ['BrowseNum', 'CollectNum', 'PeriodNum', 'Rating', 'RatingNum', 'StudentNum']
			}],
			attributes: ['Id', 'Title', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Thumb')), InSertIp), 'Thumb'], 'TrainCourseAnalysisId', 'Summary', 'IsPublic']
		}).then(function(TrainCourseData) {
			var TrainCourse = TrainCourseData.dataValues
			routeSql.TrainCourseAnalysis.update({
				BrowseNum: TrainCourseData.dataValues.TrainCoursesTrainCourseAnalysisId.BrowseNum + 1
			}, {
				where: {
					Id: TrainCourseData.dataValues.TrainCourseAnalysisId
				}
			}).then(function(data) {
				// console.log(data.dataValues)
			})
			// console.log(decoded)
			routeSql.TrainPeriodRecords.count({
				where: {
					CourseId: TrainCourseData.dataValues.Id,
					UserId: decoded.Id,
					Status: 1
				}
			}).then(function(LearnedCount) {
				TrainCourse.LearnedCount = LearnedCount;
			})
			routeSql.Collects.findAll({
				where: {
					CourseId: TrainCourseData.dataValues.Id,
					CreatorUserId: decoded.Id
				}
			}).then(function(CollectsData) {
				if(CollectsData.length > 0) {
					TrainCourse.IsCollected = true;
				} else {
					TrainCourse.IsCollected = false;
				}
			})
			// console.log('11111111')
			var resultArr = [];
			var stationArr = [];
			routeSql.TrainCourseSections.findAll({
				where: {
					CourseId: TrainCourseData.dataValues.Id
				},
				order: [
					['Seq', 'ASC']
				],
				attributes: ['Id', 'Seq', 'Title']
				// ,include:[{model:routeSql.TrainPeriods,as:'TrainCourseSectionsTrainPeriods'}]
			}).then(function(arr) {
				stationArr = arr;
				dataTreat(stationArr)
			})

			function dataTreat(stationArr) {
				var data = new Object()
				data = stationArr.shift()
				// console.log('222222')
				if(data) {
					routeSql.TrainPeriods.findAll({
						where: {
							CourseSectionId: data.dataValues.Id
						},
						order: [
							['Seq', 'ASC']
						],
						attributes: ['Id', 'Title', 'Seq', 'Title', 'ResourceId'],
						include: [{
							model: routeSql.Resources,
							as: 'TrainPeriodResource',
							attributes: ['FileName', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('FileUrl')), InSertIp), 'FileUrl'], 'FileSize', 'FileCategory']
						}]
					}).then(function(periodArr) {
						data.dataValues.periodArr = periodArr
						resultArr.push(data.dataValues)
						dataTreat(stationArr);
					})
				} else {
					res.send({
						error: 0,
						result: {
							TrainCourse: TrainCourse,
							resultArr
						}
					})
				}
			}
		})
	} else {
		routeSql.TrainCourses.findOne({
			where: {
				Id: req.query.CourseId
			},
			include: [{
				model: routeSql.TrainCourseAnalysis,
				as: 'TrainCoursesTrainCourseAnalysisId',
				attributes: ['BrowseNum', 'CollectNum', 'PeriodNum', 'Rating', 'RatingNum', 'StudentNum']
			}],
			attributes: ['Id', 'Title', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('Thumb')), InSertIp), 'Thumb'], 'TrainCourseAnalysisId', 'Summary', 'IsPublic']
		}).then(function(TrainCourseData) {
			if(TrainCourseData.dataValues.IsPublic) {
				routeSql.TrainCourseAnalysis.update({
					BrowseNum: TrainCourseData.dataValues.TrainCoursesTrainCourseAnalysisId.BrowseNum + 1
				}, {
					where: {
						Id: TrainCourseData.dataValues.TrainCoursesTrainCourseAnalysisId.Id
					}
				}).then(function(data) {
					// console.log(data.dataValues)
				})
				TrainCourseData.dataValues.IsCollected = false;
				// TrainCourseData.dataValues.IsPraised = false;
				TrainCourseData.dataValues.LearnedCount = 0;
				// if (req.headers.token == null||req.headers.token == '') {
				// } else {
				//     var token = req.headers.token;
				//     var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
				//     routeSql.TrainPeriodRecords.count({where:{CourseId:TrainCourseData.dataValues.Id,CreatorUserId:decoded.Id,Score:1}}).then(function(LearnedCount){
				//         TrainCourseData.dataValues.LearnedCount = LearnedCount;
				//     })
				//     routeSql.Collects.findAll({where:{CourseId:TrainCourseData.dataValues.Id,CreatorUserId:decoded.Id}}).then(function(CollectsData){
				//         if (CollectsData.length > 0) {
				//             TrainCourseData.dataValues.IsCollected = true;
				//         } else {
				//             TrainCourseData.dataValues.IsCollected = false;
				//         }
				//     })
				//     // routeSql.Praises.findAll({where:{CourseId:TrainCourseData.dataValues.Id,CreatorUserId:decoded.Id}}).then(function(PraisesData){
				//     //  if (PraisesData.length > 0) {
				//     //      TrainCourseData.dataValues.IsPraised = true;
				//     //  } else {
				//     //      TrainCourseData.dataValues.IsPraised = false;
				//     //  }
				//     // })
				// }
				var resultArr = [];
				var stationArr = [];
				routeSql.TrainCourseSections.findAll({
					where: {
						CourseId: TrainCourseData.dataValues.Id
					},
					order: [
						['Seq', 'ASC']
					],
					attributes: ['Id', 'Seq', 'Title']
					// ,include:[{model:routeSql.TrainPeriods,as:'TrainCourseSectionsTrainPeriods'}]
				}).then(function(arr) {
					stationArr = arr;
					dataTreat(stationArr)
				})

				function dataTreat(stationArr) {
					var data = new Object()
					data = stationArr.shift()
					if(data) {
						routeSql.TrainPeriods.findAll({
							where: {
								CourseSectionId: data.dataValues.Id
							},
							order: [
								['Seq', 'ASC']
							],
							attributes: ['Id', 'Title', 'Seq', 'Title', 'ResourceId'],
							include: [{
								model: routeSql.Resources,
								as: 'TrainPeriodResource',
								attributes: ['FileName', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('FileUrl')), InSertIp), 'FileUrl'], 'FileSize', 'FileCategory']
							}]
						}).then(function(periodArr) {
							data.dataValues.periodArr = periodArr
							resultArr.push(data.dataValues)
							dataTreat(stationArr);
						})
					} else {
						res.send({
							error: 0,
							result: {
								TrainCourse: TrainCourseData.dataValues,
								resultArr
							}
						})
					}
				}
			} else {
				res.send({
					error: 1,
					result: {
						msg: '该课程未公开'
					}
				})
			}
		})
	}
})

router.get('/api/TrainCourseCenter/TrainPeriodsforWeb', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	routeSql.TrainPeriods.findOne({
		where: {
			Id: req.query.TrainPeriodsId
		}
	}).then(function(TrainPeriodData) {
		routeSql.TrainCourseSections.findOne({
			where: {
				Id: TrainPeriodData.dataValues.CourseSectionId
			}
		}).then(function(CourseSectionData) {
			routeSql.TrainCourses.findOne({
				where: {
					Id: CourseSectionData.dataValues.CourseId
				}
			}).then(function(CourseData) {
				if(CourseData.dataValues.IsPublic) {
					routeSql.Resources.findOne({
						where: {
							Id: TrainPeriodData.dataValues.ResourceId
						},
						attributes: ['Id', 'FileName', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('FileUrl')), InSertIp), 'FileUrl'], 'FileSize', 'FileCategory']
					}).then(function(resourceData) {
						res.send({
							error: 0,
							result: {
								IsPublic: true,
								resourceData: resourceData
							}
						})
					})
				} else {
					if(req.headers.token && req.headers.token != '' && req.headers.token != 'null') {
						routeSql.Resources.findOne({
							where: {
								Id: TrainPeriodData.dataValues.ResourceId
							},
							attributes: ['Id', 'FileName', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('FileUrl')), InSertIp), 'FileUrl'], 'FileSize', 'FileCategory']
						}).then(function(resourceData) {
							res.send({
								error: 0,
								result: {
									IsPublic: true,
									resourceData: resourceData
								}
							})
						})
					} else {
						res.send({
							error: 0,
							result: {
								IsPublic: false,
								resourceData: {}
							}
						})
					}
				}
			})
		})
	})
})

router.get('/GetFiles', function(req, res) {
	var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
	var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	if(parseInt(req.headers.insert)) {
		InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
		CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
	}
	routeSql.Resources.findOne({
		where: {
			Id: req.query.ResourceId
		},
		attributes: ['FileName', [sequelize.fn('Nullif', sequelize.fn("CONCAT", InSertIp, sequelize.col('FileUrl')), InSertIp), 'FileUrl']]
	}).then(function(data) {
		res.send({
			error: 0,
			result: data
		})
	})
})

module.exports = router;