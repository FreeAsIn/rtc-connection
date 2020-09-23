const socket = new WebSocket('ws://localhost:8081');


socket.onopen = (event) => {
    console.log('onopen',{ event })
    socket.send('test')
}

socket.onmessage = (event) => {
    console.log('onmessage',{ event });
}

socket.onclose = (event) => {
    console.log('onclose',{ event });
}

export default socket