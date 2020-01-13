
// var fs = require('fs');
// let server = {
//     host: 'lubaba.xyz',
//     port: 22,
//     username: 'root',
//     privateKey: '/Users/lucifer/.ssh/id_rsa'
// }
//var ssh1 = ssh.connect(server);
// ssh.connect(server).then(function() {
//         // // Local, Remote
//         // ssh.putFile('/home/steel/Lab/localPath', '/home/steel/Lab/remotePath').then(function() {
//         //     console.log("The File thing is done")
//         // }, function(error) {
//         //     console.log("Something's wrong")
//         //     console.log(error)
//         // })
//         // // Array<Shape('local' => string, 'remote' => string)>
//         // ssh.putFiles([{ local: '/home/steel/Lab/localPath', remote: '/home/steel/Lab/remotePath' }])
//         //     .then(function() {
//         //         console.log("The File thing is done")
//         //     }, function(error) {
//         //         console.log("Something's wrong")
//         //         console.log(error)
//         //     })
//         // // Local, Remote
//         // ssh.getFile('/home/steel/Lab/localPath', '/home/steel/Lab/remotePath')
//         //     .then(function(Contents) {
//         //         console.log("The File's contents were successfully downloaded")
//         //     }, function(error) {
//         //         console.log("Something's wrong")
//         //         console.log(error)
//         //     })
//         // // Putting entire directories
//         // const failed = []
//         // const successful = []
//         // ssh.putDirectory('/home/steel/Lab', '/home/steel/Lab', {
//         //     recursive: true,
//         //     concurrency: 10,
//         //     validate: function(itemPath) {
//         //         const baseName = path.basename(itemPath)
//         //         return baseName.substr(0, 1) !== '.' && // do not allow dot files
//         //             baseName !== 'node_modules' // do not allow node_modules
//         //     },
//         //     tick: function(localPath, remotePath, error) {
//         //         if (error) {
//         //             failed.push(localPath)
//         //         } else {
//         //             successful.push(localPath)
//         //         }
//         //     }
//         // }).then(function(status) {
//         //     console.log('the directory transfer was', status ? 'successful' : 'unsuccessful')
//         //     console.log('failed transfers', failed.join(', '))
//         //     console.log('successful transfers', successful.join(', '))
//         // })
//         // Command
//         ssh.execCommand('ls', { cwd:'/var/www' }).then(function(result) {
//             console.log('STDOUT: ' + result.stdout)
//             console.log('STDERR: ' + result.stderr)
//         })
//         // Command with escaped params
//         ssh.exec('ls', ['-a'], { cwd: '/var/www', stream: 'stdout', options: { pty: true } })
//             .then(function(result) {
//                 console.log('STDOUT: ' + result)
//             })
//         // With streaming stdout/stderr callbacks
//         /*ssh.exec('ls', ['-a'], {
//             cwd: '/var/www',
//             onStdout(chunk) {
//                 console.log('stdoutChunk', chunk.toString('utf8'))
//             },
//             onStderr(chunk) {
//                 console.log('stderrChunk', chunk.toString('utf8'))
//             },
//         })*/
//
//     })

// function sshAsync(i){
//     return new Promise((resolve, reject) => {
//         if (i===0) reject(0)
//         else resolve(1)
//     })
// }
//
// sshAsync(1).then(data=>{
//     console.log(data);
//     return sshAsync(0)
// }).then(data=>{
//     console.log(data);
//     return sshAsync(1)
// })
//     .catch(err=>{
//     console.log(err);
// })
//
/*const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
let adapter = new FileSync('db.json');
const db = low(adapter);
// function Delete1 (table,id){
//     db.get(table)
//         .where({ id: id })
//         .remove()
//         .write();
// }
//
// Delete1("Servers",'251d9050-93b9-4f65-ad74-c8e9fcfa2edf');

console.log(db.get('Servers').find({id:'251d9050-93b9-4f65-ad74-c8e9fcfa2edf'}).assign({userpwd:'123'}).write());*/

'use strict';

new Promise(function () {console.log(1)})
    .then(data=>{
        console.log(1)});



