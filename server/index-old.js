const WebSocket = require('ws')

const webSocketServer = new WebSocket.Server({
    port: 8081,
});

webSocketServer.on('connection', socket => {
    console.log('ON CONNECTION')
    socket.on('message', message => {
        webSocketServer.clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        })
        console.log('received: %s', message, typeof message);
    });
    socket.send('connection established');
});