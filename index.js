const net = require('net')
const parseString = require('xml2js').parseString;

console.log('Starting client')
var client = new net.Socket();
client.connect(5001, '127.0.0.1', function() {
	console.log('Connected');
	//client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
    const xml = data.toString('utf8').substring(6)
    // console.log('Received: ' + xml)
    if (xml) {
        parseString(xml, function (err, result) {
            if(err) {
                console.log(err)
            } else {
                result.operations.call.forEach(element => {
                    console.dir(element.$.ticketNumber)
                })
            }
        })
    } else {
        console.log('Empty data')
    }
})
