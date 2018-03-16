
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
var request = require('request');
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段

router.get('/CloudDiskFiles',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    // console.log(req.body)
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (decoded.UserType == 0) {
        res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
    } else {
        routeSql.CloudDisks.findOne({where:{Name:decoded.Id.toString(),CreatorUserId:decoded.Id}}).then(function(CloudDisksdata){
            if (CloudDisksdata) {
                routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:CloudDisksdata.dataValues.Id,FatherId:req.query.FatherId,IsDeleted:false},attributes:['Id','FileName','IsFolder','ResourceId','CreationTime','FatherId'],order:[['CreationTime','DESC']],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(arr){
                    // console.log(arr)
                    res.send({error:0,result:arr})
                })
            } else {
                routeSql.AbpUsers.findOne({where:{Id:decoded.Id}}).then(function(UserData){
                    if (UserData.dataValues.TenantId) {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id,Size:52428800,UsedSize:0}).then(function(data){
                            routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:data.dataValues.Id,FatherId:req.query.FatherId,IsDeleted:false},attributes:['Id','FileName','IsFolder','ResourceId','CreationTime','FatherId'],order:[['CreationTime','DESC']],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(arr){
                                // console.log(arr)
                                res.send({error:0,result:arr})
                            })
                        })
                    } else {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id}).then(function(data){
                            routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:data.dataValues.Id,FatherId:req.query.FatherId,IsDeleted:false},attributes:['Id','FileName','IsFolder','ResourceId','CreationTime','FatherId'],order:[['CreationTime','DESC']],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(arr){
                                // console.log(arr)
                                res.send({error:0,result:arr})
                            })
                        })
                    }
                })
            }
            // console.log(data)
            // console.log(data[0].dataValues.Id)
            // console.log(req.query)
        })
    }
})

// 分类查询
// router.get('/ClassifyFind',function(req,res){
//     var token = req.headers.token;
//     var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
//     if (decoded.UserType == 0) {
//     	res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
//     } else {
//     	routeSql.CloudDisks.findOrCreate({where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(data){
//     		routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:data[0].dataValues.Id,FatherId:req.body.FatherId,IsDeleted:false},attributes:['Id','CloudDiskId','FileName','IsFolder','ResourceId'],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['Id','FileName','FileCategory','FileUrl'],where:{FileCategory:req.body.FileCategory},required:false}]}).then(function(arr){
//     			res.send({error:0,result:arr})
//     		})
//     	})
//     }
// })

router.get('/lastFileSize',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (decoded.UserType > 0) {
        routeSql.CloudDisks.findOne({where:{CreatorUserId:decoded.Id}}).then(function(CloudData){
            if (CloudData) {
                if (CloudData.dataValues.Size) {
                    if (parseInt(CloudData.dataValues.Size) > parseInt(CloudData.dataValues.UsedSize)) {
                        res.send({error:0,result:{msg:'可以继续上传'}})
                    } else {
                        res.send({error:1,result:{msg:'网盘空间已满，无限网盘使用空间请切换校园版'}})
                    }
                } else {
                    res.send({error:0,result:{msg:'可以继续上传'}})
                }
            } else {
                routeSql.AbpUsers.findOne({where:{Id:decoded.Id}}).then(function(UserData){
                    if (UserData.dataValues.TenantId) {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id,Size:52428800,UsedSize:0}).then(function(){
                            res.send({error:0,result:{msg:'可以继续上传'}})
                        })
                    } else {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id}).then(function(){
                            res.send({error:0,result:{msg:'可以继续上传'}})
                        })
                    }
                })
            }
        })
    } else {
        res.send({error:2,result:{msg:'你没有权限上传文件'}})
    }
})

router.post('/SelectFile',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var msg = req.body.KeyWords;
    if (decoded.UserType == 0) {
        res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
    } else {
        routeSql.CloudDisks.findOne({where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(CloudDisksdata){
            if (CloudDisksdata) {
                routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:CloudDisksdata.dataValues.Id,IsDeleted:false,IsFolder:false,FileName:{$like:'%' + msg + '%'}},attributes:['Id','CloudDiskId','FileName','IsFolder','ResourceId'],order:[['CreationTime','DESC']],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(arr){
                    res.send({error:0,result:arr})
                })
            } else {
                routeSql.AbpUsers.findOne({where:{Id:decoded.Id}}).then(function(UserData){
                    if (UserData.dataValues.TenantId) {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id,Size:52428800,UsedSize:0}).then(function(data){
                            routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:data.dataValues.Id,IsDeleted:false,IsFolder:false,FileName:{$like:'%' + msg + '%'}},attributes:['Id','CloudDiskId','FileName','IsFolder','ResourceId'],order:[['CreationTime','DESC']],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(arr){
                                res.send({error:0,result:arr})
                            })
                        })
                    } else {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id}).then(function(data){
                            routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:data.dataValues.Id,IsDeleted:false,IsFolder:false,FileName:{$like:'%' + msg + '%'}},attributes:['Id','CloudDiskId','FileName','IsFolder','ResourceId'],order:[['CreationTime','DESC']],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(arr){
                                res.send({error:0,result:arr})
                            })
                        })
                    }
                })
            }
        })
    }
})

