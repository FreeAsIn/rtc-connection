// const io = require("socket.io")
// const server = io.listen(8081)

const server = require("http").createServer(onRequest);
const io = require("socket.io")(server);

function onRequest(req,res){
    res.writeHead(200, {
    'Access-Control-Allow-Origin' : '*'
    });
};

io.on("connection", (socket) => {
    socket.on('room', (room) => {
        socket.room = room;
        socket.join(room)
    })

    socket.on("disconnect", () => {

    })

    socket.on('message', message => {
        console.log(server.clients)
        socket.broadcast.emit('message', message)
        console.log('received: %s', message, typeof message);
    });
    socket.send('connection established');
})

server.listen(8081, ()=>{})
