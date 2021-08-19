"use strict"
var util=require("util")
var events=require("events");
var Client = require("ssh2").Client;
var fs = require("fs");
var path = require('path');
 
 
/**
* 描述：连接远程电脑
* 参数：server 远程电脑凭证；then 回调函数
* 回调：then(conn) 连接远程的client对象
*/
function Connect(server, then){
	var conn = new Client();
	conn.on("ready", function(){
		//console.log("connect Ok!");
		then(conn);
	}).on('error', function(err){
		then(conn,err);
		//console.log("connect error!");
	}).on('end', function() {
		//console.log("connect end!");
	}).on('close', function(had_error){
		//console.log("connect close!");
	}).connect(server);	
}
 
/**
* 描述：运行shell命令
* 参数：server 远程电脑凭证；cmd 执行的命令；then 回调函数
* 回调：then(err, data) ： data 运行命令之后的返回数据信息
*/
function Shell(server, cmd, then){
	Connect(server, function(conn,err){
		if(err!==undefined){
			then(err,"error");
			return;
		}
		conn.shell(function(err, stream){
			if(err){
				then(err);
			}else{// end of if
				var buf = "";
				stream.on('close', function(){						
					conn.end();						
					then(err, buf);
				}).on('data', function(data){
					buf=buf+data;	
					process.stdout.write("["+new Date()+'] '+data);								
				}).on("error", function (data) {
					console.log("["+new Date()+'] err: ' + data);
				}).stderr.on('data', function(data) {
					console.log("["+new Date()+'] stderr: ' + data);
				});	
				stream.end(cmd);		
			}							
		});
	});	
}

/**
 * 描述：执行linux命令
 * 参数：server 远程电脑凭证；cmd 指令；then 回调函数
 * 回调：then(err, result)
 */
function Exec(server,cmd,then){
	Connect(server,function(conn,err){
		if(err) {
			then(err);
			return;
		}
		conn.exec(cmd, function(err, stream) {
			if (err) then(err);
			stream.on('close', function(code, signal) {
				//console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
				conn.end();
				then(code, signal);
			}).on('data', function(err,data) {
				console.log("["+new Date()+'] ' + err.toString());
				//console.log('STDOUT: ' + data);
			}).stderr.on('data', function(data) {
				console.log("["+new Date()+'] STDERR: ' + data);
			});

		});
	})
}


// /**
//  * 描述：执行linux命令
//  * 参数：server 远程电脑凭证；cmd 指令；then 回调函数
//  * 回调：then(err, result)
//  * 结果返回：resultFunc
//  */
// function Exec(server,cmd,then,resultFunc){
// 	Connect(server,function(conn,err){
// 		if(err) {
// 			then(err);
// 			return;
// 		}
// 		conn.exec(cmd, function(err, stream) {
// 			if (err) then(err);
// 			stream.on('close', function(code, signal) {
// 				//console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
// 				conn.end();
// 				then(code, signal);
// 			}).on('data', function(err,data) {
// 				console.log(err.toString());
// 				resultFunc(err.toString());
// 				//console.log('STDOUT: ' + data);
// 			}).stderr.on('data', function(data) {
// 				//console.log('STDERR: ' + data);
// 			});
//
// 		});
// 	})
// }


 
/**
* 描述：上传文件
* 参数：server 远程电脑凭证；localPath 本地路径；remotePath 远程路径；then 回调函数
* 回调：then(err, result)
*/
function UploadFile(server, localPath, remotePath , then){
	Connect(server, function(conn,err){
		if(err!==undefined){
			then(err,0);
		}
		conn.sftp(function(err, sftp){
			if(err!==undefined){
				then(err,0);
			}else{

				sftp.fastPut(localPath, remotePath, function(err, result){
					conn.end();
					then(err, 1);
				});
			}
		});
	});
}
 
/**
* 描述：下载文件
* 参数：server 远程电脑凭证；remotePath 远程路径；localPath 本地路径；then 回调函数
* 回调：then(err, result)
*/
function DownloadFile(server, remotePath, localPath, then){
	Connect(server, function(conn,err){
		conn.sftp(function(err, sftp){
			if(err){
				then(err);
			}else{
				sftp.fastGet(remotePath, localPath, function(err, result){
					if(err){
						then(err);
					}else{
						conn.end();
						then(err, result);
					}
				});
			}
		});
	});
}
 
