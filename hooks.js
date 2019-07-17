const ioHook = require('iohook')

const init = (startNumber, digits, updateElement) => {
    let number = 0
    const maxNumber = 10**digits
    const numberDigit = (number, digit) => ((number * 10 + (digit)) % maxNumber )

    ioHook.on('keydown', event => {
        console.log(event)
        switch (event.keycode) {
            case 13:
            case 78:
                number = (number + 1) % maxNumber
                break;
            case 12:
            case 74:
                number = number > 0 ? (number - 1) : (maxNumber - 1)
                break;
            default:
                if( event.rawcode >= 48 && event.rawcode <= 57) {
                    number = numberDigit (number, event.rawcode - 48)
                } else if( event.rawcode >= 96 && event.rawcode <= 105) {
                    number = numberDigit (number, event.rawcode - 96)
                }
                else return
                break;
        }
        updateElement( (startNumber + number).slice(-digits))
    })

    // Register and start hook
    ioHook.start()
}

module.exports.init = init