router.get('/PublicCloudDiskFiles',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    // console.log(req.body)
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log('2222')
    if (decoded.UserType == 0) {
        res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
    } else {
        routeSql.AbpUsers.findOne({where:{UserType:2}}).then(function(AbpUser){
            // console.log('1111111111')
            routeSql.CloudDisks.findOne({where:{CreatorUserId:AbpUser.dataValues.Id}}).then(function(CloudDisksData) {
                routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:CloudDisksData.dataValues.Id,FatherId:req.query.FatherId,IsDeleted:false},attributes:['Id','FileName','IsFolder','ResourceId'],order:[['CreationTime','DESC']],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(arr){
                    // console.log('sssssssssssssss')
                    res.send({error:0,result:arr})
                })
            })
        })
        // routeSql.CloudDisks.findOrCreate({where:{Name:decoded.Id.toString(),CreatorUserId:decoded.Id}}).then(function(data){
            // console.log(data)
            // console.log(data[0].dataValues.Id)
            // console.log(req.query)
        // })
    }
})

router.post('/PublicSelectFiles',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var msg = req.body.KeyWords;
    if (decoded.UserType == 0) {
        res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
    } else {
        routeSql.AbpUsers.findOne({where:{UserType:2}}).then(function(AbpUser){
            routeSql.CloudDisks.findOne({where:{CreatorUserId:AbpUser.dataValues.Id}}).then(function(CloudDisksData) {
                routeSql.CloudDiskFiles.findAll({where:{CloudDiskId:CloudDisksData.dataValues.Id,FatherId:req.body.FatherId,IsDeleted:false,IsFolder:false,FileName:{$like:'%' + msg + '%'}},attributes:['Id','CloudDiskId','FileName','IsFolder','ResourceId'],order:[['CreationTime','DESC']],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(arr){
                    res.send({error:0,result:arr})
                })
            })
        })
    }
})



