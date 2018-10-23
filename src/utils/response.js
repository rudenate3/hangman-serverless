'use strict'

const response = (body, status) => {
  return {
    statusCode: status,
    headers: {
      'Access-Control-Allow-Origin': process.env.ORIGIN,
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  }
}
module.exports.failure = body => {
  return response(body, 500)
}

module.exports.success = body => {
  return response(body, 200)
}
