const net = require('net')
const optionalRequire = require("optional-require")(require)
const http = require('http')
const { merge } = require('lodash/fp')
const fs = require('fs')
const spawn = require( 'child_process' ).spawn

const TEMPLATE_FILE = 'counterTemplate.html'
 
let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
fs.watchFile(TEMPLATE_FILE, () => {
    template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
})


let actualCounter = "0"

const play = () => spawn( 'cscript.exe', [ './pling.vbs' ] )

play()

const server = http.createServer(function(req, res) {
  res.writeHead(200)
  res.end(template.replace('--counter--', actualCounter))
})
 
const custom = optionalRequire("./config.json") || {}
const config = merge({
    remoteIp: "127.0.0.1",
    remotePort: 5001,
    localPort: 8080
}, custom)

const parseString = require('xml2js').parseString

console.log('Starting client')
var client = new net.Socket();

client.on('connect', () => console.log('Connected'))

const connect = () => {
    console.log('Connecting to ' + config.remoteIp + ':' +config.remotePort)
    client.connect(config.remotePort, config.remoteIp)
}

client.on('error', () => {
    console.log("Connection error ... trying to reconnect in 1 second")
    setTimeout(connect, 1000)
})

client.on('end', (hadError) => {
    console.log("Connection closed ... trying to reconnect in 1 second")
    setTimeout(connect, 1000)
})

client.on('data', function(data) {
    const xml = data.toString('utf8').substring(6)
    // console.log('Received: ' + xml)
    if (xml) {
        parseString(xml, function (err, result) {
            if(err) {
                console.log(err)
            } else {
                result.operations.call.forEach(element => {
                    console.dir(element)
                    play()
                    actualCounter = element.$.ticketNumber
                })
            }
        })
    } else {
        console.log('Empty data')
    }
})

console.log("Starting http server at port ", config.localPort)
server.listen(config.localPort)

connect()