const db = require('./dbHelper.js');
const ssh = require('./sshHelper.js');
const fs = require('./fsHelper.js');
const ipcRenderer = require('electron').ipcRenderer;
const exec = require('child_process').exec;
const os = require('os');
const homeDir = os.homedir();
const tool = require('./tools.js');
const { spawn } = require('child_process');

var layer;//layui中的layer
var form;

function setValue(control, value) {
    document.getElementById(control).value = value;
}

function getValue(control) {
    return document.getElementById(control).value;
}

exports.createLayer = (lay,layform) => {
    layer = lay;
    form = layform;
};

//初始化
init();

function init() {
    //初始化数据库
    db.initDd();
    //初始化下拉框
    initDrpListServer();
    initDrpListProjects();

    //listen message form main proess
    listenMessage();
}

//加载服务器下拉框
function initDrpListServer() {
    let data = db.searchServers();
    let html = "<option value=\"0\">－请选择连接服务器－</option>";
    for (let i = 0; i < data.length; i++) {
        html += "<option value=\"" + data[i].id + "\">" + data[i].description + "</option>";
    }
    document.getElementById("drpServer").innerHTML = html;
}

//加载项目下拉框
function initDrpListProjects() {
    let data = db.searchProjects();
    let html = "<option value=\"0\">－请选择发布项目－</option>";
    for (let i = 0; i < data.length; i++) {
        html += "<option value=\"" + data[i].id + "\">" + data[i].projectName + "</option>";
    }
    document.getElementById("drpProjects").innerHTML = html;
}

function drpAddSelect(id, value, text) {
    document.getElementById(id).innerHTML += "<option value=\"" + value + "\">" + text + "</option>";
}

//设置服务器信息的值
exports.setServerInfo = (id) => {
    const data = db.searchServers(id);
    if (data === undefined || data.length === 0) return;
    const entity = data[0];
    setValue('txtIp', entity.ip);
    setValue('txtUserName', entity.username);
    setValue('txtPwd', entity.userpwd);
    setValue('txtDescription', entity.description);
};

function clearServerInfo(){
    setValue('txtIp', '');
    setValue('txtUserName', '');
    setValue('txtPwd', '');
    setValue('txtDescription', '');
};

//设置项目信息的值
exports.setProjectInfo = (id) => {
    let data = db.searchProjects(id);
    if (data === undefined || data.length === 0) return;
    const entity = data[0];
    setValue('txtProjectName', entity.projectName);
    setValue('txtProjectPath', entity.projectPath);
    setValue('txtPackPath', entity.projectPackPath);
    setValue('txtProjectServerPath', entity.projectServerPath);
    setValue('txtDockerParams', entity.projectDockerParams);
    setValue('txtBeforeShell', entity.beforeShell);
    setValue('txtAfterShell', entity.afterShell);
    setValue('txtProjectDescription', entity.description);
};


function clearProjectInfo(){
    setValue('txtProjectName', '');
    setValue('txtProjectPath', '');
    setValue('txtPackPath', '');
    setValue('txtProjectServerPath', '');
    setValue('txtDockerParams', '');
    setValue('txtBeforeShell', '');
    setValue('txtAfterShell', '');
    setValue('txtProjectDescription', '');
};

//获取连接服务器server
function getServer() {
    let server;
    if (getValue('txtPwd') === undefined || getValue('txtPwd').length === 0) {
        server = {
            host: getValue('txtIp'),
            port: 22,
            username: getValue('txtUserName'),
            privateKey: require('fs').readFileSync(homeDir+'/.ssh/id_rsa')
        }
    } else {
        server = {
            host: getValue('txtIp'),
            port: 22,
            username: getValue('txtUserName'),
            password: getValue('txtPwd')
        }
    }
    return server;
}

//连接测试 服务器
document.getElementById("btnConnection").onclick = () => {
    //const description = document.getElementById("txtDescription").value;
    let server = getServer();
    ssh.Exec(server, "ls", function (code, signal) {
        if (code > 0) {
            layer.alert('连接失败！');
            return;
        }
        layer.alert('连接成功！');
    })
};

