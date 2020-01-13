const crypto = require('crypto')

let cipher = crypto.createCipher('aes256', secretKey)
let decipher = crypto.createDecipher('aes256', secretKey)

low.stringify = function(obj) {
    let str = JSON.stringify(obj)
    return cipher.update(str, 'utf8', 'hex') + cipher.final('hex')
}

low.parse = function(encrypted) {
    let str = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
    return JSON.parse(str)
}