 

var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段
// var async = require('async');
var qrImage = require('qr-image')
var fs = require('fs')
var JoinToExamResult = require('./AddExamData.js')
var JoinToHomeWorkResult = require('./AddHomeWorkData.js')
// var destroyResult = require('./destroyResult.js')

router.get('/TeachingActivity',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var Id = req.query.Id
    routeSql.TeachingActivity.findOne({where:{Id:Id,IsDeleted:false}}).then(function(ActivityData){
        routeSql.AbpUsers.findOne({where:{UserType:2}}).then(function(SuperAdmin){
            routeSql.TeachingActivityUser.findOne({where:{UserId:decoded.Id,TeachingActivityId:Id}}).then(function(User){
                if (decoded.UserType != 0 && decoded.Id == ActivityData.dataValues.CreatorUserId) {
                    var State = 0
                    searchActivity(State)
                } else if (User) {
                    var State = 1
                    searchActivity(State)
                } else if (ActivityData.dataValues.IsPublic || SuperAdmin.dataValues.Id == ActivityData.dataValues.CreatorUserId) {
                    var State = 2
                    searchActivity(State)
                } else {
                    res.send({error:1,result:{msg:'你没有权限查看该活动'}})
                }
            })
        })
    })
    function searchActivity(UserState){
        routeSql.TeachingActivity.findOne({where:{Id:Id,IsDeleted:false},attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),InSertIp),'CodePath'],'InviteCode','BrowNum',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img']]}).then(function(ActivityData){
            var ActivityArray = []
            if (ActivityData) {
                if (UserState != 0) {
                    var BrowseNum = parseInt(ActivityData.dataValues.BrowNum)
                    routeSql.TeachingActivity.update({BrowNum:BrowseNum + 1},{where:{Id:Id}})
                }
                routeSql.TeachingLink.findAll({where:{TeachingActivityId:Id,IsDeleted:false},attributes:['Id','Title','Desc','TaskCount','ShowSort'],order:[['ShowSort','ASC']]}).then(function(TeachingLinkArr){
                    getAllLink(TeachingLinkArr)
                    function getAllLink(TeachingLinkArr){
                        var TeachingLinkData = TeachingLinkArr.shift()
                        var TeachingLinkDataValues = {}
                        if (TeachingLinkData) {
                            TeachingLinkDataValues = TeachingLinkData.dataValues;
                            routeSql.TeachingTask.findAll({where:{TeachingLinkId:TeachingLinkDataValues.Id,IsDeleted:false},attributes:['Id','Title','Desc','ShowSort','IsDeleted'],order:[['ShowSort','ASC']]}).then(function(TeachingTaskArr){
                                var TaskArray = []
                                getAllTask(TeachingTaskArr)
                                function getAllTask(TeachingTaskArr){
                                    var TeachingTaskData = TeachingTaskArr.shift()
                                    if (TeachingTaskData) {
                                        var TeachingTaskDataValues = TeachingTaskData.dataValues;
                                        routeSql.TeachingDetail.findAll({where:{TeachingTaskId:TeachingTaskDataValues.Id}}).then(function(TeachingDetailArr){
                                            var ModelArray = []
                                            getAllModel(TeachingDetailArr)
                                            function getAllModel(TeachingDetailArr){
                                                var TeachingDetailData = TeachingDetailArr.shift()
                                                if (TeachingDetailData) {
                                                    var TeachingDetailDataValues = TeachingDetailData.dataValues
                                                    if (TeachingDetailDataValues.Type == 0) {
                                                        // console.log(TeachingDetailDataValues)
                                                        // console.log('-----')
                                                        routeSql.CloudDiskFiles.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(ModelData){
                                                            // console.log(ModelData)
                                                            // console.log(ModelData.dataValues)
                                                            var FileCategory = 0;
                                                            var FileUrl = '';
                                                            var FileSize = 0
                                                            if (ModelData.dataValues.DiskFilesResourceId) {
                                                                FileCategory = ModelData.dataValues.DiskFilesResourceId.FileCategory
                                                                FileUrl = ModelData.dataValues.DiskFilesResourceId.FileUrl
                                                                FileSize = ModelData.dataValues.DiskFilesResourceId.FileSize
                                                            }
                                                            ModelArray.push({TeachingDetailData:TeachingDetailData,ModelData:{FileName:ModelData.dataValues.FileName,ResourceId:ModelData.dataValues.ResourceId,FileCategory:FileCategory,FileUrl:FileUrl,FileSize:FileSize}})
                                                            getAllModel(TeachingDetailArr)
                                                        })
                                                    } else if (TeachingDetailDataValues.Type == 1) {
                                                        routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ExamData){
                                                            routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
                                                                routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:TeachingDetailDataValues.ModelId}}).then(function(ExamResultData){
                                                                    routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamBaseData.dataValues.Id}}).then(function(QuestionCount){
                                                                        var State = 3;
                                                                        var TeacherPaperState;
                                                                        if (new Date(ExamData.dataValues.StartDate) > new Date()) {
                                                                            State = 3//考试还未开始
                                                                            // if (ExamResultData) {
                                                                            //     State = 3//考试还未开始
                                                                            // } else {
                                                                            //     State = 5//不能参加该考试
                                                                            // }
                                                                        } else if (new Date(ExamData.dataValues.StartDate) < new Date() && new Date() < new Date(ExamData.dataValues.EndDate)) {
                                                                            if (ExamResultData) {
                                                                                if (ExamResultData.dataValues.State == 1) {
                                                                                    State = 2//已经提交过了或者考试时长已经过了考试未结束
                                                                                } else {
                                                                                    State = 0//可以开始考试
                                                                                }
                                                                            } else {
                                                                                State = 5//不能参加该考试
                                                                            }
                                                                        } else {
                                                                            if (ExamResultData) {
                                                                                if (ExamResultData.dataValues.State == 0) {
                                                                                    State = 4//缺考
                                                                                } else {
                                                                                    State = 1//考试已经结束
                                                                                }
                                                                            } else {
                                                                                State = 5//不能参加该考试
                                                                            }
                                                                        }
                                                                            // if (new Date(ExamData.dataValues.EndDate) > new Date()) {
                                                                            //     if (ExamResultData) {
                                                                            //         if (ExamResultData.dataValues.State == 1 || Date(ExamResultData.dataValues.EndDate) < new Date()) {
                                                                            //             State = 2//已经提交过了或者考试时长已经过了考试未结束
                                                                            //         } else {
                                                                            //             State = 0//可以开始考试
                                                                            //         }
                                                                            //     } else {
                                                                            //         State = 3//考试还未开始或不能参加该考试
                                                                            //     }
                                                                            // } else {
                                                                            //     if (ExamResultData) {
                                                                            //         if (new Date(ExamData.dataValues.EndDate) < new Date() && ExamResultData.dataValues.State == 0) {
                                                                            //             State = 4//缺考
                                                                            //         } else {
                                                                            //             State = 1//考试已经结束
                                                                            //         }
                                                                            //     }
                                                                            // }
                                                                            if (new Date(ExamData.dataValues.StartDate) > new Date()) {
                                                                                TeacherPaperState = 2;//未开始
                                                                            } else if (new Date(ExamData.dataValues.StartDate) < new Date() && new Date(ExamData.dataValues.EndDate) > new Date()) {
                                                                                TeacherPaperState = 0;//正在进行中
                                                                            } else {
                                                                                TeacherPaperState = 1;//已结束
                                                                            }
                                                                        ModelArray.push({TeachingDetailData:TeachingDetailData,ModelData:{State:State,CountScore:ExamBaseData.dataValues.CountScore,PassScore:ExamBaseData.dataValues.PassScore,StartDate:ExamData.dataValues.StartDate,EndDate:ExamData.dataValues.EndDate,TimeLong:ExamData.dataValues.TimeLong,MyExamBaseId:ExamData.dataValues.MyExamBaseId,QuestionCount:QuestionCount,TeacherPaperState:TeacherPaperState}})
                                                                        getAllModel(TeachingDetailArr)
                                                                    })
                                                                })
                                                            })
                                                        })
                                                        // routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.MyExamBase,as:'TestPaper',attributes:['PassScore','CountScore']}]}).then(function(ModelData){
                                                        //     ModelArray.push({TeachingDetailData,ModelData})
                                                        //     getAllModel(TeachingDetailArr)
                                                        // })
                                                    } else if (TeachingDetailDataValues.Type == 2) {
                                                        routeSql.HomeWork.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ModelData){
                                                            if (new Date() > new Date(ModelData.dataValues.EndDate)) {
                                                                ModelData.dataValues.IsEnd = true
                                                            } else {
                                                                ModelData.dataValues.IsEnd = false
                                                            }
                                                            ModelArray.push({TeachingDetailData,ModelData})
                                                            getAllModel(TeachingDetailArr)
                                                        })
                                                    } else if (TeachingDetailDataValues.Type == 3) {
                                                        routeSql.Questionnaires.findOne({where:{Id:TeachingDetailDataValues.ModelId},attributes:['Title','Code',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),InSertIp),'CodePath'],'Count']}).then(function(ModelData){
                                                            if (UserState == 0) {
                                                                ModelArray.push({TeachingDetailData,ModelData})
                                                            } else {
                                                                ModelArray.push({TeachingDetailData,ModelData:{}})
                                                            }
                                                            getAllModel(TeachingDetailArr)
                                                        })
                                                    }
                                                } else {
                                                    TaskArray.push({TeachingTaskDataValues,ModelArray})
                                                    getAllTask(TeachingTaskArr);
                                                }
                                            }
                                        })
                                    } else {
                                        ActivityArray.push({TeachingLinkDataValues,TaskArray})
                                        getAllLink(TeachingLinkArr)
                                    }
                                }
                            })
                        } else {
                            // console.log(ActivityArray)
                            res.send({error:0,result:{ActivityData,ActivityArray,UserState:UserState}})
                        }
                    }
                })
            } else {
                res.send({error:2,result:{msg:'没找到该活动'}})
            }
        })
    }
})

