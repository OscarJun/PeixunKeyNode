

var express = require('express');
var router = express.Router();
var fs = require('fs');
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var crypto = require('crypto');
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
var md5 = function(str){
    var crypto_md5 = crypto.createHash('md5');
    crypto_md5.update(str,'utf8');
    return crypto_md5.digest('hex')
}
var qrImage = require('qr-image')
router.get('/qrImage',function(req,res){
    var tempQrcode = qrImage.image('http://127.0.0.1',{type:'png'});
    var imgName = 'ClassUrl'
    var imgName = `${imgName}.png`
    tempQrcode.pipe(fs.createWriteStream('./www/' + imgName)).on('error',function(err){
        res.send(err)
    }).on('finish',function(){
        res.send('二维码创建保存成功')
    })
    // tempQrcode.pipe(res)
    // res.type('png')
    // qrImage.image('http://127.0.0.1',{type:'png',size:1024,margin:1}).pipe(res)
})



// 我的班级
router.get('/MyClasses',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(decoded)
    if (decoded.UserType == 1) {
        routeSql.Classes.findAll({where:{IsDeleted:false,CreatorUserId:decoded.Id}}).then(function(arr){
            res.send(arr)
        })
    } else {}
})
router.post('/CreateClass',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    if (decoded.UserType == 1) {
        function fun1(){
        	var str = Math.random().toString(36).substr(2,6);
        	// console.log(str)
        	routeSql.Classes.findAll({where:{IsDeleted:false,InviteCode:str}}).then(function(arr){
        		if(arr.length == 0){
                    routeSql.Classes.create({
                        Name:req.body.name,
                        Logo:req.body.logoPath,
                        Summary:req.body.summary,
                        InviteCode:str,
                        // CodePath:'http://192.168.31.68:8900/' + str + '.png',
                        IsDeleted:false,
                        CreatorUserId:decoded.Id
                    }).then(function(data){
                        res.send({error:0,result:{msg:'班级创建成功'}})
                        var sData = {Info:{id:data.dataValues.Id},Command:2,uid:null};
                        var s = new Buffer(JSON.stringify(sData)).toString('base64');
                        console.log(s);
                        var tempQrcode = qrImage.image('http://localhost:8531/ScanCode/ToUrl?jsonstr=' + s,{type:'png'});
                        var imgName = `${data.dataValues.InviteCode}.png`
                        tempQrcode.pipe(fs.createWriteStream('./www/' + imgName))
                        routeSql.Classes.update({CodePath:Ipconfig.Local.LocalIpHost + ':' + Ipconfig.Local.LocalIpPort + '/' + data.dataValues.InviteCode + '.png'},{where:{Id:data.dataValues.Id}})
    			    })
        		}else{
        			fun1();
        		}
        	})
        }
    } else {
        res.send({error:1,result:{msg:'你没有创建班级的权限'}})
    }
    // var s = new Buffer('{"Info":"{"id":101}","Command":2,"uid":null}').toString('base64');
    // var data = {Info:{id:101},Command:2,uid:null};
    // var s = new Buffer(JSON.stringify(data)).toString('base64');
	// var b = new Buffer(s,'base64').toString();
	// console.log(s + ' ' + typeof(b) + ' ' + b)
    fun1();
})

router.get('/JoinClasses',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(decoded)
    // if (decoded.UserType == 1) {
    //     routeSql.Classes.findAll({where:{IsDeleted:false,CreatorUserId:decoded.Id}}).then(function(arr){
    //         res.send(arr)
    //     })
    // } else {}
})

module.exports = router;



