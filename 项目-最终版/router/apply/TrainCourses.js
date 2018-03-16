
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express()
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段


//获取首页内容
//查询，分页获取课程内容
router.post('/TrainCourses/List',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
	var count;
	var a = req.body.limit;
	var limit = parseInt(a)
	var page = req.body.page;
	var offset = (page -1) * a;
	var msg = req.body.msg;
	routeSql.TrainCourses.count({where:{IsDeleted:false,Title:{$like:'%' + msg + '%'}}}).then(function(i){
		// console.log(i);
		count = i;
	})
	var includeModel = [{model:routeSql.TrainCourseCategories,as:'CategoryName',attributes:['Id','Name','CreationTime']}];
	// console.log(req.body.order.name);
	var ordermsg = [['CreationTime','DESC']];
	if (req.body.order) {
		if (req.body.order.name == '') {
			ordermsg = [['CreationTime',(req.body.order.sort) ? 'ASC':'DESC']];
		} else if (req.body.order.name == 'Title') {
			ordermsg = [[{model:routeSql.TrainCourses},'Title',(req.body.order.sort) ? 'ASC':'DESC']]//sort=1正序排列 =0倒序排列
		} else if (req.body.order.name == 'Price') {
			ordermsg = [[{model:routeSql.CourseExpands,as:'TrainCoursesCourseExpands'},'Price',(req.body.order.sort) ? 'ASC':'DESC']]
		} else if (req.body.order.name == 'PayType'){
			ordermsg = [[{model:routeSql.CourseExpands,as:'TrainCoursesCourseExpands'},'PayType',(req.body.order.sort) ? 'ASC':'DESC']]
		} else if (req.body.order.name == 'TrainCourseType'){
			ordermsg = [[{model:routeSql.CourseExpands,as:'TrainCoursesCourseExpands'},'TrainCourseType',(req.body.order.sort) ? 'ASC':'DESC']]
		} else if(req.body.order.name == 'LabelId'){
			ordermsg = [[{model:routeSql.CourseLabels,as:'CourseLabelsTrainCourseId'},'LabelId',(req.body.order.sort) ? 'ASC':'DESC']]
		} else {
			ordermsg = [['CreationTime','DESC']];
		}
	} else {
		ordermsg = [['CreationTime','DESC']];
	}
	routeSql.TrainCourses.findAll({
		attributes:['Id','Title',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Thumb')),InSertIp),'Thumb'],'Summary','CreationTime','TrainCourseCategoryId'],
		where:{IsDeleted:false,Title:{$like:'%' + msg + '%'}},
		include:includeModel,
		order:ordermsg,
		offset:offset,limit:limit
	}).then(function(e){
		var data = {}
		data.count = count;
		data.data = e;
		// console.log(data)
		res.send(data);
	}).catch(function(err){
		res.send(err)
	})
})

// 删除课程（动态）
router.post('/traincourses/destory',function(req,res){
	var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var id = req.body.Id;
	// console.log(req.body.id)
	routeSql.ClassAndCourses.findAll({where:{TrainCourseId:id}}).then(function(arr){
		if (arr.length > 0) {
			res.send({error:1,result:{msg:'有班级关联该课程，无法删除'}})
		} else {
			routeSql.TrainCourses.update({IsDeleted:true,DeleterUserId:decoded.Id,DeletionTime:new Date(),},{where:{Id:id}}).then(function(){
				res.send({error:0,result:{msg:'删除成功'}})
			});
		}
	})
})

// 编辑课程
router.get('/traincourses/edit',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
	// console.log(req.query.Id)
	var includeModel = [{model:routeSql.TrainCourseCategories,as:'CategoryName',attributes:['Id','Name']}];
	routeSql.TrainCourses.findOne({
		where:{Id:req.query.Id,IsDeleted:false},
		attributes:['Id',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Thumb')),InSertIp),'Thumb'],'TrainCourseCategoryId','Title','Summary','IsPublic'],
		include:includeModel,
	}).then(function(e){
		// console.log(e.dataValues)
		res.send(e);
	})
})

