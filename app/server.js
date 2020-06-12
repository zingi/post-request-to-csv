const Koa = require('koa')
const Router = require('@koa/router')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const auth = require('./auth')
const { addCsvEntry, getCsvTable, delCsvTable, getAvailableTables } = require('./csv')
const log = require('./logger').getChildLogger('server')

const PORT = Number(process.env.PORT) || 3000
const app = new Koa()
const router = new Router()

router.get('/', ctx => { ctx.body = 'Hello World' })
router.get('/t', getAvailableTables)
router.post('/t/:table', addCsvEntry)
router.get('/t/:table', getCsvTable)
router.delete('/t/:table', delCsvTable)

app.use(cors())
app.use(auth)
app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())
app.listen(PORT)

log.info(`Server is listening on port ${PORT}`)
