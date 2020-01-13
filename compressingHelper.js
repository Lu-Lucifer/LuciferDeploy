const compressing = require('compressing');
const tool = require('./tools.js');
const fs = require('./fsHelper.js');


exports.directoryToFile=(localPath,packPath,then)=>{
    let fileName = tool.DateFormat('yyyyMMddhhmmss')+'.tgz';
    fs.IfNotExistsDelete(packPath);
    fs.IfNotExistsCreate(packPath);
    compressing.tgz.compressDir(localPath, packPath+"/"+fileName)
        .then(() => {
            then(fileName,1);
        })
        .catch(err => {
            then(err,0);
        });
};