const fs = require('fs');

/**
 * 如果不存在的话就创建文件夹
 * @param path 路径
 */
exports.IfNotExistsCreate = (path) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
};

/**
 * 删除文件夹及里边所有的文件
 * @param path 路径
 */
exports.IfNotExistsDelete = (path) =>{
    delDir(path);
}

function delDir(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) {
                delDir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }
};