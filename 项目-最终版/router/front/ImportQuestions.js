
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var xl = require('node-xlrd');
var crypto = require('crypto');
var multer = require('multer');
var fs = require('fs')
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express()
var qrImage = require('qr-image')
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段

var md5 = function(str){
    var crypto_md5 = crypto.createHash('md5');
    crypto_md5.update(str,'utf8');
    return crypto_md5.digest('hex')
}

router.post('/upLoadQuesExl',function(req,res) {
    var token = req.headers.token
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))
    var path = decoded.Id
	var storage = multer.diskStorage({
	    destination:function (req, file, cb) {
	        // console.log(req);
	        cb(null, './www/ExamQues/' + path);
	    },
	    filename:function(req,file,cb){
	        // cb(null,file.filename + '-' + Date.now());
	        cb(null,file.originalname);
	    }
	});
	var uploads = multer({storage:storage});
	if (!fs.existsSync('./www/ExamQues')) {fs.mkdirSync('./www/ExamQues')}
    if (!fs.existsSync('./www/ExamQues/' + path)) {fs.mkdirSync('./www/ExamQues/' + path)}
	uploads.single('file')(req,res,function(err){
  //       console.log(req.headers.token)
		// console.log(req.file)
		var data = {}
		data.error = 0;
		data.result = {
			name:req.file.originalname,
            url:Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/ExamQues/' + path + '/' + req.file.originalname
		}
		// console.log(req.file.extension)
		// console.log(data)
        res.send(data)
	})
})

