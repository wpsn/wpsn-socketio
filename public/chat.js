document.addEventListener('DOMContentLoaded', e => {
  let username;

  // 사용할 엘리먼트 가져오기
  const formEl = document.querySelector('#chat-form')
  const messageListEl = document.querySelector('#messages')

  // socket.io 연결 수립하고 username 설정
  const roomId = formEl.dataset.room
  const socket = io(`/chat`)
  socket.emit('join', {roomId}, data => {
    username = data.username
    console.log(`success with username ${username}`)
    formEl.elements.message.removeAttribute('disabled')
  })

  // 메시지를 DOM에 표시하기 위한 함수
  function appendText(text) {
    const messageEl = document.createElement('p')
    messageEl.textContent = text
    messageEl.classList.add('message')
    messageEl.classList.add('new')
    messageListEl.insertBefore(messageEl, messageListEl.firstChild)
    return messageEl
  }

  // 메시지 양식
  function formatMessage({username, message}) {
    return `${username}: ${message}`
  }

  // form 전송 이벤트 핸들러
  formEl.addEventListener('submit', e => {
    e.preventDefault()
    const message = e.currentTarget.elements.message.value

    // 낙관적 업데이트
    const messageEl = appendText(formatMessage({username, message}))
    formEl.reset()
    socket.emit('chat', message, data => {
      // 전송이 잘 된 것으로 확인되면 new 클래스를 삭제
      console.log(`chat succeed at ${data}`)
      messageEl.classList.remove('new')
    })
  })

  // 채팅 메시지가 올 때마다 출력
  socket.on('chat', data => {
    const messageEl = appendText(formatMessage(data))
    messageEl.classList.remove('new')
  })

  // 새 사용자가 접속한 사실을 출력
  socket.on('user connected', data => {
    const {username} = data
    appendText(`${username} 님이 접속하셨습니다.`)
  })

  // 사용자의 연결이 끊어졌다는 사실을 출력
  socket.on('user disconnected', data => {
    const {username} = data
    appendText(`${username} 님의 접속이 끊어졌습니다.`)
  })
})
