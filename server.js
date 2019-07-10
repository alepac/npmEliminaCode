var net = require('net');

var server = net.createServer(function(socket) {
	socket.pipe(socket);
});

server.listen(5001, '127.0.0.1')

console.log('Server started')

server.on('connection', (socket) => {
    console.log('Starting client socket')
    const poller = setInterval(() => {
        console.log('Pinging')
        socket.write(`123456<?xml version="1.0" encoding="UTF-8"?>
<operations>
<call id="1" ticketNumber="A002" roomNumber="1" wait="10 MIN"
queueNumber="2" division="ACCETTAZIONE" roomType="SPORTELLO" itemColor="0xFF0000"
sound="din.mp3" background="wall.jpg" delay="0" position="1" area="PRIMO PIANO"
voice="Accettazione, A, 2, Sportello 1"/>
</operations>`)
    }, 1000)
    socket.on('end', () => {
        console.log('Stopping client socket')
        clearInterval(poller)
    })
    socket.on('error', (err) => {
        console.error(err)
        clearInterval(poller)
      });
})

server.on('error', (err) => {
  console.error(err)
})