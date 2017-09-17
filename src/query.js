const knex = require('./knex')
const bcrypt = require('bcrypt')
const validator = require('validator')

module.exports = {
  createUser(username, password) {
    return new Promise((resolve, reject) => {
      if (!username || !password) {
        reject(new Error('아이디와 비밀번호가 필요합니다.'))
      } else if (!validator.isAlphanumeric(username)) {
        reject(new Error('아이디에는 영문자와 숫자만 허용됩니다.'))
      } else if (username.length > 20) {
        reject(new Error('아이디는 20자를 넘을 수 없습니다.'))
      } else if (!validator.isAscii(password)) {
        reject(new Error('비밀번호에는 Ascii 문자만 허용됩니다.'))
      } else if (password.length < 8) {
        reject(new Error('비밀번호는 8자 이상이어야 합니다.'))
      } else {
        const p = bcrypt.hash(password, 10)
          .then(hashed_password => {
            return knex('user').insert({username, hashed_password})
          })
        resolve(p)
      }
    })
  },
  compareUser(username, password) {
    return knex('user')
      .where({username})
      .first()
      .then(user => {
        if (user) {
          return bcrypt.compare(password, user.hashed_password)
        } else {
          throw new Error('해당하는 아이디가 존재하지 않습니다.')
        }
      })
      .then(isMatched => {
        if (!isMatched) {
          throw new Error('아이디 혹은 패스워드가 일치하지 않습니다.')
        }
      })
  },
  getUserByUsername(username) {
    return knex('user')
      .where({username})
      .first()
  },
  getAllRooms() {
    return knex('room')
  },
  getRoomById(id) {
    return knex('room')
      .where({id})
      .first()
  },
  createRoom(title) {
    return knex('room')
      .insert({title})
  },
  deleteRoom(title) {
    return knex('room')
      .where({title})
      .delete()
  }
}
