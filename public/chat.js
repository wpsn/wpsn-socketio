// 메시지를 DOM에 표시하기 위한 함수
function appendText(messageListEl, text) {
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

document.addEventListener('DOMContentLoaded', e => {
  let username;

  // 사용할 엘리먼트 가져오기
  const formEl = document.querySelector('#chat-form')
  const messageListEl = document.querySelector('#messages')
  const roomId = formEl.dataset.room

  // socket.io 연결 수립하고 room 설정, username 설정


  // form 전송 이벤트 핸들러


  // (chat) 채팅 메시지가 올 때마다 출력


  // (user connected) 새 사용자가 접속한 사실을 출력


  // (user disconnected) 사용자의 연결이 끊어졌다는 사실을 출력


})
