var zipper = require("zip-local");

exports.directoryToFile=(localPath)=>{
    zipper.sync.zip(localPath).compress().save(localPath.replace('Release','1.tar'));
    // cwd：需要压缩源文件的路径
    // src：需要压缩的文件 ** 是全部文件
    // dest 是解压后的层级，如果不设置会使用src的全部层级
}
