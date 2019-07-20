const ioHook = require('iohook')

const init = (debug, incrementServiceNumber, decrementServiceNumber, updateServiceNumber) => {

    ioHook.on('keydown', event => {
        debug(event)
        switch (event.keycode) {
            case 13:
            case 78:
                incrementServiceNumber()
                break;
            case 12:
            case 74:
                decrementServiceNumber()
                break;
            default:
                if( event.rawcode >= 48 && event.rawcode <= 57) {
                    updateServiceNumber(event.rawcode - 48)
                } else if( event.rawcode >= 96 && event.rawcode <= 105) {
                    updateServiceNumber(event.rawcode - 96)
                }
                else return
                break;
        }
    })

    // Register and start hook
    ioHook.start()
}

module.exports.init = init