const net = require('net')
const optionalRequire = require("optional-require")(require)
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

const { merge } = require('lodash/fp')
const fs = require('fs')
const spawn = require( 'child_process' ).spawn

const TEMPLATE_FILE = 'counterTemplate.html'
 
let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
fs.watchFile(TEMPLATE_FILE, () => {
    template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
})

const play = () => spawn( 'cscript.exe', [ './pling.vbs' ] )

play()
io.on('connection', () => {
    console.log('socket.io client connected')
    io.emit('event', actualCounter)
})
 
app.get('/', (req, res) => {
  res.send(template.replace('--counter--', actualCounter))
})
 
const custom = optionalRequire("./config.json") || {}
const config = merge({
    remoteIp: "127.0.0.1",
    remotePort: 5001,
    localPort: 8080,
    digits: 2,
    useHotkeys: false
}, custom)

let startNumber = "0".repeat(config.digits)
let actualCounter = startNumber
let number = 0
const maxNumber = 10**config.digits

const parseString = require('xml2js').parseString

var client = new net.Socket();

const updateElement = (element) => {
    play()
    actualCounter = element
    io.emit('event', actualCounter)
}

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
                    updateElement(element.$.ticketNumber)
                })
            }
        })
    } else {
        console.log('Empty data')
    }
})


server.listen(config.localPort, () => console.log("Http server listening at port ", config.localPort) )

if ( config.useHotkeys ) {
   const hooks = require('./hooks.js')
   hooks.init(number, maxNumber, startNumber, config.digits, updateElement)
} else {
    console.log('Starting client')
    connect()
}