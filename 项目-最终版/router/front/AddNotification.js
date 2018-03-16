

// AddHomeWorkData// router.post('/EditExam',function(req,res){})
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var schedule = require('node-schedule')

// JoinToExamResult()
function Notification(){
	// console.log('__________________')
	routeSql.TeachingDetail.findAll({where:{Type:2}}).then(function(Arr){
		FindAllHomeWork(Arr)
	})
	routeSql.TeachingDetail.findAll({where:{Type:1}}).then(function(Arr){
		FindAllExam(Arr)
	})
}
function FindAllHomeWork(Arr){
	var HomeWorkData = Arr.shift()
	// console.log('------------------------------')
	// console.log(HomeWorkData.dataValues)
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
	// console.log(date.toString())
	// console.log(new Date())
	// var j = schedule.scheduleJob(new Date(date.toString()),function(){
		// console.log('+++++++++++++++')
	var date = new Date(MyHomeWorkData.dataValues.EndDate)
	// console.log(date)
	if (date > new Date()) {
		UserJoinToExamResult();
	}
	// })
	// FindAllHomeWork(Arr)
	function UserJoinToExamResult(){
		// console.log('+++++++++++++++++++++++++++++++++')
		// console.log(HomeWorkData.dataValues.TeachingActivityId)
		// console.log(HomeWorkData.dataValues)
		routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:HomeWorkData.dataValues.TeachingActivityId}}).then(function(ActivityUserData){
			AddAllHomeWorkToNotification(ActivityUserData,MyHomeWorkData)
		})
	}
}
function AddAllHomeWorkToNotification(ActivityUserData,MyHomeWorkData){
	// console.log(ActivityUserData)
	var UserData = ActivityUserData.shift()
			// console.log('==========')
			// console.log(UserData)
	if (UserData) {
		// console.log('++++++++++')
		routeSql.Notification.findOne({where:{Type:2,UserId:UserData.dataValues.UserId,ModelId:MyHomeWorkData.dataValues.Id}}).then(function(NotificationData){
			// console.log('-----------')
			// console.log(NotificationData)
			if (!NotificationData) {
				routeSql.Notification.create({Title:MyHomeWorkData.dataValues.Title,Type:2,UserId:UserData.dataValues.UserId,Status:0,IsDeleted:false,ModelId:MyHomeWorkData.dataValues.Id}).then(function(){
					AddAllHomeWorkToNotification(ActivityUserData,MyHomeWorkData)
				})
			} else {
				AddAllHomeWorkToNotification(ActivityUserData,MyHomeWorkData)
			}
		})
	}
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
	if (new Date(DateAdd('M',-30,new Date(date.toString()))) > new Date()) {
		if (schedule.scheduledJobs['ReportResult' + MyExamData.dataValues.Id]) {
			var result = schedule.cancelJob('ReportResult' + MyExamData.dataValues.Id)
		}

		var j = schedule.scheduleJob('ReportResult' + MyExamData.dataValues.Id,new Date(DateAdd('M',-30,new Date(date.toString()))),function(){
			// console.log('+++++++++++++++')
			UserJoinToExamResult();
		})
	} else if (new Date(DateAdd('M',-30,new Date(date.toString()))) < new Date() && new Date < nextDate) {
		UserJoinToExamResult();
	}
	// FindAllExam(Arr)
	function UserJoinToExamResult(){
		// console.log('+++++++++++++++++++++++++++++++++')
		routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:ExamData.dataValues.TeachingActivityId}}).then(function(ActivityUserData){
			AddAllExamToNotification(ActivityUserData,MyExamData)
		})
	}
}
function AddAllExamToNotification(ActivityUserData,MyExamData){
	var UserData = ActivityUserData.shift()
	if (UserData) {
		// console.log('+++++++++++++++++++++++')
		routeSql.Notification.findOne({where:{Type:1,UserId:UserData.dataValues.UserId,ModelId:MyExamData.dataValues.Id}}).then(function(data){
		// console.log('-------------------------------')
			if (!data) {
		// console.log('*****************************')
				routeSql.Notification.create({Type:1,Title:MyExamData.dataValues.Title,UserId:UserData.dataValues.UserId,Status:0,ModelId:MyExamData.dataValues.Id,IsDeleted:false}).then(function(){
					AddAllExamToNotification(ActivityUserData,MyExamData)
				})
			} else {
				AddAllExamToNotification(ActivityUserData,MyExamData)
		// console.log('============================')
			}
		})
	}
}





