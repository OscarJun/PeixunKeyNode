 

var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var fs = require('fs')
var jwt = require('jwt-simple');//引入node的token生成验证包
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var qrImage = require('qr-image')
var fs = require('fs')
// var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig


// 我的项目
router.get('/MyProject',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(decoded)
    var result = {}
    routeSql.TeachingActivity.findAll({where:{IsDeleted:false,IsPublic:true},limit:8,offset:0,order:[['CreationTime','DESC']],attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),CodePathIp),'CodePath'],[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img'],'CreationTime','InviteCode','BrowNum'],include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(PublicArr){
        // result.PublicArr = PublicArr;
        result.PublicArr = []
        AddPublic(PublicArr)
        function AddPublic(PublicArr) {
            var PublicData = PublicArr.shift()
            if (PublicData) {
                var Public = PublicData.dataValues
                routeSql.TeachingActivityUser.count({where:{TeachingActivityId:Public.Id}}).then(function(count){
                    Public.Count = count;
                    result.PublicArr.push(Public)
                    AddPublic(PublicArr)
                })
            } else {
                if (decoded.UserType != 0) {
                    routeSql.TeachingActivity.findAll({where:{IsDeleted:false,CreatorUserId:decoded.Id},order:[['CreationTime','DESC']],attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),CodePathIp),'CodePath'],[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img'],'CreationTime','InviteCode','BrowNum'],include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(ActivityArr){
                        var arr = [];
                        AddUserNum(ActivityArr);
                        function AddUserNum(ActivityArr){
                            var ActivityData = ActivityArr.shift();
                            if (ActivityData) {
                                var Activity = ActivityData.dataValues
                                routeSql.TeachingActivityUser.count({where:{TeachingActivityId:Activity.Id}}).then(function(count){
                                    Activity.Count = count;
                                    arr.push(Activity)
                                    AddUserNum(ActivityArr)
                                })
                            } else {
                                result.OwnArr = arr
                                res.send({error:0,result:result})
                            }
                        }
                    })
                }
                // else if (decoded.UserType == 2){
                //     routeSql.TeachingActivity.findAll({where:{IsDeleted:false},order:[['CreationTime','DESC']],attributes:['Id','Title','Desc','IsPublic','CodePath','Img','CreationTime','InviteCode','BrowNum'],include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(ActivityArr){
                //         var arr = [];
                //         AddUserNum(ActivityArr);
                //         function AddUserNum(ActivityArr){
                //             var ActivityData = ActivityArr.shift();
                //             if (ActivityData) {
                //                 Activity = ActivityData.dataValues
                //                 routeSql.TeachingActivityUser.count({where:{TeachingActivityId:Activity.Id}}).then(function(count){
                //                     Activity.Count = count;
                //                     arr.push(Activity)
                //                     AddUserNum(ActivityArr)
                //                 })
                //             } else {
                //                 result.OwnArr = arr
                //                 res.send({error:0,result:result})
                //             }
                //         }
                //     })
                // }
                else {
                    routeSql.TeachingActivityUser.findAll({where:{UserId:decoded.Id},order:[[{model:routeSql.TeachingActivity,as:'UserTeachingActivityId'},'CreationTime','DESC']],include:[{model:routeSql.TeachingActivity,through:{where:{IsDeleted:false}},as:'UserTeachingActivityId',attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),CodePathIp),'CodePath'],[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img'],'CreationTime','InviteCode','BrowNum']}]}).then(function(ActivityArr){
                        var arr = [];
                        AddUserNum(ActivityArr);
                        function AddUserNum(ActivityArr){
                            var ActivityData = ActivityArr.shift();
                            if (ActivityData) {
                                var Activity = ActivityData.dataValues
                                routeSql.TeachingActivityUser.count({where:{TeachingActivityId:Activity.Id}}).then(function(count){
                                    Activity.Count = count;
                                    arr.push(Activity)
                                    AddUserNum(ActivityArr)
                                })
                            } else {
                                result.OwnArr = arr
                                res.send({error:0,result:result})
                            }
                        }
                    })
                }
            }
        }
    })
})