// 存储服务器发送的请求
router.post('/SaveCloudDisks',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    console.log(req.body)
    var CloudDiskId;
    if (decoded.UserType == 0) {
        res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
    } else {
        routeSql.CloudDisks.findOne({where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(DiskData){
            if (DiskData) {
                CloudDiskId = DiskData.dataValues.Id;
                routeSql.Resources.findOne({where:{FileHashCode:req.body.FileHashCode,FileUrl:req.body.url,IsDeleted:false}}).then(function(HashResourceData){
                    if (HashResourceData) {
                        routeSql.CloudDiskFiles.findOne({where:{CreatorUserId:decoded.Id,ResourceId:HashResourceData.dataValues.Id,FileName:req.body.name,IsDeleted:false}}).then(function(CloudDiskFileData){
                            if (CloudDiskFileData) {
                                var result = {}
                                result.ResourceId = HashResourceData.dataValues.Id;
                                result.url = req.body.InSertIp + HashResourceData.dataValues.FileUrl;
                                result.FileName = HashResourceData.dataValues.FileName;
                                result.DiskFileId = CloudDiskFileData.dataValues.Id;
                                res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                            } else {
                                routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
                                    if (UserData.dataValues.TenantId) {
                                        routeSql.CloudDiskFiles.create({CreatorUserId:decoded.Id,CloudDiskId:CloudDiskId,FileName:req.body.name,FatherId:req.body.FatherId,IsFolder:false,FileType:HashResourceData.dataValues.FileCategory,ResourceId:HashResourceData.dataValues.Id,IsDeleted:false}).then(function(newCloudDiskFileData){
                                            routeSql.CloudDisks.update({UsedSize:(parseInt(DiskData.dataValues.UsedSize) + parseInt(req.body.size))},{where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(){
                                                var result = {}
                                                result.ResourceId = newCloudDiskFileData.dataValues.Id;
                                                result.url = req.body.InSertIp + newCloudDiskFileData.dataValues.FileUrl;
                                                result.FileName = newCloudDiskFileData.dataValues.FileName;
                                                result.DiskFileId = newCloudDiskFileData.dataValues.Id;
                                                res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                                            })
                                        })
                                    } else {
                                        routeSql.CloudDiskFiles.create({CreatorUserId:decoded.Id,CloudDiskId:CloudDiskId,FileName:req.body.name,FatherId:req.body.FatherId,IsFolder:false,FileType:HashResourceData.dataValues.FileCategory,ResourceId:HashResourceData.dataValues.Id,IsDeleted:false}).then(function(newCloudDiskFileData){
                                            var result = {}
                                            result.ResourceId = newCloudDiskFileData.dataValues.Id;
                                            result.url = req.body.InSertIp + newCloudDiskFileData.dataValues.FileUrl;
                                            result.FileName = newCloudDiskFileData.dataValues.FileName;
                                            result.DiskFileId = newCloudDiskFileData.dataValues.Id;
                                            res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        routeSql.Resources.findAll({where:{FileUrl:req.body.url,IsDeleted:false}}).then(function(HashCodeArr){
                            if (HashCodeArr.length > 0) {
                                firstReName(req.body)
                            } else {
                                saveFile(req.body)
                            }
                        })
                    }
                })
            } else {
                routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
                    if (UserData.dataValues.TenantId) {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id,Size:52428800,UsedSize:0}).then(function(data){
                            CloudDiskId = data.dataValues.Id;
                            routeSql.Resources.findOne({where:{FileHashCode:req.body.FileHashCode,FileUrl:req.body.url,IsDeleted:false}}).then(function(HashResourceData){
                                if (HashResourceData) {
                                    routeSql.CloudDiskFiles.findOne({where:{CreatorUserId:decoded.Id,ResourceId:HashResourceData.dataValues.Id,FileName:req.body.name,IsDeleted:false}}).then(function(CloudDiskFileData){
                                        if (CloudDiskFileData) {
                                            var result = {}
                                            result.ResourceId = HashResourceData.dataValues.Id;
                                            result.url = req.body.InSertIp + HashResourceData.dataValues.FileUrl;
                                            result.FileName = HashResourceData.dataValues.FileName;
                                            result.DiskFileId = CloudDiskFileData.dataValues.Id;
                                            res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                                        } else {
                                            if (UserData.dataValues.TenantId) {
                                                routeSql.CloudDiskFiles.create({CreatorUserId:decoded.Id,CloudDiskId:CloudDiskId,FileName:req.body.name,FatherId:req.body.FatherId,IsFolder:false,FileType:HashResourceData.dataValues.FileCategory,ResourceId:HashResourceData.dataValues.Id,IsDeleted:false}).then(function(newCloudDiskFileData){
                                                    routeSql.CloudDisks.update({UsedSize:(parseInt(data.dataValues.UsedSize) + parseInt(req.body.size))},{where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(){
                                                        var result = {}
                                                        result.ResourceId = newCloudDiskFileData.dataValues.Id;
                                                        result.url = req.body.InSertIp + newCloudDiskFileData.dataValues.FileUrl;
                                                        result.FileName = newCloudDiskFileData.dataValues.FileName;
                                                        result.DiskFileId = newCloudDiskFileData.dataValues.Id;
                                                        res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                                                    })
                                                })
                                            } else {
                                                routeSql.CloudDiskFiles.create({CreatorUserId:decoded.Id,CloudDiskId:CloudDiskId,FileName:req.body.name,FatherId:req.body.FatherId,IsFolder:false,FileType:HashResourceData.dataValues.FileCategory,ResourceId:HashResourceData.dataValues.Id,IsDeleted:false}).then(function(newCloudDiskFileData){
                                                    var result = {}
                                                    result.ResourceId = newCloudDiskFileData.dataValues.Id;
                                                    result.url = req.body.InSertIp + newCloudDiskFileData.dataValues.FileUrl;
                                                    result.FileName = newCloudDiskFileData.dataValues.FileName;
                                                    result.DiskFileId = newCloudDiskFileData.dataValues.Id;
                                                    res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                                                })
                                            }
                                        }
                                    })
                                } else {
                                    routeSql.Resources.findAll({where:{FileUrl:req.body.url,IsDeleted:false}}).then(function(HashCodeArr){
                                        if (HashCodeArr.length > 0) {
                                            firstReName(req.body)
                                        } else {
                                            saveFile(req.body)
                                        }
                                    })
                                }
                            })
                        })
                    } else {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id}).then(function(data){
                            CloudDiskId = data.dataValues.Id;
                            routeSql.Resources.findOne({where:{FileHashCode:req.body.FileHashCode,FileUrl:req.body.url,IsDeleted:false}}).then(function(HashResourceData){
                                if (HashResourceData) {
                                    routeSql.CloudDiskFiles.findOne({where:{CreatorUserId:decoded.Id,ResourceId:HashResourceData.dataValues.Id,FileName:req.body.name,IsDeleted:false}}).then(function(CloudDiskFileData){
                                        if (CloudDiskFileData) {
                                            var result = {}
                                            result.ResourceId = HashResourceData.dataValues.Id;
                                            result.url = req.body.InSertIp + HashResourceData.dataValues.FileUrl;
                                            result.FileName = HashResourceData.dataValues.FileName;
                                            result.DiskFileId = CloudDiskFileData.dataValues.Id;
                                            res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                                        } else {
                                            routeSql.CloudDiskFiles.create({CreatorUserId:decoded.Id,CloudDiskId:CloudDiskId,FileName:req.body.name,FatherId:req.body.FatherId,IsFolder:false,FileType:HashResourceData.dataValues.FileCategory,ResourceId:HashResourceData.dataValues.Id,IsDeleted:false}).then(function(newCloudDiskFileData){
                                                var result = {}
                                                result.ResourceId = newCloudDiskFileData.dataValues.Id;
                                                result.url = req.body.InSertIp + newCloudDiskFileData.dataValues.FileUrl;
                                                result.FileName = newCloudDiskFileData.dataValues.FileName;
                                                result.DiskFileId = newCloudDiskFileData.dataValues.Id;
                                                res.send({error:1,result:{msg:'文件已经存在',fileObject:result}})
                                            })
                                        }
                                    })
                                } else {
                                    routeSql.Resources.findAll({where:{FileUrl:req.body.url,IsDeleted:false}}).then(function(HashCodeArr){
                                        if (HashCodeArr.length > 0) {
                                            firstReName(req.body)
                                        } else {
                                            saveFile(req.body)
                                        }
                                    })
                                }
                            })
                        })
                    }
                })
            }
        })
    }
    function firstReName(data){
        routeSql.Resources.findAll({where:{FileUrl:data.url,IsDeleted:false}}).then(function(UrlArr){
            if (UrlArr.length > 0) {
                data.url = data.url.substring(0,data.url.lastIndexOf('.')) + '(1)' + data.url.substring(data.url.lastIndexOf('.'))
                data.name = data.name.substring(0,data.name.lastIndexOf('.')) + '(1)' + data.name.substring(data.name.lastIndexOf('.'))
                reName(data)
            } else {
                saveFile(data)
            }
        })
    }
    function reName(data){
        routeSql.Resources.findAll({where:{FileUrl:data.url,IsDeleted:false}}).then(function(UrlArr){
            if (UrlArr.length > 0) {
                data.url = data.url.substring(0,data.url.lastIndexOf('(') + 1) + (parseInt(data.url.substr(data.url.lastIndexOf('(') + 1,1)) + 1) + ')' + data.url.substring(data.url.lastIndexOf('.'))
                data.name = data.name.substring(0,data.name.lastIndexOf('(') + 1) + (parseInt(data.name.substr(data.name.lastIndexOf('(') + 1,1)) + 1) + ')' + data.name.substring(data.name.lastIndexOf('.'))
                // console.log(data)
                reName(data)
            } else {
                saveFile(data)
            }
        })
    }
    function saveFile(data){
        var fileName = data.name;
        var token = data.token
        var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
        var FileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
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
        var PdfFileUrl = null
        if (FileCategory == 5 || FileCategory == 6 || FileCategory == 7) {
            PdfFileUrl = data.url.substring(0,data.url.lastIndexOf('.')) + new Date().getTime() + '.pdf'
        }
        routeSql.Resources.create({FileName:data.name,FileUrl:data.url,FileExtension:FileExtension,FileCategory:FileCategory,FileHashCode:data.FileHashCode,CreatorUserId:decoded.Id,CreationTime:new Date(),FileSize:data.size}).then(function(data){
            routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
                if (UserData.dataValues.TenantId) {
                    routeSql.CloudDiskFiles.create({CloudDiskId:CloudDiskId,FatherId:req.body.FatherId,CreatorUserId:decoded.Id,FileName:data.dataValues.FileName,FileType:FileCategory,IsFolder:false,ResourceId:data.dataValues.Id,IsDeleted:false}).then(function(DiskFileData){
                        routeSql.CloudDisks.findOne({where:{Id:CloudDiskId}}).then(function(DiskData){
                            routeSql.CloudDisks.update({UsedSize:(parseInt(DiskData.dataValues.UsedSize) + parseInt(req.body.size))},{where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(){
                                var result = {}
                                result.ResourceId = data.Id;
                                result.DiskFileId = DiskFileData.dataValues.Id;
                                result.url = req.body.InSertIp + data.FileUrl;
                                result.FileName = data.FileName;
                                res.send({error:0,result:{msg:'文件保存成功',fileObject:result}})
                            })
                        })
                    })
                } else {
                    routeSql.CloudDiskFiles.create({CloudDiskId:CloudDiskId,FatherId:req.body.FatherId,CreatorUserId:decoded.Id,FileName:data.dataValues.FileName,FileType:FileCategory,IsFolder:false,ResourceId:data.dataValues.Id,IsDeleted:false}).then(function(DiskFileData){
                        var result = {}
                        result.ResourceId = data.Id;
                        result.DiskFileId = DiskFileData.dataValues.Id;
                        result.url = req.body.InSertIp + data.FileUrl;
                        result.FileName = data.FileName;
                        res.send({error:0,result:{msg:'文件保存成功',fileObject:result}})
                    })
                }
            })
        })
    }
})

router.post('/SaveCloudDisksFolder',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (decoded.UserType == 0) {
        res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
    } else {
        routeSql.CloudDisks.findOne({where:{Name:decoded.Id,CreatorUserId:decoded.Id}}).then(function(DiskData){
            if (DiskData) {
                routeSql.CloudDiskFiles.findAll({where:{FileName:req.body.FileName,FatherId:req.body.FatherId,CloudDiskId:DiskData.dataValues.Id,IsDeleted:false}}).then(function(IsFolderNameRepeat){
                    if (IsFolderNameRepeat.length > 0) {
                        res.send({error:2,result:{msg:'该文件夹名已占用'}})
                    } else {
                        routeSql.CloudDiskFiles.create({CloudDiskId:DiskData.dataValues.Id,FatherId:req.body.FatherId,CreatorUserId:decoded.Id,FileName:req.body.FileName,FileType:0,IsFolder:true,IsDeleted:false}).then(function(data){
                            res.send({error:0,result:{DiskFileId:data.dataValues.Id,FileName:data.dataValues.FileName}})
                        })
                    }
                })
            } else {
                routeSql.AbpUsers.findOne({where:{Id:decoded.Id}}).then(function(UserData){
                    if (UserData.dataValues.TenantId) {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id,Size:52428800,UsedSize:0}).then(function(data){
                            routeSql.CloudDiskFiles.findAll({where:{FileName:req.body.FileName,FatherId:req.body.FatherId,CloudDiskId:data.dataValues.Id,IsDeleted:false}}).then(function(IsFolderNameRepeat){
                                if (IsFolderNameRepeat.length > 0) {
                                    res.send({error:2,result:{msg:'该文件夹名已占用'}})
                                } else {
                                    routeSql.CloudDiskFiles.create({CloudDiskId:data.dataValues.Id,FatherId:req.body.FatherId,CreatorUserId:decoded.Id,FileName:req.body.FileName,FileType:0,IsFolder:true,IsDeleted:false}).then(function(data){
                                        res.send({error:0,result:{DiskFileId:data.dataValues.Id,FileName:data.dataValues.FileName}})
                                    })
                                }
                            })
                        })
                    } else {
                        routeSql.CloudDisks.create({Name:decoded.Id,CreatorUserId:decoded.Id}).then(function(data){
                            routeSql.CloudDiskFiles.findAll({where:{FileName:req.body.FileName,FatherId:req.body.FatherId,CloudDiskId:data.dataValues.Id,IsDeleted:false}}).then(function(IsFolderNameRepeat){
                                if (IsFolderNameRepeat.length > 0) {
                                    res.send({error:2,result:{msg:'该文件夹名已占用'}})
                                } else {
                                    routeSql.CloudDiskFiles.create({CloudDiskId:data.dataValues.Id,FatherId:req.body.FatherId,CreatorUserId:decoded.Id,FileName:req.body.FileName,FileType:0,IsFolder:true,IsDeleted:false}).then(function(data){
                                        res.send({error:0,result:{DiskFileId:data.dataValues.Id,FileName:data.dataValues.FileName}})
                                    })
                                }
                            })
                        })
                    }
                })
            }
        })
    }
})