function upDateHomeWorkNotification(Id){
	// console.log('__________________')
	routeSql.TeachingDetail.findOne({where:{Type:2,ModelId:Id}}).then(function(HomeWorkData){
		upDateFindAllHomeWork(HomeWorkData)
	})
}
function upDateFindAllHomeWork(HomeWorkData){
	// var HomeWorkData = Arr.shift()
	// console.log('------------------------------')
	// console.log(HomeWorkData.dataValues)
	if (HomeWorkData) {
		// console.log(ExamData.dataValues)
		routeSql.HomeWork.findOne({where:{Id:HomeWorkData.dataValues.ModelId}}).then(function(MyHomeWorkData){
			// console.log(MyExamData.dataValues)
			if (MyHomeWorkData != null) {
				upDateFindOneHomeWork(MyHomeWorkData,HomeWorkData)
			}
			// upDateFindAllHomeWork(Arr)
		})
	}
}
function upDateFindOneHomeWork(MyHomeWorkData,HomeWorkData){
	// console.log(MyExamData.dataValues.StartDate)
	// console.log(date.toString())
	// console.log(new Date())
	// var j = schedule.scheduleJob(new Date(date.toString()),function(){
		// console.log('+++++++++++++++')
	var date = new Date(MyHomeWorkData.dataValues.EndDate)
	// console.log(date)
	if (date > new Date()) {
		upDateUserJoinToExamResult();
	}
	// })
	// FindAllExam(Arr)
	function upDateUserJoinToExamResult(){
		// console.log('+++++++++++++++++++++++++++++++++')
		// console.log(HomeWorkData.dataValues.TeachingActivityId)
		// console.log(HomeWorkData.dataValues)
		routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:HomeWorkData.dataValues.TeachingActivityId}}).then(function(ActivityUserData){
			upDateAddAllHomeWorkToNotification(ActivityUserData,MyHomeWorkData)
		})
	}
}
function upDateAddAllHomeWorkToNotification(ActivityUserData,MyHomeWorkData){
	// console.log(ActivityUserData)
	var UserData = ActivityUserData.shift()
			// console.log('==========')
			// console.log(UserData)
	if (UserData) {
		// console.log('++++++++++')
		routeSql.Notification.findOne({where:{Type:2,UserId:UserData.dataValues.UserId,ModelId:MyHomeWorkData.dataValues.Id,Status:0}}).then(function(NotificationData){
			// console.log('-----------')
			// console.log(NotificationData)
			if (!NotificationData) {
				routeSql.Notification.create({Title:MyHomeWorkData.dataValues.Title,Type:2,UserId:UserData.dataValues.UserId,Status:0,IsDeleted:false,ModelId:MyHomeWorkData.dataValues.Id}).then(function(){
					upDateAddAllHomeWorkToNotification(ActivityUserData,MyHomeWorkData)
				})
			} else {
				upDateAddAllHomeWorkToNotification(ActivityUserData,MyHomeWorkData)
			}
		})
	}
}

