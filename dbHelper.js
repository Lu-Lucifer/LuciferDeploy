//const crypt = require("./cryptoHelper")
"use script"
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const guid = require('./guidHelper.js');
const fs1 = require('fs');
const path = require('path');
const {remote} = require('electron');
const DB_DIR = path.join(getUserHome(), `.${remote.app.name}`);
try {
    fs1.accessSync(DB_DIR);
} catch (err) {
    fs1.mkdirSync(DB_DIR);
}finally {
    console.log(DB_DIR);
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
// const adapter = new FileSync('db.json', {
//     serialize: (data) => crypt.encrypt('aes192',"lucifer666",JSON.stringify(data)),
//     deserialize: (data) => JSON.parse(crypt.decrypt('aes192',"lucifer666",data))
// })

let adapter = new FileSync(path.join(DB_DIR,'db.json'));
const db = low(adapter);

//初始化数据库
exports.initDd = () => {
    if (db.get('Servers').value() === undefined) {
        db.defaults({Servers: [], Projects: []}).write();
    }
}

//新增服务器配置
exports.Insert = (ip, username, userpwd, description) => {
    const id=guid.createGuid();
    db.get('Servers')
        .push({id: id, ip: ip, username: username, userpwd: userpwd, description: description})
        .write()
    return id;
}

exports.Update = (table,id,data)=>{
    db.get(table)
        .find({ id: id })
        .assign(data)
        .write();
}

//新增项目配置
exports.InsertProject = (projectName, projectPath, projectPackPath, projectServerPath, projectPort,projectVolumes, beforeShell, afterShell, description) => {
    const id=guid.createGuid();
    db.get('Projects')
        .push({
            id: id,
            projectName: projectName,
            projectPath: projectPath,
            projectPackPath: projectPackPath,
            projectServerPath: projectServerPath,
            projectPort: projectPort,
            projectVolumes:projectVolumes,
            beforeShell: beforeShell,
            afterShell: afterShell,
            description: description,
            deployVersion: []
        })
        .write()
    return id;
}

//根据项目插入版本
exports.insertDeployVersion = function (id,version) {
    db.get('Projects')
        .find({ id: id })
        .assign({deployVersion:version})
        .write();
};

//根据项目获取上一次的项目版本
exports.getLastDeployVersion = function (id) {
    let project=db.get('Projects')
        .find({id: id})
        .value();
    if(project!==undefined && project.deployVersion.length>0){
        return project.deployVersion;
    }
    return "";

};

//查询所有服务器
exports.searchServers = function (id) {
    if (id !== undefined && id.length > 0) {
        return db.get('Servers')
            .filter({id: id})
            .value()
    }
    return db.get('Servers')
        .value()
}

//查询所有项目配置
exports.searchProjects = function (id) {
    if (id !== undefined && id.length > 0) {
        return db.get('Projects')
            .filter({id: id})
            .value()
    }
    return db.get('Projects')
        .value()
}



function add(array, b) {
    array.unshift(b);
    return array;
}
