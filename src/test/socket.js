import io from './web_modules/socket.io-client.js';
const socket = io('http://localhost:8081');

socket.on('connection', (payload) => {
    console.log('connection', { payload });
    // ...
})

socket.on('message', (payload) => {
    console.log('Connected socket', { payload });
    // ...
})

export default socket