router.get('/ChangeIsFoldUp',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.AbpUsers.findOne({where:{Id:decoded.Id}}).then(function(data){
        // console.log(data.dataValues)
        routeSql.AbpUsers.update({IsFoldUp:!data.dataValues.IsFoldUp},{where:{Id:decoded.Id}}).then(function(){
            res.send({error:0,result:{msg:'更改合并状态成功'}})
        })
    })
})

router.get('/AppMyProject',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    // console.log(parseInt(req.headers.insert))
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var arr = [];
    var ActivityDataArr = []
    // console.log('222222222222222222222222')
    // console.log(req.body)
    if (decoded.UserType != 0) {
        routeSql.TeachingActivity.findAll({where:{IsDeleted:false,CreatorUserId:decoded.Id},attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),CodePathIp),'CodePath'],[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img'],'CreationTime','InviteCode','BrowNum'],order:[['CreationTime','DESC']],include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(ActivityArr){
            ActivityDataArr = ActivityArr
            AddUserNum(ActivityDataArr);
            function AddUserNum(ActivityArr){
                var ActivityData = ActivityArr.shift();
                if (ActivityData) {
                    var Activity = ActivityData.dataValues
                    routeSql.TeachingActivityUser.count({where:{TeachingActivityId:Activity.Id}}).then(function(count){
                        Activity.Count = count;
                        arr.push(Activity)
                        AddUserNum(ActivityArr)
                    })
                } else {
                    res.send({error:0,result:arr})
                }
            }
        })
    }
    // else if (decoded.UserType == 2){
    //     routeSql.TeachingActivity.findAll({where:{IsDeleted:false},attributes:['Id','Title','Desc','IsPublic','CodePath','Img','CreationTime','InviteCode','BrowNum'],order:[['CreationTime','DESC']],include:[{model:routeSql.TeachingActivityUser,as:'UserTeachingActivityId'}],include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(ActivityArr){
    //         var arr = [];
    //         AddUserNum(ActivityArr);
    //         function AddUserNum(ActivityArr){
    //             var ActivityData = ActivityArr.shift();
    //             if (ActivityData) {
    //                 Activity = ActivityData.dataValues
    //                 routeSql.TeachingActivityUser.count({where:{TeachingActivityId:Activity.Id}}).then(function(count){
    //                     Activity.Count = count;
    //                     arr.push(Activity)
    //                     AddUserNum(ActivityArr)
    //                 })
    //             } else {
    //                 res.send({error:0,result:arr})
    //             }
    //         }
    //     })
    // }
    else {
        // console.log('444444444444444444444444')
        routeSql.TeachingActivityUser.findAll({where:{UserId:decoded.Id}}).then(function(ActivityArr){
            // console.log('1111111111111111')
            var result = []
            AllActivity(ActivityArr)
            function AllActivity(ActivityArr){
                // console.log('222222222222222222222222222222')
                var ActivityId = ActivityArr.shift()
                if (ActivityId) {
                    routeSql.TeachingActivity.findOne({where:{Id:ActivityId.dataValues.TeachingActivityId,IsDeleted:false},attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),CodePathIp),'CodePath'],[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img'],'CreationTime','InviteCode','BrowNum'],order:[['CreationTime','DESC']],include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(data){
                        // console.log('333333333333333333333333')
                        if (data) {
                            var dataValues = data.dataValues;
                            routeSql.TeachingActivityUser.count({where:{TeachingActivityId:dataValues.Id}}).then(function(count){
                                dataValues.Count = count;
                                result.push(dataValues)
                                AllActivity(ActivityArr)
                            })
                        } else {
                            AllActivity(ActivityArr)
                        }
                    })
                } else {
                    result.sort(function(a,b){return b.Id - a.Id;})
                    res.send({error:0,result:result})
                }
            }
        })
    }
})