router.post('/traincourses/edit',function(req,res){
	var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	if (req.body.Title == '' || req.body.Title == null) {
		res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
	} else {
		if (req.body.Title.length <= 30) {
			routeSql.TrainCourses.update({Title:req.body.Title,Thumb:req.body.Thumb.substring(req.body.Thumb.indexOf(Ipconfig.SaveServer.SaveServerIpPort) + Ipconfig.SaveServer.SaveServerIpPort.toString().length),Summary:req.body.Summary,TrainCourseCategoryId:req.body.CategoryId,IsPublic:req.body.IsPublic,LastModificationTime:new Date(),LastModifierUserId:decoded.Id},{where:{Id:req.body.Id}}).then(function(){
				res.send({error:0,result:{msg:'编辑成功'}});
			})
		} else {
			res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
		}
	}
})

// 获取课程章节信息
router.get('/traincourses/station',function(req,res){
	var resultArr = [];
	var stationArr = []
	// var periodArr = []
	routeSql.TrainCourseSections.findAll({where:{CourseId:req.query.Id},attributes:['Id','Seq','Title','CourseId']
		// ,include:[{model:routeSql.TrainPeriods,as:'TrainCourseSectionsTrainPeriods'}]
	}).then(function(arr){
		stationArr = arr;
		dataTreat(stationArr)
	})
	function dataTreat(stationArr){
		var data = new Object()
		data = stationArr.shift()
		if (data) {
			routeSql.TrainPeriods.findAll({where:{CourseSectionId:data.dataValues.Id},attributes:['Id','Title','CourseSectionId','Seq','ResourceId']}).then(function(periodArr){
				var perArr = []
				getFileName(periodArr)
				function getFileName(periodArr) {
					var preiodData = periodArr.shift()
					if (preiodData) {
						routeSql.Resources.findOne({where:{Id:preiodData.dataValues.ResourceId}}).then(function(ResourceData) {
							period = {Id:preiodData.dataValues.Id,Title:preiodData.dataValues.Title,CourseSectionId:preiodData.dataValues.CourseSectionId,Seq:preiodData.dataValues.Seq,ResourceId:preiodData.dataValues.ResourceId,FileName:ResourceData.dataValues.FileName}
							perArr.push(period)
							getFileName(periodArr)
						})
					} else {
						data.dataValues.periodArr = perArr
						resultArr.push(data.dataValues)
						dataTreat(stationArr);
					}
				}
			})
		} else {
			res.send({error:0,result:resultArr})
		}
	}
})

