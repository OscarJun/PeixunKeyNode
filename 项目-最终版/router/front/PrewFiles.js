
var express = require('express');
var router = express.Router();
var routeSql = require('../sql/routeSql.js');
var fs = require('fs')
var jwt = require('jwt-simple');//引入node的token生成验证包
var app = express();
app.set('jwtTokenSecret','JingGe');//设置token加密字段
var qrImage = require('qr-image')
var fs = require('fs')
var Ipconfig = require('../Ipconfig/Ipconfig.js').Ipconfig
// var msopdf = require('node-msoffice-pdf');
var toPdf = require("office-to-pdf")
var fs = require("fs")
router.get('/PrewFiles',function(req,res){
// var wordBuffer = fs.readFileSync("./router/front/abc.doc")

// toPdf(wordBuffer).then(function(pdfBuffer){
//     fs.writeFileSync("abc.pdf", pdfBuffer).then(function(err){
//     	console.log('++++++++++++')
//     	res.send(err)
//     }).catch(function(err){
//     	console.log('----------')
//     	res.send(err)
//     })
//   }
// )
	// msopdf(null,function(error,office){
	// 	if (error) { 
	// 		// console.log("Init failed", error);
	// 		return;
	// 	}
	// 	// office.word({input:'./景格培训学校余俊 2017年7月月报.docx',output:'景格培训学校余俊 2017年7月月报.pdf'},function(error,pdf){
	// 	// 	if (error) {
	// 	// 		res.send(error)
	// 	// 	} else {
	// 	// 		res.send(pdf)
	// 	// 	}
	// 	// })
	// 	// office.excel({input: "./ImportUser.xls", output: "ImportUser.pdf"}, function(error, pdf) { 
	// 	// 	if (error) { 
	// 	// 		res.send(error)
	// 	// 	} else { 
	// 	// 		res.send(pdf)
	// 	// 	}
	// 	// });
	// 	// office.powerPoint({input: "./附件4：试用期转正述职报告—某某某.ppt", output: "附件4：试用期转正述职报告—某某某.pdf"}, function(error, pdf) { 
	// 	// 	if (error) { 
	// 	// 		res.send(error)
	// 	// 	} else { 
	// 	// 		res.send(pdf)
	// 	// 	}
	// 	// });
	// })
})

module.exports = router;

// msopdf(null, function(error, office) { 
 
//     if (error) { 
//       console.log("Init failed", error);
//       return;
//     }
 
//    /*
//      There is a queue on the background thread, so adding things is non-blocking.
//    */
 
//    office.word({input: "infile.doc", output: "outfile.pdf"}, function(error, pdf) { 
//       if (error) { 
//            /* 
//                Sometimes things go wrong, re-trying usually gets the job done
//                Could not get remoting to repiably not crash on my laptop
//            */
//            console.log("Woops", error);
//        } else { 
//            console.log("Saved to", pdf);
//        }
//    });
 
 
//    office.excel({input: "infile.xlsx", output: "outfile.pdf"}, function(error, pdf) { 
//        if (error) { 
//            console.log("Woops", error);
//        } else { 
//            console.log("Saved to", pdf);
//        }
//    });
 
 
//    office.powerPoint({input: "infile.pptx", output: "outfile.pdf"}, function(error, pdf) { 
//        if (error) { 
//            console.log("Woops", error);
//        } else { 
//            console.log("Saved to", pdf);
//        }
//    });
 
//    /*
//      Word/PowerPoint/Excel remain open (for faster batch conversion)
 
//      To clean them up, and to wait for the queue to finish processing
//    */
 
//    office.close(null, function(error) { 
//        if (error) { 
//            console.log("Woops", error);
//        } else { 
//            console.log("Finished & closed");
//        }
//    });
// });