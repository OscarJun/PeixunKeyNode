
var express = require('express');
var fs = require('fs');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express()
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段

router.post('/load',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
    }
    var password = ''
    if (req.body.password) {password = req.body.password}
    routeSql.AbpUsers.findOne({//$or:[{PhoneNumber:req.body.name},{}]
        where:{UserName:req.body.name,isDeleted:false}
        // ,attributes:['Id','Name','UserName','UserType',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage'],'Password','IsFoldUp']
    }).then(function(data){
        // console.log(data)
        if (data) {
            if (password == data.dataValues.Password) {
                // var expires = moment().add('day',10).valueOf();
                // if (!data.dataValues.LastLoginTime && data.dataValues.UserType == 1) {}
                // if (req.body.IsAppLoad) {} else {}
                // console.log(req.body)
                if (req.body.IsWebLoad) {
                    routeSql.AbpUsers.update({LastLoginTime:new Date()},{where:{Id:data.dataValues.Id}}).then(function(){
                        routeSql.AbpUsers.findOne({where:{Id:data.dataValues.Id},attributes:['Id','Name','UserName','UserType',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage'],'Password','TenantId','IsFoldUp','LastLoginTime','AppLastLoginTime','ExpirationTime']}).then(function(SelfData){
                            if (!SelfData.dataValues.ExpirationTime || (Date.parse(SelfData.dataValues.ExpirationTime) - new Date().getTime()) > 0) {
                                var token = jwt.encode({
                                    UserName:SelfData.dataValues.UserName,
                                    Id:SelfData.dataValues.Id,
                                    UserType:SelfData.dataValues.UserType,
                                    LastLoginTime:SelfData.dataValues.LastLoginTime,
                                    IsAppLoad:false,
                                    // Password:data.Password
                                    // exp:expires
                                },app.get('jwtTokenSecret'));
                                var arr = {}
                                arr.token = token;
                                arr.userName = SelfData.dataValues.UserName;
                                arr.userType = SelfData.dataValues.UserType;
                                arr.name = SelfData.dataValues.Name;
                                arr.isFoldUp = SelfData.dataValues.IsFoldUp
                                arr.headImage = SelfData.dataValues.HeadImage;
                                arr.ValidTime = (Date.parse(SelfData.dataValues.ExpirationTime) - new Date().getTime())/1000;
                                arr.TenantId = SelfData.dataValues.TenantId;
                                res.send({error:0,result:arr});
                            } else {
                                res.send({error:551,result:{msg:'账户已过期，请联系管理员'}})
                            }
                        })
                    })
                } else {
                    routeSql.AbpUsers.update({AppLastLoginTime:new Date()},{where:{Id:data.dataValues.Id}}).then(function(){
                        routeSql.AbpUsers.findOne({where:{Id:data.dataValues.Id},attributes:['Id','Name','UserName','UserType',[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage'],'Password','TenantId','IsFoldUp','LastLoginTime','AppLastLoginTime','ExpirationTime']}).then(function(SelfData){
                            if (!SelfData.dataValues.ExpirationTime || (Date.parse(SelfData.dataValues.ExpirationTime) - new Date().getTime()) > 0) {
                                var token = jwt.encode({
                                    UserName:SelfData.dataValues.UserName,
                                    Id:SelfData.dataValues.Id,
                                    UserType:SelfData.dataValues.UserType,
                                    LastLoginTime:SelfData.dataValues.AppLastLoginTime,
                                    IsAppLoad:true
                                },app.get('jwtTokenSecret'));
                                var arr = {}
                                arr.token = token;
                                arr.userName = SelfData.dataValues.UserName;
                                arr.userType = SelfData.dataValues.UserType;
                                arr.name = SelfData.dataValues.Name;
                                arr.isFoldUp = SelfData.dataValues.IsFoldUp
                                arr.headImage = SelfData.dataValues.HeadImage;
                                arr.ValidTime = (Date.parse(SelfData.dataValues.ExpirationTime) - new Date().getTime())/1000
                                arr.TenantId = SelfData.dataValues.TenantId;
                                res.send({error:0,result:arr});
                            } else {
                                res.send({error:551,result:{msg:'账户已过期，请联系管理员'}})
                            }
                        })
                    })
                }
            } else {
                res.send({error:1,result:{msg:'密码错误'}})
            }
        } else {
            res.send({error:2,result:{msg:'账户不存在'}});
        }
    })
})



module.exports = router;

