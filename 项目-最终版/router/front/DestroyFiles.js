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

router.post('/DestroyFiles',function(req,res){
    var token = req.headers.token
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))
    var data = {};
    routeSql.CloudDiskFiles.findOne({where:{Id:req.body.DiskFileId,IsDeleted:false}}).then(function(DiskFileData){
        if (DiskFileData.dataValues.IsFolder) {
            res.send({error:1,result:{msg:'只能删除文件'}})
        } else {
            var data = {FileName:DiskFileData.dataValues.FileName,ResourceId:DiskFileData.dataValues.ResourceId}
            routeSql.TeachingDetail.findAll({where:{Type:0,ModelId:req.body.DiskFileId},attributes:['TeachingActivityId']}).then(function(ActivityArr){
                if (ActivityArr.length > 0) {
                    res.send({error:3,result:{msg:'存在相关联的教学活动',ActivityArr:ActivityArr}})
                } else {
                    routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
                        if (UserData.dataValues.TenantId) {
                            routeSql.Resources.findOne({where:{Id:DiskFileData.dataValues.ResourceId}}).then(function(ResourceData){
                                routeSql.CloudDisks.findOne({where:{CreatorUserId:decoded.Id,Name:decoded.Id}}).then(function(DiskData){
                                    routeSql.CloudDisks.update({UsedSize:(parseInt(DiskData.dataValues.UsedSize) - parseInt(ResourceData.dataValues.FileSize))},{where:{Id:DiskData.dataValues.Id}}).then(function(){
                                        routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:req.body.DiskFileId}}).then(function(){
                                            deleteFile(data)
                                        })
                                    })
                                })
                            })
                        } else {
                            routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:req.body.DiskFileId}}).then(function(){
                                deleteFile(data)
                            })
                        }
                    })
                }
            })
        }
    })
    function deleteFile(data){
        var ID = data.ResourceId;
        routeSql.Resources.findOne({where:{Id:data.ResourceId}}).then(function(ResourceData){
            request.post({url:Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort + '/destroyFile',headers:{'token':token},form:{FileName:data.FileName}},function(err,result,data){
                if (err) {
                    res.send({error:0,result:{msg:'文件不存在'}})
                    routeSql.Resources.update({IsDeleted:true},{where:{Id:ID}})
                } else {
                    res.send({error:0,result:{msg:'文件删除成功'}})
                    routeSql.Resources.update({IsDeleted:true},{where:{Id:ID}})
                }
            })
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