function upDateExamNotification(Id){
	// console.log('__________________')
	routeSql.TeachingDetail.findOne({where:{Type:1,ModelId:Id}}).then(function(ExamData){
		upDateFindAllExam(ExamData)
	})
}
function upDateFindAllExam(ExamData){
	// var ExamData = Arr.shift()
	// console.log('------------------------------')
	if (ExamData) {
		// console.log(ExamData.dataValues)
		routeSql.MyExam.findOne({where:{Id:ExamData.dataValues.ModelId}}).then(function(MyExamData){
			// console.log(MyExamData.dataValues)
			if (MyExamData != null) {
				upDateFindOneExam(MyExamData,ExamData)
			}
			// upDateFindAllExam(Arr)
		})
	}
}
function upDateFindOneExam(MyExamData,ExamData){
	// console.log(MyExamData.dataValues.StartDate)
	var date = new Date(MyExamData.dataValues.StartDate)
	var nextDate = new Date(MyExamData.dataValues.EndDate)
	// console.log(date.toString())
	// console.log(new Date())
	if (new Date(DateAdd('M',-30,new Date(date.toString()))) > new Date()) {
		if (schedule.scheduledJobs['ReportResult' + MyExamData.dataValues.Id]) {
			var result = schedule.cancelJob('ReportResult' + MyExamData.dataValues.Id)
		}
		var j = schedule.scheduleJob('ReportResult' + MyExamData.dataValues.Id,new Date(DateAdd('M',-30,new Date(date.toString()))),function(){
			// console.log('+++++++++++++++')
			upDateUserJoinToExamResult();
		})
	} else if (new Date(DateAdd('M',-30,new Date(date.toString()))) < new Date() && new Date < nextDate) {
		upDateUserJoinToExamResult();
	}
	// upDateFindAllExam(Arr)
	function upDateUserJoinToExamResult(){
		// console.log('+++++++++++++++++++++++++++++++++')
		routeSql.TeachingActivityUser.findAll({where:{TeachingActivityId:ExamData.dataValues.TeachingActivityId}}).then(function(ActivityUserData){
			upDateAddAllExamToNotification(ActivityUserData,MyExamData)
		})
	}
}
function upDateAddAllExamToNotification(ActivityUserData,MyExamData){
	var UserData = ActivityUserData.shift()
	if (UserData) {
		// console.log('+++++++++++++++++++++++')
		routeSql.Notification.findOne({where:{Type:1,UserId:UserData.dataValues.UserId,ModelId:MyExamData.dataValues.Id,Status:0}}).then(function(data){
		// console.log('-------------------------------')
			if (!data) {
		// console.log('*****************************')
				routeSql.Notification.create({Type:1,Title:MyExamData.dataValues.Title,UserId:UserData.dataValues.UserId,Status:0,ModelId:MyExamData.dataValues.Id,IsDeleted:false}).then(function(){
					upDateAddAllExamToNotification(ActivityUserData,MyExamData)
				})
			} else {
		// console.log('============================')
				upDateAddAllExamToNotification(ActivityUserData,MyExamData)
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


function TeacherNotification(){
	// console.log('__________________')
	routeSql.TeachingDetail.findAll({where:{Type:2}}).then(function(Arr){
		TeacherFindAllHomeWork(Arr)
	})
	routeSql.TeachingDetail.findAll({where:{Type:1}}).then(function(Arr){
		TeacherFindAllExam(Arr)
	})
}
function TeacherFindAllHomeWork(Arr){
	var HomeWorkData = Arr.shift()
	// console.log('------------------------------')
	// console.log(HomeWorkData.dataValues)
	if (HomeWorkData) {
		// console.log(ExamData.dataValues)
		routeSql.HomeWork.findOne({where:{Id:HomeWorkData.dataValues.ModelId}}).then(function(MyHomeWorkData){
			// console.log(MyExamData.dataValues)
			if (MyHomeWorkData != null) {
				TeacherFindOneHomeWork(MyHomeWorkData,HomeWorkData,Arr)
			}
			TeacherFindAllHomeWork(Arr)
		})
	}
}
function TeacherFindOneHomeWork(MyHomeWorkData,HomeWorkData,Arr){
	// console.log(MyExamData.dataValues.StartDate)
	// console.log(date.toString())
	// console.log(new Date())
	// var j = schedule.scheduleJob(new Date(date.toString()),function(){
		// console.log('+++++++++++++++')
	var nextDate = new Date(MyHomeWorkData.dataValues.EndDate)
	// console.log(date)
	if (nextDate > new Date()) {
		if (schedule.scheduledJobs['TeacherHomeReport' + MyHomeWorkData.dataValues.Id]) {
			var result = schedule.cancelJob('TeacherHomeReport' + MyHomeWorkData.dataValues.Id)
		}
		var j = schedule.scheduleJob('TeacherHomeReport' + MyHomeWorkData.dataValues.Id,nextDate,function(){
			// console.log('+++++++++++++++')
			TeacherUserJoinToExamResult();
		})
	} else if (new Date > nextDate) {
		TeacherUserJoinToExamResult();
	}
	// })
	// FindAllExam(Arr)
	function TeacherUserJoinToExamResult(){
		// console.log('+++++++++++++++++++++++++++++++++')
		// console.log(HomeWorkData.dataValues.TeachingActivityId)
		// console.log(HomeWorkData.dataValues)
		routeSql.TeachingActivity.findOne({where:{Id:HomeWorkData.dataValues.TeachingActivityId}}).then(function(ActivityData){
			TeacherAddAllHomeWorkToNotification(ActivityData,MyHomeWorkData)
		})
	}
}
function TeacherAddAllHomeWorkToNotification(ActivityData,MyHomeWorkData){
	// console.log(ActivityUserData)
	// var UserData = ActivityData.shift()
			// console.log('==========')
			// console.log(UserData)
	// if (ActivityData) {
		// console.log('++++++++++')
		routeSql.Notification.findOne({where:{Type:2,UserId:ActivityData.dataValues.CreatorUserId,ModelId:MyHomeWorkData.dataValues.Id}}).then(function(NotificationData){
			// console.log('-----------')
			// console.log(NotificationData)
			if (!NotificationData) {
				routeSql.Notification.create({Title:MyHomeWorkData.dataValues.Title,Type:2,UserId:ActivityData.dataValues.CreatorUserId,Status:0,IsDeleted:false,ModelId:MyHomeWorkData.dataValues.Id}).then(function(){
					// TeacherAddAllHomeWorkToNotification(ActivityData,MyHomeWorkData)
				})
			}
			// else{
				
			// }
		})
	// }
}



function TeacherFindAllExam(Arr){
	var ExamData = Arr.shift()
	// console.log('------------------------------')
	if (ExamData) {
		// console.log(ExamData.dataValues)
		routeSql.MyExam.findOne({where:{Id:ExamData.dataValues.ModelId}}).then(function(MyExamData){
			// console.log(MyExamData.dataValues)
			if (MyExamData != null) {
				TeacherFindOneExam(MyExamData,ExamData,Arr)
			}
			TeacherFindAllExam(Arr)
		})
	}
}
function TeacherFindOneExam(MyExamData,ExamData,Arr){
	// console.log(MyExamData.dataValues.StartDate)
	var date = new Date(MyExamData.dataValues.StartDate)
	var nextDate = new Date(MyExamData.dataValues.EndDate)
	// console.log(date.toString())
	// console.log(new Date())
	// console.log('++++++++++')
	if (nextDate > new Date()) {
		if (schedule.scheduledJobs['TeacherExamReport' + MyExamData.dataValues.Id]) {
			var result = schedule.cancelJob('TeacherExamReport' + MyExamData.dataValues.Id)
		}
		var j = schedule.scheduleJob('TeacherExamReport' + MyExamData.dataValues.Id,nextDate,function(){
			// console.log('+++++++++++++++')
			TeacherUserJoinToExamResult();
		})
	} else if (new Date > nextDate) {
		TeacherUserJoinToExamResult();
	}
	// TeacherFindAllExam(Arr)
	function TeacherUserJoinToExamResult(){
		// console.log('+++++++++++++++++++++++++++++++++')
		routeSql.TeachingActivity.findOne({where:{Id:ExamData.dataValues.TeachingActivityId}}).then(function(ActivityData){
			// console.log('-----------')
			TeacherAddAllExamToNotification(ActivityData,MyExamData)
		})
	}
}
function TeacherAddAllExamToNotification(ActivityData,MyExamData){
	// var UserData = ActivityUserData.shift()
	// if (UserData) {
		// console.log('+++++++++++++++++++++++')
		routeSql.Notification.findOne({where:{Type:1,UserId:ActivityData.dataValues.CreatorUserId,ModelId:MyExamData.dataValues.Id}}).then(function(NotificationData){
		// console.log('-------------------------------')
		// console.log('*****************************')
			if (!NotificationData) {
				routeSql.Notification.create({Type:1,Title:MyExamData.dataValues.Title,UserId:ActivityData.dataValues.CreatorUserId,Status:0,ModelId:MyExamData.dataValues.Id,IsDeleted:false}).then(function(){
					// TeacherAddAllExamToNotification(ActivityUserData,MyExamData)
				})
			}
			// else{
				
			// }
		})
	// }
}






module.exports = {upDateExamNotification,upDateHomeWorkNotification,Notification,TeacherNotification}