//新增配置到数据库中
document.getElementById("btnAddConfig").onclick = () => {
    const id = db.Insert(getValue('txtIp'), getValue('txtUserName'), getValue('txtPwd'), getValue('txtDescription'));
    if (id.length > 0) {
        initDrpListServer();
        form.render('select');
        layer.alert('数据已生效！');        
    } else {
        layer.alert('操作失败！');
    }
};

//修改服务器参数的配置到数据库中
document.getElementById("btnEditConfig").onclick = () => {
    var id = document.getElementById("drpServer").value;
    db.Update('Servers', id, {
        ip: getValue('txtIp'),
        username: getValue('txtUserName'),
        userpwd: getValue('txtPwd'),
        description: getValue('txtDescription')
    });
    initDrpListServer();
    clearServerInfo();
    form.render('select');
    layer.alert('数据已生效！');    
};

//删除服务器配置
document.getElementById("btnDeleteConfig").onclick = () => {
    db.Delete('Servers',document.getElementById("drpServer").value);
    initDrpListServer();
    clearServerInfo();
    form.render('select');
    layer.alert('数据已生效！');    
};

//通过scp上传文件夹到服务器上
function scpLocalFileToServer(server) {
    return new Promise((resolve, reject) => {
        const localPath = getValue('txtPackPath')+'/'+getValue('txtProjectName');
            // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
            let cmdStr = ` scp -r ${localPath} ${getValue('txtUserName')}@${getValue('txtIp')}:${getValue('txtProjectServerPath')} `;
            console.log(cmdStr);
            const scp = spawn(cmdStr, {
                encoding: 'utf8',
                cwd: process.cwd(), // 执行命令路径
                shell: true, // 使用shell命令
              })
              
              // 监听标准输出
              scp.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
              });
              
              // 监听标准错误
              scp.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
                reject('上传失败！');
              });
              
              // 子进程关闭事件
              scp.on('close', (code) => {
                //console.log(`子进程退出，退出码 ${code}`);
                resolve('上传成功！');
              });
    })
}

//服务器进行解压文件
function ServerTarFile(server, fileName) {
    return new Promise((resolve, reject) => {
        const cmd = `tar -xf ${getValue('txtProjectServerPath')}/${fileName} -C ${getValue('txtProjectServerPath')}`;
        console.log(cmd);
        ssh.Exec(server
            , cmd
            , function (code, signal) {
                if (code === 0) {
                    resolve('解压成功！');
                    return;
                }
                reject('解压失败！');
            })
    })
}

//创建镜像
function BuildImages(server, version) {
    return new Promise((resolve, reject) => {
        const cmd = `sudo docker build --no-cache --rm -t ${getValue('txtProjectName').toLowerCase()}:${version} -f ${getValue('txtProjectServerPath')}/${getValue('txtProjectName')}/Dockerfile ${getValue('txtProjectServerPath')}/${getValue('txtProjectName')}/`;
        console.log(cmd);
        ssh.Exec(server
            , cmd
            , function (code, signal) {
                if (code > 0) {
                    reject("创建镜像失败！");
                    return;
                }
                resolve('创建镜像成功！');
            })
    })
}

//停止容器
function StopContainer(server) {
    return new Promise((resolve, reject) => {
        const cmd = `sudo docker rm -f ${getValue('txtProjectName').toLowerCase()}`;
        console.log(cmd);
        ssh.Exec(server
            , cmd
            , function (code, signal) {
                resolve('停止容器成功！')
            })
    })
}

//创建容器
function CreateContainer(server, version) {
    return new Promise((resolve) => {
        const cmd = `sudo docker run --name=${getValue('txtProjectName').toLowerCase()}  -d --restart=always ${getValue('txtDockerParams')} ${getValue('txtProjectName').toLowerCase()}:${version}`;
        console.log(cmd);
        ssh.Exec(server
            , cmd
            , function (code, signal) {
                resolve('创建容器成功！')
            });
    });
}

