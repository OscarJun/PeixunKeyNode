
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
var request = require('request');
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
var fs = require('fs');
var crypto = require('crypto');
function md5(text){
	return crypto.createHash('md5').update(text).digest('hex');
}
app.set('jwtTokenSecret','JingGe');//设置token加密字段



router.post('/ReadDiskFiles',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(req.body.filePath.substring(req.body.filePath.lastIndexOf('\\') + 1))
    routeSql.CloudDisks.findOne({where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(DiskData){
		routeSql.CloudDiskFiles.create({CloudDiskId:DiskData.dataValues.Id,FatherId:0,CreatorUserId:decoded.Id,FileName:req.body.filePath.substring(req.body.filePath.lastIndexOf('\\') + 1),FileType:0,IsFolder:true,IsDeleted:false}).then(function(DiskFolder){
			readFiles(req.body.filePath,DiskFolder.dataValues.Id)
		})
	})
    // readFiles(req.body.filePath,0)
    function readFiles(url,fatherId){
	    fs.readdir(url,function(err,files){
	    	if (err) {
	    		return console.error(err)
	    	} else {
	    		// console.log(files)
	    		reReadFile(files)
	    		function reReadFile(files){
	    			// console.log(files)
	    			var file = files.shift()
	    			if (file) {
		    			// console.log(file)
		    			// console.log(url + '\\' + file)
		    			fs.stat(url + '\\' + file,function(err,stats){
							// console.log(err)
							// console.info(stats);
							// console.log(stats.size)
							// console.log(stats.isFile());
							// console.log(stats.isDirectory());
							if (stats.isFile()) {
								var rs = fs.createReadStream(url + '\\' + file)
								var FileExtension = file.substring(file.lastIndexOf('.')).toLowerCase()
								var FileCategory = 20;
								switch(FileExtension){
								    case '.mp4':
								    case ".wmv":
								    case ".flv":
								    case ".3gpp":
								    case ".avi":
								    case ".wma":
								    case ".rmvb":
								    case ".mkv":
								    case ".rm":
								    case ".mov":
								    case ".mpg":
								        FileCategory = 1;
								        break;
								    case ".jpg":
								    case ".jpeg":
								    case ".bmp":
								    case ".gif":
								    case ".png":
								        FileCategory = 2;
								        break;
								    case ".txt":
								        FileCategory = 3;
								        break;
								    case ".pdf":
								        FileCategory = 4;
								        break;
								    case ".doc":
								    case ".docx":
								        FileCategory = 5;
								        break;
								    case ".ppt":
								    case ".pptx":
								        FileCategory = 6;
								        break;
								    case ".xls":
								    case ".xlsx":
								        FileCategory = 7;
								        break;
								    case ".zip":
								    case ".rar":
								        FileCategory = 8;
								        break;
								    case ".swf":
								        FileCategory = 9;
								        break;
								    default:
								        FileCategory = 20;
								        break;
								}
								var FileHashCode
								rs.on('data',function(dataBuffer){
									FileHashCode = md5(dataBuffer)
								})
								rs.on('end',function(){
									var FileUrl = '\\upload' +　url.substring(url.indexOf('www') + 3) + '\\' + file
									FileUrl = FileUrl.replace(/\\/g,"\/")
									str = FileHashCode
									// console.log(str)
									// console.log('111111111111111')
									// console.log(file)
									// console.log(FileExtension)
									// console.log(FileCategory)
									// console.log(FileHashCode)
									// console.log(stats.size)
									// console.log(FileUrl)
									// console.log('111111111111111')
									routeSql.CloudDisks.findOne({where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(DiskData){
										routeSql.Resources.create({FileName:file,FileUrl:FileUrl,FileExtension:FileExtension,FileCategory:FileCategory,FileHashCode:FileHashCode,CreatorUserId:decoded.Id,CreationTime:new Date(),FileSize:stats.size}).then(function(ResourceData){
											routeSql.CloudDiskFiles.create({CloudDiskId:DiskData.dataValues.Id,FatherId:fatherId,CreatorUserId:decoded.Id,FileName:file,FileType:FileCategory,IsFolder:false,ResourceId:ResourceData.dataValues.Id,IsDeleted:false})
										})
									})
								})
								reReadFile(files)
							} else if (stats.isDirectory()) {
								routeSql.CloudDisks.findOne({where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(DiskData){
									routeSql.CloudDiskFiles.create({CloudDiskId:DiskData.dataValues.Id,FatherId:fatherId,CreatorUserId:decoded.Id,FileName:file,FileType:0,IsFolder:true,IsDeleted:false}).then(function(DiskFolder){
										readFiles(url + '\\' + file,DiskFolder.dataValues.Id)
									})
								})
								reReadFile(files)
							}
						})
	    			}
	    		}
	    	}
	    })
    }
	res.send({error:0,msg:'创建成功'})
})

module.exports = router;

