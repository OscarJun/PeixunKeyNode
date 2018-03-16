
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');//引入node的文件(夹)读写包
var multer = require('multer');//引入node的存储包
var moment = require('moment');//引入时间计算模块
var crypto = require('crypto');
var qr = require('qr-image');
var routeSql = require('./router/sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var cookieParser = require('cookie-parser')
var Ipconfig = require('./router/Ipconfig/Ipconfig.js').Ipconfig
var Host = require('./router/Ipconfig/Ipconfig.js').Host
var schedule = require('node-schedule')

// var x = 'abc'
// var test = function (){
// var data = new Date()
//         console.log('ssssssssssssssssssssssssssssssssssssssssssssssssss')
// console.log(new Date(DateAdd('M',1,new Date(data.toString()))))
//         console.log('ssssssssssssssssssssssssssssssssssssssssssssssssss')
//     var j = schedule.scheduleJob('jobid' + x,new Date(DateAdd('M',1,new Date(data.toString()))), function(taskdata) {　
//         console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
//     });
//     setTimeout(function() {
//         console.log('定时器取消')
//         a();
//     }, 58000);
// }
// test()
// var a = function(){
//     if (schedule.scheduledJobs['jobid' + x]) {
//         console.log(schedule.scheduledJobs['jobid' + x])
//         var result = schedule.cancelJob('jobid' + x);
//     }
// }

var app = express();
app.use(express.static('www'))
app.use(bodyParser.json({limit:'100mb'}));
app.use(bodyParser.urlencoded({limit:'100mb',extended:true}));
app.use(bodyParser.json({verify:function(req,res,buf,encoding){req.rawBody = buf}}))//设置能够接收raw字段
app.use(bodyParser.urlencoded({extend:false,verify:function(req,res,buf,encoding){req.rawBody = buf}}));//设置能够接收raw字段
var md5 = function(str){
    var crypto_md5 = crypto.createHash('md5');
    crypto_md5.update(str,'utf8');
    return crypto_md5.digest('hex')
}
app.set('jwtTokenSecret','JingGe');//设置token加密字段
app.use(cookieParser());

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");//http://127.0.0.1 ; null 本地访问 ; * 任何都可以访问
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length,Authorization,Accept,X-Requested-With,token,insert");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By","3.2.1");
    res.header("Access-Control-Allow-Credentials","true");
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

global.activate = true
app.get('/Activate',function(req,res){
    global.activate = true;
    res.send({error:0,result:{msg:'激活成功'}})
})

app.use('/',function(req,res,next) {
    if (global.activate) {
        next()
    } else {
        res.send({error:3,result:{msg:'请激活程序'}})
    }
})
app.use(require('./router/UnLogin/UnLogin.js'))
app.use(require('./router/apply/load.js'))//引入登录接口
app.use(require('./router/apply/saveFile.js'))//引入上传文件格式保存在数据库接口
app.use(require('./router/front/AnswerTheQuestionnaires.js'))
// app.use(require('./router/front/PrewFiles.js'))
app.use(require('./router/front/ReadFiles.js'))
var JoinToExamResult = require('./router/front/AddExamData.js')
var JoinToHomeWorkResult = require('./router/front/AddHomeWorkData.js')
var Notification = require('./router/front/AddNotification.js')
JoinToExamResult()
JoinToHomeWorkResult()
// console.log(Notification)
// Notification.upDateExamNotification()
// Notification.upDateHomeWorkNotification()
Notification.Notification()
Notification.TeacherNotification()

app.use('/Admin',function(req,res,next){
    // console.log(req.headers.token)
    if (req.headers.token) {
        // console.log('============------------==========')
        var token = req.headers.token;
        // console.log(token)
        // console.log('-----------')
        try {
            var decoded = jwt.decode(token, app.get('jwtTokenSecret'));
            if (decoded.UserType == 2) {
            // console.log('============------------==========')
                // res.send({error:0,msg:'欢迎来到师培后台'});
                next();
            }else{
                res.send({error:1,result:{msg:'你没有访问权限'}})
            }
        } catch (err) {
            res.send({error:2,result:{msg:'请传递正确的token'}})
        }
        // var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
        // console.log(decoded)
        // console.log('========')
    }else{res.send({error:1,result:{msg:'请登录'}})}
})//登录后台验证

