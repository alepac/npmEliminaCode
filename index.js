const net = require('net')
const optionalRequire = require("optional-require")(require)
const express = require('express')
const app = express()
const path = require('path')
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const parseString = require('xml2js').parseString

const { merge } = require('lodash/fp')
const fs = require('fs')
const spawn = require('child_process').spawn

const hooks = require('./hooks.js')

const TEMPLATE_FILE = 'counterTemplate.html'

let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
fs.watchFile(TEMPLATE_FILE, () => {
    debugMe("Template changed")
    template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    io.emit('reload')
})

const play = () => (process.platform == "win32") ? spawn('cscript.exe', ['./pling.vbs']) : false;
const debugMe = (message) => { config.debug && console.log(message) }

play()

const custom = optionalRequire("./config.json") || {}
const config = merge({
    debug: true,
    remoteIp: "127.0.0.1",
    remotePort: 5001,
    localPort: 8080,
    digits: 2,
    useHotkeys: false,
    useBrowserHotkeys: false,
    minimumRoomNumber: 4,
    backgroundColor: {
        default: "#808080",
        rooms: []
    },
    textColor: {
        default: "#ffffff",
        rooms: []
    }
}, custom)

let paddingNumber = "0".repeat(config.digits)
let actualCounter = Array(config.minimumRoomNumber + 1).fill(paddingNumber)
let serviceNumber = 0
const maxNumber = 10 ** config.digits

const updateElementWithService = (id) => {
    updateElement((paddingNumber + serviceNumber).slice(-config.digits), id)
}

const incrementServiceNumber = (id) => {
    serviceNumber = (serviceNumber + 1) % maxNumber
    updateElementWithService(id)
}

const decrementServiceNumber = (id) => {
    serviceNumber = serviceNumber > 0 ? (serviceNumber - 1) : (maxNumber - 1)
    updateElementWithService(id)
}

const resetServiceNumber = (id) => {
    serviceNumber = 0
    updateElementWithService(id)
}

const updateServiceNumber = (digit, id) => {
    serviceNumber = ((serviceNumber * 10 + digit) % maxNumber)
    updateElementWithService(id)
}

io.on('connection', (ioclient) => {
    debugMe('socket.io client connected')
    ioclient.on('increment', (id) => {
        debugMe(id)
        incrementServiceNumber(id)
    })
    ioclient.on('decrement', (id) => {
        debugMe(id)
        decrementServiceNumber(id)
    })
    ioclient.on('reset', (id) => {
        debugMe(id)
        resetServiceNumber(id)
    })
})

app.use(express.static(path.join(__dirname, 'public')))

app.get('*', (req, res) => {
    console.dir(req.query)
    const roomEvent = 'event' + (req.query.roomId || '')
    const textColor = req.query.roomId && config.textColor.rooms[req.query.roomId] || config.textColor.default
    const backgroundColor = req.query.roomId && config.backgroundColor.rooms[req.query.roomId] || config.backgroundColor.default
    res.send(template.replace(/--counter--/g, actualCounter[req.query.roomId || 0])
        .replace(/--id--/g, req.query.roomId || 0)
        .replace(/--event--/g, roomEvent)
        .replace(/--textColor--/g, textColor)
        .replace(/--backgroundColor--/g, backgroundColor))
})

var client = new net.Socket();

const updateElement = (element, index) => {
    play()
    actualCounter[index || 0] = element
    io.emit('event' + (index || ''), actualCounter[index || 0])
}

client.on('connect', () => debugMe('Connected'))

const connect = () => {
    debugMe('Connecting to ' + config.remoteIp + ':' + config.remotePort)
    client.connect(config.remotePort, config.remoteIp)
}

client.on('error', () => {
    debugMe("Connection error ... trying to reconnect in 10 seconds")
    setTimeout(connect, 10000)
})

client.on('end', (hadError) => {
    debugMe("Connection closed ... trying to reconnect in 10 seconds")
    setTimeout(connect, 10000)
})

client.on('data', (data) => {
    const datastring = data.toString('utf8')
    debugMe('Received: ' + datastring)
    const xml = datastring.substring(datastring.indexOf('<'))
    if (xml && (xml.charAt(0) === '<')) {
        parseString(xml, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                result.operations.call.forEach(element => {
                    console.dir(element)
                    updateElement(element.$.ticketNumber, element.$.roomNumber)
                })
            }
        })
    } else {
        debugMe('Empty data')
    }
})

const startHotkeys = () =>
    hooks.init(debugMe, incrementServiceNumber, decrementServiceNumber, updateServiceNumber)


if (process.argv.length > 2) {
    startHotkeys()
    debugMe("Dry Runned")
    process.exit(0)
} else {
    server.listen(config.localPort, () => debugMe("Http server listening at port " + config.localPort))

    if (config.useHotkeys) {
        startHotkeys()
    } else if (config.useBrowserHotkeys) {
        debugMe('Using browser hotkeys')
    } else {
        debugMe('Starting client')
        connect()
    }
}