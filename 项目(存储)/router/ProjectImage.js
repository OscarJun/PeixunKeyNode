
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

router.post('/Project/ProjectImage',function(req,res){
	var InSertIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
	// console.log(req.headers)
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
	var token = req.headers.token
	// console.log(token)
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
	if (!fs.existsSync('./www/updata')) {fs.mkdirSync('./www/updata')}
	if (!fs.existsSync('./www/Project')) {fs.mkdirSync('./www/Project')}
	uploads.single('file')(req,res,function(err){
	    // console.log(req.file);
	    if (req.file) {
	    	if (req.file.originalname) {
	    		// if (fs.statSync('./www/updata/' + req.file.originalname).size == req.file.size) {
	    			
	    		// } else {}
				fs.exists('./www/updata/' + req.file.originalname,function(exist){
					if (exist) {
						var rs = fs.ReadStream('./www/updata/' + req.file.originalname,{highWaterMark:req.file.size + 128})
						var data = {}
						data.error = 0;
						var FileHashCode
						rs.on('data',function(dataBuffer){
							// crypto.createHash('md5').update(dataBuffer)
							FileHashCode = md5(dataBuffer)
							// console.log(FileHashCode)
						});
						rs.on('end',function(){
							data.result = {
								url:'/upload/Project/' + req.file.originalname,
								size:req.file.size,
								mimetype:req.file.mimetype,
								name:req.file.originalname,
								FileHashCode:FileHashCode,
								token:req.headers.token,
								InSertIp:InSertIp
							}
							// console.log(data)
							// console.log('11111111111111111111111111')
							request.post({url:Ipconfig.RunServer.RunServerIpHost + ':' + Ipconfig.RunServer.LocalIpPort + '/saveFile',headers:{'token':token},form:data.result},function(err,result,body){
								var body = JSON.parse(body)
								// var preFile = fs.createReadStream('./www/updata/' + req.file.originalname)
								// var newFile = fs.createWriteStream('./www/users/' + path + '/' + body.FileName)
								// fs.unlinkSync('./www/updata/' + req.file.originalname)
								// console.log('222222222222222')
								if (!err) {
									if (body.error == 0) {
										// console.log('33333333333333')
										fs.exists('./www/updata/' + req.file.originalname,function(exist){
											if (exist) {
												fs.rename('./www/updata/' + req.file.originalname,'./www/Project/' + body.result.fileObject.FileName,function(err){
													// console.log('5555555555555555')
													// console.log(body)
													res.send(body)
												})
											} else {
												res.send({error:2,result:{msg:'文件上传失败'}})
											}
										})
									}else{
										// console.log('33333333333333')
										fs.exists('./www/updata/' + req.file.originalname,function(exist){
											if (exist) {
												fs.unlink('./www/updata/' + req.file.originalname,function(){
													// console.log('4444444444444444')
													// console.log(body)
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
	    	} else {
	    		res.send({error:1,result:{msg:'上传格式不正确'}})
	    	}
	    } else {
	    	res.send({error:1,result:{msg:'上传文件不正确'}})
	    }
	    // var path = req.body.ActivityId;
	    // if (!fs.existsSync('./www/Project')) {fs.mkdirSync('./www/Project')}
		// if (!fs.existsSync('./www/Project/' + path)) {fs.mkdirSync('./www/Project/' + path)}
		// fs.rename('./www/updata/' + req.file.originalname,'./www/Project/' + req.file.originalname,function(err){
		// 	// console.log(err)
		// 	// console.log("======")
		// 	// console.log('./www/cloudDisk/' + path + '/' + body.FileName)
		// 	res.send({result:{msg:'保存成功'}})
		// })
	})
})


module.exports = router;
