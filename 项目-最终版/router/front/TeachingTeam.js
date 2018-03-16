 
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var JoinToExamResult = require('./AddExamData.js')
var JoinToHomeWorkResult = require('./AddHomeWorkData.js')

// 添加团队
router.get('/AddTeachingTeam',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(decoded)
    if (decoded.Type > 0) {
    	routeSql.TeachingTeam.create({Name:req.body.Name,Desc:req.body.Desc,CreatorUserId:decoded.Id})
    } else {
    	res.send({error:0,result:{msg:'你没有权限进行处理修改'}})
    }
})

router.get('/AllTeachingTeam',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingTeam.findAll({where:{CreatorUserId:decoded.Id,IsDeleted:false}}).then(function(TeamArr){
    	res.send({error:0,result:TeamArr})
    })
})

router.post('/destroyTeachingTeam',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingTeam.findOne({where:{Id:req.body.TeachingTeamId,IsDeleted:false}}).then(function(data){
    	if (decoded.Id == data.dataValues.CreatorUserId) {
    		routeSql.TeachingTeam.update({IsDeleted:true},{where:{Id:req.body.TeachingTeamId}}).then(function(){
    			res.send({error:0,result:{msg:'删除团队成功'}})
    		})
    	} else {
			res.send({error:1,result:{msg:'你没有权限删除团队'}})
    	}
    })
})

router.post('/ClassesAndStudent',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var resultArr = []
	var IncludeUserId = []
	routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:req.body.TeachingActivityId},attributes:['UserId']}).then(function(UserArr){
		for (var i = 0; i < UserArr.length; i++) {
			IncludeUserId.push(UserArr[i].UserId)
		}
		routeSql.AbpUsers.findOne({where:{Id:decoded.Id}}).then(function(UserData){
			if (UserData.dataValues.TenantId) {
				if (IncludeUserId.length == 0) {IncludeUserId = [0]}
				routeSql.AbpUsers.findAll({where:{IsDeleted:false,ClassName:UserData.dataValues.UserName,Id:{$notIn:IncludeUserId},UserType:0},attributes:['Id','UserName','Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']],required:false}).then(function(ClassStudent){
					resultArr.push({ClassName:{ClassesName:UserData.dataValues.UserName,Id:UserData.dataValues.Id},ClassStudent:ClassStudent})
					res.send({error:0,result:resultArr})
				})
				// searchStudent([UserData.dataValues.UserName],IncludeUserId)
			} else {
				routeSql.ClassesName.findAll().then(function(arr){
					IncludeUserId = IncludeUserId.map(s => s*1);
					searchStudent(arr,IncludeUserId)
				})
			}
		})
		// resultArr.push(UserArr)
	})
	function searchStudent(ClassArr,IncludeUser){
		var ClassName = ClassArr.shift()
		if (ClassName) {
		// console.log(ClassName)
		console.log(ClassName.dataValues)
			if (IncludeUser.length == 0) {IncludeUser = [0]}
			routeSql.AbpUsers.findAll({
				where:{IsDeleted:false,ClassName:ClassName.dataValues.ClassesName,Id:{$notIn:IncludeUser},UserType:0},
				attributes:['Id','UserName','Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']],
				required:false
			}).then(function(ClassStudent){
				resultArr.push({ClassName:ClassName,ClassStudent:ClassStudent})
				searchStudent(ClassArr,IncludeUser)
			})
		} else {
			res.send({error:0,result:resultArr})
		}
	}
})

router.post('/AllStudents',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(decoded)
    if (decoded.UserType > 0) {
		var limit = parseInt(req.body.limit)
		var page = req.body.page;
		var offset = (page - 1) * limit;
		var nameMsg = req.body.nameMsg;
		var classMsg = ''
		if (req.body.classMsg) {
			classMsg = req.body.classMsg;
		}
		var IncludeUserId = []
		routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:req.body.TeachingActivityId},attributes:['UserId']}).then(function(UserArr){
			for (var i = 0; i < UserArr.length; i++) {
				IncludeUserId.push(UserArr[i].UserId)
			}
			searchStudent(IncludeUserId)
			// resultArr.push(UserArr)
		})
		function searchStudent(IncludeUserId){
			routeSql.AbpUsers.findAll({
				attributes:['Id','Surname','ClassName','Name'],
				where:{IsDeleted:false,ClassName:{$like:'%' + classMsg + '%'},Name:{$like:'%' + nameMsg + '%'},Id:{$notIn:IncludeUser}}
			}).then(function(data){res.send(data)})
		}
    } else {
    	res.send({error:1,result:{msg:'你没有权限进行查询'}})
    }
})

