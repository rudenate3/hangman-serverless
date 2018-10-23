'use strict'

module.exports.response = (body, status = 200) => {
  return {
    statusCode: status,
    headers: {
      'Access-Control-Allow-Origin': process.env.ORIGIN
    },
    body: JSON.stringify(body)
  }
}
