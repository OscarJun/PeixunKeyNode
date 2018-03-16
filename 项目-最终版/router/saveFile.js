var express=require("express"),fs=require("fs"),router=express.Router(),routeSql=require("../sql/routeSql.js"),jwt=require("jwt-simple"),app=express();app.set("jwtTokenSecret","JingGe"),router.post("/saveFile",function(e,s){function r(r){routeSql.Resources.findAll({where:{FileUrl:r.url}}).then(function(t){var n={};t.length>0?(n.url=r.url.substring(0,r.url.lastIndexOf("."))+"(1)"+r.url.substring(r.url.lastIndexOf(".")),n.name=r.name.substring(0,r.name.lastIndexOf("."))+"(1)"+r.name.substring(r.name.lastIndexOf(".")),n.size=r.size,n.mimetype=r.mimetype,n.FileHashCode=r.FileHashCode,routeSql.Resources.findOne({where:{FileHashCode:n.FileHashCode,FileUrl:n.FileUrl}}).then(function(r){r?s.send({error:1,result:{msg:"文件已存在",fileObject:{ResourceId:r.dataValues.Id,url:e.body.InSertIp+r.dataValues.FileUrl,FileName:r.dataValues.FileName}}}):a(n)})):l(r)})}function a(r){routeSql.Resources.findAll({where:{FileUrl:r.url}}).then(function(t){var n={};t.length>0?(n.url=r.url.substring(0,r.url.lastIndexOf("(")+1)+(parseInt(r.url.substr(r.url.lastIndexOf("(")+1,1))+1)+")"+r.url.substring(r.url.lastIndexOf(".")),n.name=r.name.substring(0,r.name.lastIndexOf("(")+1)+(parseInt(r.name.substr(r.name.lastIndexOf("(")+1,1))+1)+")"+r.name.substring(r.name.lastIndexOf(".")),n.size=r.size,n.mimetype=r.mimetype,n.FileHashCode=r.FileHashCode,routeSql.Resources.findOne({where:{FileHashCode:n.FileHashCode,FileUrl:n.FileUrl}}).then(function(r){r?s.send({error:1,result:{msg:"文件已存在",fileObject:{ResourceId:r.dataValues.Id,url:e.body.InSertIp+r.dataValues.FileUrl,FileName:r.dataValues.FileName}}}):a(n)})):l(r)})}function l(r){var a,l=r.name,t=e.headers.token,n=jwt.decode(t,app.get("jwtTokenSecret")),i=l.substring(l.lastIndexOf(".")).toLowerCase();switch(i){case".mp4":case".wmv":case".flv":case".3gp":case".avi":case".wma":case".rmvb":case".mkv":case".rm":case".mov":case".mpg":a=1;break;case".jpg":case".jpeg":case".bmp":case".gif":case".png":a=2;break;case".txt":a=3;break;case".pdf":a=4;break;case".doc":case".docx":a=5;break;case".ppt":case".pptx":a=6;break;case".xls":case".xlsx":a=7;break;case".zip":case".rar":a=8;break;case".swf":a=9;break;default:a=20}5!=a&&6!=a&&7!=a||(r.url.substring(0,r.url.lastIndexOf(".")),(new Date).getTime()),routeSql.Resources.create({FileName:r.name,FileUrl:r.url,FileExtension:i,FileCategory:a,FileHashCode:r.FileHashCode,CreatorUserId:n.Id,CreationTime:new Date,FileSize:r.size}).then(function(r){var a={};a.ResourceId=r.Id,a.url=e.body.InSertIp+r.FileUrl,a.FileName=r.FileName,s.send({error:0,result:{msg:"文件保存成功",fileObject:a}})})}e.headers.token?routeSql.Resources.findOne({where:{FileHashCode:e.body.FileHashCode}}).then(function(a){a?routeSql.Resources.findOne({where:{FileUrl:e.body.url,FileHashCode:e.body.FileHashCode}}).then(function(r){if(r){var a={};a.ResourceId=r.dataValues.Id,a.url=e.body.InSertIp+r.dataValues.FileUrl,a.FileName=r.dataValues.FileName,s.send({error:1,result:{msg:"文件已经存在",fileObject:a}})}else l(e.body)}):routeSql.Resources.findOne({where:{FileUrl:e.body.url}}).then(function(s){s?r(e.body):l(e.body)})}):s.send({error:2,result:{msg:"请传递token"}})}),module.exports=router;