//执行命令shell
function DoShell(server,cmd) {
    return new Promise((resolve) => {
        if(cmd!==undefined && cmd.length>0){
            ssh.Exec(server, cmd
                , function (code, signal) {
                    resolve('操作完成！');
                });
        }else{
            resolve('操作完成！');
        }
    });
}

//进行发布
document.getElementById("btnDockerDeploy").onclick = () => {
    const server = getServer();
    var filename, versionname;
    versionname =  tool.DateFormat('yyyyMMddhhmmss')
    DoShell(server,getValue('txtBeforeShell'))
        .then((data)=>{
            layer.msg("开始进行发布");
            return ProjectsPublish();
        })
        .then((data)=>{
            layer.msg("开始进行备份项目");
            return ProjectBackUp(server);
        })
        .then((data) => {
            layer.msg("开始上传文件！");
            return scpLocalFileToServer(server);
        })
        .then((data) => {
            layer.msg('开始创建镜像！');
            return BuildImages(server, versionname);
        })
        .then((data) => {
            layer.msg('开始停止容器！');
            return StopContainer(server);
        })
        .then((data) => {
            layer.msg('开始创建容器！');
            return CreateContainer(server, versionname);
        })
        .then((data) => {
            layer.msg('开始删除之前的容器！');
            return DeleteImages(server,getValue('txtProjectName').toLowerCase());
        })
        .then((data)=>{
            db.Update("Projects",document.getElementById('drpProjects').value, {deployVersion:versionname});
            fs.IfNotExistsDelete(getValue('txtPackPath')+'/Deploy');
            fs.IfNotExistsDelete(getValue('txtPackPath')+'/'+getValue('txtProjectName'));
            fs.IfNotExistsDelete(getValue('txtPackPath')+'/Release');
            new Notification("Docker发布",  {
                title: "LuciferDeploy",
                body: "发布完成!"
            });
            return DoShell(server,getValue('txtAfterShell'))
        })
        .catch((data) => {
            console.log(data);
            new Notification("Docker发布",  {
                title: "LuciferDeploy",
                body: "发布失败!"
            });
        })
};

//发布文件到服务器上面
document.getElementById('btnFileDeploy').onclick = () => {
    const server = getServer();
    DoShell(server,getValue('txtBeforeShell'))
        .then((data) => {
            layer.msg("开始上传文件！");
            return scpLocalFileToServer(server);
        })
        .then(data=>{
            new Notification("文件发布",  {
                title: "成功",
                body: "发布成功!"
            });
            fs.IfNotExistsDelete(getValue('txtPackPath')+'/'+getValue('txtProjectName'));
            return DoShell(server,getValue('txtAfterShell'))
        })
        .catch((data) => {
            console.log(data);
            new Notification("文件发布",  {
                title: "发布失败!",
                body: "发布失败!"
            });
        })
};

//新增项目配置
document.getElementById('btnAddProjectConfig').onclick = () => {
    const id = db.InsertProject(getValue('txtProjectName')
        , getValue('txtProjectPath')
        , getValue('txtPackPath')
        , getValue('txtProjectServerPath')
        , getValue('txtDockerParams')
        , getValue('txtBeforeShell')
        , getValue('txtAfterShell')
        , getValue('txtProjectDescription'));
    if (id.length > 0) {
        drpAddSelect('drpProjects', id, getValue('txtProjectName'));
        initDrpListProjects();
        form.render('select');
        layer.alert('数据已生效！');
    } else {
        layer.alert('操作失败！');
    }
};

//修改项目配置
document.getElementById('btnEditProjectConfig').onclick = () => {
    db.Update('Projects', getValue('drpProjects'),
        {
            projectName: getValue('txtProjectName'),
            projectPath: getValue('txtProjectPath'),
            projectPackPath: getValue('txtPackPath'),
            projectServerPath: getValue('txtProjectServerPath'),
            projectDockerParams: getValue('txtDockerParams'),
            beforeShell: getValue('txtBeforeShell'),
            afterShell: getValue('txtAfterShell'),
            description: getValue('txtProjectDescription'),
        });
        initDrpListProjects();
        clearProjectInfo();
        form.render('select');
    layer.alert('数据已生效！');
}

