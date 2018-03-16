
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js');

// 课程分类
router.get('/TrainCourseCategories',function(req,res){
	var count;
	routeSql.TrainCourseCategories.count({where:{FatherId:{$ne:0},IsDeleted:false,CreatorUserId:{$ne:0}}}).then(function(c){
		count = c;
	})
	routeSql.TrainCourseCategories.findAll({where:{FatherId:{$ne:0},IsDeleted:false,CreatorUserId:{$ne:0}},attributes:['Id','Name']}).then(function(arr){
		var data = {}
		data.error = 0;
		data.result = {count:count,arr:arr}
		res.send(data);
	})
})

router.get('/TrainCourseCenter',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
	// console.log(req.query)
	var data = {IsDeleted:false}
	var msg = req.query.msg ? req.query.msg : '';
	req.query.typeId == 0 ? data : data.TrainCourseCategoryId=req.query.typeId;
	data.Title = {$like:'%' + msg + '%'}
	var page = 1
	if (req.query.page > 0) {
		page = req.query.page;
	} else {
		page = 1
	}
	var limit = parseInt(req.query.pageSize);
	var offset = (page - 1) * limit;
	var count;
	routeSql.TrainCourses.count({where:data}).then(function(c){
		count = c;
	})
	var ordermsg;
	if (req.query.order == 1) {
		ordermsg = [[{model:routeSql.TrainCourseAnalysis,as:'TrainCoursesTrainCourseAnalysisId',attributes:['StudentNum']},'BrowseNum','DESC']]
	} else {
		ordermsg = [['CreationTime','DESC']]
	}
	routeSql.TrainCourses.findAll({where:data,Title:{$like:'%' + msg + '%'},limit:limit,offset:offset,order:ordermsg,attributes:['Id','Title',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Thumb')),InSertIp),'Thumb'],'TrainCourseAnalysisId'],include:[{model:routeSql.TrainCourseAnalysis,as:'TrainCoursesTrainCourseAnalysisId',attributes:['StudentNum','BrowseNum']}]}).then(function(arr){
		var data = {}
		data.error = 0;
		data.result = {count:count,arr:arr}
		res.send(data);
	});
})

module.exports = router;



