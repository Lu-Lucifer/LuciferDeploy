const db = require('./dbHelper.js');
const ssh = require('./sshHelper.js');
const compressing = require('./compressingHelper.js');
const fs = require('./fsHelper.js');
const ipcRenderer = require('electron').ipcRenderer;
const exec = require('child_process').exec;
var layer;//layui中的layer

function setValue(control, value) {
    document.getElementById(control).value = value;
}

function getValue(control) {
    return document.getElementById(control).value;
}

exports.createLayer = (lay) => {
    layer = lay;
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

//设置项目信息的值
exports.setProjectInfo = (id) => {
    let data = db.searchProjects(id);
    if (data === undefined || data.length === 0) return;
    const entity = data[0];
    setValue('txtProjectName', entity.projectName);
    setValue('txtProjectPath', entity.projectPath);
    setValue('txtPackPath', entity.projectPackPath);
    setValue('txtProjectServerPath', entity.projectServerPath);
    setValue('txtPort', entity.projectPort);
    setValue('txtVolume', entity.projectVolumes);
    setValue('txtBeforeShell', entity.beforeShell);
    setValue('txtAfterShell', entity.afterShell);
    setValue('txtProjectDescription', entity.description);
};

//获取连接服务器server
function getServer() {
    let server;
    if (getValue('txtPwd') === undefined || getValue('txtPwd').length === 0) {
        server = {
            host: getValue('txtIp'),
            port: 22,
            username: getValue('txtUserName'),
            privateKey: require('fs').readFileSync('/Users/lucifer/.ssh/id_rsa')
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

//连接服务器
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

//进行本地压缩
function localCompressing() {
    return new Promise((resolve, reject) => {
        compressing.directoryToFile(
            getValue('txtPackPath')+'/'+getValue('txtProjectName')
            , getValue('txtPackPath')+"/Deploy", function (data, err) {
                if (err === 0) {
                    reject("压缩失败！");
                    return;
                }
                resolve(data);
            });
    })
}

//上传文件到服务器上面
function localFileToServer(server, data) {
    return new Promise((resolve, reject) => {
        const fileName = data;
        ssh.UploadFile(server, `${getValue('txtPackPath')}/Deploy/${data}`
            , getValue('txtProjectServerPath') + '/' + data
            , function (err, data) {
                if (err !== undefined && data !== 1) {
                    reject("上传文件失败！");
                    return;
                }
                resolve(fileName);
            })
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
        const cmd = `sudo docker run --name  ${getValue('txtProjectName').toLowerCase()}  -d --restart=always -p ${getValue('txtPort')} ${getValue('txtVolume')} ${getValue('txtProjectName').toLowerCase()}:${version}`;
        console.log(cmd);
        ssh.Exec(server
            , cmd
            , function (code, signal) {
                resolve('创建容器成功！')
            });
    });
}

//删除改项目之前创建的镜像
function DeleteImages(server) {
    return new Promise((resolve) => {
            const lastVersion = db.getLastDeployVersion(document.getElementById('drpProjects').value);
            if(lastVersion===undefined || lastVersion===""){
                resolve('没有容器！');
                return;
            }
            const cmd = `docker rmi $(docker images | grep ${getValue('txtProjectName').toLowerCase()} | grep  "${lastVersion}" | awk  '{print $3}')`;
            console.log(cmd);
            ssh.Exec(server, cmd
                , function (code, signal) {
                    resolve('删除之前的镜像成功！');
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

    DoShell(server,getValue('txtBeforeShell'))
        .then((data)=>{
            layer.msg('开始压缩！');
            return localCompressing();
        })
        .then((data) => {
            layer.msg("压缩成功！");
            layer.msg("开始上传文件！");
            return localFileToServer(server, data);
        })
        .then((data) => {
            layer.msg('上传成功！');
            layer.msg('开始解压！');
            filename = data;
            versionname = data.replace('.tgz', '');
            return ServerTarFile(server, filename);
        })
        .then((data) => {
            layer.msg(data+'创建镜像开始！');
            return BuildImages(server, versionname);
        })
        .then((data) => {
            layer.msg(data+'开始停止容器！');
            return StopContainer(server);
        })
        .then((data) => {
            layer.msg(data+'开始创建容器！');
            console.log('create');
            return CreateContainer(server, versionname);
        })
        .then((data) => {
            layer.msg(data+'开始删除之前的容器！');
            return DeleteImages(server);
        })
        .then((data)=>{
            db.Update("Projects",document.getElementById('drpProjects').value, {deployVersion:versionname});
            fs.IfNotExistsDelete(getValue('txtPackPath')+'/Deploy');
            fs.IfNotExistsDelete(getValue('txtPackPath')+'/'+getValue('txtProjectName'));
            fs.IfNotExistsDelete(getValue('txtPackPath')+'/Release');
            //layer.alert('发布完成！');
            new Notification("发布完成!",  {
                title: "发布完成!",
                body: "发布完成!"
            });
            return DoShell(server,getValue('txtAfterShell'))
        })
        .catch((data) => {
            console.log(data);
            new Notification("发布失败!",  {
                title: "发布失败!",
                body: "发布失败!"
            });
        })
};

//发布文件到服务器上面
document.getElementById('btnFileDeploy').onclick = () => {
    const server = getServer();
    var filename, versionname;
    DoShell(server,getValue('txtBeforeShell'))
        .then((data)=>{
            layer.msg('开始压缩！');
            return localCompressing();
        })
        .then((data) => {
            layer.msg("压缩成功！");
            layer.msg("开始上传文件！");
            return localFileToServer(server, data);
        })
        .then((data) => {
            layer.msg('上传成功！');
            layer.msg('开始解压！');
            filename = data;
            versionname = data.replace('.tgz', '');
            return ServerTarFile(server, filename);
        })
        .then(data=>{
            new Notification("成功",  {
                title: "成功",
                body: "发布成功!"
            });
            fs.IfNotExistsDelete(getValue('txtPackPath')+'/Deploy');
            return DoShell(server,getValue('txtAfterShell'))
        })
        .catch((data) => {
            console.log(data);
            new Notification("发布失败!",  {
                title: "发布失败!",
                body: "发布失败!"
            });
        })
};

//新增配置到数据库中
document.getElementById("btnAddConfig").onclick = () => {
    const id = db.Insert(getValue('txtIp'), getValue('txtUserName'), getValue('txtPwd'), getValue('txtDescription'));
    if (id.length > 0) {
        layer.alert('数据已生效！');
        drpAddSelect('drpList', id, getValue('txtIp'));
    } else {
        layer.alert('操作失败！');
    }
};

//修改服务器参数的配置到数据库中
document.getElementById("btnEditConfig").onclick = () => {
    db.Update('Servers', document.getElementById("drpServer").value, {
        ip: getValue('txtIp'),
        username: getValue('txtUserName'),
        userpwd: getValue('txtPwd'),
        description: getValue('txtDescription')
    });
    layer.alert('数据已生效！');
};

//新增项目配置
document.getElementById('btnAddProjectConfig').onclick = () => {
    const id = db.InsertProject(getValue('txtProjectName')
        , getValue('txtProjectPath')
        , getValue('txtPackPath')
        , getValue('txtProjectServerPath')
        , getValue('txtPort')
        , getValue('txtVolume')
        , getValue('txtBeforeShell')
        , getValue('txtAfterShell')
        , getValue('txtProjectDescription'));
    if (id.length > 0) {
        drpAddSelect('drpProjects', id, getValue('txtProjectName'));
        layer.alert('数据已生效！');
    } else {
        layer.alert('操作失败！');
    }
};

//修改项目配置信息到数据库中
document.getElementById('btnEditProjectConfig').onclick = () => {
    db.Update('Projects', getValue('drpProjects'),
        {
            projectName: getValue('txtProjectName'),
            projectPath: getValue('txtProjectPath'),
            projectPackPath: getValue('txtPackPath'),
            projectServerPath: getValue('txtProjectServerPath'),
            projectPort: getValue('txtPort'),
            projectVolumes: getValue('txtVolume'),
            beforeShell: getValue('txtBeforeShell'),
            afterShell: getValue('txtAfterShell'),
            description: getValue('txtProjectDescription'),
        })
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

document.getElementById("btnPublish").onclick = () => {
    // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
    let cmdStr = ` /usr/local/share/dotnet/dotnet publish ${getValue('txtProjectPath')} -c Release -o ${getValue('txtPackPath')}/${getValue("txtProjectName")} `;
    console.log(cmdStr);
   //let workerProcess = exec('dotnet', [`publish ${getValue('txtProjectPath')} -c Release -o ${getValue('txtPackPath')}/${getValue("txtProjectName")}`]);

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
            //layer.alert("");
            new Notification("失败!",  {
                title: "失败!",
                body: "项目发布失败，请解决问题后重试！"
            });
        } else {
            new Notification("发布成功!",  {
                title: "发布成功!",
                body: "发布成功!"
            });
        }
    })
};

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