router.get('/TeachingActivityforTest',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var Id = req.query.Id
    routeSql.TeachingActivity.findOne({where:{Id:Id,IsDeleted:false}}).then(function(ActivityData){
        routeSql.AbpUsers.findOne({where:{UserType:2}}).then(function(SuperAdmin){
            routeSql.TeachingActivityUser.findOne({where:{UserId:decoded.Id,TeachingActivityId:Id}}).then(function(User){
                if (decoded.UserType != 0 && decoded.Id == ActivityData.dataValues.CreatorUserId) {
                    var State = 0
                    searchActivity(State)
                } else if (User) {
                    var State = 1
                    searchActivity(State)
                } else if (ActivityData.dataValues.IsPublic || SuperAdmin.dataValues.Id == ActivityData.dataValues.CreatorUserId) {
                    var State = 2
                    searchActivity(State)
                } else {
                    res.send({error:1,result:{msg:'你没有权限查看该活动'}})
                }
            })
        })
    })
    function searchActivity(UserState){
        routeSql.TeachingActivity.findOne({where:{Id:Id,IsDeleted:false},attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),InSertIp),'CodePath'],'InviteCode','BrowNum',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img']]}).then(function(ActivityData){
            var ActivityArray = []
            if (ActivityData) {
                if (UserState != 0) {
                    var BrowseNum = parseInt(ActivityData.dataValues.BrowNum)
                    routeSql.TeachingActivity.update({BrowNum:BrowseNum + 1},{where:{Id:Id}})
                }
                routeSql.TeachingLink.findAll({where:{TeachingActivityId:Id,IsDeleted:false},attributes:['Id','Title','Desc','TaskCount','ShowSort'],order:[['ShowSort','ASC']]}).then(function(TeachingLinkArr){
                    getAllLink(TeachingLinkArr)
                    function getAllLink(TeachingLinkArr){
                        var TeachingLinkData = TeachingLinkArr.shift()
                        var LinkArray = []
                        if (TeachingLinkData) {
                            var TeachingLinkDataValues = TeachingLinkData.dataValues;
                            routeSql.TeachingTask.findAll({where:{TeachingLinkId:TeachingLinkDataValues.Id,IsDeleted:false},attributes:['Id','Title','Desc','ShowSort','IsDeleted'],order:[['ShowSort','ASC']]}).then(function(TeachingTaskArr){
                                var TaskArray = []
                                getAllTask(TeachingTaskArr)
                                function getAllTask(TeachingTaskArr){
                                    var TeachingTaskData = TeachingTaskArr.shift()
                                    if (TeachingTaskData) {
                                        var TeachingTaskDataValues = TeachingTaskData.dataValues;
                                        routeSql.TeachingDetail.findAll({where:{TeachingTaskId:TeachingTaskDataValues.Id}}).then(function(TeachingDetailArr){
                                            var ModelArray = []
                                            getAllModel(TeachingDetailArr)
                                            function getAllModel(TeachingDetailArr){
                                                var TeachingDetailData = TeachingDetailArr.shift()
                                                if (TeachingDetailData) {
                                                    var TeachingDetailDataValues = TeachingDetailData.dataValues
                                                    if (TeachingDetailDataValues.Type == 0) {
                                                        // console.log(TeachingDetailDataValues)
                                                        // console.log('-----')
                                                        routeSql.CloudDiskFiles.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(ModelData){
                                                            // console.log(ModelData)
                                                            // console.log(ModelData.dataValues)
                                                            var FileCategory = 0;
                                                            var FileUrl = '';
                                                            var FileSize = 0
                                                            if (ModelData.dataValues.DiskFilesResourceId) {
                                                                FileCategory = ModelData.dataValues.DiskFilesResourceId.FileCategory
                                                                FileUrl = ModelData.dataValues.DiskFilesResourceId.FileUrl
                                                                FileSize = ModelData.dataValues.DiskFilesResourceId.FileSize
                                                            } else {}
                                                            ModelArray.push({TeachingDetailData:TeachingDetailData,ModelData:{FileName:ModelData.dataValues.FileName,ResourceId:ModelData.dataValues.ResourceId,FileCategory:FileCategory,FileUrl:FileUrl,FileSize:FileSize}})
                                                            getAllModel(TeachingDetailArr)
                                                        })
                                                    } else if (TeachingDetailDataValues.Type == 1) {
                                                        routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ExamData){
                                                            routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
                                                                routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:TeachingDetailDataValues.ModelId}}).then(function(ExamResultData){
                                                                    routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamBaseData.dataValues.Id}}).then(function(QuestionCount){
                                                                        var State = 3;
                                                                        var TeacherPaperState;
                                                                        if (new Date(ExamData.dataValues.StartDate) > new Date()) {
                                                                            State = 3//考试还未开始
                                                                            // if (ExamResultData) {
                                                                            //     State = 3//考试还未开始
                                                                            // } else {
                                                                            //     State = 5//不能参加该考试
                                                                            // }
                                                                        } else if (new Date(ExamData.dataValues.StartDate) < new Date() && new Date() < new Date(ExamData.dataValues.EndDate)) {
                                                                            if (ExamResultData) {
                                                                                if (ExamResultData.dataValues.State == 1) {
                                                                                    State = 2//已经提交过了或者考试时长已经过了考试未结束
                                                                                } else {
                                                                                    State = 0//可以开始考试
                                                                                }
                                                                            } else {
                                                                                State = 5//不能参加该考试
                                                                            }
                                                                        } else {
                                                                            if (ExamResultData) {
                                                                                if (ExamResultData.dataValues.State == 0) {
                                                                                    State = 4//缺考
                                                                                } else {
                                                                                    State = 1//考试已经结束
                                                                                }
                                                                            } else {
                                                                                State = 5//不能参加该考试
                                                                            }
                                                                        }
                                                                            // if (new Date(ExamData.dataValues.EndDate) > new Date()) {
                                                                            //     if (ExamResultData) {
                                                                            //         if (ExamResultData.dataValues.State == 1 || Date(ExamResultData.dataValues.EndDate) < new Date()) {
                                                                            //             State = 2//已经提交过了或者考试时长已经过了考试未结束
                                                                            //         } else {
                                                                            //             State = 0//可以开始考试
                                                                            //         }
                                                                            //     } else {
                                                                            //         State = 3//考试还未开始或不能参加该考试
                                                                            //     }
                                                                            // } else {
                                                                            //     if (ExamResultData) {
                                                                            //         if (new Date(ExamData.dataValues.EndDate) < new Date() && ExamResultData.dataValues.State == 0) {
                                                                            //             State = 4//缺考
                                                                            //         } else {
                                                                            //             State = 1//考试已经结束
                                                                            //         }
                                                                            //     }
                                                                            // }
                                                                            if (new Date(ExamData.dataValues.StartDate) > new Date()) {
                                                                                TeacherPaperState = 2;//未开始
                                                                            } else if (new Date(ExamData.dataValues.StartDate) < new Date() && new Date(ExamData.dataValues.EndDate) > new Date()) {
                                                                                TeacherPaperState = 0;//正在进行中
                                                                            } else {
                                                                                TeacherPaperState = 1;//已结束
                                                                            }
                                                                        ModelArray.push({TeachingDetailData:TeachingDetailData,ModelData:{State:State,CountScore:ExamBaseData.dataValues.CountScore,PassScore:ExamBaseData.dataValues.PassScore,StartDate:ExamData.dataValues.StartDate,EndDate:ExamData.dataValues.EndDate,TimeLong:ExamData.dataValues.TimeLong,MyExamBaseId:ExamData.dataValues.MyExamBaseId,QuestionCount:QuestionCount,TeacherPaperState:TeacherPaperState}})
                                                                        getAllModel(TeachingDetailArr)
                                                                    })
                                                                })
                                                            })
                                                        })
                                                        // routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.MyExamBase,as:'TestPaper',attributes:['PassScore','CountScore']}]}).then(function(ModelData){
                                                        //     ModelArray.push({TeachingDetailData,ModelData})
                                                        //     getAllModel(TeachingDetailArr)
                                                        // })
                                                    } else if (TeachingDetailDataValues.Type == 2) {
                                                        routeSql.HomeWork.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ModelData){
                                                            if (new Date() > new Date(ModelData.dataValues.EndDate)) {
                                                                ModelData.dataValues.IsEnd = true
                                                            } else {
                                                                ModelData.dataValues.IsEnd = false
                                                            }
                                                            ModelArray.push({TeachingDetailData,ModelData})
                                                            getAllModel(TeachingDetailArr)
                                                        })
                                                    } else if (TeachingDetailDataValues.Type == 3) {
                                                        routeSql.Questionnaires.findOne({where:{Id:TeachingDetailDataValues.ModelId},attributes:['Title','Code',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),InSertIp),'CodePath'],'Count']}).then(function(ModelData){
                                                            if (UserState == 0) {
                                                                ModelArray.push({TeachingDetailData,ModelData})
                                                            } else {
                                                                ModelArray.push({TeachingDetailData,ModelData:{}})
                                                            }
                                                            getAllModel(TeachingDetailArr)
                                                        })
                                                    }
                                                } else {
                                                    TaskArray.push({TeachingTaskDataValues,ModelArray})
                                                    getAllTask(TeachingTaskArr);
                                                }
                                            }
                                        })
                                    } else {
                                        ActivityArray.push({TeachingLinkDataValues,TaskArray})
                                        getAllLink(TeachingLinkArr)
                                    }
                                }
                            })
                        } else {
                            // console.log(ActivityArray)
                            res.send({error:0,result:{ActivityData,ActivityArray,UserState:UserState}})
    // console.log('--------------------------------------------')
    // console.log({ActivityData,ActivityArray,UserState:UserState})
    // console.log('--------------------------------------------')
    // // res.send('sssss')
                        }
                    }
                })
            } else {
                res.send({error:2,result:{msg:'没找到该活动'}})
            }
        })
    }
})



