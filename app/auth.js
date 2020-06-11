const log = require('./logger').getChildLogger('auth')
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''

if (AUTH_TOKEN.length > 0) log.info(`auth: "${AUTH_TOKEN}"`)
else log.warn('no authentication set')

async function auth (ctx, next) {
  if (AUTH_TOKEN.length > 0 && ctx.headers.auth !== AUTH_TOKEN) {
    ctx.throw(401)
  }
  await next()
}

module.exports = auth
