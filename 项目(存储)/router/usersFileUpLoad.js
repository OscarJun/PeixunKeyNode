
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

router.post('/usersFileUpLoad',function(req,res){
	var InSertIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var path = decoded.Id;
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
	if (!fs.existsSync('./www/users/' + path)) {fs.mkdirSync('./www/users/' + path)}
	if (!fs.existsSync('./www/updata')) {fs.mkdirSync('./www/updata')}
	uploads.single('file')(req,res,function(err){
		// console.log(req.file)
		fs.exists('./www/updata/' + req.file.originalname,function(exist){
			if (exist) {
				var rs = fs.ReadStream('./www/updata/' + req.file.originalname,{highWaterMark:req.file.size + 128})
				var data = {}
				// console.log(rs)
				data.error = 0;
				var FileHashCode
				rs.on('data',function(dataBuffer){
					FileHashCode = md5(dataBuffer)
				});
				rs.on('end',function(){
					data.result = {
						url:'/upload/users/' + path + '/' + req.file.originalname,
						size:req.file.size,
						mimetype:req.file.mimetype,
						name:req.file.originalname,
						FileHashCode:FileHashCode,
						token:req.headers.token,
						InSertIp:InSertIp
					}
					request.post({url:Ipconfig.RunServer.RunServerIpHost + ':' + Ipconfig.RunServer.LocalIpPort + '/saveFile',headers:{'token':token},form:data.result},function(err,result,body){
						if (!err) {
							var body = JSON.parse(body)
							if (body.error == 0) {
								fs.exists('./www/updata/' + req.file.originalname,function(exist){
									if (exist) {
										fs.rename('./www/updata/' + req.file.originalname,'./www/users/' + path + '/' + body.FileName,function(err){
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
	})
})

module.exports = router;
