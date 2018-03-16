
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


// 获取首页用户信息
// 分页，查询用户
router.post('/user/list',function(req,res){
 //    console.log('11111111111111111111111111111')
	// console.log(req.headers.insert)
	// console.log(req.body)
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
	var count;
	var a = req.body.limit;
	var limit = parseInt(a)
	var page = req.body.page ? req.body.page:1;
	var offset = (page -1) * limit;
	var msg = req.body.msg ? req.body.msg:'';
    var type = parseInt(req.body.UserType);
    // var type = req.body.UserType;
	// console.log(msg)
    // console.log(type)
    // console.log(type === 0 || type === 1)
	var data = {}
    var ConditionData = {IsDeleted:false,UserName:{$like:'%' + msg + '%'}}
    if (type === 0 || type === 1) {
        var ConditionData = {IsDeleted:false,UserName:{$like:'%' + msg + '%'},UserType:type}
    }
	routeSql.AbpUsers.count({where:ConditionData}).then(function(i){
		count = i;
	})
	routeSql.AbpUsers.findAll({
		where:ConditionData,
		offset:offset,limit:limit,
		order:[['CreationTime','DESC']],
        // [sequelize.fn("CONCAT",'wwwww',sequelize.col('Name'),'  yuyun'),'Name']//[sequelize.fn('Nullif',sequelize.fn("CONCAT",'wwwww',sequelize.col('HeadImage')),'wwwww'),'Name']
		attributes:[[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage'],'UserName','PhoneNumber','Password','Name','EmailAddress','LastLoginTime','ClassName','Id','UserType']
	}).then(function(arr){
		data.count = count;
		data.data = arr;
		res.send({error:0,result:data});
		// console.log(arr);
	})

})

router.get('/user/resetPsw',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var Id = req.body.Id;
    routeSql.AbpUsers.update({Password:111111},{where:{Id:Id}}).then(function(){
        res.send({error:0,result:{msg:'密码重置成功'}})
    })
})

router.post('/user/delete',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var Id = req.body.Id;
    routeSql.AbpUsers.update({IsDeleted:true},{where:{Id:Id}}).then(function(){
        res.send({error:0,result:{msg:'用户删除成功'}})
    })
})

router.post('/user/setting',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var Id = req.body.Id;
    var data = {}
    // console.log(req.body)
    routeSql.AbpUsers.findOne({where:{Id:Id}}).then(function(UserData){
        data.HeadImage = req.body.HeadImage ? req.body.HeadImage.substring(req.body.HeadImage.indexOf(Ipconfig.SaveServer.SaveServerIpPort) + Ipconfig.SaveServer.SaveServerIpPort.toString().length) : UserData.dataValues.HeadImage
        data.Name = req.body.Name ? req.body.Name : UserData.dataValues.Name;
        data.PhoneNumber = req.body.PhoneNumber ? req.body.PhoneNumber : UserData.dataValues.PhoneNumber;
        data.EmailAddress = req.body.EmailAddress ? req.body.EmailAddress : UserData.dataValues.EmailAddress;
        // console.log(data)
        routeSql.AbpUsers.update(data,{where:{Id:Id,IsDeleted:false}}).then(function(){
            res.send({error:0,result:{msg:'信息修改成功'}})
        }).catch(function(){
            res.send({error:0,result:{msg:'信息修改失败'}})
        })
    })
})