// 编辑课程章节信息
router.post('/traincourses/station',function(req,res){
	var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body.updated.arr)
    // console.log(req.body.updated.arr)
	var deletedSecArr = []
	deletedSecArr = req.body.deleted.deletedSecArr;
	var deletedPerArr = []
	deletedPerArr = req.body.deleted.deletedPerArr;
	var Num = 0;
	if (deletedSecArr.length != 0) {
		destroySecArr(deletedSecArr)
		function destroySecArr(deletedSecArr){
			var deletedSecData = deletedSecArr.shift()
			if (deletedSecData) {
				routeSql.TrainCourseSections.destroy({where:{Id:deletedSecData}}).then(function(){
					routeSql.TrainPeriods.count({where:{CourseSectionId:deletedSecData}}).then(function(count){
						Num += count
					})
					routeSql.TrainPeriods.destroy({where:{CourseSectionId:deletedSecData}}).then(function(){
						destroySecArr(deletedSecArr)
					})
				})
			}
		}
	}
	if (deletedPerArr.length != 0) {
		routeSql.TrainPeriods.count({where:{Id:deletedPerArr}}).then(function(count){
					Num += count
				})
		routeSql.TrainPeriods.destroy({where:{Id:deletedPerArr}})
	}
	var upDateArr = req.body.updated.arr;
	var CourseId = req.body.updated.CourseId;
	var PeriodNum = 0;
	saveValue();
	function saveValue(){
		var upDate = upDateArr.shift()
		if (upDate) {
			console.log(upDate)
			if (upDate.Id != 0) {
				// if (upDate.Title.length < 30) {} else {}
				routeSql.TrainCourseSections.update({Title:upDate.Title,CourseId:CourseId},{where:{Id:upDate.Id}}).then(function(data){
					// console.log('2222222')
					updatePeriod(upDate.periodArr,upDate.Id)
				})
			} else {
		// console.log('0000')
				routeSql.TrainCourseSections.max(['Seq']).then(function(Seq){
					// console.log('11111111')
					if (!Seq) {Seq = 0}
					routeSql.TrainCourseSections.create({Title:upDate.Title,Seq:Seq + 1,CourseId:CourseId,IsRelease:false,courseType:3,CreationTime:new Date(),CreatorUserId:decoded.Id}).then(function(data){
						if (upDate.periodArr) {
							PeriodNum += upDate.periodArr.length;
						}
						updatePeriod(upDate.periodArr,data.dataValues.Id)
					})
				})
			}
		}else{
			res.send({error:0,result:{msg:'编辑成功'}})
			// for (var i = 0; i < upDateArr.length; i++) {
			// 	PeriodNum += upDateArr[i].periodArr.length - Num - deletedPerArr.length
			// }
			// 	PeriodNum += upDateArr[i].periodArr.length - Num - deletedPerArr.length
			routeSql.TrainCourses.findOne({where:{Id:CourseId}}).then(function(CourseData){
				routeSql.TrainCourseAnalysis.findOne({where:{Id:CourseData.dataValues.TrainCourseAnalysisId}}).then(function(AnalysisData){
					routeSql.TrainCourseAnalysis.update({PeriodNum:AnalysisData.dataValues.PeriodNum + PeriodNum - Num},{where:{Id:CourseData.dataValues.TrainCourseAnalysisId}})
				})
			})
			// console.log('sssssssssssssssssssssssssssssssssssssssssssssssssssssss')
			// routeSql.TrainCourseAnalysis.update({PeriodNum:PeriodNum},{where:{Id:CourseId}})
		}
		function updatePeriod(PeriodArr,CourseSectionId){
			console.log(PeriodArr)
			if (PeriodArr) {
				var upDatePer = PeriodArr.shift()
				if(upDatePer){
					if (upDatePer.Id != 0) {
						if (upDatePer.ResourceId) {
							routeSql.TrainPeriods.update({Title:upDatePer.Title,ResourceId:upDatePer.ResourceId,CourseSectionId:CourseSectionId},{where:{Id:upDatePer.Id}}).then(function(data){
								updatePeriod(PeriodArr,CourseSectionId);
								// console.log('33333333')
							})
						} else {
								updatePeriod(PeriodArr,CourseSectionId);
								// console.log('33333333')
						}
					} else {
						PeriodNum += 1;
						routeSql.TrainPeriods.max(['Seq'],{where:{CourseSectionId:CourseSectionId}}).then(function(Seq){
							if (!Seq) {Seq = 0}
								if (upDatePer.ResourceId) {
									routeSql.TrainPeriods.create({Title:upDatePer.Title,Seq:Seq + 1,ResourceId:upDatePer.ResourceId,CourseSectionId:CourseSectionId,IsRelease:false,assetType:0,CreationTime:new Date(),CreatorUserId:decoded.Id,IsPreview:0}).then(function(data){
										// console.log('4444444')
										updatePeriod(PeriodArr,CourseSectionId);
									})
								} else {
										// console.log('4444444')
										updatePeriod(PeriodArr,CourseSectionId);
								}
								// console.log('111111111111111111111111111111111111111')
						})
					}
				}else{
					saveValue()
				}
			} else {
				saveValue()
			}
		}
	}
})

