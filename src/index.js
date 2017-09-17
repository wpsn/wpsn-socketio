require('dotenv').config()

const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const csurf = require('csurf')
const flash = require('connect-flash')

const middleware = require('./middleware')
const query = require('./query')
const util = require('./util')

const rooms = {}

const app = express()
const httpServer = http.Server(app)
const io = socketio(httpServer)
const PORT = process.env.PORT || 3000
const sessionMiddleware = cookieSession({
  name: 'chatsession',
  keys: [
    process.env.SECRET
  ]
})
app.set('view engine', 'pug')
app.set('trust proxy')

app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(bodyParser.urlencoded({extended: false}))
app.use(sessionMiddleware)
app.use(flash())
app.use(csurf())
app.use(middleware.insertReqMiddleware)
app.use(middleware.insertUserMiddleware)
app.use(middleware.insertTokenMiddleware)

app.get('/', (req, res) => {
  res.render('index.pug')
})

app.get('/login', (req, res) => {
  res.render('login.pug')
})

app.post('/login', (req, res) => {
  query.compareUser(req.body.username, req.body.password)
    .then(() => {
      req.session.username = req.body.username
      res.redirect('/rooms')
    })
    .catch(util.flashError(req, res))
})

app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/login')
})

app.get('/register', (req, res) => {
  res.render('register.pug')
})

app.post('/register', (req, res) => {
  query.createUser(req.body.username, req.body.password)
    .then(() => {
      req.session.username = req.body.username
      res.redirect('/rooms')
    })
    .catch(util.flashError(req, res))
})

app.get('/account', middleware.authMiddleware, (req, res) => {
  res.render('account.pug')
})

app.get('/rooms', middleware.authMiddleware, (req, res) => {
  query.getAllRooms()
    .then(rooms => {
      res.render('rooms.pug', {rooms})
    })
})

app.post('/rooms', middleware.authMiddleware, (req, res) => {
  query.createRoom(req.body.title)
    .then(([id]) => {
      res.redirect(`/rooms/${id}`)
    })
})

app.get('/rooms/:id', middleware.authMiddleware, (req, res, next) => {
  query.getRoomById(req.params.id)
    .then(room => {
      if (room) {
        getOrCreateRoom(room.id)
        res.render('chat.pug', {room})
      } else {
        next()
      }
    })
})

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next)
})

function getOrCreateRoom(roomId) {
  if (roomId in rooms) {
    return rooms[roomId]
  } else {
    rooms[roomId] = createRoom(roomId)
    return rooms[roomId]
  }
}

function createRoom(roomId) {
  const nsp = io.of(`/room/${roomId}`)
  nsp.on('connection', socket => {
    const username = socket.request.session.username
    console.log(`user(${username}) connected`)

    // username을 클라이언트에 전송
    socket.emit('username', {username})

    // 유저가 접속했다는 사실을 다른 모든 유저에게 전송
    socket.broadcast.emit('user connected', {username})

    // 채팅 메시지가 전송되었을 때
    socket.on('chat', (message, cb) => {
      // 성공적으로 전송되었다는 사실을 클라이언트에 알림
      cb(new Date().toJSON())

      // 해당 클라이언트를 제외한 모든 클라이언트에게 메시지 전송
      socket.broadcast.emit('chat', {username, message})
    })

    // 한 클라이언트의 연결이 끊어졌을 때
    socket.on('disconnect', () => {
      console.log('user disconnected')

      // 다른 모든 클라이언트에 메시지
      nsp.emit('user disconnected', {username})

      // 연결된 클라이언트가 하나도 남아있지 않으면 방 삭제
      nsp.clients((err, clients) => {
        delete rooms[roomId]
      })
    })
  })
  return nsp
}

httpServer.listen(PORT, () => {
  console.log(`listenning ${PORT}...`)
})