router.post('/DestroyDiskFile',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.CloudDiskFiles.findOne({where:{Id:req.body.DiskFileId,IsDeleted:false}}).then(function(data){
        if (data) {
            if (decoded.Id == data.dataValues.CreatorUserId) {
                if (data.dataValues.IsFolder) {
                    routeSql.CloudDiskFiles.findAll({where:{FatherId:data.dataValues.Id,IsDeleted:false}}).then(function(arr){
                        if (arr.length > 0) {
                            res.send({error:3,result:{msg:'文件夹内部存在文件，不能删除该文件夹'}})
                        } else {
                            routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:req.body.DiskFileId}}).then(function(){
                                res.send({error:0,result:{msg:'删除成功'}})
                            })
                        }
                    })
                }else{
                    var ReqData = {FileName:data.dataValues.FileName,ResourceId:data.dataValues.ResourceId}
                    routeSql.TeachingDetail.findAll({where:{Type:0,ModelId:req.body.DiskFileId},attributes:['TeachingActivityId']}).then(function(ActivityArr){
                        if (ActivityArr.length > 0) {
                            res.send({error:3,result:{msg:'存在相关联的教学活动',ActivityArr:ActivityArr}})
                        } else {
                            routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
                                if (UserData.dataValues.TenantId) {
                                    routeSql.Resources.findOne({where:{Id:data.dataValues.ResourceId,IsDeleted:false}}).then(function(ResourceData){
                                        routeSql.CloudDisks.findOne({where:{CreatorUserId:decoded.Id,Name:decoded.Id}}).then(function(DiskData){
                                            routeSql.CloudDisks.update({UsedSize:(parseInt(DiskData.dataValues.UsedSize) - parseInt(ResourceData.dataValues.FileSize))},{where:{Id:DiskData.dataValues.Id}}).then(function(){
                                                routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:req.body.DiskFileId}}).then(function(){
                                                    // res.send({error:0,result:{msg:'删除成功'}})
                                                    deleteFile(ReqData)
                                                })
                                            })
                                        })
                                    })
                                } else {
                                    routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:req.body.DiskFileId}}).then(function(){
                                        // res.send({error:0,result:{msg:'删除成功'}})
                                        deleteFile(ReqData)
                                    })
                                }
                            })
                        }
                    })
                }
            } else {
                res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
            }
        } else {
            res.send({error:2,result:{msg:'该文件不存在'}})
        }
    })
    function deleteFile(data){
        var ID = data.ResourceId;
        routeSql.Resources.findOne({where:{Id:data.ResourceId,IsDeleted:false}}).then(function(ResourceData){
            request.post({url:Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort + '/destroyFile',headers:{'token':token},form:{FileName:data.FileName}},function(err,result,data){
                if (err) {
                    res.send({error:0,result:{msg:'文件不存在'}})
                    routeSql.Resources.update({IsDeleted:true},{where:{Id:ID}})
                } else {
                    res.send({error:0,result:{msg:'文件删除成功'}})
                    routeSql.Resources.update({IsDeleted:true},{where:{Id:ID}})
                }
                // console.log(data)
            })
        })
    }
})

