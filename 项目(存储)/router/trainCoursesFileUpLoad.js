
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

router.post('/trainCoursesFileUpLoad',function(req,res){
	// console.log(req.headers.token)
	var InSertIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
	var token = req.headers.token
	var storage = multer.diskStorage({
	    destination:function (req, file, cb) {
	        // console.log(req);
	        cb(null, './www/updata');
	    },
	    filename:function(req,file,cb){
	        // cb(null,file.filename + '-' + Date.now());
	        cb(null,file.originalname);
	    }
	});
	var uploads = multer({storage:storage});
    // console.log(req);
	if (!fs.existsSync('./www/updata')) {fs.mkdirSync('./www/updata')}
	if (!fs.existsSync('./www/TrainCourses')) {fs.mkdirSync('./www/TrainCourses')}
	uploads.single('file')(req,res,function(err){
		if (req.file != undefined) {
			fs.exists('./www/updata/' + req.file.originalname,function(exist){
				if (exist) {
					var rs = fs.ReadStream('./www/updata/' + req.file.originalname,{highWaterMark:req.file.size + 128})
					var data = {}
					data.error = 0;
					var FileHashCode
					rs.on('data',function(dataBuffer){
						FileHashCode = md5(dataBuffer)
					});
					rs.on('end',function(){
						data.result = {
							url:'/upload/TrainCourses/' + req.file.originalname,
							size:req.file.size,
							mimetype:req.file.mimetype,
							name:req.file.originalname,
							FileHashCode:FileHashCode,
							token:req.headers.token,
							InSertIp:InSertIp
						}
						request.post({url:Ipconfig.RunServer.RunServerIpHost + ':' + Ipconfig.RunServer.LocalIpPort + '/saveFile',headers:{'token':token},form:data.result},function(err,result,body){
							// console.log(body)
							var body = JSON.parse(body)
							// var preFile = fs.createReadStream('./www/updata/' + req.file.originalname)
							// var newFile = fs.createWriteStream('./www/users/' + path + '/' + body.FileName)
							// fs.unlinkSync('./www/updata/' + req.file.originalname)
							// console.log(body.error)
							if (!err) {
								if (body.error == 0) {
									fs.exists('./www/updata/' + req.file.originalname,function(exist){
										if (exist) {
											fs.rename('./www/updata/' + req.file.originalname,'./www/TrainCourses/' + body.result.fileObject.FileName,function(err){
												res.send(body)
											})
										} else {
											res.send({error:2,result:{msg:'文件上传失败'}})
										}
									})
								}else{
									fs.exists('./www/updata/' + req.file.originalname,function(exist){
										if (exist) {
											fs.unlink('./www/updata/' + req.file.originalname,function(){
												res.send(body)
											})
										} else {
											res.send({error:2,result:{msg:'文件上传失败'}})
										}
									})
								}
							}else{
								fs.exists('./www/updata/' + req.file.originalname,function(exist){
									if (exist) {
										fs.unlink('./www/updata/' + req.file.originalname,function(){
											res.send(err)
										})
									} else {
										res.send({error:2,result:{msg:'文件上传失败'}})
									}
								})
							}
						})
					})
				} else {
					res.send({error:2,result:{msg:'文件上传失败'}})
				}
			})
	        // fs.lstat('./www/TrainCourses/' + req.file.filename,function(err,stats){
	        //     console.log(err)
	        //     console.log(stats)
	        // })
			// data.result = {
			// 	url:'http://192.168.31.68:9000/upload/TrainCourses/' + req.file.filename,
			// 	size:req.file.size,
			// 	mimetype:req.file.mimetype,
			// 	name:req.file.originalname,
			// 	token:req.headers.token
			// }
			// // console.log(req.file.extension) 
			// console.log(data)
			// request.post('http://192.168.31.68:8900/saveFile',{form:data.result},function(err,result,body){
			// 	// console.log(err)
			// 	// console.log(result.statusCode)
			// 	// console.log(body)
			// 	var body = JSON.parse(body)
			// 	res.send(body)
			// })
		} else {
			res.send({error:1,result:{msg:'上传格式不正确'}})
		}
			// console.log(req.file)
	})
    // console.log('----')
    // console.log(req.file);
    // res.send('ssss')
})

module.exports = router;
