
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var Sequelize = require('sequelize');
var sequelize = require('../sql/sqlConnect.js')
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var crypto = require('crypto');
var md5 = function(str){
    var crypto_md5 = crypto.createHash('md5');
    crypto_md5.update(str,'utf8');
    return crypto_md5.digest('hex')
}


// 个人中心
router.get('/userCenter',function(req,res){
    var InSertIp = Ipconfig.SaveServer.SaveServerIpHost + ':' + Ipconfig.SaveServer.SaveServerIpPort
    var CodePathIp = Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort
    if (parseInt(req.headers.insert)) {
        InSertIp = Ipconfig.InSertIp.InSertIpHost + ':' + Ipconfig.InSertIp.InSertIpPort
        CodePathIp = Ipconfig.InSertCodePathIp.InSertCodePathIpHost + ':' + Ipconfig.InSertCodePathIp.InSertCodePathIpPort
    }
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false},
    	attributes:[[sequelize.fn('Nullif',sequelize.fn("CONCAT",InSertIp,sequelize.col('HeadImage')),InSertIp),'HeadImage'],'UserName','PhoneNumber','Name','EmailAddress']}).then(function(data){
    		res.send({error:0,result:data})
    	})
})

router.post('/userCenter/settingPassword',function(req,res){
    var token = req.headers.token;
    var primPsw = req.body.primPassword;
    // var primPsw = md5(req.body.primPassword + 'jingge')
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false},
    	attributes:['Password']}).then(function(data){
        var reg2 = /^[a-zA-Z0-9]{6,20}$/
        if (!reg2.test(data.Password)) {
            res.send({error:2,result:{msg:'请输入正确的密码格式'}})
        } else {
    		if (primPsw == data.Password) {
                var psw = req.body.newPassword
    			// var psw = md5(req.body.newPassword + 'jingge');
                if (reg2.test(psw)) {
        			if (psw == primPsw) {
        				res.send({error:1,result:{msg:'密码与旧密码相同'}})
        			} else {
    	    			routeSql.AbpUsers.update({Password:psw},{where:{Id:decoded.Id,IsDeleted:false}}).then(function(){
    	    				res.send({error:0,result:{msg:'密码更改成功'}})
    	    			})
        			}
                } else {
                    res.send({error:2,result:{msg:'请输入正确的密码格式'}})
                }      // 
    		} else {
    			res.send({error:2,result:{msg:'旧密码输入错误'}})
    		}
            
        }
    })
})

router.post('/userCenter/setting',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    var Id = decoded.Id;
    var data = req.body
    routeSql.AbpUsers.update(data,{where:{Id:decoded.Id,IsDeleted:false}}).then(function(){
    	res.send({error:0,result:{msg:'信息修改成功'}})
    }).catch(function(){
    	res.send({error:0,result:{msg:'信息修改失败'}})
    })
})

router.get('/ValidTime',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token, app.get('jwtTokenSecret'));
    routeSql.AbpUsers.findOne({where:{Id:decoded.Id,IsDeleted:false}}).then(function(UserData){
        if (UserData) {
            if (!UserData.dataValues.ExpirationTime) {
                res.send({error:550,result:{msg:'你是永久账户'}})
            } else {
                if ((Date.parse(UserData.dataValues.ExpirationTime) - new Date().getTime()) > 0) {
                    res.send({error:0,result:{ValidTime:(Date.parse(UserData.dataValues.ExpirationTime) - new Date().getTime())/1000}})
                } else {
                    res.send({error:551,result:{msg:'账号已经过期，请联系管理员'}})
                }
            }
        } else {
            res.send({error:2,result:{msg:'账号不存在'}})
        }
    })
})

module.exports = router;



