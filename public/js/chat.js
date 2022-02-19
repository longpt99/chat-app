const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const messageUrlTemplate = document.querySelector(
  '#message-url-template'
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const $newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  console.log(containerHeight, $newMessageHeight, scrollOffset);
  if (containerHeight - $newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
    username: message.username,
  });

  //Adjacent: liền kề
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

// const btnSubmit = document.getElementById('btn');
// const input = document.getElementById('box-chat');
// const form = document.getElementById('message-form');

// btnSubmit.addEventListener('click', () => {
//   socket.emit('sendMessage', input.value);
// });

$messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');

  // const message = document.querySelector('form > input').value;
  // console.log(event.target.elements, event.target.elements.ip.value);
  // const html = Mustache.render(messageTemplate, {
  //   message: $messageFormInput.value,
  // });
  // $messages.insertAdjacentHTML('beforeend', html);

  socket.emit(
    'sendMessage',
    { message: $messageFormInput.value },
    (message) => {
      $messageFormButton.removeAttribute('disabled');
      $messageFormInput.value = '';
      $messageFormInput.focus();
      console.log('The message was delivered.', message);
    }
  );
});

socket.on('messageLocation', (message) => {
  console.log(message);
  const html = Mustache.render(messageUrlTemplate, {
    url: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  //Adjacent: liền kề
  $messages.insertAdjacentHTML('beforeend', html);
});

document.querySelector('#send-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported');
  }
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      lat: position.coords.latitude,
      long: position.coords.longitude,
    });
  });
});

socket.emit('join', { username, room }, (err) => {
  console.log(err);
  if (err) {
    alert(err);
    location.href = '/';
  }
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  document.querySelector('#sidebar').innerHTML = html;
});
