const fs = require('fs')
const bcrypt = require('bcryptjs')
const { v4: uuid } = require('uuid')

const db = JSON.parse(fs.readFileSync('data.json', 'utf8'))
const exists = db.users.find(u => u.email === 'admin@nargisa.com')
if (exists) {
  exists.password = bcrypt.hashSync('admin1984', 10)
  exists.role = 'admin'
} else {
  db.users.push({
    id: uuid(),
    name: 'Nargisa',
    email: 'admin@nargisa.com',
    phone: '900000000',
    password: bcrypt.hashSync('admin1984', 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  })
}
fs.writeFileSync('data.json', JSON.stringify(db, null, 2))
console.log('✅ admin@nargisa.com tayyor!')
