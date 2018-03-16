
var express = require('express');
// var AntiLeech = require('express-anti-leech');
var path = require('path')
var bodyParser = require('body-parser');
var fs = require('fs');//引入node的文件(夹)读写包
var multer = require('multer');//引入node的存储包
var request = require('request');
var crypto = require('crypto');
var images = require('images')
var Ipconfig = require('./router/Ipconfig/Ipconfig.js').Ipconfig
// var msopdf = require('node-msoffice-pdf');//文件转化pdf

// console.log(Ipconfig)
// var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig

// var md5 = crypto.createHash('md5');
function md5(text){
	return crypto.createHash('md5').update(text).digest('hex');
}

var app = express();


app.use(bodyParser.json({limit:'1gb'}));
app.use(bodyParser.urlencoded({limit:'1gb',extended:true}));
app.use(bodyParser.json({verify:function(req,res,buf,encoding){req.rawBody = buf}}))//设置能够接收raw字段
app.use(bodyParser.raw());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

app.use(bodyParser.urlencoded({extend:false,verify:function(req,res,buf,encoding){req.rawBody = buf}}));//设置能够接收raw字段
// app.use('/',express.static('www'))
// app.use('/abc',function(req,res){
// 	// console.log(req.url)
// 	var DecodeUrl = decodeURI(req.url)
// 	var postfix = DecodeUrl.substring(DecodeUrl.lastIndexOf('/upload') + 7)
// 	// console.log('/////////')
// 	console.log(postfix)
// 	console.log('www' + postfix)
// 	// res.redirect('./www' + postfix)
// })
app.use('/upload',express.static('www'))
app.use('/upload',function(req,res,next){
	var DecodeUrl = decodeURI(req.url)
	var postfix = DecodeUrl.substring(DecodeUrl.lastIndexOf('.') + 1)
	if (postfix.indexOf('@') > 0 && postfix.indexOf('_') > 0) {
		var parms = DecodeUrl.substring(DecodeUrl.lastIndexOf('@') + 1)
		var url = DecodeUrl.substring(0,DecodeUrl.lastIndexOf('@'))
		// console.log(url)
		var parm = parms.split(",")
		// parm.forEach(function(){})
		var a = parm.map(function(val){
			return val.split('_')
		})
		// console.log(a)
		var data = {}
		a.forEach(function(val){
			// console.log(val[0])
			data[val[0]] = val[1]
		})
		// console.log(data)
		// console.log(data.w+' '+data.h+' '+data.q)
		res.send(images('./www' + url).size(data.w,data.h).encode("jpg", {quality:data.q}))
		// next();
	} else {
		next()
	}
})

// app.use(AntiLeech());

// var hosts = {
//   'http://192.168.31.31': ['127.0.0.1'],
//   'localhost:9000': ['*']
// };
// var hosts = ['http://localhost:9000', 'http://localhost','localhost:8322','192.168.31.68:8322','192.168.31.68','192.168.31.31:8080','192.168.31.31'];
// var exts = ['.mp4','.wmv','.3gp','.avi','.wma','.flv','.rmvb','.mkv','.rm','mov','.mpg'];
// var pictrue = '/www/TrainCourses/haha啊啊.png'
// app.use(AntiLeech({
// 	allow: hosts,
// 	exts: exts,
// 	log: console.log, // 你也可以使用自己的方法来记录
// 	default: pictrue
// }));
// app.use('/eTrainCourses',express.static(path.join(__dirname, '/www/TrainCourses')));
// app.use('/eTrainCourses',express.static('www/TrainCourses'));

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");//http://127.0.0.1 ; null 本地访问 ; * 任何都可以访问
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length,Authorization,Accept,X-Requested-With,token,pathid,insert");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By","3.2.1");
    res.header("Access-Control-Allow-Credentials","true");
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

var jwt = require('jwt-simple');//引入node的token生成验证包
app.set('jwtTokenSecret','JingGe');//设置token加密字段
app.use(require('./router/userCenterImage.js'))
app.use(require('./router/ProjectImage.js'))
app.use(require('./router/trainCoursesFileUpLoad.js'))
app.use(require('./router/classesFileUpLoad.js'))
app.use(require('./router/usersFileUpLoad.js'))
app.get('/test',function(req,res){
	res.send({error:0,result:{msg:'测试成功'}})
})



app.use(require('./router/DiskFileUpload.js'))
app.use(require('./router/HomeWork.js'))
app.use(require('./router/filelist.js'))

app.post('/changeName',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var path = decoded.Id;
	var preName = req.body.PreFileName;
	var fileName = req.body.FileName;
	fs.rename('./www/cloudDisk/' + path + '/' + preName,'./www/cloudDisk/' + path + '/' + fileName,function(err){
		// console.log(err)
	})
	res.send({error:0,result:{msg:'文件名修改成功'}})
})



app.listen(Ipconfig.Local.LocalIpPort,function(){
	console.log(Ipconfig.Local.LocalIpPort)
	console.log('server running……');
})