router.post('/DestroyDiskFileforWeb',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    console.log(req.body)
    // DestroyMany(req.body.DiskFiles)
    var CanNotDelet = []
    DestroyMany(req.body.DiskFiles)
    function DestroyMany(DiskFiles){
        var DiskFileId = DiskFiles.shift()
        if (DiskFileId) {
            routeSql.CloudDiskFiles.findOne({where:{Id:DiskFileId,IsDeleted:false}}).then(function(data){
                if (data) {
                    if (decoded.Id == data.dataValues.CreatorUserId) {
                        if (data.dataValues.IsFolder) {
                            routeSql.CloudDiskFiles.findAll({where:{FatherId:data.dataValues.Id,IsDeleted:false}}).then(function(arr){
                                if (arr.length > 0) {
                                    CanNotDelet.push({DiskFileId:DiskFileId,msg:'文件夹内部存在文件，不能删除该文件夹'})
                                    DestroyMany(DiskFiles)
                                    // res.send({error:3,result:{msg:'文件夹内部存在文件，不能删除该文件夹'}})
                                } else {
                                    routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:DiskFileId}}).then(function(){
                                        // res.send({error:0,result:{msg:'删除成功'}})
                                        DestroyMany(DiskFiles)
                                    })
                                }
                            })
                        }else{
                            var ReqData = {FileName:data.dataValues.FileName,ResourceId:data.dataValues.ResourceId}
                            routeSql.TeachingDetail.findAll({where:{Type:0,ModelId:DiskFileId},attributes:['TeachingActivityId']}).then(function(ActivityArr){
                                if (ActivityArr.length > 0) {
                                    CanNotDelet.push({DiskFileId:DiskFileId,msg:'存在相关联的教学活动'})
                                    DestroyMany(DiskFiles)
                                    // res.send({error:3,result:{msg:'存在相关联的教学活动',ActivityArr:ActivityArr}})
                                } else {
                                    routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
                                        if (UserData.dataValues.TenantId) {
                                            routeSql.Resources.findOne({where:{Id:data.dataValues.ResourceId,IsDeleted:false}}).then(function(ResourceData){
                                                routeSql.CloudDisks.findOne({where:{CreatorUserId:decoded.Id,Name:decoded.Id}}).then(function(DiskData){
                                                    routeSql.CloudDisks.update({UsedSize:(parseInt(DiskData.dataValues.UsedSize) - parseInt(ResourceData.dataValues.FileSize))},{where:{Id:DiskData.dataValues.Id}}).then(function(){
                                                        routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:DiskFileId}}).then(function(){
                                                            deleteFile(ReqData)
                                                            DestroyMany(DiskFiles)
                                                        })
                                                    })
                                                })
                                            })
                                        } else {
                                            routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:DiskFileId}}).then(function(){
                                                deleteFile(ReqData)
                                                DestroyMany(DiskFiles)
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    } else {
                        CanNotDelet.push({DiskFileId:DiskFileId,msg:'你没有权限操作使用网盘删除该文件'})
                        DestroyMany(DiskFiles)
                        // res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
                    }
                } else {
                    CanNotDelet.push({DiskFileId:DiskFileId,msg:'该文件不存在'})
                    DestroyMany(DiskFiles)
                    // res.send({error:2,result:{msg:'该文件不存在'}})
                }
            })
        } else {
            res.send({error:0,result:{CanNotDelet:CanNotDelet}})
        }
    }
    function deleteFile(data){
        var ID = data.ResourceId;
        routeSql.Resources.findOne({where:{Id:data.ResourceId,IsDeleted:false}}).then(function(ResourceData){
            request.post({url:Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort + '/destroyFile',headers:{'token':token},form:{FileName:data.FileName}},function(err,result,data){
                if (err) {
                    // res.send({error:0,result:{msg:'文件不存在'}})
                    routeSql.Resources.update({IsDeleted:true},{where:{Id:ID}})
                } else {
                    // res.send({error:0,result:{msg:'文件删除成功'}})
                    routeSql.Resources.update({IsDeleted:true},{where:{Id:ID}})
                }
                // console.log(data)
            })
        })
    }

})