app.use('/api',function(req,res,next){
        var token = req.headers.token;
        try {
            if (req.headers.token) {
                var decoded = jwt.decode(token, app.get('jwtTokenSecret'));
                routeSql.AbpUsers.findOne({where:{Id:decoded.Id}}).then(function(UserData){
                    if (!UserData.dataValues.ExpirationTime || (Date.parse(UserData.dataValues.ExpirationTime) - new Date().getTime()) > 0) {
                        if (decoded.IsAppLoad) {
                            if (new Date(UserData.dataValues.AppLastLoginTime).getTime() == new Date(decoded.LastLoginTime).getTime()) {
                                next()
                            } else {
                                res.send({error:555,result:{msg:'其他设备登录，请重新登录'}})
                            }
                        } else {
                            if (new Date(UserData.dataValues.LastLoginTime).getTime() == new Date(decoded.LastLoginTime).getTime()) {
                                next()
                            } else {
                                res.send({error:555,result:{msg:'其他设备登录，请重新登录'}})
                            }
                        }
                    } else {
                        res.send({error:551,result:{msg:'账号已经过期，请联系管理员'}})
                    }
                })
                // next()
            }else{res.send({error:1,result:{msg:'请登录'}})}
        } catch (err) {
            res.send({error:2,result:{msg:'请传递正确的token'}})
        }
})//登录界面验证

app.post('/upLoadExl',function(req,res) {
    var storage = multer.diskStorage({
        destination:function (req, file, cb) {
            // console.log(req);
            cb(null, './www/upload');
        },
        filename:function(req,file,cb){
            // cb(null,file.filename + '-' + Date.now());
            cb(null,file.originalname);
        }
    });
    var uploads = multer({storage:storage});
    if (!fs.existsSync('./www/upload')) {fs.mkdirSync('./www/upload')}
    uploads.single('file')(req,res,function(err){
        // console.log(req.headers.token)
        // console.log(req.file)
        var data = {}
        data.error = 0;
        data.result = {
            name:req.file.originalname
        }
        // console.log(req.file.extension)
        // console.log(data)
        res.send(data)
    })
})


app.use('/api',require('./router/front/TrainCourseCenter.js'))
app.use('/api',require('./router/front/AbpUserCenter.js'))
app.use('/api',require('./router/front/ImportQuestions.js'))
// app.use('/api',require('./router/front/CreateClass.js'))
app.use('/api',require('./router/front/trainCourse.js'))
app.use('/api',require('./router/front/CreateProject.js'))
app.use('/api',require('./router/front/SaveCloudDisks.js'))
app.use('/api',require('./router/front/ActivityDetail.js'))
app.use('/api',require('./router/front/Exam.js'))
app.use('/api',require('./router/front/TeachingTeam.js'))
app.use('/api',require('./router/front/ReleaseExam.js'))
app.use('/api',require('./router/front/BankQues.js'))
app.use('/api',require('./router/front/HomeWork.js'))
app.use('/api',require('./router/front/Questionnaires.js'))
app.use('/api',require('./router/front/Notification.js'))
app.use('/api',require('./router/front/DoProjects.js'))
app.use('/api',require('./router/front/CreateMyStudent.js'))
app.use('/api',require('./router/front/SameScreenRoom.js'))
app.use('/api',require('./router/front/MyQueClassify.js'))
app.use('/api',require('./router/front/DestroyFiles.js'))

app.use('/Admin',require('./router/apply/TrainCourses.js'));
app.use('/Admin',require('./router/apply/AbpUser.js'));
app.use('/Admin',require('./router/apply/TrainCourseCategories.js'));
// app.use('/Admin',require('./router/apply/HomePage.js'))


app.use('/testip',function(req,res,next) {
    var request = require('request')
    request.get({url:'http://ifconfig.me/ip'},function(err,result,data) {
        // console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        // console.log(data)
        res.send(data)
    })
})

app.use(function(req, res, next) {
    res.status(404).send('Sorry cant find that URL!');
    next()
});

CreateSuperAdmin()
function CreateSuperAdmin() {
    routeSql.AbpUsers.findOne({where:{UserType:2}}).then(function(SuperAdmin) {
        if (!SuperAdmin) {
            routeSql.AbpUsers.create({
                UserName:'AdminUser',
                Name:'AdminUser',
                PhoneNumber:null,
                IsPhoneNumberConfirmed:true,
                Password:'111111',
                EmailAddress:null,
                IsEmailConfirmed:true,
                IsActive:true,
                IsDeleted:false,
                CreationTime:new Date(),
                UserType:2,
                ClassName:null,
                CreatorUserId:null
            })
        }
    })
}

// var pdf = require('pdfkit')
// var pdfo = new pdf()
// app.get('/createPdf',function(req,res){
//     // var text = fs.ReadStream('./表.txt')
//     var text = '测试pdf'
//     pdfo.pipe(fs.createWriteStream('Test.pdf'))
//     pdfo.text(text,0,0)
//     pdfo.end()
// })

app.listen(Ipconfig.Local.LocalIpPort,function(){
    console.log(Ipconfig.Local.LocalIpPort)
    console.log('server running……');
})


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


