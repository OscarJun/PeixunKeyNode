
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express()
app.set('jwtTokenSecret','JingGe');//设置token加密字段

// 查找首页内容
// 分页，指定查询
router.post('/TrainCourseCategories/List',function(req,res){
	// console.log('++++++++++++++++++++')
	// console.log(req.body)
	var count;
	var a = req.body.limit;
	var limit = parseInt(a)
	var page = req.body.page ? req.body.page:1;
	var offset = (page -1) * a;
	var msg = req.body.msg ? req.body.msg:'';
	var ordermsg = [['CreationTime','DESC']];
	// var includeModel = [{model:routeSql.TrainCourseCategories,as:'TrainCourseCategoriesFatherId',attributes:['Name']}]
	routeSql.TrainCourseCategories.count({where:{IsDeleted:false,FatherId:{$ne:0}},Title:{$like:'%' + msg + '%'}}).then(function(i){
		count = i;
	})
	var result = {}
	routeSql.TrainCourseCategories.findAll({
		where:{IsDeleted:false,FatherId:{$ne:0}},
		Name:{$like:'%' + msg + '%'},
		order:ordermsg,
		attributes:['Id','Name'],
		// include:includeModel,
		offset:offset,limit:limit
		}).then(function(arr){
			result.count = count;
			result.data = arr;
			res.send({error:0,result});
		})
	})

router.post('/TrainCourseCategories/destory',function(req,res){
	var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var id = req.body.id;
	routeSql.TrainCourseCategories.findAll({where:{FatherId:id,IsDeleted:false}}).then(function(arr){
		if (arr.length > 0) {
			res.send({error:1,result:{msg:'不能删除，该分类存在子类'}})
		} else {
			routeSql.TrainCourses.findAll({where:{TrainCourseCategoryId:id}}).then(function(TrainCoursesArr) {
				if (TrainCoursesArr.length > 0) {
					res.send({error:1,result:{msg:'不能删除，该分类下存在课程'}})
				} else {
					routeSql.TrainCourseCategories.update({IsDeleted:true,DeleterUserId:decoded.Id,DeletionTime:new Date()},{where:{Id:id}}).then(function(){
						res.send({error:0,result:{msg:'分类删除成功'}})
					})
				}
			})
		}
	})
	// routeSql.TrainCourseCategories.findOne({where:{Id:id,IsDeleted:false}}).then(function(data){
	// 	// console.log(data)
	// 	if (data.FatherId != 0) {
	// 		routeSql.TrainCourses.findAll({where:{TrainCourseCategoryId:id}}).then(function(TrainCoursesArr) {
	// 			if (TrainCoursesArr.length > 0) {
	// 				res.send({error:1,result:{msg:'不能删除，该分类下存在课程'}})
	// 			} else {
	// 				routeSql.TrainCourseCategories.update({IsDeleted:true,DeleterUserId:decoded.Id,DeletionTime:new Date()},{where:{Id:id}}).then(function(){
	// 					res.send({error:0,result:{msg:'分类删除成功'}})
	// 				})
	// 			}
	// 		})
	// 	} else {
	// 		console.log(id)
	// 	}
	// })
})

// 获取一级分类
// router.get('/TrainCourseCategories/create',function(req,res){
// 	routeSql.TrainCourseCategories.findAll({where:{FatherId:0,IsDeleted:false},attributes:['Id','Name']}).then(function(arr){
// 		res.send(arr);
// 	})
// })

// 创建新的分类
router.post('/TrainCourseCategories/create',function(req,res){
	// console.log(req.body)
	// console.log(req.headers.token)
	var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (req.body.name == '' || req.body.name == null) {
    	res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
    } else {
    	if (req.body.name.length <= 20) {
			var name = req.body.name;
			routeSql.TrainCourseCategories.create({
				Name:name,
				Credit:0,
				IsDeleted:false,
				CreatorUserId:decoded.Id,
				CreationTime:new Date()
			}).then(function(){
				res.send({error:0,result:{msg:'save succeed'}});
			}).catch(function(err) {
				res.send({error:1,result:{msg:err}})
			})
    	} else {
    		res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
    	}
    }
})

// 编辑分类
router.get('/TrainCourseCategories/edit',function(req,res){
	var id = req.body.id;
	// var includeModel = [{model:routeSql.TrainCourseCategories,as:'TrainCourseCategoriesFatherId',attributes:['Name']}]
	routeSql.TrainCourseCategories.findOne({where:{Id:id},attributes:['Id','Name']}).then(function(data){
		res.send(data);
	})
})
router.post('/TrainCourseCategories/edit',function(req,res){
	var id = req.body.id;
	var name = req.body.name;
    if (req.body.name == '' || req.body.name == null) {
    	res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
    } else {
    	if (req.body.name.length <= 20) {
			// var fatherId = req.body.fatherId;
			routeSql.TrainCourseCategories.update({Name:name},{where:{Id:id}}).then(function(){
				res.send({error:0,result:{msg:'edited succeed'}});
			}).catch(function(err) {
				res.send({error:1,result:{msg:err}})
			})
    	} else {
    		res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
    	}
    }
})

module.exports = router;