//删除项目配置
document.getElementById('btnDeleteProjectConfig').onclick = () => {
    db.Delete('Projects', getValue('drpProjects'));
    initDrpListProjects();
    clearProjectInfo();
    form.render('select');
    layer.alert('数据已生效！');
}

//选择项目路径，到sln文件
document.getElementById('btnProjectPath').onclick = () => {
    ipcRenderer.send('asynchronous-message', 'txtProjectPath');
};

//选择打包路径，到文件夹
document.getElementById('btnSelectPackPath').onclick = () => {
    ipcRenderer.send('asynchronous-message', 'txtPackPath');
};

//监听主线程上面传回来的选择路径的信息
function listenMessage() {
    ipcRenderer.on('asynchronous-reply', function (event, arg) {
        document.getElementById(arg[0]).value = arg[1];
    });
}

//项目生成
document.getElementById("btnPublish").onclick = () => {
    ProjectsPublish().then((data)=>{
        new Notification("项目生成",  {
            title: "失败!",
            body: "项目发布失败，请解决问题后重试！"
        });
    }).catch((data) => {
        new Notification("项目生成",  {
            title: "发布成功!",
            body: "发布成功!"
        });
    });
};

// 生成发布后的项目
function ProjectsPublish(){
    return new Promise((resolve) => {
        // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
        let cmdStr = `/usr/local/bin/dotnet publish ${getValue('txtProjectPath')} -c Release -o ${getValue('txtPackPath')}/${getValue("txtProjectName")} `;
        console.log(cmdStr);

        let workerProcess = exec(cmdStr,{});
        // 不受child_process默认的缓冲区大小的使用方法，没参数也要写上{}：workerProcess = exec(cmdStr, {})

        // 打印正常的后台可执行程序输出
        workerProcess.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
        });

        // 打印错误的后台可执行程序输出
        workerProcess.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });

        // 退出之后的输出 1失败，0成功
        workerProcess.on('close', function (code) {
            console.log('public result=>' + code);
            if (code > 0) {
                reject("publish project fail");
            } else {
                resolve("publish project success");
            }
        });
    });
}

// 备份项目
function ProjectBackUp(server){
    return new Promise((resolve, reject) => {
        var path = `${getValue('txtProjectServerPath')}/${getValue("txtProjectName")}`;
        const cmd = `cp -rf ${path} ${path}${tool.DateFormat('yyyyMMddhhmmss')}`;
        console.log(cmd);
        ssh.Exec(server
            , cmd
            , function (code, signal) {
                if (code > 0) {
                    console.log("备份成功！")
                }else{
                    console.log("备份失败！")
                }    
                resolve("备份成功！");            
            })
    })
}    

//删除容器
function DeleteContainer(server,container){
    return new Promise((resolve) => {
        const cmd = `docker rm -f $(docker ps | grep ${container} |  awk  '{print $1}')`
        console.log(cmd);
        ssh.Exec(server
            , cmd
            , function (code, signal) {
                resolve('删除容器！')
            });
    });
}
//删除镜像
function DeleteImages(server,container){
    return new Promise((resolve) => {
        const cmd = `docker rmi -f $(docker images | grep ${container} |  awk  '{print $3}')`
        console.log(cmd);
        ssh.Exec(server
            , cmd
            , function (code, signal) {
                resolve('删除容器！')
            });
    });
}

document.getElementById("btnDeleteContainer").onclick = () =>{
    const server = getServer();
    DeleteContainer(server, getValue('txtProjectName').toLowerCase()).then(()=>{
        layer.alert('已删除！');
    }).catch(data=>{
        layer.alert('操作失败！');
    });
};

document.getElementById("btnDeleteImages").onclick = () =>{
    const server = getServer();
    DeleteImages(server, getValue('txtProjectName').toLowerCase()).then(()=>{
        layer.alert('已删除！');
    }).catch(data=>{
        layer.alert('操作失败！');
    });
};
