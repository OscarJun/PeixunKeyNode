 

var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段

// 添加资料
router.get('/AddMaterial',function(req,res){
    var token = req.headers.token;
    var decoded = jwt.decode(token,app.get('jwtTokenSecret'))//解析token
    // console.log(decoded)
})

module.exports = router;



