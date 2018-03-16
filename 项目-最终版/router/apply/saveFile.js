
var express = require('express');
var fs = require('fs');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express()
app.set('jwtTokenSecret','JingGe');//设置token加密字段


router.post('/saveFile',function(req,res){
    // console.log(req.body)
    if (req.headers.token) {
        // console.log(req.body)
        routeSql.Resources.findOne({where:{FileHashCode:req.body.FileHashCode,IsDeleted:false}}).then(function(HashCodeArr){
            if (HashCodeArr) {
                routeSql.Resources.findOne({where:{FileUrl:req.body.url,FileHashCode:req.body.FileHashCode,IsDeleted:false}}).then(function(SameMame){
                    if (SameMame) {
                        var result = {}
                        result.ResourceId = SameMame.dataValues.Id;
                        result.url = req.body.InSertIp + SameMame.dataValues.FileUrl;
                        result.FileName = SameMame.dataValues.FileName;
                        // console.log(req.body)
                        res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                    } else {
                        saveFile(req.body)
                    }
                })
            } else {
                routeSql.Resources.findOne({where:{FileUrl:req.body.url,IsDeleted:false}}).then(function(SameMame){
                    if (SameMame) {
                        firstReName(req.body)
                    } else {
                        saveFile(req.body)
                    }
                })
            }
        })
    } else {
        res.send({error:2,result:{msg:'请传递token'}})
    }
    // console.log(req.body)
    // res.send('save successed!')
    function firstReName(data){
        routeSql.Resources.findAll({where:{FileUrl:data.url,IsDeleted:false}}).then(function(UrlArr){
            // console.log('========')
            var Data = {}
            if (UrlArr.length > 0) {
                Data.url = data.url.substring(0,data.url.lastIndexOf('.')) + '(1)' + data.url.substring(data.url.lastIndexOf('.'))
                Data.name = data.name.substring(0,data.name.lastIndexOf('.')) + '(1)' + data.name.substring(data.name.lastIndexOf('.'))
                Data.size = data.size
                Data.mimetype = data.mimetype
                Data.FileHashCode = data.FileHashCode
                // console.log(data)
                routeSql.Resources.findOne({where:{FileHashCode:Data.FileHashCode,FileUrl:Data.FileUrl,IsDeleted:false}}).then(function(SameHashCode){
                    if (SameHashCode) {
                        res.send({error:1,result:{msg:'文件已存在',fileObject:{ResourceId:SameHashCode.dataValues.Id,url:req.body.InSertIp + SameHashCode.dataValues.FileUrl,FileName:SameHashCode.dataValues.FileName}}})
                    } else {
                        reName(Data)
                    }
                })
            } else {
                saveFile(data)
            }
        })
    }
    function reName(data){
        routeSql.Resources.findAll({where:{FileUrl:data.url,IsDeleted:false}}).then(function(UrlArr){
            // console.log(data.url.substr(data.url.lastIndexOf('(') + 1,1))
            var Data = {}
            if (UrlArr.length > 0) {
                Data.url = data.url.substring(0,data.url.lastIndexOf('(') + 1) + (parseInt(data.url.substr(data.url.lastIndexOf('(') + 1,1)) + 1) + ')' + data.url.substring(data.url.lastIndexOf('.'))
                Data.name = data.name.substring(0,data.name.lastIndexOf('(') + 1) + (parseInt(data.name.substr(data.name.lastIndexOf('(') + 1,1)) + 1) + ')' + data.name.substring(data.name.lastIndexOf('.'))
                Data.size = data.size
                Data.mimetype = data.mimetype
                Data.FileHashCode = data.FileHashCode
                // console.log(data)
                routeSql.Resources.findOne({where:{FileHashCode:Data.FileHashCode,FileUrl:Data.FileUrl,IsDeleted:false}}).then(function(SameHashCode){
                    if (SameHashCode) {
                        res.send({error:1,result:{msg:'文件已存在',fileObject:{ResourceId:SameHashCode.dataValues.Id,url:req.body.InSertIp + SameHashCode.dataValues.FileUrl,FileName:SameHashCode.dataValues.FileName}}})
                    } else {
                        reName(Data)
                    }
                })
            } else {
                saveFile(data)
            }
        })
    }
    function saveFile(data){
        var fileName = data.name;
        var token = req.headers.token
        // console.log(token)
        var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
        var FileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
        // console.log(FileExtension)
        var FileCategory;
        switch(FileExtension){
            case '.mp4':
            case ".wmv":
            case ".flv":
            case ".3gp":
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
        var PdfFileUrl = null
        if (FileCategory == 5 || FileCategory == 6 || FileCategory == 7) {
            PdfFileUrl = data.url.substring(0,data.url.lastIndexOf('.')) + new Date().getTime() + '.pdf'
        }
        // console.log(FileCategory)
        routeSql.Resources.create({FileName:data.name,FileUrl:data.url,FileExtension:FileExtension,FileCategory:FileCategory,FileHashCode:data.FileHashCode,CreatorUserId:decoded.Id,CreationTime:new Date(),FileSize:data.size}).then(function(data){
            var result = {}
            result.ResourceId = data.Id;
            result.url = req.body.InSertIp + data.FileUrl;
            result.FileName = data.FileName;
            res.send({error:0,result:{msg:'文件保存成功',fileObject:result}})
        })
    }
})

module.exports = router;

// 设置存储位置及文件存储名称
// var a = 1
// var storage = multer.diskStorage({
//     destination:function (req, file, cb) {
//         console.log(req);
//         cb(null, './www/upload/' + a + '/');
//     },
//     filename:function(req,file,cb){
//         // cb(null,file.filename + '-' + Date.now());
//         cb(null,file.originalname);
//     }
// });

// var uploads = multer({storage:storage});
// app.post('/file',uploads.single('file'),function(req,res){
//     console.log('----')
//     console.log(req.body);
//     console.log(req.file);
// })


