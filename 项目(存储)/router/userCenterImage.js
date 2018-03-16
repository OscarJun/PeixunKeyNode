
var express = require('express');
var router = express.Router()
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jwt-simple');//引入node的token生成验证包
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var fs = require('fs');//引入node的文件(夹)读写包
var multer = require('multer');//引入node的存储包
var request = require('request');
var crypto = require('crypto');
// var msopdf = require('node-msoffice-pdf');//文件转化pdf
var Ipconfig = require('./Ipconfig/Ipconfig.js').Ipconfig
app.use(bodyParser.json({limit:'1gb'}));
app.use(bodyParser.urlencoded({limit:'1gb',extended:true}));
app.use(bodyParser.json({verify:function(req,res,buf,encoding){req.rawBody = buf}}))//设置能够接收raw字段
app.use(bodyParser.urlencoded({extend:false,verify:function(req,res,buf,encoding){req.rawBody = buf}}));//设置能够接收raw字段
function md5(text){
	return crypto.createHash('md5').update(text).digest('hex');
}

router.post('/userCenterImage',function(req,res){
	// console.log()
	// console.log(req.buffer('file'))
	var InSertIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var path = decoded.Id;
	var storage = multer.diskStorage({
	    destination:function (req, file, cb) {
	        cb(null,'./www/users/' + path);
	    },
	    filename:function(req,file,cb){
	        cb(null,Date.now() + file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase());
	    }
	});
	var uploads = multer({storage:storage});
	if (!fs.existsSync('./www/users')) {fs.mkdirSync('./www/users')}
	if (!fs.existsSync('./www/users/' + path)) {fs.mkdirSync('./www/users/' + path)}
	uploads.single('file')(req,res,function(err){
		// console.log(req.file)
		// console.log(Date.now())
		var data = {}
		data.error = 0;
		data.result = {
			HeadImage:'/upload/users/' + path + '/' + req.file.filename,
			InSertIp:InSertIp
		}
		request.post({url:Ipconfig.RunServer.RunServerIpHost + ':' + Ipconfig.RunServer.LocalIpPort + '/api/userCenter/setting',headers:{'token':token},form:data.result},function(err,result,body){
			var body = JSON.parse(body)
			body.result.url = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/upload/users/' + path + '/' + req.file.filename
			res.send(body)
		})
	})
})

router.post('/userSettingImage',function(req,res){
	// console.log()
	// console.log(req.buffer('file'))
	var InSertIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
	var storage = multer.diskStorage({
	    destination:function (req, file, cb) {
	        cb(null,'./www/updata');
	    },
	    filename:function(req,file,cb){
	        cb(null,file.originalname);
	    }
	});
	var uploads = multer({storage:storage});
	if (!fs.existsSync('./www/updata')) {fs.mkdirSync('./www/updata')}
	uploads.single('file')(req,res,function(err){
	    var path = req.body.Id;
		if (!fs.existsSync('./www/users')) {fs.mkdirSync('./www/users')}
		if (!fs.existsSync('./www/users/' + path)) {fs.mkdirSync('./www/users/' + path)}
		if (!err) {
			if (req.file != undefined) {
				fs.exists('./www/updata/' + req.file.originalname,function(exist){
					if (exist) {
						fs.rename('./www/updata/' + req.file.originalname,'./www/users/' + path + '/' +req.file.originalname,function(err){
							res.send({error:0,result:{msg:'文件保存成功',fileObject:{url:Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/upload/users/' + path + '/' + req.file.originalname,FileName:req.file.originalname}}})
						})
					} else {
						res.send({error:3,result:{msg:'文件上传失败'}})
					}
				})
			} else {
				res.send({error:4,result:{msg:'文件上传失败'}})
			}
		} else {
			res.send({error:2,result:{msg:'文件上传失败'}})
		}
	})
})


module.exports = router;