// 添加新的环节列表
router.post('/AddLink',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body)
    routeSql.TeachingActivity.findOne({where:{Id:req.body.TeachingActivityId}}).then(function(data){
        if (decoded.Id == data.dataValues.CreatorUserId) {
            if (req.body.Title == '' || req.body.Title == null) {
                res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
            } else {
                if (req.body.Title.length <= 30) {
                    routeSql.TeachingLink.max(['ShowSort'],{where:{TeachingActivityId:req.body.TeachingActivityId}}).then(function(MaxIndex){
                        if (!MaxIndex) {MaxIndex = 0}
                        routeSql.TeachingLink.create({Title:req.body.Title,Desc:'',TeachingActivityId:req.body.TeachingActivityId,ShowSort:MaxIndex + 1,CreatorUserId:decoded.Id,TaskCount:0}).then(function(LinkData){
                            res.send({error:0,result:LinkData})
                        })
        	    	})
                } else {
                    res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
                }
            }
	    } else {
	    	res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
	    }
    })
})
// 编辑任务列表
router.post('/EditLink',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingLink.findOne({where:{Id:req.body.TeachingLinkId}}).then(function(data){
        if (decoded.Id == data.dataValues.CreatorUserId) {
            if (req.body.Title == '' || req.body.Title == null) {
                res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
            } else {
                if (req.body.Title.length <= 30) {
                    routeSql.TeachingLink.update({Title:req.body.Title,Desc:''},{where:{Id:req.body.TeachingLinkId}}).then(function(MaxIndex){
                        res.send({error:0,result:{msg:'编辑成功'}})
                    })
                } else {
                    res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
                }
            }
        } else {
            res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
        }
    })
})
// 删除环节
router.post('/destroyLink',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingLink.findOne({where:{Id:req.body.TeachingLinkId}}).then(function(data){
        routeSql.TeachingLink.findAll({where:{TeachingActivityId:data.dataValues.TeachingActivityId}}).then(function(LinkArrLength){
            if (LinkArrLength.length > 1) {
                if (decoded.Id == data.dataValues.CreatorUserId) {
                    console.log(req.body.TeachingLinkId)
                    routeSql.TeachingTask.findAll({where:{TeachingLinkId:req.body.TeachingLinkId}}).then(function(TaskArr){
                        destroyTaskArr(TaskArr)
                        function destroyTaskArr(TaskArr){
                            var TaskData = TaskArr.shift()
                            if (TaskData) {
                                routeSql.TeachingDetail.findAll({where:{TeachingTaskId:TaskData.dataValues.Id}}).then(function(DetailArr){
                                    destroyDetailArr(DetailArr)
                                    function destroyDetailArr(DetailArr){
                                        var DetailData = DetailArr.shift()
                                        if (DetailData) {
                                            if (DetailData.dataValues.Type == 0) {
                                                routeSql.TeachingDetail.destroy({where:{ModelId:DetailData.dataValues.ModelId,Type:DetailData.dataValues.Type,Id:DetailData.dataValues.Id}}).then(function(){
                                                    destroyDetailArr(DetailArr)
                                                })
                                            } else if (DetailData.dataValues.Type == 1) {
                                                console.log(DetailData.dataValues.ModelId)
                                                routeSql.ExamResult.findAll({where:{ExamId:DetailData.dataValues.ModelId}}).then(function(ExamResultArr){
                                                    destroyExamResult(ExamResultArr)
                                                    function destroyExamResult(ExamResultArr){
                                                        var ExamResultData = ExamResultArr.shift()
                                                        if (ExamResultData) {
                                                            routeSql.ExamResultRecord.destroy({where:{ExamResultId:ExamResultData.dataValues.Id}}).then(function(){
                                                                routeSql.ExamResult.update({IsDeleted:true},{where:{Id:ExamResultData.dataValues.Id}}).then(function(){
                                                                    destroyExamResult(ExamResultArr)
                                                                })
                                                            })
                                                        } else {
                                                            routeSql.MyExam.destroy({where:{Id:DetailData.dataValues.ModelId}}).then(function(){
                                                                routeSql.TeachingDetail.destroy({where:{ModelId:DetailData.dataValues.ModelId,Type:DetailData.dataValues.Type,Id:DetailData.dataValues.Id}}).then(function(){
                                                                    destroyDetailArr(DetailArr)
                                                                })
                                                            })
                                                        }
                                                    }
                                                })
                                            } else if (DetailData.dataValues.Type == 2) {
                                                routeSql.HomeWork.findOne({where:{Id:DetailData.dataValues.ModelId}}).then(function(HomeWorkData){
                                                    routeSql.HomeWorkResult.findAll({where:{HomeWorkId:DetailData.dataValues.ModelId}}).then(function(HomeWorkResultArr){
                                                        destroyHomeWork(HomeWorkResultArr)
                                                        function destroyHomeWork(HomeWorkResultArr){
                                                            var HomeWorkResultData = HomeWorkResultArr.shift()
                                                            if (HomeWorkResultData) {
                                                                routeSql.HomeWorkImage.destroy({where:{WorkType:1,WorkId:HomeWorkResultData.dataValues.Id}}).then(function(){
                                                                    routeSql.HomeWorkResult.destroy({where:{Id:HomeWorkResultData.dataValues.Id}}).then(function(){
                                                                        destroyHomeWork(HomeWorkResultArr)
                                                                    })
                                                                })
                                                            } else {
                                                                routeSql.HomeWork.destroy({where:{Id:DetailData.dataValues.ModelId}}).then(function(){
                                                                    routeSql.HomeWorkImage.destroy({where:{WorkType:2,WorkId:HomeWorkData.dataValues.AnswerId}}).then(function(){
                                                                        routeSql.HomeWorkAnswer.destroy({where:{Id:HomeWorkData.dataValues.AnswerId}}).then(function(){
                                                                            routeSql.HomeWorkImage.destroy({where:{WorkType:0,WorkId:HomeWorkData.dataValues.Id}}).then(function(){
                                                                                    routeSql.TeachingDetail.destroy({where:{ModelId:DetailData.dataValues.ModelId,Type:DetailData.dataValues.Type,Id:DetailData.dataValues.Id}}).then(function(){
                                                                                        destroyDetailArr(DetailArr)
                                                                                    })
                                                                            })
                                                                        })
                                                                    })
                                                                })
                                                            }
                                                        }
                                                    })
                                                })
                                            } else {
                                                routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:DetailData.dataValues.ModelId}}).then(function(QuestionSurveiesArr){
                                                    destroyQuestionSurveies(QuestionSurveiesArr)
                                                    function destroyQuestionSurveies(QuestionSurveiesArr){
                                                        var QuestionSurveiesData = QuestionSurveiesArr.shift()
                                                        // console.log(QuestionSurveiesData)
                                                        if (QuestionSurveiesData) {
                                                            routeSql.QuestionnaireResults.destroy({where:{QuestionSurveiesId:QuestionSurveiesData.dataValues.Id}}).then(function(){
                                                                routeSql.QuestionSurveies.destroy({where:{Id:QuestionSurveiesData.dataValues.Id}})
                                                                destroyQuestionSurveies(QuestionSurveiesArr)
                                                            })
                                                        } else {
                                                            routeSql.Questionnaires.destroy({where:{Id:DetailData.dataValues.ModelId}}).then(function(){
                                                                routeSql.TeachingDetail.destroy({where:{ModelId:DetailData.dataValues.ModelId,Type:DetailData.dataValues.Type,Id:DetailData.dataValues.Id}}).then(function(){
                                                                    destroyDetailArr(DetailArr)
                                                                })
                                                            })
                                                        }
                                                    }
                                                })
                                            }
                                        } else {
                                            routeSql.TeachingTask.update({IsDeleted:true,DeleterUserId:decoded.Id,DeletionTime:new Date()},{where:{Id:TaskData.dataValues.Id}}).then(function(){
                                                routeSql.TeachingLink.update({TaskCount:data.dataValues.TaskCount - 1},{where:{Id:data.dataValues.TeachingLinkId}}).then(function(){
                                                    // console.log('=====')
                                                    destroyTaskArr(TaskArr)
                                                })
                                            })
                                        }
                                    }
                                })
                            } else {
                                routeSql.TeachingLink.update({IsDeleted:true,DeleterUserId:decoded.Id,DeletionTime:new Date(),TaskCount:0},{where:{Id:req.body.TeachingLinkId}}).then(function(MaxIndex){
                                    res.send({error:0,result:{msg:'删除成功'}})
                                })
                            }
                        }
                    })
                } else {
                    res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
                }
            } else {
                res.send({error:1,result:{msg:'环节最低要有一个'}})
            }
        })
    })
})