router.post('/CreateProject',function(req,res){
    console.log('000000000000000000000000000000')
    console.log(req.body)
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (decoded.UserType >= 1) {
        if (req.body.Title == '' || req.body.Desc == null || req.body.Title == null) {
            res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
        } else {
            if (req.body.Title.length <= 255 && req.body.Desc.length <= 255) {
                fun1();
            } else {
                res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
            }
        }
        function fun1(){
            var str = Math.random().toString(36).substr(2,6);
            // console.log(str)
            routeSql.TeachingActivity.findAll({where:{IsDeleted:false,InviteCode:str}}).then(function(arr){
                if(arr.length == 0){
                    routeSql.TeachingActivity.create({
                        Title:req.body.Title,
                        Desc:req.body.Desc,
                        InviteCode:str,
                        CreatorUserId:decoded.Id,
                        BrowNum:0,
                        Img:(req.body.Img == ''|| req.body.Img == null) ?  '/upload/cloudDisk/default.png':req.body.Img.substring(req.body.Img.indexOf(Ipconfig.SaveServer.SaveServerIpPort) + Ipconfig.SaveServer.SaveServerIpPort.toString().length)
                    }).then(function(data){
                        var sData = {Info:{Id:data.dataValues.Id,InviteCode:str},Command:2,uid:null}
                        var s = new Buffer(JSON.stringify(sData)).toString('base64');
                        if (!fs.existsSync('./www/Activity')) {fs.mkdirSync('./www/Activity')}
                        var tempQrcode = qrImage.image(Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/SharePages/Activity.html?jsonstr=' + s,{type:'png'});
                        var imgName = `${data.dataValues.InviteCode}.png`
                        tempQrcode.pipe(fs.createWriteStream('./www/Activity/' + imgName))
                        routeSql.TeachingActivity.update({CodePath:'/Activity/' + data.dataValues.InviteCode + '.png'},{where:{Id:data.dataValues.Id,IsDeleted:false}}).then(function(){
                            routeSql.TeachingLink.create({Title:'课前',TeachingActivityId:data.dataValues.Id,ShowSort:1,CreatorUserId:decoded.Id,TaskCount:0})
                            routeSql.TeachingLink.create({Title:'课中',TeachingActivityId:data.dataValues.Id,ShowSort:2,CreatorUserId:decoded.Id,TaskCount:0})
                            routeSql.TeachingLink.create({Title:'课后',TeachingActivityId:data.dataValues.Id,ShowSort:3,CreatorUserId:decoded.Id,TaskCount:0})
                            res.send({error:0,result:{msg:'创建成功',ActivityId:data.dataValues.Id}})
                        })
                    })
                }else{
                    fun1();
                }
            })
        }
    } else {
        res.send({error:1,result:{msg:'你没有创建教学活动的权限'}})
    }
})

router.get('/EditActivity',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingActivity.findOne({where:{Id:req.query.ActivityId,IsDeleted:false},attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),CodePathIp),'CodePath'],[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img'],'CreatorUserId']}).then(function(data){
        if (data) {
            if (decoded.Id == data.dataValues.CreatorUserId) {
                res.send({error:0,result:data})
            } else {
                res.send({error:1,result:{msg:'你没有权限操作该活动'}})
            }
        } else {
            res.send({error:2,result:{msg:'请传活动Id'}})
        }
    })
})


router.post('/EditActivity',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingActivity.findOne({where:{Id:req.body.ActivityId,IsDeleted:false}}).then(function(data){
        if (decoded.Id == data.dataValues.CreatorUserId) {
            var UpdateData = req.body;
            UpdateData.LastModifierUserId = decoded.Id;
            UpdateData.LastModificationTime = new Date();
            if (req.body.Img) {
                UpdateData.Img = req.body.Img.substring(req.body.Img.indexOf(Ipconfig.SaveServer.SaveServerIpPort) + Ipconfig.SaveServer.SaveServerIpPort.toString().length)
            }
            // console.log(UpdateData)
            if (UpdateData.Title && UpdateData.Desc) {
                if (UpdateData.Title.length <= 255) {
                    if (UpdateData.Desc) {
                        if (UpdateData.Desc.length <= 255) {
                            routeSql.TeachingActivity.update(UpdateData,{where:{Id:req.body.ActivityId,IsDeleted:false}}).then(function(){
                                res.send({error:0,result:{msg:'编辑成功'}})
                            })
                        } else {
                            res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
                        }
                    } else {
                        routeSql.TeachingActivity.update(UpdateData,{where:{Id:req.body.ActivityId,IsDeleted:false}}).then(function(){
                            res.send({error:0,result:{msg:'编辑成功'}})
                        })
                    }
                } else {
                    res.send({error:2,result:{msg:'请输入正确的名称和描述'}})
                }
            } else {
                routeSql.TeachingActivity.update(UpdateData,{where:{Id:req.body.ActivityId,IsDeleted:false}}).then(function(){
                    res.send({error:0,result:{msg:'编辑成功'}})
                })
            }
        } else {
            res.send({error:1,result:{msg:'你没有权限操作该活动'}})
        }
    })
    
})