router.post('/DestroyDiskFileAnyWay',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.CloudDiskFiles.findOne({where:{Id:req.body.DiskFileId,IsDeleted:false}}).then(function(data){
        if (data) {
            if (decoded.Id == data.dataValues.CreatorUserId) {
                if (!data.dataValues.IsFolder) {
                    routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
                        if (UserData.dataValues.TenantId) {
                            routeSql.Resources.findOne({where:{Id:data.dataValues.ResourceId,IsDeleted:false}}).then(function(ResourceData){
                                routeSql.CloudDisks.findOne({where:{CreatorUserId:decoded.Id,Name:decoded.Id}}).then(function(DiskData){
                                    routeSql.CloudDisks.update({UsedSize:(parseInt(DiskData.dataValues.UsedSize) - parseInt(ResourceData.dataValues.FileSize))},{where:{Id:DiskData.dataValues.Id}}).then(function(){
                                        routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:req.body.DiskFileId}}).then(function(){
                                            routeSql.TeachingDetail.destroy({where:{Type:0,ModelId:req.body.DiskFileId}}).then(function(){res.send({error:0,result:{msg:'删除成功'}})})
                                        })
                                    })
                                })
                            })
                        } else {
                            routeSql.CloudDiskFiles.update({IsDeleted:true},{where:{Id:req.body.DiskFileId}}).then(function(){
                                routeSql.TeachingDetail.destroy({where:{Type:0,ModelId:req.body.DiskFileId}}).then(function(){res.send({error:0,result:{msg:'删除成功'}})})
                            })
                        }
                    })
                }else{
                    res.send({error:2,result:{msg:'文件夹不能直接删除'}})
                }
            } else {
                res.send({error:1,result:{msg:'你没有权限操作使用网盘'}})
            }
        } else {
            res.send({error:2,result:{msg:'该文件不存在'}})
        }
    })
})