router.post('/AddTeamUsers',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingTeam.findOne({where:{Id:req.body.TeachingTeamId,IsDeleted:false}}).then(function(data){
    	if (decoded.Id == data.dataValues.CreatorUserId) {
			var userArr = req.body.UserArr;
			function saveTeamUser(UserArr){
				var UserId = UserArr.shift()
				if (UserId) {
					routeSql.TeachingActivityUser.create({UserId:UserId,TeachingActivityId:req.body.TeachingActivityId}).then(function(){
						saveTeamUser(UserArr)
					})
				} else {
					res.send({error:0,result:{msg:'添加学生成功'}})
				}
			}
			saveTeamUser(userArr)
    	} else {
			res.send({error:1,result:{msg:'你没有权限添加学生'}})
    	}
    })
})

// router.get('/AllTeamUser',function(req,res){})

router.get('/destroyTeamUsers',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingTeam.findOne({where:{Id:req.body.TeachingTeamId,IsDeleted:false}}).then(function(data){
    	if (decoded.Id == data.dataValues.CreatorUserId) {
    		routeSql.TeachingTeamUser.destroy({where:{TeachingTeamId:req.body.TeachingTeamId,UserId:req.body.TeamUserId}}).then(function(){
    			res.send({error:0,result:{msg:'删除学生成功'}})
    		})
    	} else {
			res.send({error:1,result:{msg:'你没有权限删除学生'}})
    	}
    })
})

router.get('/ShowActivityUsers',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:req.query.TeachingActivityId}}).then(function(arr){
		var result = []
		SearchUser(arr);
		function SearchUser(UserArr){
			var UserId = UserArr.shift()
			if (UserId) {
				routeSql.AbpUsers.findOne({where:{Id:UserId.dataValues.UserId},attributes:['Id','UserName','Name',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage']]}).then(function(data){
					if (data) {
						result.push(data);
					}
					// console.log(result)
					SearchUser(UserArr)
				})
			} else {
				res.send({error:0,result:result})
			}
		}
	})
})

router.post('/AddActivityTeam',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.TeachingActivity.findOne({where:{Id:req.body.TeachingActivityId}}).then(function(ActivityData){
		routeSql.TeachingTeam.findOne({where:{Id:req.body.TeachingTeamId,IsDeleted:false}}).then(function(TeamData){
			if (decoded.Id == ActivityData.dataValues.CreatorUserId && decoded.Id == TeamData.dataValues.CreatorUserId) {
				routeSql.TeachingTeamUser.findAll({where:{TeachingTeamId:req.body.TeachingTeamId}}).then(function(Arr){
					var userArr = Arr;
					function saveActivityUser(UserArr){
						var UserId = UserArr.shift()
						if (UserId) {
							routeSql.TeachingActivityUser.create({UserId:UserId,TeachingActivityId:req.body.TeachingActivityId}).then(function(){
								saveActivityUser(UserArr)
							})
						} else {
							res.send({error:0,result:{msg:'添加学生成功'}})
						}
					}
					saveActivityUser(userArr)
				})
			} else {
				res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
			}
		})
	})
})