router.post('/DestroyActivity',function(req,res){
    // console.log(req.body)
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingActivity.findOne({where:{Id:req.body.ActivityId,IsDeleted:false}}).then(function(data){
        if (decoded.Id == data.dataValues.CreatorUserId) {
            routeSql.TeachingLink.findAll({where:{TeachingActivityId:req.body.ActivityId,IsDeleted:false}}).then(function(LinkArr){
                destroyLinkArr(LinkArr)
                function destroyLinkArr(LinkArr){
                    var LinkData = LinkArr.shift()
                    if (LinkData) {
                        routeSql.TeachingTask.findAll({where:{TeachingLinkId:LinkData.dataValues.Id}}).then(function(TaskArr){
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
                                                    routeSql.ExamResult.findAll({where:{ExamId:DetailData.dataValues.ModelId}}).then(function(ExamResultArr){
                                                        destroyExamResult(ExamResultArr)
                                                        function destroyExamResult(ExamResultArr){
                                                            var ExamResultData = ExamResultArr.shift()
                                                            if (ExamResultData) {
                                                                routeSql.ExamResultRecord.destroy({where:{ExamResultId:ExamResultData.dataValues.Id}}).then(function(){
                                                                    routeSql.ExamResult.destroy({where:{Id:ExamResultData.dataValues.Id}}).then(function(){
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
                                                    routeSql.TeachingLink.update({TaskCount:LinkData.dataValues.TaskCount - 1},{where:{Id:LinkData.dataValues.Id}}).then(function(){
                                                        // console.log('=====')
                                                        destroyTaskArr(TaskArr)
                                                    })
                                                })
                                            }
                                        }
                                    })
                                } else {
                                    routeSql.TeachingLink.update({IsDeleted:true,DeleterUserId:decoded.Id,DeletionTime:new Date(),TaskCount:0},{where:{Id:LinkData.dataValues.Id}}).then(function(MaxIndex){
                                        destroyLinkArr(LinkArr)
                                    })
                                }
                            }
                        })
                    } else {
                        routeSql.TeachingActivity.update({IsDeleted:true,DeleterUserId:decoded.Id,DeletionTime:new Date()},{where:{Id:req.body.ActivityId,IsDeleted:false}}).then(function(){
                            res.send({error:0,result:{msg:'删除成功'}})
                        })
                    }
                }
            })
        } else {
            res.send({error:1,result:{msg:'你没有权限操作该活动'}})
        }
    })
})

router.get('/ModelActivity',function(req,res) {
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))
    ModelActivity()
    function ModelActivity(){
        routeSql.AbpUsers.findOne({where:{UserType:2}}).then(function(SuperAdmin){
            routeSql.TeachingActivity.findAll({where:{CreatorUserId:SuperAdmin.dataValues.Id,IsDeleted:false},attributes:['Id','Title',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img'],'BrowNum']}).then(function(ModelActivityArr){
                console.log(ModelActivityArr)
                res.send({error:0,result:ModelActivityArr})
            })
        })
    }
})

router.get('/AllPublicActivity',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    routeSql.AbpUsers.findOne({where:{UserType:2}}).then(function(SuperAdmin){
        routeSql.TeachingActivity.findAll({where:{IsDeleted:false,IsPublic:true,CreatorUserId:{$ne:SuperAdmin.dataValues.Id}},order:[['CreationTime','DESC']],attributes:['Id','Title','Desc','IsPublic',[sequelize.fn('Nullif',sequelize.fn("CONCAT",CodePathIp,sequelize.col('CodePath')),CodePathIp),'CodePath'],[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('Img')),InSertIp),'Img'],'CreationTime','InviteCode','BrowNum'],include:[{model:routeSql.AbpUsers,as:'ActivityCreatorUser',attributes:['Id','Name']}]}).then(function(PublicArr){
            res.send({error:0,result:PublicArr})
        })
    })
})


module.exports = router;