// 任务列表调换位置
router.post('/ChangeLinkPosition',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body)
    // console.log('--------+++++++++++')
    routeSql.TeachingActivity.findOne({where:{Id:req.body.ActivityId}}).then(function(data){
        var ExchangeShowSort;
        var CurrentShowSort;
        routeSql.TeachingLink.max(['ShowSort'],{where:{IsDeleted:false,TeachingActivityId:req.body.ActivityId}}).then(function(ShowSort){
            ExchangeShowSort = ShowSort;
        })
        if (decoded.Id == data.dataValues.CreatorUserId) {
            routeSql.TeachingLink.findAll({where:{Id:req.body.ExchangedLinkId,IsDeleted:false}}).then(function(ExchangeData){
                if (ExchangeData.length > 0) {
                    ExchangeShowSort = ExchangeData[0].dataValues.ShowSort;
                }
                routeSql.TeachingLink.findOne({where:{Id:req.body.CurrentLinkId}}).then(function(CurrentData){
                    CurrentShowSort = CurrentData.dataValues.ShowSort;
                    if (ExchangeShowSort > CurrentShowSort) {
                        routeSql.TeachingLink.update({ShowSort:ExchangeShowSort + 1},{where:{Id:CurrentData.dataValues.Id}}).then(function(){
                            routeSql.TeachingLink.findAll({where:{ShowSort:{$gt:ExchangeShowSort},Id:{$ne:CurrentData.dataValues.Id},TeachingActivityId:req.body.ActivityId,IsDeleted:false}}).then(function(arr){
                                ChangeLinkPosition(arr)
                            })
                        })
                    } else {
                        routeSql.TeachingLink.update({ShowSort:ExchangeShowSort},{where:{Id:CurrentData.dataValues.Id}}).then(function(){
                            routeSql.TeachingLink.findAll({where:{ShowSort:{$gte:ExchangeShowSort},Id:{$ne:CurrentData.dataValues.Id},TeachingActivityId:req.body.ActivityId,IsDeleted:false}}).then(function(arr){
                                ChangeLinkPosition(arr)
                            })
                        })
                    }
                })
            })
        } else {
            res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
        }
    })
    function ChangeLinkPosition(arr){
        var data = arr.shift()
        // console.log(arr)
        if (data) {
            routeSql.TeachingLink.update({ShowSort:data.dataValues.ShowSort + 1},{where:{Id:data.dataValues.Id}}).then(function(){ChangeLinkPosition(arr)})
        } else {
            res.send({error:0,result:{msg:'位置调换成功'}})
        }
    }
})

