const fstream = require('fstream');
const tar = require('tar');
const zlib = require('zlib');
//const fs = require('fs');

//这个方法有问题，pipe(tar.Pack())报错，下次有空解决
exports.tarDirectoryToFile=(localPath)=>{
    // fstream.Reader({'path':localPath,'type':'Directory'})
    //   //  .pipe(new tar.Pack())
    //     .pipe(zlib.gzip())
    //     .pipe(fstream.Writer({'path':localPath+new Date().format('yyyy-MM-dd hh:mm:ss')+'.tar.gz'}))

console.log(localPath);
    fstream.Reader({ 'path': localPath, 'type': 'Directory' }) /* Read the source directory */
        .pipe(tar.Pack()) /* Convert the directory to a .tar file */
        .pipe(zlib.gzip()) /* Compress the .tar file */
        .pipe(fstream.Writer({ 'path': localPath+"1.tar.gz" })); /* Give the output file name */
}


