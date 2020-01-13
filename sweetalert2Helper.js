const Swal = require('sweetalert2')

//
exports.SwalFire=(type,title)=>{
    Swal.fire({
        type: type,
        title: title,
        showConfirmButton: false,
        width:300,
        timer: 1500
    });
}