// hash-password.js
const bcrypt = require('bcrypt');
const myPassword = 'aularium2023'; // La contraseña exacta que usarás para iniciar sesión

bcrypt.hash(myPassword, 10, function(err, hash) {
    if (err) throw err;
    console.log("Copia este nuevo hash:");
    console.log(hash);
});