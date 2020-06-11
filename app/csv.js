const fs = require('fs')
const path = require('path')
const { default: PQueue } = require('p-queue')
const log = require('./logger').getChildLogger('csv')

const NEW_LINE = process.env.NEW_LINE || require('os').EOL
const SC = process.env.SEPARATE_CHAR || ','
const DATA_DIR = process.env.DATA_DIR || '/data'
const IGNORE_EMPTY = (process.env.IGNORE_EMPTY || 'true').toLowerCase() === 'true'
const TABLES = getTables()
const WRITE_QUEUE = new PQueue({ concurrency: 1 })
log.info(`Available tables: ${TABLES.map(e => e.name).join(', ')}`)

const isObj = v => typeof v === 'object' && v !== null

/**
 * Returns an array which contains all env variable names.
 */
function getEnvVars () {
  const arr = []
  for (const v in process.env) {
    arr.push(v)
  }
  arr.sort()
  return arr
}

/**
 * Returns true if the provided file path exists.
 * @param {String} filePath
 */
async function fileExists (filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Tables are defined as env variables:
 * T_TABLENAME=col1,col2,col3
 */
function getTables () {
  const vars = getEnvVars().filter(e => e.startsWith('T_'))
  return vars.map(e => {
    const name = e.substring(2).toLowerCase()
    const columns = process.env[e].split(',').map(e => e.trim())
    return { name, columns }
  })
}

/**
 * Adds the line/s to the corresponding csv file.
 * @param {Object} ctx Koa request context
 */
async function addCsvEntry (ctx) {
  const tableName = ctx.params.table
  const body = ctx.request.body

  if (!TABLES.map(e => e.name).includes(tableName)) {
    ctx.throw(400, `Provided table: "${tableName}" does not exist.`)
  }
  if (!isObj(body)) {
    ctx.throw(400, 'Provided body is not valid json.')
  }

  const string = await writeToFile(TABLES.find(e => e.name === tableName), Array.isArray(body) ? body : [body])
  ctx.body = string
}

/**
 * Converts something like:
 * [ 'abc','123 ] to "abc,123"
 * @param {Array.String} columns
 * @param {Object} obj
 */
function getCsvLine (columns, obj) {
  let string = ''
  columns.forEach((column, i) => {
    string += `${obj[column] || ''}${i < columns.length - 1 ? SC : ''}`
  })
  return string
}

/**
 * Creates the corresponding csv file, if it not yet exists
 * and adds the column names as first line.
 * @param {Object} table
 */
async function assureCsvFileExists (table) {
  const filePath = path.join(DATA_DIR, `${table.name}.csv`)
  const exists = await fileExists(filePath)
  if (!exists) {
    await fs.promises.appendFile(filePath, table.columns.join(','))
  }
}

/**
 * Writes the provided entries into the provided csv file.
 * @param {Object} table { name: '', columns: [ 'col1', 'col2' ] }
 * @param {Array.Object} entries [ {},{},{} ]
 */
function writeToFile (table, entries) {
  return new Promise((resolve, reject) => {
    // path of destination .csv file
    const outPath = path.join(DATA_DIR, `${table.name}.csv`)
    // convert objects to csv lines
    let lines = entries.map(e => getCsvLine(table.columns, e))
    // filter empty lines
    if (IGNORE_EMPTY) lines = lines.filter(e => e.length > 0)
    // create one string from lines
    const string = lines.join(NEW_LINE)

    // assure that at every time only one write command is executed
    WRITE_QUEUE.add(() => {
      // assure that the csv file exists with the column names as first line
      assureCsvFileExists(table)
        .then(() => {
          // append the csv data lines to the file
          fs.appendFile(outPath, NEW_LINE + string, err => {
            if (err) reject(err)
            else {
              log.info(`Written to ${outPath}:`)
              lines.forEach(e => log.info(e))
              resolve(string)
            }
          })
        })
        .catch(err => reject(err))
    })
  })
}

module.exports.addCsvEntry = addCsvEntry