router.post('/QuesExcel',function(req,res){
    // console.log(req.body)
	var fileName = req.body.fileName
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var arrData = []
	var arrExist = []
    var WrongArr = []
    var TeacherData = []
    var path = decoded.Id
    var Pattern = req.body.Pattern
    // console.log(req.body.fileName)
    // console.log(decoded)
    if (fileName.substring(fileName.lastIndexOf('.')).toLowerCase() == '.xls') {
        xl.open('www/ExamQues/' + path + '/' + fileName,function(err,bk){
            // console.log(bk)
            if (err) {
                res.send(err);
            } else {
                var count = bk.sheet.count;
                count = 1;
                // var arr = [];
                for(var sIdx = 0; sIdx < count; sIdx++ ){
                    var sht = bk.sheets[sIdx],rCount = sht.row.count,cCount = sht.column.count;
                    for(var rIdx = 1; rIdx < rCount; rIdx++){
                        var data = {}
                        // var password = sht.cell(rIdx,2)
                        // var psw = md5(password + 'jingge')
                        if (Pattern != 2) {
                            data.QuesTitle = sht.cell(rIdx,0);
                            var type = sht.cell(rIdx,1);
                            data.Type = type.replace(/(^\s*)|(\s*$)/g, "")
                            data.OptionA = sht.cell(rIdx,2);
                            data.OptionB = sht.cell(rIdx,3);
                            data.OptionC = sht.cell(rIdx,4);
                            data.OptionD = sht.cell(rIdx,5);
                            data.OptionE = sht.cell(rIdx,6);
                            data.OptionF = sht.cell(rIdx,7);
                            data.OptionG = sht.cell(rIdx,8);
                            data.OptionH = sht.cell(rIdx,9);
                            var TrueOption = sht.cell(rIdx,10);
                            data.TrueOption = TrueOption.replace(/(^\s*)|(\s*$)/g, "")
                        } else {
                            data.QuesTitle = sht.cell(rIdx,0);
                            var type = sht.cell(rIdx,1);
                            data.Type = type.replace(/(^\s*)|(\s*$)/g, "")
                            data.OptionA = true;
                            data.OptionB = false;
                            var TrueOption = sht.cell(rIdx,2);
                            data.TrueOption = TrueOption.replace(/(^\s*)|(\s*$)/g, "")
                        }
                        arrData.push(data)
                    }
                }
                createValue();
            }
        })
    } else {
        res.send({error:2,result:{msg:'请上传正确文件格式'}})
    }
    function createValue(){
        var Regx = /^[A-Ha-h]*$/
    	var data = arrData.pop()
        if (data) {
            if (data.Type) {
                routeSql.MyQueClassify.findOne({where:{Title:data.Type,CreatorUserId:decoded.Id,IsDeleted:false}}).then(function(MyQueClassifyData){
                    if (MyQueClassifyData) {
                        CreateMyQueClassify(MyQueClassifyData.dataValues.Id)
                        // console.log(MyQueClassifyData.dataValues)
                    } else {
                        routeSql.MyQueClassify.create({Title:data.Type,CreatorUserId:decoded.Id,IsDeleted:false}).then(function(NewMyQueClassifyData){
                            // console.log(NewMyQueClassifyData)
                            CreateMyQueClassify(NewMyQueClassifyData.dataValues.Id)
                        })
                    }
                })
            } else {
                CreateMyQueClassify()
            }
            // CreateMyQueClassify()
            function CreateMyQueClassify(type){
                if (Pattern == 0) {
                    if (data.TrueOption.length == 1 && Regx.test(data.TrueOption)) {
                        routeSql.MyQuestions.create({Title:data.QuesTitle.toString(),Pattern:Pattern,CreatorUserId:decoded.Id,ClassifyId:type,QuesBankQuestions:[{CreatorUserId:decoded.Id}]},{include:[{model:routeSql.QuesBank,as:'QuesBankQuestions'}]}).then(function(QuesData){
                            if (data.OptionA.toString() != '') {
                                if (data.TrueOption == 'A' || data.TrueOption == 'a') {
                                    routeSql.MyQuestionOption.create({Title:data.OptionA.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionA.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
                                }
                            }
                            if (data.OptionB.toString() != '') {
                                if (data.TrueOption == 'B' || data.TrueOption == 'b') {
                                    routeSql.MyQuestionOption.create({Title:data.OptionB.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionB.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
                                }
                            }
                            if (data.OptionC.toString() != '') {
                                if (data.TrueOption == 'C' || data.TrueOption == 'c') {
                                    routeSql.MyQuestionOption.create({Title:data.OptionC.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:3})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionC.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:3})
                                }
                            }
                            if (data.OptionD.toString() != '') {
                                if (data.TrueOption == 'D' || data.TrueOption == 'd') {
                                    routeSql.MyQuestionOption.create({Title:data.OptionD.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:4})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionD.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:4})
                                }
                            }
                            if (data.OptionE.toString() != '') {
                                if (data.TrueOption == 'E' || data.TrueOption == 'e') {
                                    routeSql.MyQuestionOption.create({Title:data.OptionE.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:5})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionE.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:6})
                                }
                            }
                            if (data.OptionF.toString() != '') {
                                if (data.TrueOption == 'F' || data.TrueOption == 'f') {
                                    routeSql.MyQuestionOption.create({Title:data.OptionF.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:7})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionF.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:7})
                                }
                            }
                            if (data.OptionG.toString() != '') {
                                if (data.TrueOption == 'G' || data.TrueOption == 'g') {
                                    routeSql.MyQuestionOption.create({Title:data.OptionG.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:8})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionG.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:8})
                                }
                            }
                            if (data.OptionH.toString() != '') {
                                if (data.TrueOption == 'H' || data.TrueOption == 'h') {
                                    routeSql.MyQuestionOption.create({Title:data.OptionH.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:9})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionH.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:9})
                                }
                            }
                            createValue()
                        })
                    } else {
                        WrongArr.push(data)
                        createValue()
                    }
                    // if (data) {
                    //     // console.log(data)
                    // } else {
                    //     if (WrongArr.length >= 1) {
                    //         res.send({error:1,result:WrongArr})
                    //     } else {
                    //         res.send({error:0,result:{msg:'试题上传成功'}})
                    //     }
                    // }
                } else if (Pattern == 1) {
                    if (data.TrueOption.length >= 1 && Regx.test(data.TrueOption)) {
                        routeSql.MyQuestions.create({Title:data.QuesTitle.toString(),Pattern:Pattern,CreatorUserId:decoded.Id,ClassifyId:type,QuesBankQuestions:[{CreatorUserId:decoded.Id}]},{include:[{model:routeSql.QuesBank,as:'QuesBankQuestions'}]}).then(function(QuesData){
                            if (data.OptionA.toString() != '') {
                                if (data.TrueOption.indexOf('A') > -1 || data.TrueOption.indexOf('a') > -1) {
                                    routeSql.MyQuestionOption.create({Title:data.OptionA.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionA.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
                                }
                            }
                            if (data.OptionB.toString() != '') {
                                if (data.TrueOption.indexOf('B') > -1 || data.TrueOption.indexOf('b') > -1) {
                                    routeSql.MyQuestionOption.create({Title:data.OptionB.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionB.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
                                }
                            }
                            if (data.OptionC.toString() != '') {
                                if (data.TrueOption.indexOf('C') > -1 || data.TrueOption.indexOf('c') > -1) {
                                    routeSql.MyQuestionOption.create({Title:data.OptionC.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:3})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionC.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:3})
                                }
                            }
                            if (data.OptionD.toString() != '') {
                                if (data.TrueOption.indexOf('D') > -1 || data.TrueOption.indexOf('d') > -1) {
                                    routeSql.MyQuestionOption.create({Title:data.OptionD.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:4})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionD.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:4})
                                }
                            }
                            if (data.OptionE.toString() != '') {
                                if (data.TrueOption.indexOf('E') > -1 || data.TrueOption.indexOf('e') > -1) {
                                    routeSql.MyQuestionOption.create({Title:data.OptionE.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:5})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionE.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:6})
                                }
                            }
                            if (data.OptionF.toString() != '') {
                                if (data.TrueOption.indexOf('F') > -1 || data.TrueOption.indexOf('f') > -1) {
                                    routeSql.MyQuestionOption.create({Title:data.OptionF.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:7})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionF.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:7})
                                }
                            }
                            if (data.OptionG.toString() != '') {
                                if (data.TrueOption.indexOf('G') > -1 || data.TrueOption.indexOf('g') > -1) {
                                    routeSql.MyQuestionOption.create({Title:data.OptionG.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:8})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionG.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:8})
                                }
                            }
                            if (data.OptionH.toString() != '') {
                                if (data.TrueOption.indexOf('H') > -1 || data.TrueOption.indexOf('h') > -1) {
                                    routeSql.MyQuestionOption.create({Title:data.OptionH.toString(),IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:9})
                                } else {
                                    routeSql.MyQuestionOption.create({Title:data.OptionH.toString(),IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:9})
                                }
                            }
                            createValue()
                        })
                    } else {
                        WrongArr.push(data)
                        createValue()
                    }
                    // if (data) {
                    // } else {
                    //     if (WrongArr.length >= 1) {
                    //         res.send({error:1,result:WrongArr})
                    //     } else {
                    //         res.send({error:0,result:{msg:'试题上传成功'}})
                    //     }
                    // }
                } else {
                        if (data.TrueOption == 'T' || data.TrueOption == 't') {
                            routeSql.MyQuestions.create({Title:data.QuesTitle.toString(),Pattern:Pattern,CreatorUserId:decoded.Id,ClassifyId:type,QuesBankQuestions:[{CreatorUserId:decoded.Id}]},{include:[{model:routeSql.QuesBank,as:'QuesBankQuestions'}]}).then(function(QuesData){
                                    routeSql.MyQuestionOption.create({Title:'正确',IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
                                    routeSql.MyQuestionOption.create({Title:'错误',IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
                            })
                        } else if (data.TrueOption == 'F' || data.TrueOption == 'f') {
                            routeSql.MyQuestions.create({Title:data.QuesTitle.toString(),Pattern:Pattern,CreatorUserId:decoded.Id,ClassifyId:type,QuesBankQuestions:[{CreatorUserId:decoded.Id}]},{include:[{model:routeSql.QuesBank,as:'QuesBankQuestions'}]}).then(function(QuesData){
                                    routeSql.MyQuestionOption.create({Title:'正确',IsAnswer:false,QuestionId:QuesData.dataValues.Id,ShowOrder:1})
                                    routeSql.MyQuestionOption.create({Title:'错误',IsAnswer:true,QuestionId:QuesData.dataValues.Id,ShowOrder:2})
                            })
                        } else {
                            WrongArr.push(data)
                        }
                        createValue()
                    // if (data) {
                    // } else {
                    //     if (WrongArr.length >= 1) {
                    //         res.send({error:1,result:WrongArr})
                    //     } else {
                    //         res.send({error:0,result:{msg:'试题上传成功'}})
                    //     }
                    // }
                }
            }
        } else {
            if (WrongArr.length >= 1) {
                res.send({error:1,result:WrongArr})
            } else {
                res.send({error:0,result:{msg:'试题上传成功'}})
            }
        }
    	// if (data) {
     //                        // console.log(data.ClassName)
     //        routeSql.AbpUsers.findAll({where:{UserName:data.UserName}}).then(function(arr) {
     //            if (arr.length > 0) {
     //                arrExist.push(data.UserName)
     //                createValue();
     //            } else {
     //                routeSql.ClassesName.findAll({where:{ClassesName:data.ClassName}}).then(function(ClassArr){
     //                    if (ClassArr.length == 0) {
     //                        if (data.ClassName != null && data.ClassName != '') {
     //                            routeSql.ClassesName.create({ClassesName:data.ClassName}).then(function(){
     //                                createValue();
     //                            })
     //                        }else{
     //                            createValue();
     //                        }
     //                    }else{
     //                        createValue();
     //                    }
                        
     //                })
     //    			routeSql.AbpUsers.create({
     //                	UserName:data.UserName,
     //                	Name:data.Name,
     //                	PhoneNumber:data.Phone,
     //                	IsPhoneNumberConfirmed:true,
     //                	Password:data.Password,
     //                	// EmailAddress:data.EmailAddress,
     //                	IsEmailConfirmed:true,
     //                	IsFoldUp:false,
     //                	IsDeleted:false,
     //                	CreationTime:new Date(),
     //                	UserType:data.UserType,
     //                	ClassName:data.ClassName,
     //                	CreatorUserId:decoded.Id
     //    			}).then(function(AbpUserData){
     //                    if (data.UserType > 0) {
     //                        fun1();
     //                    }
     //                    function fun1(){
     //                        var str = Math.random().toString(36).substr(2,6);
     //                        // console.log(str)
     //                        routeSql.TeachingActivity.findAll({where:{IsDeleted:false,InviteCode:str}}).then(function(arr){
     //                            if(arr.length == 0){
     //                                routeSql.TeachingActivity.create({
     //                                    Title:'样例',
     //                                    Desc:'可删',
     //                                    InviteCode:str,
     //                                    CreatorUserId:AbpUserData.dataValues.Id,
     //                                    BrowNum:0,
     //                                    Img:(req.body.Img == ''|| req.body.Img == null) ? '/upload/cloudDisk/default.png':req.body.Img
     //                                }).then(function(data){
     //                                    var sData = {Info:{Id:data.dataValues.Id,InviteCode:str},Command:2,uid:null}
     //                                    var s = new Buffer(JSON.stringify(sData)).toString('base64');
     //                                    if (!fs.existsSync('./www/Activity')) {fs.mkdirSync('./www/Activity')}
     //                                    var tempQrcode = qrImage.image(Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/Activity.html?jsonstr=' + s,{type:'png'});
     //                                    imgName = `${data.dataValues.InviteCode}.png`
     //                                    tempQrcode.pipe(fs.createWriteStream('./www/Activity/' + imgName))
     //                                    routeSql.TeachingActivity.update({CodePath:'/Activity/' + data.dataValues.InviteCode + '.png'},{where:{Id:data.dataValues.Id}}).then(function(){
     //                                        routeSql.TeachingLink.create({Title:'课前',TeachingActivityId:data.dataValues.Id,ShowSort:1,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
     //                                        routeSql.TeachingLink.create({Title:'课中',TeachingActivityId:data.dataValues.Id,ShowSort:2,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
     //                                        routeSql.TeachingLink.create({Title:'课后',TeachingActivityId:data.dataValues.Id,ShowSort:3,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
     //                                        // res.send({error:0,result:{msg:'创建成功',ActivityId:data.dataValues.Id}})
     //                                    })
     //                                })
     //                            }else{
     //                                fun1();
     //                            }
     //                        })
     //                    }
     //                })
     //    		}
        		
     //    	})
    	// } else {
     //        // console.log({arrExist:arrExist,WrongArr:WrongArr})
    	// 	res.send({error:0,result:{arrExist:arrExist,WrongArr:WrongArr}})
    	// }
    }
})


module.exports = router;

