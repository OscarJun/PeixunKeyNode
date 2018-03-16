
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段


// 课程详情
router.get('/TrainCourseCenter/TrainCourseDetails',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.TrainCourses.findOne({where:{Id:req.query.CourseId},include:[{model:routeSql.TrainCourseAnalysis,as:'TrainCoursesTrainCourseAnalysisId',attributes:['BrowseNum','CollectNum','PeriodNum','Rating','RatingNum','StudentNum']}],attributes:['Id','Title',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Thumb')),InSertIp),'Thumb'],'TrainCourseAnalysisId','Summary']}).then(function(TrainCourseData){
		routeSql.TrainCourseAnalysis.update({BrowseNum:TrainCourseData.dataValues.TrainCoursesTrainCourseAnalysisId.BrowseNum + 1},{where:{Id:TrainCourseData.dataValues.TrainCourseAnalysisId}}).then(function(data){
			// console.log('33333333333333333333')
			// console.log(data.dataValues)
			var TrainCourse = TrainCourseData.dataValues;
		    routeSql.TrainPeriodRecords.count({where:{CourseId:TrainCourseData.dataValues.Id,UserId:decoded.Id,Status:1}}).then(function(LearnedCount){
		    	// console.log('666666666666666')
		    	TrainCourse.LearnedCount = LearnedCount;
		    })
			routeSql.Collects.findAll({where:{CourseId:TrainCourseData.dataValues.Id,CreatorUserId:decoded.Id}}).then(function(CollectsData){
				if (CollectsData.length > 0) {
					TrainCourse.IsCollected = true;
				} else {
					TrainCourse.IsCollected = false;
				}
			})
			var resultArr = [];
			var stationArr = [];
			routeSql.TrainCourseSections.findAll({where:{CourseId:TrainCourseData.dataValues.Id},order:[['Seq','ASC']],attributes:['Id','Seq','Title']
				// ,include:[{model:routeSql.TrainPeriods,as:'TrainCourseSectionsTrainPeriods'}]
			}).then(function(arr){
				stationArr = arr;
				dataTreat(stationArr)
			})
			function dataTreat(stationArr){
				var data = new Object()
				data = stationArr.shift()
				if (data) {
					routeSql.TrainPeriods.findAll({where:{CourseSectionId:data.dataValues.Id},order:[['Seq','ASC']],attributes:['Id','Title','Seq','Title','ResourceId'],include:[{model:routeSql.Resources,as:'TrainPeriodResource',attributes:['FileName',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize']}]}).then(function(periodArr){
						data.dataValues.periodArr = periodArr
						resultArr.push(data.dataValues)
						dataTreat(stationArr);
					})
				} else {
					routeSql.TrainCourses.findOne({where:{Id:req.query.CourseId},include:[{model:routeSql.TrainCourseAnalysis,as:'TrainCoursesTrainCourseAnalysisId',attributes:['BrowseNum','CollectNum','PeriodNum','Rating','RatingNum','StudentNum']}],attributes:['Id','Title',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Thumb')),InSertIp),'Thumb'],'TrainCourseAnalysisId','Summary']}).then(function(TrainCourseData){
						res.send({error:0,result:{TrainCourse:TrainCourse,resultArr}})
					})
				}
			}
		})
	})
})

router.get('/TrainCourseCollects',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.Collects.findAll({where:{CreatorUserId:decoded.Id}}).then(function(CollectArr){
		var result = []
		findAllCollectCourse(CollectArr)
		function findAllCollectCourse(CollectArr){
			var CollectData = CollectArr.shift()
			// console.log(CollectData)
			if (CollectData) {
				routeSql.TrainCourses.findOne({where:{Id:CollectData.dataValues.CourseId},attributes:['Id','Title',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Thumb')),InSertIp),'Thumb']],include:[{model:routeSql.TrainCourseAnalysis,as:'TrainCoursesTrainCourseAnalysisId',attributes:['BrowseNum','CollectNum']}]}).then(function(data){
					result.push(data)
					findAllCollectCourse(CollectArr)
				})
			} else {
				res.send({error:0,result:result})
			}
		}
	})
})

router.post('/TrainCourseCenter/Collects',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	var CourseId = req.body.CourseId;
	// console.log(CourseId)
	routeSql.TrainCourses.findOne({where:{Id:CourseId}}).then(function(TrainCourseData){
		routeSql.Collects.findOne({where:{CourseId:CourseId,CreatorUserId:decoded.Id}}).then(function(arr){
			if (arr) {
				routeSql.Collects.destroy({where:{Id:arr.dataValues.Id}})
				routeSql.TrainCourseAnalysis.findOne({where:{Id:TrainCourseData.dataValues.TrainCourseAnalysisId}}).then(function(data){
					var CollectNum = 0
					if (data.dataValues.CollectNum > 0) {
						CollectNum = data.dataValues.CollectNum - 1
					}
					// console.log(data)
					routeSql.TrainCourseAnalysis.update({CollectNum:CollectNum},{where:{Id:TrainCourseData.dataValues.TrainCourseAnalysisId}}).then(function(){
					// console.log('22222222222222222')
						res.send({error:0,result:{msg:'取消收藏成功'}})
					})
				})
			} else {
				routeSql.Collects.create({CourseId:CourseId,CreatorUserId:decoded.Id,CreationTime:new Date()})
				routeSql.TrainCourseAnalysis.findOne({where:{Id:TrainCourseData.dataValues.TrainCourseAnalysisId}}).then(function(data){
					// console.log(data)
					routeSql.TrainCourseAnalysis.update({CollectNum:data.dataValues.CollectNum + 1},{where:{Id:TrainCourseData.dataValues.TrainCourseAnalysisId}}).then(function(){
	// console.log('1111111111111111111')
						res.send({error:0,result:{msg:'收藏成功'}})
					})
				})
			}
		})
	})
})

// 评价
router.post('/TrainCourseCenter/Evaluations',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var CourseId = req.body.CourseId;
	var Content = req.body.Content;
	var Score = req.body.Score;
	routeSql.Evaluations.findAll({where:{CourseId:CourseId,CreatorUserId:decoded.Id}}).then(function(Onearr){
		if (Onearr.length > 0) {
			routeSql.Evaluations.update({Content:Content,Score:Score,CreationTime:new Date()},{where:{Id:Onearr[0].dataValues.Id}}).then(function(){
				// console.log(CourseId)
				routeSql.Evaluations.findAll({where:{CourseId:CourseId}}).then(function(arr){
					var SumScore = 0;
					var Rating;
					// console.log('44444444444444444444444')
					// console.log(arr.length)
					for (var i = 0; i < arr.length; i++) {
						// console.log(arr[i].dataValues.Score)
						SumScore += arr[i].dataValues.Score;
						// console.log(SumScore)
					}
					Rating = SumScore/(arr.length);
					routeSql.TrainCourseAnalysis.findOne({where:{Id:CourseId}}).then(function(data){
						routeSql.TrainCourseAnalysis.update({Rating:Rating,RatingNum:data.dataValues.RatingNum + 1},{where:{Id:data.dataValues.Id}}).then(function(){
							res.send({error:0,result:{msg:'评价成功'}})
						})
					})
				})
			})

		} else {
			routeSql.Evaluations.create({CourseId:CourseId,CreatorUserId:decoded.Id,Score:Score}).then(function(){
				routeSql.Evaluations.findAll({where:{CourseId:CourseId}}).then(function(arr){
					// console.log(arr[0])
					var SumScore;
					var Rating
					for (var i = 0; i < arr.length; i++) {
						SumScore += arr[i].dataValues.Score;
					}
					Rating = SumScore/(arr.length);
					routeSql.TrainCourseAnalysis.findOne({where:{Id:CourseId}}).then(function(data){
						routeSql.TrainCourseAnalysis.update({Rating:Rating,RatingNum:data.dataValues.RatingNum + 1},{where:{Id:data.dataValues.Id}}).then(function(){
							res.send({error:0,result:{msg:'评价成功'}})
						})
					})
				})
			})
		}
	})
})

router.post('/TrainCourseCenter/StartTrainPeriod',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	// console.log(req.body)
	routeSql.TrainCourses.findOne({where:{Id:req.body.CourseId}}).then(function(TrainCourseData){
		routeSql.TrainPeriodRecords.findOne({where:{UserId:decoded.Id,PeriodId:parseInt(req.body.PeriodId),CourseId:req.body.CourseId},attributes:['Status','ProgressTime']}).then(function(data){
			if (data) {
				res.send({error:0,result:data})
			} else {
				routeSql.TrainCourseAnalysis.findOne({where:{Id:TrainCourseData.dataValues.TrainCourseAnalysisId}}).then(function(AnalysisData){
					routeSql.TrainCourseAnalysis.update({StudentNum:AnalysisData.dataValues.StudentNum + 1},{where:{Id:TrainCourseData.dataValues.TrainCourseAnalysisId}})
				})
				routeSql.TrainPeriodRecords.create({UserId:decoded.Id,Status:0,ProgressTime:0,PeriodId:parseInt(req.body.PeriodId),CourseId:req.body.CourseId}).then(function(){
					res.send({error:0,result:{Status:0,ProgressTime:0}})
				})
			}
		})
	})
})

router.post('/TrainCourseCenter/EndTrainPeriod',function(req,res){
	var token = req.headers.token;
	var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	routeSql.TrainPeriodRecords.update({Status:req.body.Status,ProgressTime:req.body.ProgressTime},{where:{UserId:decoded.Id,PeriodId:req.body.PeriodId}}).then(function(){
		res.send({error:0,result:{msg:'停止观看成功'}})
	})
})




module.exports = router;



