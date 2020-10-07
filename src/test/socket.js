import io from './web_modules/socket.io-client.js';
const socket = io('http://localhost:8081');

socket.on('connection', (payload) => {
    console.log('connection', { payload });
    io.join('MyRoom');

    // ...
})


socket.on('message', (payload) => {
    console.log('Connected socket', { payload });
    // ...
})

socket.on(`announce`, (payload) => {
    console.log({ payload })
})

socket.on(`joined`, (socketId) => {
    //inititate handshake to socketId
})


socket.emit('join', 'MyRoom')

export default socket