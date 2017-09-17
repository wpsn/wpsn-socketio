document.addEventListener('DOMContentLoaded', () => {
  const logoutEl = document.querySelector('.logout')
  if (logoutEl) {
    logoutEl.addEventListener('click', e => {
      e.preventDefault()
      const csrfToken = e.currentTarget.dataset.token
      fetch(`/logout?_csrf=${csrfToken}`, {
        method: 'POST'
      }).then(res => {
        location = '/'
      }).catch(console.error)
    })
  }
})