router.post('/AddTask',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (decoded.UserType > 0) {
        routeSql.TeachingLink.findOne({where:{Id:req.body.TeachingLinkId}}).then(function(LinkData){
            if (LinkData.dataValues.CreatorUserId == decoded.Id) {
                routeSql.TeachingTask.max(['ShowSort'],{where:{TeachingLinkId:req.body.TeachingLinkId}}).then(function(MaxIndex){
                    if (!MaxIndex) {MaxIndex = 0}
                    routeSql.TeachingTask.create({Title:'新建任务',TeachingLinkId:req.body.TeachingLinkId,ShowSort:MaxIndex + 1,CreatorUserId:decoded.Id,IsDeleted:false}).then(function(data){
                        routeSql.TeachingLink.update({TaskCount:LinkData.dataValues.TaskCount + 1},{where:{Id:LinkData.dataValues.Id}})
                        res.send({error:0,result:{Id:data.dataValues.Id,Title:data.dataValues.Title,Desc:data.dataValues.Desc}})
                    })
                })
            } else {
                res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
            }
        })
    } else {
        res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
    }
    // console.log(req.body.ModelArray)
    // // req.body.ModelArray = [{Title:ModelTitle,Type:ModelType,ModelId:ModelId,TeachingActicityId:ActivityId},{}];
    // var ModelArray = [];
    // ModelArray = req.body.ModelArray
    // console.log(typeof(req.body.ModelArray))
    // console.log('+++++++++')
    // // if (req.body.ModelArray.length > 0) {
    // //     ModelArray = JSON.parse(req.body.ModelArray)
    // //     console.log(ModelArray)
    // // }
    // routeSql.TeachingLink.findOne({where:{Id:req.body.TeachingLinkId}}).then(function(data){
	   //  if (decoded.Id == data.dataValues.CreatorUserId) {
	   //  	routeSql.TeachingTask.max(['ShowSort'],{where:{TeachingLinkId:req.body.TeachingLinkId}}).then(function(MaxIndex){
	   //  		if (!MaxIndex) {MaxIndex = 0}
	   //  		routeSql.TeachingTask.create({Title:req.body.TaskTitle,Desc:req.body.Desc,TeachingLinkId:req.body.TeachingLinkId,ShowSort:MaxIndex + 1,CreatorUserId:decoded.Id,IsDeleted:false,TeachingDetailTaskId:ModelArray},{include:[{model:routeSql.TeachingDetail,as:'TeachingDetailTaskId'}]}).then(function(){
    //                 routeSql.TeachingLink.update({TaskCount:data.dataValues.TaskCount + 1},{where:{Id:req.body.TeachingLinkId}}).then(function(){
    //                     res.send({error:0,result:{msg:'创建新的任务成功'}})
    //                     JoinToExamResult()
    //                     JoinToHomeWorkResult()
    //                 })
    //             })
	   //  	})
	   //  } else {
	   //  	res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
	   //  }
    // })
})

router.get('/EditTask',function(req,res){
    // console.log(req.query)
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingTask.findOne({where:{Id:req.query.TeachingTaskId},include:[{model:routeSql.TeachingDetail,as:'TeachingDetailTaskId',attributes:['ModelId','Title','Type']}],attributes:['Id','Title','Desc']}).then(function(data){
        // console.log(data)
        // searchDetail(req.query.TeachingTaskId)
        // console.log(searchDetail(req.query.TeachingTaskId))
        res.send({error:0,result:data})
        // JoinToExamResult()
        // JoinToHomeWorkResult()
    })
})

router.get('/EditTaskforWeb',function(req,res){
    // console.log(req.query)
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingTask.findOne({where:{Id:req.query.TeachingTaskId},attributes:['Id','Title','Desc']}).then(function(data){
        // console.log(data)
        searchDetail(req.query.TeachingTaskId,req,res,data,decoded)
        // JoinToExamResult()
        // JoinToHomeWorkResult()
    })
})

router.post('/EditTask',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // var deletedArray = req.body.deletedArray;
    // var updateArray = req.body.updateArray;
    // var TeachingActivityId = req.body.TeachingActivityId;
    // console.log(req.body)
    if (req.body.TeachingTaskId != '' && req.body.TeachingTaskId != null) {
        routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId}}).then(function(data){
            if (data.dataValues.CreatorUserId == decoded.Id) {
                if (req.body.TaskTitle == '' || req.body.Desc == null || req.body.TaskTitle == null) {
                    res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
                } else {
                    if (req.body.TaskTitle.length <= 30 && req.body.Desc.length <= 100) {
                        routeSql.TeachingTask.update({Title:req.body.TaskTitle,Desc:req.body.Desc},{where:{Id:data.dataValues.Id}}).then(function(){
                            res.send({error:0,result:{msg:'编辑成功'}})
                            // routeSql.TeachingDetail.destroy({where:{Id:deletedArray,TeachingTaskId:req.body.TeachingTaskId}})
                            // updateDetail()
                            // function updateDetail(){
                            //     var upDate = updateArray.shift()
                            //     if (upDate) {
                            //         if (upDate.Id) {
                            //             routeSql.TeachingDetail.update({Title:upDate.Title,Type:upDate.Type,ModelId:upDate.ModelId,TeachingTaskId:req.body.TeachingTaskId,TeachingActivityId:upDate.TeachingActivityId},{where:{Id:upDate.Id}}).then(function(){
                            //                 updateDetail()
                            //             })
                            //         } else {
                            //             routeSql.TeachingDetail.create({Title:upDate.Title,Type:upDate.Type,ModelId:upDate.ModelId,TeachingTaskId:req.body.TeachingTaskId,TeachingActivityId:upDate.TeachingActivityId}).then(function(){
                            //                 updateDetail()
                            //             })
                            //         }
                            //     } else {
                            //         JoinToExamResult()
                            //         JoinToHomeWorkResult()
                            //         res.send({error:0,result:{msg:'编辑成功'}})
                            //     }
                            // }
                        })
                    } else {
                        res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
                    }
                }
            } else {
                res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
            }
        })
    } else {
        res.send({error:2,result:{msg:'报错了'}})
    }
})