/**
* 描述：获取远程文件路径下文件列表信息
* 参数：server 远程电脑凭证；
*		remotePath 远程路径；
*		isFile 是否是获取文件，true获取文件信息，false获取目录信息；
*		then 回调函数
* 回调：then(err, dirs) ： dir, 获取的列表信息
*/
function GetFileOrDirList(server, remotePath, isFile, then){
	var cmd = "find " + remotePath + " -type "+ (isFile == true ? "f":"d") + "\r\nexit\r\n";	
	Shell(server, cmd, function(err, data){
		var arr = [];
		var remoteFile = [];
		arr = data.split("\r\n");
		arr.forEach(function(dir){
			if(dir.indexOf(remotePath) ==0){
				remoteFile.push(dir);
			}
		});
		then(err, remoteFile);
	});
}
 
/**
* 描述：控制上传或者下载一个一个的执行
*/
function Control(){
	events.EventEmitter.call(this);
}
util.inherits(Control, events.EventEmitter); // 使这个类继承EventEmitter
 
var control = new Control();
 
control.on("donext", function(todos, then){
	if(todos.length > 0){
		var func = todos.shift();
		func(function(err, result){
			if(err){
				throw err;	
				then(err);
			}else{			
				control.emit("donext", todos, then);					
			}
		});
	}else{			
		then(null);
	}
});
 
 
/**
* 描述：下载目录到本地
* 参数：server 远程电脑凭证；
*		remotePath 远程路径；
*		localDir 本地路径，
*		then 回调函数
* 回调：then(err)
*/
function DownloadDir(server, remoteDir,localDir, then){
	GetFileOrDirList(server, remoteDir, false, function(err, dirs){
		if(err){
			throw err;
		}else{
			GetFileOrDirList(server, remoteDir, true, function(err, files){
				if(err){
					throw err;
				}else{					
					dirs.shift();
					dirs.forEach(function(dir){	
						var tmpDir = path.join(localDir, dir.slice(remoteDir.length+1)).replace(/[//]\g/, '\\');
						// 创建目录
						fs.mkdirSync(tmpDir);				
					});
					var todoFiles = [];
					files.forEach(function(file){
						var tmpPath = path.join(localDir, file.slice(remoteDir.length+1)).replace(/[//]\g/, '\\');
						todoFiles.push(function(done){
							DownloadFile(server, file, tmpPath, done);							
							console.log("downloading the "+file);
						});// end of todoFiles.push						
					});
					control.emit("donext", todoFiles, then);
				}
			});
		}
	});
}
 
/**
* 描述：获取windows上的文件目录以及文件列表信息
* 参数：destDir 本地路径，
*		dirs 目录列表
*		files 文件列表
*/
function GetFileAndDirList(localDir, dirs, files){
	var dir = fs.readdirSync(localDir);
	for(var i = 0; i < dir.length; i ++){
		var p = path.join(localDir, dir[i]);
		var stat = fs.statSync(p); 
		if(stat.isDirectory())
		{
			dirs.push(p);
			GetFileAndDirList(p, dirs, files);
		}
		else
		{
			files.push(p);
		}
	}
}
 
/**
* 描述：上传文件夹到远程目录
* 参数：server 远程电脑凭证；
*		localDir 本地路径，
*		remotePath 远程路径；
*		then 回调函数
* 回调：then(err)
*/
function UploadDir(server, localDir, remoteDir, then){
	var dirs = [];
	var files = [];
	GetFileAndDirList(localDir, dirs, files);
	
	// 创建远程目录
	var todoDir = [];
	dirs.forEach(function(dir){
		todoDir.push(function(done){			
			var to = path.join(remoteDir, dir.slice(localDir.length+1)).replace(/[\\]/g, '/');
			var cmd = "mkdir -p " + to +"\r\nexit\r\n";
			console.log(cmd);
			Shell(server, cmd, done);
		})// end of push
	});
	
	// 上传文件
	var todoFile = [];
	files.forEach(function(file){
		todoFile.push(function(done){
			var to  = path.join(remoteDir, file.slice(localDir.length+1)).replace(/[\\]/g, '/');
			console.log("upload " + to);
			UploadFile(server, file, to, done);
		});
	});
	
	control.emit("donext", todoDir, function(err){
		if(err){
			throw err;
		}else{			
			control.emit("donext", todoFile, then);
		}
	});
	
}
 
exports.Shell = Shell;
exports.Exec = Exec;
exports.UploadFile = UploadFile;
exports.DownloadFile = DownloadFile;
exports.GetFileOrDirList = GetFileOrDirList;
exports.DownloadDir = DownloadDir;
exports.UploadDir = UploadDir;