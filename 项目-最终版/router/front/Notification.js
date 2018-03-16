var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var Notification = require('./AddNotification.js')

// Notification()
// console.log(Notification)
// console.log('111111111111111111111111111111111111111111111111111111111111111')
router.get('/GetNotification',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var Count = 0
	if (decoded.UserType == 0) {
		routeSql.Notification.findAll({where:{UserId:decoded.Id,IsDeleted:false},order:[['CreationTime','DESC']]}).then(function(NotiArr){
			// console.log(NotiArr)
			routeSql.Notification.count({where:{UserId:decoded.Id,IsDeleted:false,Status:0}}).then(function(notReadCount){
				// console.log(notReadCount)
				var result = []
				GetNotiInfo(NotiArr)
				function GetNotiInfo(NotiArr){
					var NotiData = NotiArr.shift()
					if (NotiData) {
						routeSql.TeachingDetail.findOne({where:{Type:NotiData.dataValues.Type,ModelId:NotiData.dataValues.ModelId}}).then(function(DetailData){
							if (DetailData) {
								routeSql.TeachingActivity.findOne({where:{Id:DetailData.dataValues.TeachingActivityId},include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(ActivityData){
									var IsEnd;
									if (NotiData.dataValues.Status == 0) {
										Count++;
									}
									if (NotiData.dataValues.Type == 1) {
										routeSql.MyExam.findOne({where:{Id:NotiData.dataValues.ModelId}}).then(function(ExamData){
											if (new Date() < new Date(ExamData.dataValues.EndDate)) {IsEnd = false} else {IsEnd = true}
											result.push({ActivityTitle:ActivityData.dataValues.Title,ActivityId:ActivityData.dataValues.Id,Status:NotiData.dataValues.Status,NotiId:NotiData.dataValues.Id,NotiCreationTime:NotiData.dataValues.CreationTime,Title:NotiData.dataValues.Title,Type:NotiData.dataValues.Type,StartDate:ExamData.dataValues.StartDate,EndDate:ExamData.dataValues.EndDate,ExamBaseId:ExamData.dataValues.MyExamBaseId,ModelId:NotiData.dataValues.ModelId,IsEnd:IsEnd})
											GetNotiInfo(NotiArr)
										})
									} else if (NotiData.dataValues.Type == 2) {
										routeSql.HomeWork.findOne({where:{Id:NotiData.dataValues.ModelId}}).then(function(HomeWorkData){
											if (new Date() < new Date(HomeWorkData.dataValues.EndDate)) {IsEnd = false} else {IsEnd = true}
											result.push({ActivityTitle:ActivityData.dataValues.Title,ActivityId:ActivityData.dataValues.Id,Status:NotiData.dataValues.Status,NotiId:NotiData.dataValues.Id,NotiCreationTime:NotiData.dataValues.CreationTime,Title:NotiData.dataValues.Title,Type:NotiData.dataValues.Type,StartDate:'',EndDate:HomeWorkData.dataValues.EndDate,ModelId:NotiData.dataValues.ModelId,IsEnd:IsEnd})
											GetNotiInfo(NotiArr)
										})
									}
									// console.log(ActivityData.dataValues)
									// var note = {}
								})
							} else {
								GetNotiInfo(NotiArr)
							}
						})
					} else {
						res.send({error:0,result:{result:result,notReadCount:Count}})
					}
				}
			})
		})
	} else {
		routeSql.Notification.findAll({where:{UserId:decoded.Id,IsDeleted:false},order:[['CreationTime','DESC']]}).then(function(NotiArr){
			routeSql.Notification.count({where:{UserId:decoded.Id,IsDeleted:false,Status:0}}).then(function(notReadCount){
				var result = []
				GetNotiInfo(NotiArr)
				function GetNotiInfo(NotiArr){
					var NotiData = NotiArr.shift()
					if (NotiData) {
						routeSql.TeachingDetail.findOne({where:{Type:NotiData.dataValues.Type,ModelId:NotiData.dataValues.ModelId}}).then(function(DetailData){
							// console.log(DetailData)
							if (DetailData) {
								if (NotiData.dataValues.Status == 0) {
									Count++;
								}
								routeSql.TeachingActivity.findOne({where:{Id:DetailData.dataValues.TeachingActivityId},include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(ActivityData){
									var IsEnd;
									if (NotiData.dataValues.Type == 1) {
										routeSql.MyExam.findOne({where:{Id:NotiData.dataValues.ModelId}}).then(function(ExamData){
											if (new Date() < new Date(ExamData.dataValues.EndDate)) {IsEnd = false} else {IsEnd = true}
											result.push({ActivityTitle:ActivityData.dataValues.Title,ActivityId:ActivityData.dataValues.Id,Status:NotiData.dataValues.Status,NotiId:NotiData.dataValues.Id,NotiCreationTime:NotiData.dataValues.CreationTime,Title:NotiData.dataValues.Title,Type:NotiData.dataValues.Type,StartDate:ExamData.dataValues.StartDate,EndDate:ExamData.dataValues.EndDate,ExamBaseId:ExamData.dataValues.MyExamBaseId,ModelId:NotiData.dataValues.ModelId,IsEnd:IsEnd})
											GetNotiInfo(NotiArr)
										})
									} else if (NotiData.dataValues.Type == 2) {
										routeSql.HomeWork.findOne({where:{Id:NotiData.dataValues.ModelId}}).then(function(HomeWorkData){
											if (new Date() < new Date(HomeWorkData.dataValues.EndDate)) {IsEnd = false} else {IsEnd = true}
											result.push({ActivityTitle:ActivityData.dataValues.Title,ActivityId:ActivityData.dataValues.Id,Status:NotiData.dataValues.Status,NotiId:NotiData.dataValues.Id,NotiCreationTime:NotiData.dataValues.CreationTime,Title:NotiData.dataValues.Title,Type:NotiData.dataValues.Type,StartDate:'',EndDate:HomeWorkData.dataValues.EndDate,ModelId:NotiData.dataValues.ModelId,IsEnd:IsEnd})
											GetNotiInfo(NotiArr)
										})
									}
									// console.log(ActivityData.dataValues)
									// var note = {}
								})
							} else {
								GetNotiInfo(NotiArr)
							}
						})
					} else {
						res.send({error:0,result:{result:result,notReadCount:Count}})
					}
				}
			})
		})
	}
})

router.post('/readNoti',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	routeSql.Notification.findOne({where:{Id:req.body.NotiId}}).then(function(NotiData){
		if (NotiData.dataValues.UserId == decoded.Id) {
			routeSql.Notification.update({Status:1},{where:{Id:req.body.NotiId}}).then(function(){
				res.send({error:0,result:{msg:'已经查看过了'}})
			})
		} else {
			res.send({error:1,result:{msg:'你没有权限查看该通知'}})
		}
	})
})

router.get('/readAllNoti',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.Notification.update({Status:1},{where:{UserId:decoded.Id}}).then(function(){
		res.send({error:0,result:{msg:'通知已全部查看'}})
	})
})

router.post('/destroyNoti',function(req,res){
	var token = req.headers.token
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log('1111111111111111111111111111')
	// console.log(req.body)
	// console.log(decoded)
	destroyNotiIdArr(req.body.NotiIdArr)
	function destroyNotiIdArr(NotiArr){
		var NotiId = NotiArr.shift()
		// console.log(NotiArr)
		// console.log(NotiId)
		if (NotiId) {
			routeSql.Notification.update({IsDeleted:true,DeletionTime:new Date(),Status:1},{where:{Id:NotiId}}).then(function(){
				destroyNotiIdArr(NotiArr)
			})
		} else {
			res.send({error:0,result:{msg:'通知删除成功'}})
		}
	}
})

module.exports = router;