router.post('/destroyTask',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body)
    routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId}}).then(function(data){
        // console.log(data.dataValues)
        if (data.dataValues.CreatorUserId == decoded.Id) {
            routeSql.TeachingDetail.findAll({where:{TeachingTaskId:req.body.TeachingTaskId}}).then(function(DetailArr){
                destroyDetailArr(DetailArr)
                function destroyDetailArr(DetailArr){
                    var DetailData = DetailArr.shift()
                    if (DetailData) {
                        if (DetailData.dataValues.Type == 0) {
                            routeSql.TeachingDetail.destroy({where:{ModelId:DetailData.dataValues.ModelId,Type:DetailData.dataValues.Type,Id:DetailData.dataValues.Id}}).then(function(){
                                destroyDetailArr(DetailArr)
                            })
                        } else if (DetailData.dataValues.Type == 1) {
                            routeSql.ExamResult.findAll({where:{ExamId:DetailData.dataValues.ModelId}}).then(function(ExamResultArr){
                                destroyExamResult(ExamResultArr)
                                function destroyExamResult(ExamResultArr){
                                    var ExamResultData = ExamResultArr.shift()
                                    if (ExamResultData) {
                                        routeSql.ExamResultRecord.destroy({where:{ExamResultId:ExamResultData.dataValues.Id}}).then(function(){
                                            routeSql.ExamResult.update({IsDeleted:true},{where:{Id:ExamResultData.dataValues.Id}}).then(function(){
                                                destroyExamResult(ExamResultArr)
                                            })
                                        })
                                    } else {
                                        routeSql.MyExam.destroy({where:{Id:DetailData.dataValues.ModelId}}).then(function(){
                                            routeSql.TeachingDetail.destroy({where:{ModelId:DetailData.dataValues.ModelId,Type:DetailData.dataValues.Type,Id:DetailData.dataValues.Id}}).then(function(){
                                                destroyDetailArr(DetailArr)
                                            })
                                        })
                                    }
                                }
                            })
                        } else if (DetailData.dataValues.Type == 2) {
                            routeSql.HomeWork.findOne({where:{Id:DetailData.dataValues.ModelId}}).then(function(HomeWorkData){
                                routeSql.HomeWorkResult.findAll({where:{HomeWorkId:DetailData.dataValues.ModelId}}).then(function(HomeWorkResultArr){
                                    destroyHomeWork(HomeWorkResultArr)
                                    function destroyHomeWork(HomeWorkResultArr){
                                        var HomeWorkResultData = HomeWorkResultArr.shift()
                                        if (HomeWorkResultData) {
                                            routeSql.HomeWorkImage.destroy({where:{WorkType:1,WorkId:HomeWorkResultData.dataValues.Id}}).then(function(){
                                                routeSql.HomeWorkResult.destroy({where:{Id:HomeWorkResultData.dataValues.Id}}).then(function(){
                                                    destroyHomeWork(HomeWorkResultArr)
                                                })
                                            })
                                        } else {
                                            routeSql.HomeWork.destroy({where:{Id:DetailData.dataValues.ModelId}}).then(function(){
                                                routeSql.HomeWorkImage.destroy({where:{WorkType:2,WorkId:HomeWorkData.dataValues.AnswerId}}).then(function(){
                                                    routeSql.HomeWorkAnswer.destroy({where:{Id:HomeWorkData.dataValues.AnswerId}}).then(function(){
                                                        routeSql.HomeWorkImage.destroy({where:{WorkType:0,WorkId:HomeWorkData.dataValues.Id}}).then(function(){
                                                                routeSql.TeachingDetail.destroy({where:{ModelId:DetailData.dataValues.ModelId,Type:DetailData.dataValues.Type,Id:DetailData.dataValues.Id}}).then(function(){
                                                                    destroyDetailArr(DetailArr)
                                                                })
                                                        })
                                                    })
                                                })
                                            })
                                        }
                                    }
                                })
                            })
                        } else {
                            routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:DetailData.dataValues.ModelId}}).then(function(QuestionSurveiesArr){
                                destroyQuestionSurveies(QuestionSurveiesArr)
                                function destroyQuestionSurveies(QuestionSurveiesArr){
                                    var QuestionSurveiesData = QuestionSurveiesArr.shift()
                                    // console.log(QuestionSurveiesData)
                                    if (QuestionSurveiesData) {
                                        routeSql.QuestionnaireResults.destroy({where:{QuestionSurveiesId:QuestionSurveiesData.dataValues.Id}}).then(function(){
                                            routeSql.QuestionSurveies.destroy({where:{Id:QuestionSurveiesData.dataValues.Id}})
                                            destroyQuestionSurveies(QuestionSurveiesArr)
                                        })
                                    } else {
                                        routeSql.Questionnaires.destroy({where:{Id:DetailData.dataValues.ModelId}}).then(function(){
                                            routeSql.TeachingDetail.destroy({where:{ModelId:DetailData.dataValues.ModelId,Type:DetailData.dataValues.Type,Id:DetailData.dataValues.Id}}).then(function(){
                                                destroyDetailArr(DetailArr)
                                            })
                                        })
                                    }
                                }
                            })
                        }
                    } else {
                        routeSql.TeachingTask.update({IsDeleted:true,DeleterUserId:decoded.Id,DeletionTime:new Date()},{where:{Id:req.body.TeachingTaskId}}).then(function(){
                            routeSql.TeachingLink.findOne({where:{Id:data.dataValues.TeachingLinkId}}).then(function(TeachingLinkData){
                                routeSql.TeachingLink.update({TaskCount:TeachingLinkData.dataValues.TaskCount - 1},{where:{Id:data.dataValues.TeachingLinkId}}).then(function(){
                                    // console.log('=====')
                                    res.send({error:0,result:{msg:'删除成功'}})
                                })
                            })
                        })
                    }
                }
            })
        } else {
            res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
        }
    })
})

