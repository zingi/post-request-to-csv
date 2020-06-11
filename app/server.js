const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const auth = require('./auth')
const { addCsvEntry } = require('./csv')

const app = new Koa()
const router = new Router()

router.get('/', ctx => { ctx.body = 'Hello World' })
router.post('/:table', addCsvEntry)

app.use(auth)
app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())
app.listen(3000)
