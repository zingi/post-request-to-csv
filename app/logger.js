const os = require('os')
const winston = require('winston')

const NEW_LINE = os.EOL
const JSON_PRETTY_PRINT_MAX_LINES = Number(process.env.JSON_PRETTY_PRINT_MAX_LINES) || 30
const PAD_CHAR = ' '
const PAD_LEFT = 0
const PAD_RIGHT = 1
const toPadParts = new Map()

let rootLogger = null

/**
 * Returns a string which contains <count> times the PAD_CHAR
 * @param {Number} count
 */
function getPadString (count) {
  return PAD_CHAR.repeat(count)
}

/**
 * Returns a padded string representation for the provided string.
 * Pads with the max. number of chars, which the field <name> ever had.
 * @param {String} name of the field in the logging string
 * @param {String} string the string to pad
 * @param {Number} padDir PAD_LEFT or PAD_RIGHT
 */
function padString (name, string, padDir) {
  const p = toPadParts.get(name)
  if (p) {
    if (string.length > p) toPadParts.set(name, string.length)
  } else {
    toPadParts.set(name, string.length)
  }
  const charCount = toPadParts.get(name) - string.length

  switch (padDir) {
    case PAD_LEFT:
      return getPadString(charCount) + string
    case PAD_RIGHT:
      return string + getPadString(charCount)
    default:
      return string
  }
}

function isObject (variable) {
  return typeof variable === 'object' && variable !== null
}

/**
 * If the provided variable is an object, it trys to parse it to a string,
 * if that doesn't work or it is already a string, it just casts it to a string.
 * @param {Object || String} message
 */
function stringifyMessage (message) {
  if (isObject(message)) {
    try {
      const pretty = JSON.stringify(message, null, 2)
      const lineCount = pretty.split(NEW_LINE).length
      if (lineCount <= JSON_PRETTY_PRINT_MAX_LINES) {
        return pretty
      } else {
        return JSON.stringify(message)
      }
    } catch (error) {
      return `${message}`
    }
  } else {
    return `${message}`
  }
}

const myConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, name, timestamp }) => {
    const paddedName = padString('name', name, PAD_RIGHT)
    const paddedLevel = padString('level', level, PAD_RIGHT)
    const messageString = stringifyMessage(message)

    return `${timestamp} - [${paddedName}] [${paddedLevel}] : \t${messageString}`
  })
)

function createRootLogger () {
  const transports = []
  // always log to console
  transports.push(new winston.transports.Console({ format: myConsoleFormat }))

  rootLogger = winston.createLogger({
    level: 'debug',
    transports: transports
  })
}

/**
 * Returns the root logger.
 * If the root logger was not yet instantiated,
 * it instantiates the root logger.
 */
function getRootLogger () {
  if (rootLogger === null) {
    createRootLogger()
  }
  return rootLogger
}

/**
 * Returns a child logger.
 * One child logger should be used per module.
 * @param {String} name name of the module from which logging is done
 */
function getChildLogger (name) {
  const logger = getRootLogger()
  const childLogger = logger.child({ name: name })
  return childLogger
}

module.exports.getChildLogger = getChildLogger
