const socket = io();

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector('#messages');

const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector("#locationMessage-template").innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoScroll = () => {
   const $newMessage = $messages.lastElementChild;
   const newMessageStyles = getComputedStyle($newMessage)
   const newMessageMargin = parseInt(newMessageStyles.marginBottom)
   const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
   
   const visibleHeight = $messages.offsetHeight;
   const contentHeight = $messages.scrollHeight;
   const scrollOffset = $messages.scrollTop + visibleHeight;

   if (contentHeight - newMessageHeight <= scrollOffset) {
       $messages.scrollTop = $messages.scrollHeight
     
   }

}


socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('H:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    console.log(message, "locationM<essage")
    const html = Mustache.render(locationMessageTemplate, {
        url: message.url,
        username: message.username,
        createdAt: moment(message.createdAt).format('H:m A')
    })

    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll()
})

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
      room,
      users
  })

  document.querySelector("#sidebar").innerHTML = html
})


$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute('disabled', 'disabled')
  
  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = "";
    $messageFormInput.focus()

      if (error) {
         console.log(error) 
      }
      console.log("The message is delievered!")
  })
})

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
     return alert('Geolocation is not supported by the browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
      socket.emit('sendLocation', {
          lat: position.coords.latitude,
          lon: position.coords.longitude
      }, () => {
          $sendLocationButton.removeAttribute('disabled')
          console.log("Location shared")
      })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})