router.post('/CodeAddUserToActivity',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log({decoded,InviteCode:req.body.InviteCode})
	if (decoded.UserType == 0) {
		routeSql.TeachingActivity.findOne({where:{InviteCode:req.body.InviteCode,IsDeleted:false}}).then(function(ActivityData){
			if (ActivityData) {
				routeSql.TeachingActivityUser.findOne({where:{UserId:decoded.Id,TeachingActivityId:ActivityData.dataValues.Id}}).then(function(ActivityUserData){
					if (ActivityUserData) {
						res.send({error:0,result:{msg:'你已经加入该活动'}})
					} else {
						routeSql.TeachingActivityUser.create({UserId:decoded.Id,TeachingActivityId:ActivityData.dataValues.Id}).then(function(){
							res.send({error:0,result:{msg:'加入活动成功'}})
							JoinToExamResult()
                    		JoinToHomeWorkResult()
						})
					}
				})
			} else {
				res.send({error:2,result:{msg:'该活动已经不存在了'}})
			}
		})
	} else {
		res.send({error:1,result:{msg:'只有学生才能添加进活动'}})
	}
})

router.post('/AddActivityUsers',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body)
	routeSql.TeachingActivity.findOne({where:{Id:req.body.TeachingActivityId}}).then(function(data){
		if (decoded.Id == data.dataValues.CreatorUserId) {
			var userArr = []
			userArr = req.body.UserArr?req.body.UserArr:[];
			function saveActivityUser(UserArr){
				var UserId = UserArr.shift()
				if (UserId) {
					routeSql.TeachingActivityUser.findAll({where:{UserId:UserId,TeachingActivityId:req.body.TeachingActivityId}}).then(function(ActivityUserData){
						if (ActivityUserData.length == 0) {
							routeSql.AbpUsers.findOne({where:{Id:UserId}}).then(function(AbpUser){
								if (AbpUser.dataValues.UserType == 0) {
									routeSql.TeachingActivityUser.create({UserId:UserId,TeachingActivityId:req.body.TeachingActivityId}).then(function(){
										saveActivityUser(UserArr)
									})
								} else {
									saveActivityUser(UserArr)
								}
							})
						} else {
							saveActivityUser(UserArr)
						}
					})
				} else {
					res.send({error:0,result:{msg:'添加学生成功'}})
                    JoinToExamResult()
                    JoinToHomeWorkResult()
				}
			}
			saveActivityUser(userArr)
		} else {
			res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
		}
	})
})

router.post('/DestroyActivityUsers',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body)
	routeSql.TeachingActivity.findOne({where:{Id:req.body.TeachingActivityId}}).then(function(data){
		if (decoded.Id == data.dataValues.CreatorUserId) {
			DestroyUsers(req.body.UserId)
		} else {
			res.send({error:1,result:{msg:'你没有权限删除学生'}})
		}
	})
	function DestroyUsers(UsersId){
		var UserId = UsersId.shift()
		if (UserId) {
			routeSql.TeachingDetail.findAll({where:{TeachingActivityId:req.body.TeachingActivityId,Type:1}}).then(function(ExamArr){
				DestroyStuExamResult(ExamArr)
				function DestroyStuExamResult(ExamArr){
					var ExamData = ExamArr.shift()
					if (ExamData) {
						routeSql.ExamResult.update({IsDeleted:true},{where:{ExamId:ExamData.dataValues.ModelId,UserId:UserId}}).then(function(){
							DestroyStuExamResult(ExamArr)
						})
					} else {
						routeSql.TeachingDetail.findAll({where:{TeachingActivityId:req.body.TeachingActivityId,Type:2}}).then(function(HomeWorkArr){
							DestroyStuHomeWorkResult(HomeWorkArr)
							function DestroyStuHomeWorkResult(HomeWorkArr){
								var HomeWorkData = HomeWorkArr.shift()
								if (HomeWorkData) {
									routeSql.HomeWorkResult.destroy({where:{HomeWorkId:HomeWorkData.dataValues.ModelId,UserId:UserId}}).then(function(){
										DestroyStuHomeWorkResult(HomeWorkArr)
									})
								} else {
									routeSql.TeachingActivityUser.destroy({where:{UserId:UserId,TeachingActivityId:req.body.TeachingActivityId}}).then(function(){
										DestroyUsers(UsersId)
									})
								}
							}
						})
					}
				}
			})
		} else {
			res.send({error:0,result:{msg:'删除学生成功'}})
            JoinToExamResult()
            JoinToHomeWorkResult()
		}
	}
})

module.exports = router;



