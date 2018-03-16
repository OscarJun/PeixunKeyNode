// AddHomeWorkData// router.post('/EditExam',function(req,res){})
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var schedule = require('node-schedule')

// JoinToExamResult()
module.exports = function JoinToHomeWorkResult(){
	// console.log('__________________')
	routeSql.TeachingDetail.findAll({where:{Type:2}}).then(function(Arr){
		FindAllHomeWork(Arr)
	})
}
function FindAllHomeWork(Arr){
	var HomeWorkData = Arr.shift()
	// console.log('------------------------------')
	if (HomeWorkData) {
		// console.log(ExamData.dataValues)
		routeSql.HomeWork.findOne({where:{Id:HomeWorkData.dataValues.ModelId}}).then(function(MyHomeWorkData){
			// console.log(MyExamData.dataValues)
			if (MyHomeWorkData != null) {
				FindOneHomeWork(MyHomeWorkData,HomeWorkData,Arr)
			}
			FindAllHomeWork(Arr)
		})
	}
}
function FindOneHomeWork(MyHomeWorkData,HomeWorkData,Arr){
	// console.log(MyExamData.dataValues.StartDate)
	// var date = new Date(MyHomeWorkData.dataValues.StartDate)
	// console.log(date.toString())
	// console.log(new Date())
	// var j = schedule.scheduleJob(new Date(date.toString()),function(){
		// console.log('+++++++++++++++')
	var date = new Date(MyHomeWorkData.dataValues.EndDate)
	if (date > new Date()) {
		UserJoinToExamResult();
	}
	// })
	// FindAllExam(Arr)
	function UserJoinToExamResult(){
		// console.log('+++++++++++++++++++++++++++++++++')
		routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:HomeWorkData.dataValues.TeachingActivityId}}).then(function(ActivityUserData){
			FindAllActivityUser(ActivityUserData,MyHomeWorkData)
		})
	}
}
function FindAllActivityUser(ActivityUserData,MyHomeWorkData){
	var UserData = ActivityUserData.shift()
	if (UserData) {
		routeSql.HomeWorkResult.findOne({where:{UserId:UserData.dataValues.UserId,HomeWorkId:MyHomeWorkData.dataValues.Id}}).then(function(HomeWorkResultData){
			if (HomeWorkResultData) {
				FindAllActivityUser(ActivityUserData,MyHomeWorkData)
			} else {
				routeSql.HomeWorkResult.create({UserId:UserData.dataValues.UserId,State:0,HomeWorkId:MyHomeWorkData.dataValues.Id}).then(function(){
					FindAllActivityUser(ActivityUserData,MyHomeWorkData)
				})
			}
		})
	}
}