router.post('/ChangeTaskPosition',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var ExchangeShowSort;
    var CurrentShowSort;
    // console.log(req.body)
    if (req.body.TeachingLinkId != '' && req.body.TeachingLinkId != null && req.body.CurrentTaskId != '' && req.body.CurrentTaskId != null && req.body.ExchangeTaskId != '' && req.body.ExchangeTaskId != null && req.body.TeachingLinkId != '0') {
        routeSql.TeachingTask.max(['ShowSort'],{where:{TeachingLinkId:req.body.TeachingLinkId}}).then(function(ShowSort){
            if (ShowSort) {
                ExchangeShowSort = ShowSort+1;
            } else {
                ExchangeShowSort = 1;
            }
        })
        routeSql.TeachingTask.findOne({where:{Id:req.body.ExchangeTaskId}}).then(function(ExchangeData){
            if (ExchangeData) {
                ExchangeShowSort = ExchangeData.dataValues.ShowSort;
            }
            // console.log('11111')
            routeSql.TeachingTask.findOne({where:{Id:req.body.CurrentTaskId}}).then(function(CurrentData){
                if (decoded.Id == CurrentData.dataValues.CreatorUserId) {
                    CurrentShowSort = CurrentData.dataValues.ShowSort;
                    if (CurrentData.dataValues.TeachingLinkId == req.body.TeachingLinkId) {
                        if (ExchangeShowSort > CurrentShowSort) {
                            routeSql.TeachingTask.update({ShowSort:ExchangeShowSort + 1},{where:{Id:CurrentData.dataValues.Id}}).then(function(){
                                routeSql.TeachingTask.findAll({where:{ShowSort:{$gt:ExchangeShowSort},Id:{$ne:CurrentData.dataValues.Id},TeachingLinkId:req.body.TeachingLinkId,IsDeleted:false}}).then(function(arr){
                                    ChangeTaskPosition(arr)
                                })
                            })
                        } else {
                            routeSql.TeachingTask.update({ShowSort:ExchangeShowSort},{where:{Id:CurrentData.dataValues.Id}}).then(function(){
                                routeSql.TeachingTask.findAll({where:{ShowSort:{$gte:ExchangeShowSort},Id:{$ne:CurrentData.dataValues.Id},TeachingLinkId:req.body.TeachingLinkId,IsDeleted:false}}).then(function(arr){
                                    ChangeTaskPosition(arr)
                                })
                            })
                        }
                    } else {
                        routeSql.TeachingLink.findOne({where:{Id:CurrentData.dataValues.TeachingLinkId}}).then(function(CurrentLinkData){
                            routeSql.TeachingLink.update({TaskCount:CurrentLinkData.dataValues.TaskCount - 1},{where:{Id:CurrentLinkData.dataValues.Id}})
                        })
                        routeSql.TeachingLink.findOne({where:{Id:req.body.TeachingLinkId}}).then(function(ExchangeLinkData){
                            routeSql.TeachingLink.update({TaskCount:ExchangeLinkData.dataValues.TaskCount + 1},{where:{Id:ExchangeLinkData.dataValues.Id}})
                        })
                        routeSql.TeachingTask.update({ShowSort:ExchangeShowSort,TeachingLinkId:req.body.TeachingLinkId},{where:{Id:CurrentData.dataValues.Id}}).then(function(){
                            routeSql.TeachingTask.findAll({where:{ShowSort:{$gte:ExchangeShowSort},Id:{$ne:CurrentData.dataValues.Id},TeachingLinkId:req.body.TeachingLinkId,IsDeleted:false}}).then(function(arr){
                                ChangeTaskPosition(arr)
                            })
                        })
                    }
                } else {
                    res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
                }
            })
        })
        function ChangeTaskPosition(arr){
            var data = arr.shift()
            if (data) {
                routeSql.TeachingTask.update({ShowSort:data.dataValues.ShowSort + 1},{where:{Id:data.dataValues.Id}}).then(function(){ChangeTaskPosition(arr)})
            } else {
                res.send({error:0,result:{msg:'位置调换成功'}})
            }
        }
    } else {
        res.send({error:1,result:{msg:'移动任务位置失败'}})
    }
})
// 
router.post('/ChangeTaskPositionForWeb',function(req,res){
    // console.log(123)
    // console.log(req.body)
    if (req.body.TeachingLinkId != '' && req.body.TeachingLinkId != null && req.body.CurrentTaskId != '' && req.body.CurrentTaskId != null && req.body.ExchangeIndex != '' && req.body.ExchangeIndex != null && req.body.TeachingLinkId != '0') {
        var token = req.headers.token;
        var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
        var ExchangeShowSort;
        var CurrentShowSort;
        routeSql.TeachingTask.max(['ShowSort'],{where:{TeachingLinkId:req.body.TeachingLinkId}}).then(function(ShowSort){
            if (ShowSort) {
                ExchangeShowSort = ShowSort+1;
            } else {
                ExchangeShowSort = 1;
            }
        }) //获取最大ShowSort

        routeSql.TeachingTask.findAll({where:{TeachingLinkId:req.body.TeachingLinkId},order:[['ShowSort','ASC']]}).then(function(allTask){
            //console.log(allTask[1].dataValues.ShowSort)
            if(allTask[req.body.ExchangeIndex]){
                ExchangeShowSort = allTask[req.body.ExchangeIndex].dataValues.ShowSort
            }
            // console.log(ExchangeShowSort)
            routeSql.TeachingTask.findOne({where:{Id:req.body.CurrentTaskId}}).then(function(CurrentData){
                //if (decoded.Id == CurrentData.dataValues.CreatorUserId) {
                    CurrentShowSort = CurrentData.dataValues.ShowSort;
                    if (CurrentData.dataValues.TeachingLinkId == req.body.TeachingLinkId) {
                        if (ExchangeShowSort > CurrentShowSort) {
                            routeSql.TeachingTask.update({ShowSort:ExchangeShowSort + 1},{where:{Id:CurrentData.dataValues.Id}}).then(function(){
                                routeSql.TeachingTask.findAll({where:{ShowSort:{$gt:ExchangeShowSort},Id:{$ne:CurrentData.dataValues.Id},TeachingLinkId:req.body.TeachingLinkId,IsDeleted:false}}).then(function(arr){
                                    ChangeTaskPosition(arr)
                                })
                            })
                        } else {
                            routeSql.TeachingTask.update({ShowSort:ExchangeShowSort},{where:{Id:CurrentData.dataValues.Id}}).then(function(){
                                routeSql.TeachingTask.findAll({where:{ShowSort:{$gte:ExchangeShowSort},Id:{$ne:CurrentData.dataValues.Id},TeachingLinkId:req.body.TeachingLinkId,IsDeleted:false}}).then(function(arr){
                                    ChangeTaskPosition(arr)
                                })
                            })
                        }
                    } else {
                        routeSql.TeachingLink.findOne({where:{Id:CurrentData.dataValues.TeachingLinkId}}).then(function(CurrentLinkData){
                            routeSql.TeachingLink.update({TaskCount:CurrentLinkData.dataValues.TaskCount - 1},{where:{Id:CurrentLinkData.dataValues.Id}})
                        })
                        routeSql.TeachingLink.findOne({where:{Id:req.body.TeachingLinkId}}).then(function(ExchangeLinkData){
                            routeSql.TeachingLink.update({TaskCount:ExchangeLinkData.dataValues.TaskCount + 1},{where:{Id:ExchangeLinkData.dataValues.Id}})
                        })
                        routeSql.TeachingTask.update({ShowSort:ExchangeShowSort,TeachingLinkId:req.body.TeachingLinkId},{where:{Id:CurrentData.dataValues.Id}}).then(function(){
                            routeSql.TeachingTask.findAll({where:{ShowSort:{$gte:ExchangeShowSort},Id:{$ne:CurrentData.dataValues.Id},TeachingLinkId:req.body.TeachingLinkId,IsDeleted:false}}).then(function(arr){
                                ChangeTaskPosition(arr)
                            })
                        })
                    }
                //} else {
                //    res.send({error:1,result:{msg:'你没有权限进行处理修改'}})
                //}
            })
        })
        function ChangeTaskPosition(arr){
            var data = arr.shift()
            if (data) {
                routeSql.TeachingTask.update({ShowSort:data.dataValues.ShowSort + 1},{where:{Id:data.dataValues.Id}}).then(function(){ChangeTaskPosition(arr)})
            } else {
                res.send({error:0,result:{msg:'位置调换成功'}})
            }
        }
    } else {
        res.send({error:1,result:{msg:'移动任务位置失败'}})
    }
})

