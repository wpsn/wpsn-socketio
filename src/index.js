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

const PORT = process.env.PORT || 3000

const app = express()
const httpServer = http.Server(app)
const io = socketio(httpServer)

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

// socket.io 에서 세션을 사용할 수 있도록 설정
// https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x/25618636#25618636
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next)
})

io.use((socket, next) => {
  if (socket.request.session.username) {
    next()
  } else {
    next(new Error('Authentication Error'))
  }
})

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
        res.render('chat.pug', {room})
      } else {
        next()
      }
    })
})

const chatNsp = io.of('/chat')

chatNsp.on('connection', socket => {
  let roomId;
  const username = socket.request.session.username
  console.log(`user(${username}) connected`)

  // join 이벤트
  // 해당 소켓을 room에 연결시킨다.
  // 클라이언트에 username을 보낸다.
  // 유저가 접속했다는 사실을 다른 모든 유저에게 전송한다.


  // chat 이벤트
  // 성공적으로 전송되었다는 사실을 클라이언트에 알림
  // 해당 클라이언트를 제외한 모든 클라이언트에게 메시지 전송


  // disconnect 내장 이벤트
  // 한 클라이언트의 연결이 끊어졌을 때
  // 다른 모든 클라이언트에 알림
})

httpServer.listen(PORT, () => {
  console.log(`listenning ${PORT}...`)
})
