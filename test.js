const bcrypt = require('bcrypt')

const password = 'victoria04_'
const paswordHash = await bcrypt.hash(password, 13)

const login = await bcrypt.compare(password, paswordHash)

console.log(login)