router.post('/upLoadExl',function(req,res) {
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
  //       console.log(req.headers.token)
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

router.post('/excel',function(req,res){
	var fileName = req.body.fileName
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var arrData = []
	var arrExist = []
    var WrongArr = []
    var TeacherData = []
    // console.log(req.body.filename)
    // console.log(token)
    xl.open('www/upload/' + fileName,function(err,bk){
        if (err) {
            // console.log(err);
        } else {
            var count = bk.sheet.count;
            // var arr = [];
            for(var sIdx = 0; sIdx < count; sIdx++ ){
                var sht = bk.sheets[sIdx],rCount = sht.row.count,cCount = sht.column.count;
                for(var rIdx = 1; rIdx < rCount; rIdx++){
                    var data = {}
                    // var password = sht.cell(rIdx,2)
                    // var psw = md5(password + 'jingge')
                    data.UserName = sht.cell(rIdx,0).toString();
                    data.Phone = sht.cell(rIdx,1);
                    data.Password = sht.cell(rIdx,2);
                    data.Name = sht.cell(rIdx,3);
                    // data.EmailAddress = sht.cell(rIdx,6);
                    data.UserType = sht.cell(rIdx,4);
                    data.ClassName = sht.cell(rIdx,5).toString();
                    data.ValidTime = sht.cell(rIdx,6)
                    data.TenantId = sht.cell(rIdx,7)
                    var reg1 = /^[a-zA-Z0-9\u4e00-\u9fa5]{4,20}$/
                    var reg2 = /^[a-zA-Z0-9]{6,20}$/
                    var reg3 = /^[a-zA-Z0-9\u4e00-\u9fa5]{2,10}$/
                    if (data.UserType != 0 && data.UserType != 1) {
                        WrongArr.push(data.UserName)
                    } else if (!reg1.test(data.UserName)) {
                        WrongArr.push(data.UserName)
                    } else if (!reg2.test(data.Password)) {
                        WrongArr.push(data.UserName)
                    } else if (!reg3.test(data.Name)) {
                        WrongArr.push(data.UserName)
                    } else {
                        arrData.push(data)
                    }
                }
            }
            createValue();
        }
    })
    function createValue(){
        var data = arrData.shift()
        if (data) {
            routeSql.AbpUsers.findAll({where:{UserName:data.UserName,IsDeleted:false}}).then(function(arr) {
                if (arr.length > 0) {
                    arrExist.push(data.UserName)
                    createValue();
                } else {
                    routeSql.ClassesName.findAll({where:{ClassesName:data.ClassName}}).then(function(ClassArr){
                        if (ClassArr.length == 0) {
                            if (data.ClassName != null && data.ClassName != '') {
                                routeSql.ClassesName.create({ClassesName:data.ClassName}).then(function(){
                                    createValue();
                                })
                            }else{
                                createValue();
                            }
                        }else{
                            createValue();
                        }
                        
                    })
        			routeSql.AbpUsers.create({
                    	UserName:data.UserName,
                    	Name:data.Name,
                    	PhoneNumber:data.Phone,
                    	IsPhoneNumberConfirmed:true,
                    	Password:data.Password,
                        TenantId:data.TenantId,
                    	// EmailAddress:data.EmailAddress,
                    	IsEmailConfirmed:true,
                    	IsFoldUp:false,
                    	IsDeleted:false,
                    	CreationTime:new Date(),
                    	UserType:data.UserType,
                    	ClassName:data.ClassName,
                    	CreatorUserId:decoded.Id
        			}).then(function(AbpUserData){
                        parseInt(data.ValidTime)
                        var ExpirationTime = DateAdd('d',parseInt(data.ValidTime),new Date())
                        if (parseInt(data.ValidTime)) {
                            routeSql.AbpUsers.update({ExpirationTime:new Date(ExpirationTime)},{where:{Id:AbpUserData.dataValues.Id}})
                        }
                        if (data.UserType > 0) {
                            fun1();
                        }
                        function fun1(){
                            var str = Math.random().toString(36).substr(2,6);
                            // console.log(str)
                            routeSql.TeachingActivity.findAll({where:{IsDeleted:false,InviteCode:str}}).then(function(arr){
                                if(arr.length == 0){
                                    routeSql.TeachingActivity.create({
                                        Title:'样例',
                                        Desc:'可删',
                                        InviteCode:str,
                                        CreatorUserId:AbpUserData.dataValues.Id,
                                        BrowNum:0,
                                        Img:(req.body.Img == ''|| req.body.Img == null) ? '/upload/cloudDisk/default.png':req.body.Img
                                    }).then(function(data){
                                        var sData = {Info:{Id:data.dataValues.Id,InviteCode:str},Command:2,uid:null}
                                        var s = new Buffer(JSON.stringify(sData)).toString('base64');
                                        if (!fs.existsSync('./www/Activity')) {fs.mkdirSync('./www/Activity')}
                                        var tempQrcode = qrImage.image(Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/SharePages/Activity.html?jsonstr=' + s,{type:'png'});
                                        imgName = `${data.dataValues.InviteCode}.png`
                                        tempQrcode.pipe(fs.createWriteStream('./www/Activity/' + imgName))
                                        routeSql.TeachingActivity.update({CodePath:'/Activity/' + data.dataValues.InviteCode + '.png'},{where:{Id:data.dataValues.Id}}).then(function(){
                                            routeSql.TeachingLink.create({Title:'课前',TeachingActivityId:data.dataValues.Id,ShowSort:1,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
                                            routeSql.TeachingLink.create({Title:'课中',TeachingActivityId:data.dataValues.Id,ShowSort:2,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
                                            routeSql.TeachingLink.create({Title:'课后',TeachingActivityId:data.dataValues.Id,ShowSort:3,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
                                            // res.send({error:0,result:{msg:'创建成功',ActivityId:data.dataValues.Id}})
                                        })
                                    })
                                }else{
                                    fun1();
                                }
                            })
                        }
                    })
        		}
        		
        	})
    	} else {
            // console.log({arrExist:arrExist,WrongArr:WrongArr})
    		res.send({error:0,result:{arrExist:arrExist,WrongArr:WrongArr}})
    	}
    }
})

router.post('/AddUser',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var reg1 = /^[a-zA-Z0-9\u4e00-\u9fa5]{4,20}$/
    var reg2 = /^[a-zA-Z0-9]{6,20}$/
    var reg3 = /^[a-zA-Z0-9\u4e00-\u9fa5]{2,10}$/
    if (req.body.UserType != 0 && req.body.UserType != 1) {
        res.send({error:2,msg:'用户类型异常'})
    } else if (!reg1.test(req.body.UserName)) {
        res.send({error:2,msg:'账户名称异常'})
    } else if (!reg2.test(req.body.Password)) {
        res.send({error:2,msg:'账户密码异常'})
    } else if (!reg3.test(req.body.Name)) {
        res.send({error:2,msg:'用户姓名异常'})
    } else {
        routeSql.AbpUsers.findOne({where:{UserName:req.body.UserName,IsDeleted:false}}).then(function(UserData){
            if (UserData) {
                res.send({error:1,msg:'账户名称已存在，请更换账户名称'});
            } else {
                routeSql.AbpUsers.create({
                    UserName:req.body.UserName,
                    Name:req.body.Name,
                    PhoneNumber:req.body.Phone,
                    IsPhoneNumberConfirmed:true,
                    Password:req.body.Password,
                    TenantId:req.body.TenantId,
                    // EmailAddress:data.EmailAddress,
                    IsEmailConfirmed:true,
                    IsFoldUp:false,
                    IsDeleted:false,
                    CreationTime:new Date(),
                    UserType:req.body.UserType,
                    // ClassName:req.body.ClassName,
                    CreatorUserId:decoded.Id
                }).then(function(AbpUserData){
                    res.send({error:0,msg:'用户创建成功'})
                    // parseInt(data.ValidTime)
                    // var ExpirationTime = DateAdd('d',parseInt(data.ValidTime),new Date())
                    // if (parseInt(data.ValidTime)) {
                    //     routeSql.AbpUsers.update({ExpirationTime:new Date(ExpirationTime)},{where:{Id:AbpUserData.dataValues.Id}})
                    // }
                    if (AbpUserData.dataValues.UserType > 0) {
                        fun1();
                    }
                    function fun1(){
                        var str = Math.random().toString(36).substr(2,6);
                        // console.log(str)
                        routeSql.TeachingActivity.findAll({where:{IsDeleted:false,InviteCode:str}}).then(function(arr){
                            if(arr.length == 0){
                                routeSql.TeachingActivity.create({
                                    Title:'样例',
                                    Desc:'可删',
                                    InviteCode:str,
                                    CreatorUserId:AbpUserData.dataValues.Id,
                                    BrowNum:0,
                                    Img:(req.body.Img == ''|| req.body.Img == null) ? '/upload/cloudDisk/default.png':req.body.Img
                                }).then(function(data){
                                    var sData = {Info:{Id:data.dataValues.Id,InviteCode:str},Command:2,uid:null}
                                    var s = new Buffer(JSON.stringify(sData)).toString('base64');
                                    if (!fs.existsSync('./www/Activity')) {fs.mkdirSync('./www/Activity')}
                                    var tempQrcode = qrImage.image(Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/SharePages/Activity.html?jsonstr=' + s,{type:'png'});
                                    imgName = `${data.dataValues.InviteCode}.png`
                                    tempQrcode.pipe(fs.createWriteStream('./www/Activity/' + imgName))
                                    routeSql.TeachingActivity.update({CodePath:'/Activity/' + data.dataValues.InviteCode + '.png'},{where:{Id:data.dataValues.Id}}).then(function(){
                                        routeSql.TeachingLink.create({Title:'课前',TeachingActivityId:data.dataValues.Id,ShowSort:1,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
                                        routeSql.TeachingLink.create({Title:'课中',TeachingActivityId:data.dataValues.Id,ShowSort:2,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
                                        routeSql.TeachingLink.create({Title:'课后',TeachingActivityId:data.dataValues.Id,ShowSort:3,CreatorUserId:AbpUserData.dataValues.Id,TaskCount:0})
                                        // res.send({error:0,result:{msg:'创建成功',ActivityId:data.dataValues.Id}})
                                    })
                                })
                            }else{
                                fun1();
                            }
                        })
                    }
                })
            }
        })
    }
})

module.exports = router;

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


