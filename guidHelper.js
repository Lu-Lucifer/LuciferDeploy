const uuid = require('node-uuid');

exports.createGuid=()=>{
    return uuid.v4()
}