router.post('/ChangeName',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.CloudDiskFiles.findOne({where:{Id:req.body.DiskFileId,IsDeleted:false}}).then(function(DiskFileData){
        if (DiskFileData.dataValues.CreatorUserId == decoded.Id) {
            if (DiskFileData.dataValues.IsFolder) {
                routeSql.CloudDiskFiles.findAll({where:{FileName:req.body.NewFileName,FatherId:DiskFileData.dataValues.FatherId,IsDeleted:false}}).then(function(IsFolderNameRepeat){
                    if (IsFolderNameRepeat.length > 0) {
                        res.send({error:2,result:{msg:'该文件夹名已占用'}})
                    } else {
                        routeSql.CloudDiskFiles.update({FileName:req.body.NewFileName},{where:{Id:req.body.DiskFileId,IsDeleted:false}}).then(function(){
                            res.send({error:0,result:{msg:'文件夹名称修改成功'}})
                        })
                    }
                })
            } else {
                routeSql.Resources.findOne({where:{Id:DiskFileData.dataValues.ResourceId,IsDeleted:false}}).then(function(ResourceData){
                    var FileUrl = ResourceData.dataValues.FileUrl.substring(0,ResourceData.dataValues.FileUrl.lastIndexOf('/') + 1) + req.body.NewFileName + ResourceData.dataValues.FileUrl.substring(ResourceData.dataValues.FileUrl.lastIndexOf('.'))
                    var FileName = req.body.NewFileName + ResourceData.dataValues.FileName.substring(ResourceData.dataValues.FileName.lastIndexOf('.'))
                    routeSql.Resources.findAll({where:{FileName:FileName,FileUrl:FileUrl,IsDeleted:false}}).then(function(ResourceArr){
                        if (ResourceArr.length > 0) {
                            res.send({error:2,result:{msg:'该文件名已占用'}})
                        } else {
                            request.post({url:Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort + '/changeName',headers:{'token':token},form:{FileName:FileName,PreFileName:ResourceData.dataValues.FileName}},function(err,result,body){
                                var body = JSON.parse(body)
                                // console.log(body)
                                routeSql.CloudDiskFiles.update({FileName:FileName},{where:{Id:DiskFileData.dataValues.Id}})
                                routeSql.Resources.update({FileName:FileName,FileUrl:FileUrl},{where:{Id:DiskFileData.dataValues.ResourceId,IsDeleted:false}}).then(function(){res.send({error:0,result:{msg:'文件名修改成功'}})})
                            })
                        }
                    })
                })
            }
        } else {
            res.send({error:1,result:{msg:'你没有权限修改文件名称'}})
        }
    })
})
  
router.post('/AddDiskFileToActivity',function(req,res){
    // console.log(req.body)
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId,IsDeleted:false}}).then(function(TeachingTaskData){
        if (TeachingTaskData) {
            if (TeachingTaskData.dataValues.CreatorUserId == decoded.Id) {
                CreateDetail(req.body.ModelArray)
                function CreateDetail(ModelArray){
                    var ModelData = ModelArray.shift()
                    if (ModelData) {
                        routeSql.CloudDiskFiles.findOne({where:{Id:ModelData.CloudDiskFilesId}}).then(function(DiskFileData){
                            if (DiskFileData.dataValues.IsFolder) {
                                CreateDetail(ModelArray)
                            } else {
                                routeSql.TeachingDetail.create({Title:ModelData.Title,Type:0,ModelId:ModelData.CloudDiskFilesId,TeachingTaskId:req.body.TeachingTaskId,TeachingActivityId:req.body.ActivityId}).then(function(){
                                    CreateDetail(ModelArray)
                                })
                            }
                        })
                    } else {
                        routeSql.TeachingTask.findOne({where:{Id:req.body.TeachingTaskId},attributes:['Id','Title','Desc']}).then(function(data){
                            // console.log(data)
                            searchDetail(req.body.TeachingTaskId,req,res,data,decoded)
                            // JoinToExamResult()
                            // JoinToHomeWorkResult()
                        })
                        // routeSql.TeachingDetail.findAll({where:{TeachingTaskId:req.body.TeachingTaskId},attributes:['Title','Type','ModelId']}).then(function(data){
                        //     res.send({error:0,result:data})
                        // })
                    }
                }
            } else {
                res.send({error:1,result:{msg:'你没有权限往该任务添加文件'}})
            }
        } else {
            res.send({error:2,result:{msg:'该任务不存在'}})
        }
    })
})

router.post('/fileRecord',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    routeSql.TeachingDetail.findAll({where:{Type:0,TeachingActivityId:req.body.ActivityId}}).then(function(DetailArr){
        DiskFile(DetailArr)
        var result = []
        function DiskFile(DetailArr){
            var DetailData = DetailArr.shift()
            if (DetailData) {
                routeSql.CloudDiskFiles.findOne({where:{Id:DetailData.dataValues.ModelId},attributes:['FileName'],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'FileSize','CreationTime']}]}).then(function(data){
                    result.push(data)
                    DiskFile(DetailArr)
                })
            } else {
                res.send({error:0,result:result})
            }
        }
    })
})

