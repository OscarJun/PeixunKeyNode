// router.post('/EditExam',function(req,res){})
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var schedule = require('node-schedule')

// JoinToExamResult()
module.exports = function JoinToExamResult(){
	// console.log('__________________')
	routeSql.TeachingDetail.findAll({where:{Type:1}}).then(function(Arr){
		FindAllExam(Arr)
	})
}
function FindAllExam(Arr){
	var ExamData = Arr.shift()
	// console.log('------------------------------')
	if (ExamData) {
		// console.log(ExamData.dataValues)
		routeSql.MyExam.findOne({where:{Id:ExamData.dataValues.ModelId}}).then(function(MyExamData){
			// console.log(MyExamData.dataValues)
			if (MyExamData != null) {
				FindOneExam(MyExamData,ExamData,Arr)
			}
			FindAllExam(Arr)
		})
	}
}
function FindOneExam(MyExamData,ExamData,Arr){
	// console.log(MyExamData.dataValues.StartDate)
	var date = new Date(MyExamData.dataValues.StartDate)
	var nextDate = new Date(MyExamData.dataValues.EndDate)
	// console.log(date.toString())
	// console.log(new Date())
	if (date > new Date()) {
		if (schedule.scheduledJobs['ExamResult' + MyExamData.dataValues.Id]) {
			var result = schedule.cancelJob('ExamResult' + MyExamData.dataValues.Id)
		}
		var j = schedule.scheduleJob('ExamResult' + MyExamData.dataValues.Id,new Date(new Date(date.toString())),function(){
			// console.log('+++++++++++++++')
			UserJoinToExamResult();
		})
	} else if (date < new Date() && new Date() < nextDate) {
		UserJoinToExamResult();
	}
	// FindAllExam(Arr)
	function UserJoinToExamResult(){
		// console.log('+++++++++++++++++++++++++++++++++')
		routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:ExamData.dataValues.TeachingActivityId}}).then(function(ActivityUserData){
			FindAllActivityUser(ActivityUserData,MyExamData)
		})
	}
}
function FindAllActivityUser(ActivityUserData,MyExamData){
	var UserData = ActivityUserData.shift()
	if (UserData) {
		// console.log(MyExamData.dataValues.Id)
		routeSql.ExamResult.findOne({where:{UserId:UserData.dataValues.UserId,ExamId:MyExamData.dataValues.Id,IsDeleted:false}}).then(function(data){
		// console.log('-------------------------------')
			if (data) {
		// console.log('*****************************')
				FindAllActivityUser(ActivityUserData,MyExamData)
			} else {
		// console.log('============================')
				routeSql.ExamResult.create({UserId:UserData.dataValues.UserId,State:0,ExamId:MyExamData.dataValues.Id}).then(function(){
					// console.log(abc)
					FindAllActivityUser(ActivityUserData,MyExamData)
				})
			}
		})
	}
}


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