router.post('/destroyDetail',function(req,res){
    // console.log(req.body)
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body)
    // routeSql.TeachingActivity.findOne({where:{}})
    routeSql.TeachingDetail.findOne({where:{ModelId:req.body.ModelId,Type:req.body.Type,Id:req.body.TeachingDetailId}}).then(function(DetailData){
        // console.log(DetailData)
        routeSql.TeachingActivity.findOne({where:{Id:DetailData.dataValues.TeachingActivityId}}).then(function(ActivityData){
            // console.log(ActivityData)
            if (ActivityData.dataValues.CreatorUserId == decoded.Id) {
                // console.log('11111111111111111111111111111111111111111111')
                if (req.body.Type == 0) {
                    // console.log('00000000000000000000000000000000000000')
                    routeSql.TeachingDetail.destroy({where:{ModelId:req.body.ModelId,Type:req.body.Type,Id:req.body.TeachingDetailId}}).then(function(){
                        res.send({error:0,result:{msg:'文件从子任务中移除成功'}})
                    })
                } else if (req.body.Type == 1) {
                    routeSql.ExamResult.findAll({where:{ExamId:req.body.ModelId}}).then(function(ExamResultArr){
                        destroyExamResult(ExamResultArr)
                        function destroyExamResult(ExamResultArr){
                            var ExamResultData = ExamResultArr.shift()
                            if (ExamResultData) {
                                routeSql.ExamResultRecord.destroy({where:{ExamResultId:ExamResultData.dataValues.Id}}).then(function(){
                                    routeSql.ExamResult.update({IsDeleted:true},{where:{Id:ExamResultData.dataValues.Id}}).then(function(){
                                        destroyExamResult(ExamResultArr)
                                    })
                                })
                                // console.log('---------------------')
                            } else {
                                // console.log('+++++++++++++++++++++++++++++')
                                routeSql.TeachingDetail.destroy({where:{ModelId:req.body.ModelId,Type:req.body.Type,Id:req.body.TeachingDetailId}}).then(function(){
                                    routeSql.MyExam.update({IsDeleted:true},{where:{Id:req.body.ModelId}}).then(function(){
                                        // console.log('=================================')
                                        res.send({error:0,result:{msg:'考试删除成功'}})
                                    })
                                })
                            }
                        }
                    })
                } else if (req.body.Type == 2) {
                    routeSql.HomeWork.findOne({where:{Id:req.body.ModelId}}).then(function(HomeWorkData){
                        routeSql.HomeWorkResult.findAll({where:{HomeWorkId:req.body.ModelId}}).then(function(HomeWorkResultArr){
                            destroyHomeWork(HomeWorkResultArr)
                            function destroyHomeWork(HomeWorkResultArr){
                                var HomeWorkResultData = HomeWorkResultArr.shift()
                                if (HomeWorkResultData) {
                                    routeSql.HomeWorkImage.destroy({where:{WorkType:1,WorkId:HomeWorkResultData.dataValues.Id}}).then(function(){
                                        routeSql.HomeWorkResult.destroy({where:{Id:HomeWorkResultData.dataValues.Id}}).then(function(){
                                            destroyHomeWork(HomeWorkResultArr)
                                        })
                                    })
                                } else {
                                    routeSql.HomeWork.destroy({where:{Id:req.body.ModelId}}).then(function(){
                                        routeSql.HomeWorkImage.destroy({where:{WorkType:2,WorkId:HomeWorkData.dataValues.AnswerId}}).then(function(){
                                            routeSql.HomeWorkAnswer.destroy({where:{Id:HomeWorkData.dataValues.AnswerId}}).then(function(){
                                                routeSql.HomeWorkImage.destroy({where:{WorkType:0,WorkId:HomeWorkData.dataValues.Id}}).then(function(){
                                                    routeSql.TeachingDetail.destroy({where:{ModelId:req.body.ModelId,Type:req.body.Type,Id:req.body.TeachingDetailId}}).then(function(){
                                                        res.send({error:0,result:{msg:'作业删除成功'}})
                                                    })
                                                })
                                            })
                                        })
                                    })
                                }
                            }
                        })
                    })
                } else if (req.body.Type == 3) {
                    routeSql.QuestionSurveies.findAll({where:{QuestionnaireId:req.body.ModelId}}).then(function(QuestionSurveiesArr){
                        destroyQuestionSurveies(QuestionSurveiesArr)
                        function destroyQuestionSurveies(QuestionSurveiesArr){
                            var QuestionSurveiesData = QuestionSurveiesArr.shift()
                            // console.log(QuestionSurveiesData)
                            if (QuestionSurveiesData) {
                                routeSql.QuestionnaireResults.destroy({where:{QuestionSurveiesId:QuestionSurveiesData.dataValues.Id}}).then(function(){
                                    routeSql.QuestionSurveies.destroy({where:{Id:QuestionSurveiesData.dataValues.Id}})
                                    destroyQuestionSurveies(QuestionSurveiesArr)
                                })
                            } else {
                                routeSql.Questionnaires.destroy({where:{Id:req.body.ModelId}}).then(function(){
                                    routeSql.TeachingDetail.destroy({where:{ModelId:req.body.ModelId,Type:req.body.Type,Id:req.body.TeachingDetailId}}).then(function(){
                                        res.send({error:0,result:{msg:'问卷删除成功'}})
                                    })
                                })
                            }
                        }
                    })
                } else {
                    res.send({error:2,result:{msg:'没有其他格式的子任务了'}})
                }
            } else {
                res.send({error:1,result:{msg:'你没有权限操作该子任务'}})
            }
        })
    })
})

module.exports = router;



function searchDetail(TeachingTaskId,req,res,TaskData,decoded) {
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    routeSql.TeachingDetail.findAll({where:{TeachingTaskId:TeachingTaskId}}).then(function(TeachingDetailArr){
        var ModelArray = []
        getAllModel(TeachingDetailArr)
        function getAllModel(TeachingDetailArr){
            var TeachingDetailData = TeachingDetailArr.shift()
            if (TeachingDetailData) {
                var TeachingDetailDataValues = TeachingDetailData.dataValues
                if (TeachingDetailDataValues.Type == 0) {
                    routeSql.CloudDiskFiles.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(ModelData){
                        ModelArray.push({TeachingDetailData:{Id:TeachingDetailData.dataValues.Id,Type:TeachingDetailData.dataValues.Type,ModelId:TeachingDetailData.dataValues.ModelId},ModelData:{FileName:ModelData.dataValues.FileName,ResourceId:ModelData.dataValues.ResourceId,FileCategory:ModelData.dataValues.DiskFilesResourceId.FileCategory,FileUrl:ModelData.dataValues.DiskFilesResourceId.FileUrl,FileSize:ModelData.dataValues.DiskFilesResourceId.FileSize}})
                        getAllModel(TeachingDetailArr)
                    })
                } else if (TeachingDetailDataValues.Type == 1) {
                    routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ExamData){
                        routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
                            routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:TeachingDetailDataValues.ModelId}}).then(function(ExamResultData){
                                routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamBaseData.dataValues.Id}}).then(function(QuestionCount){
                                    var State;
                                    var TeacherPaperState;
                                        if (new Date(ExamData.dataValues.EndDate) > new Date()) {
                                    if (ExamResultData) {
                                            if (ExamResultData.dataValues.State == 1 || Date(ExamResultData.dataValues.EndDate) < new Date()) {
                                                State = 2//已经提交过了或者考试时长已经过了考试未结束
                                            } else {
                                                State = 0//可以开始考试
                                            }
                                    } else {
                                        State = 3//考试还未开始或不能参加该考试
                                    }
                                        } else {
                                            State = 1//考试已经结束
                                        }
                                        if (new Date(ExamData.dataValues.StartDate) > new Date()) {
                                            TeacherPaperState = 2;
                                        } else if (new Date(ExamData.dataValues.StartDate) < new Date() && new Date(ExamData.dataValues.EndDate) > new Date()) {
                                            TeacherPaperState = 0;
                                        } else {
                                            TeacherPaperState = 1;
                                        }
                                    ModelArray.push({TeachingDetailData:TeachingDetailData,ModelData:{State:State,CountScore:ExamBaseData.dataValues.CountScore,PassScore:ExamBaseData.dataValues.PassScore,StartDate:ExamData.dataValues.StartDate,EndDate:ExamData.dataValues.EndDate,TimeLong:ExamData.dataValues.TimeLong,MyExamBaseId:ExamData.dataValues.MyExamBaseId,QuestionCount:QuestionCount,TeacherPaperState:TeacherPaperState}})
                                    getAllModel(TeachingDetailArr)
                                })
                            })
                        })
                    })
                    // routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.MyExamBase,as:'TestPaper',attributes:['PassScore','CountScore']}]}).then(function(ModelData){
                    //     ModelArray.push({TeachingDetailData,ModelData})
                    //     getAllModel(TeachingDetailArr)
                    // })
                } else if (TeachingDetailDataValues.Type == 2) {
                    routeSql.HomeWork.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ModelData){
                        if (new Date() > new Date(ModelData.dataValues.EndDate)) {
                            ModelData.dataValues.IsEnd = true
                        } else {
                            ModelData.dataValues.IsEnd = false
                        }
                        ModelArray.push({TeachingDetailData,ModelData})
                        getAllModel(TeachingDetailArr)
                    })
                } else if (TeachingDetailDataValues.Type == 3) {
                    routeSql.Questionnaires.findOne({where:{Id:TeachingDetailDataValues.ModelId},attributes:['Title','Code',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),InSertIp),'CodePath'],'Count']}).then(function(ModelData){
                        if (decoded.UserType != 0) {
                            ModelArray.push({TeachingDetailData,ModelData})
                        } else {
                            ModelArray.push({TeachingDetailData,ModelData:{}})
                        }
                        // ModelArray.push({TeachingDetailData,ModelData})
                        getAllModel(TeachingDetailArr)
                    })
                }
            } else {
                res.send({error:0,result:{ModelArray,TaskData}})
            }
        }
    })
}