module.exports = router;


function searchDetail(TeachingTaskId,req,res,TaskData,decoded) {
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    routeSql.TeachingDetail.findAll({where:{TeachingTaskId:TeachingTaskId}}).then(function(TeachingDetailArr){
        var ModelArray = []
        getAllModel(TeachingDetailArr)
        function getAllModel(TeachingDetailArr){
            var TeachingDetailData = TeachingDetailArr.shift()
            if (TeachingDetailData) {
                var TeachingDetailDataValues = TeachingDetailData.dataValues
                if (TeachingDetailDataValues.Type == 0) {
                    // console.log(TeachingDetailDataValues.ModelId)
                    routeSql.CloudDiskFiles.findOne({where:{Id:TeachingDetailDataValues.ModelId},attributes:['FileName','ResourceId'],include:[{model:routeSql.Resources,as:'DiskFilesResourceId',attributes:['FileCategory',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('FileUrl')),InSertIp),'FileUrl'],'CreationTime']}]}).then(function(ModelData){
                        ModelArray.push({TeachingDetailData:{Id:TeachingDetailData.dataValues.Id,Type:TeachingDetailData.dataValues.Type,ModelId:TeachingDetailData.dataValues.ModelId},ModelData:{FileName:ModelData.dataValues.FileName,ResourceId:ModelData.dataValues.ResourceId,FileCategory:ModelData.dataValues.DiskFilesResourceId.FileCategory,FileUrl:ModelData.dataValues.DiskFilesResourceId.FileUrl}})
                        getAllModel(TeachingDetailArr)
                    })
                } else if (TeachingDetailDataValues.Type == 1) {
                    routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ExamData){
                        routeSql.MyExamBase.findOne({where:{Id:ExamData.dataValues.MyExamBaseId}}).then(function(ExamBaseData){
                            routeSql.ExamResult.findOne({where:{UserId:decoded.Id,ExamId:TeachingDetailDataValues.ModelId}}).then(function(ExamResultData){
                                routeSql.MyExamQuestion.count({where:{MyExamBaseId:ExamBaseData.dataValues.Id}}).then(function(QuestionCount){
                                    var State;
                                    var TeacherPaperState;
                                        if (new Date(ExamData.dataValues.EndDate) > new Date()) {
                                    if (ExamResultData) {
                                            if (ExamResultData.dataValues.State == 1 || Date(ExamResultData.dataValues.EndDate) < new Date()) {
                                                State = 2//已经提交过了或者考试时长已经过了考试未结束
                                            } else {
                                                State = 0//可以开始考试
                                            }
                                    } else {
                                        State = 3//考试还未开始或不能参加该考试
                                    }
                                        } else {
                                            State = 1//考试已经结束
                                        }
                                        if (new Date(ExamData.dataValues.StartDate) > new Date()) {
                                            TeacherPaperState = 2;
                                        } else if (new Date(ExamData.dataValues.StartDate) < new Date() && new Date(ExamData.dataValues.EndDate) > new Date()) {
                                            TeacherPaperState = 0;
                                        } else {
                                            TeacherPaperState = 1;
                                        }
                                    ModelArray.push({TeachingDetailData:TeachingDetailData,ModelData:{State:State,CountScore:ExamBaseData.dataValues.CountScore,PassScore:ExamBaseData.dataValues.PassScore,StartDate:ExamData.dataValues.StartDate,EndDate:ExamData.dataValues.EndDate,TimeLong:ExamData.dataValues.TimeLong,MyExamBaseId:ExamData.dataValues.MyExamBaseId,QuestionCount:QuestionCount,TeacherPaperState:TeacherPaperState}})
                                    getAllModel(TeachingDetailArr)
                                })
                            })
                        })
                    })
                    // routeSql.MyExam.findOne({where:{Id:TeachingDetailDataValues.ModelId},include:[{model:routeSql.MyExamBase,as:'TestPaper',attributes:['PassScore','CountScore']}]}).then(function(ModelData){
                    //     ModelArray.push({TeachingDetailData,ModelData})
                    //     getAllModel(TeachingDetailArr)
                    // })
                } else if (TeachingDetailDataValues.Type == 2) {
                    routeSql.HomeWork.findOne({where:{Id:TeachingDetailDataValues.ModelId}}).then(function(ModelData){
                        if (new Date() > new Date(ModelData.dataValues.EndDate)) {
                            ModelData.dataValues.IsEnd = true
                        } else {
                            ModelData.dataValues.IsEnd = false
                        }
                        ModelArray.push({TeachingDetailData,ModelData})
                        getAllModel(TeachingDetailArr)
                    })
                } else if (TeachingDetailDataValues.Type == 3) {
                    routeSql.Questionnaires.findOne({where:{Id:TeachingDetailDataValues.ModelId},attributes:['Title','Code','CodePath','Count']}).then(function(ModelData){
                        if (decoded.UserType != 0) {
                            ModelArray.push({TeachingDetailData,ModelData})
                        } else {
                            ModelArray.push({TeachingDetailData,ModelData:{}})
                        }
                        getAllModel(TeachingDetailArr)
                    })
                }
            } else {
                // console.log('000000')
                res.send({error:0,result:{ModelArray,TaskData}})
            }
        }
    })
}