// 创建课程
router.post('/trainCourses/createTrainCourse',function(req,res){
	var date = new Date();
	var a = 0;
	var includeModel = [{model:routeSql.TrainCourseAnalysis,as:'TrainCoursesTrainCourseAnalysisId'}];
    if (req.body.Title == '' || req.body.Title == null) {
    	res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
    } else {
    	if (req.body.Title.length <= 20) {
			routeSql.TrainCourses.create({
				Title:req.body.Title,
				Summary:req.body.Summary,
				IsRelease:false,
				TenantId:1,
				Thumb:req.body.Thumb.substring(req.body.Thumb.indexOf(Ipconfig.SaveServer.SaveServerIpPort) + Ipconfig.SaveServer.SaveServerIpPort.toString().length),
				//Thumb:'http://bj.bcebos.com/v1/spzxtestpublic/PeiXun/Image/' + req.data.file.name,
				CreationTime:new Date(),
				TrainCourseCategoryId:req.body.CategoryId,
				IsDeleted:false,
				Credit:0,
				IsPublic:req.body.IsPublic?req.body.IsPublic:true,
				// TrainCourseAnalysisId:1136,
				TrainCoursesTrainCourseAnalysisId:[{StudentNum:a,Rating:a,RatingNum:a,PeriodNum:a,CollectNum:a,ShareNum:a,PraiseNum:a,BrowseNum:a}]
			},{include:includeModel}).then(function(data){
				res.send({error:0,result:{CourseId:data.dataValues.Id.toString()}})
				// var Id = data.dataValues
				// res.send(Id)
			})
    	} else {
    		res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
    	}
    }
})

router.post('/TrainCourses/createSection',function(req,res){
	// console.log(req.body)
	var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var upDateArr = req.body.arr;
	var CourseId = req.body.CourseId;
	var PeriodNum = 0;
	if (upDateArr) {
		for (var i = 0; i < upDateArr.length; i++) {
			if (upDateArr[i].periodArr) {
				PeriodNum += upDateArr[i].periodArr.length
			}
		}
	}
	routeSql.TrainCourses.findOne({where:{Id:CourseId}}).then(function(CourseData){
		routeSql.TrainCourseAnalysis.findOne({where:{Id:CourseData.dataValues.TrainCourseAnalysisId}}).then(function(AnalysisData){
			routeSql.TrainCourseAnalysis.update({PeriodNum:AnalysisData.dataValues.PeriodNum + PeriodNum},{where:{Id:CourseData.dataValues.TrainCourseAnalysisId}})
		})
	})
	// routeSql.TrainCourseAnalysis.update({PeriodNum:PeriodNum},{where:{Id:CourseId}})
	saveValue(upDateArr)
	function saveValue(upDateArr){
		// console.log('1111111111')
		if (upDateArr) {
			var upDate = upDateArr.shift()
			if (upDate) {
				routeSql.TrainCourseSections.max(['Seq']).then(function(Seq){
					if (!Seq) {Seq = 0}
					routeSql.TrainCourseSections.create({Title:upDate.Title,Seq:Seq + 1,CourseId:CourseId,IsRelease:false,courseType:3,CreationTime:new Date(),CreatorUserId:decoded.Id}).then(function(data){
						// console.log('2222222')
						updatePeriod(upDateArr,upDate.periodArr,data.dataValues.Id)
					})
				})
			}else{
				res.send({error:0,result:{msg:'保存成功'}})
			}
		} else {
			res.send({error:0,result:{msg:'保存成功'}})
		}
	}                     
	function updatePeriod(upDateArr,PeriodArr,CourseSectionId){
		// console.log('======')
		if (PeriodArr) {
			var upDatePer = PeriodArr.shift()
			// console.log(upDatePer)
			if(upDatePer){
				routeSql.TrainPeriods.max(['Seq']).then(function(Seq){
					if (!Seq) {Seq = 0}
					// if (upDatePer.Title.length < 30) {} else {}
					routeSql.TrainPeriods.create({Title:upDatePer.Title,Seq:Seq + 1,ResourceId:upDatePer.ResourceId,CourseSectionId:CourseSectionId,IsRelease:false,assetType:0,CreationTime:new Date(),CreatorUserId:decoded.Id,IsPreview:0}).then(function(){
						updatePeriod(upDateArr,PeriodArr,CourseSectionId);
					})
				})
			}else{
				saveValue(upDateArr)
			}
		} else {
			saveValue(upDateArr)
		}
	}
})

module.exports = router;
