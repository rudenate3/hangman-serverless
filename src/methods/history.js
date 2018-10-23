'use strict'

const { failure, success } = require('../utils/response'),
  docClient = require('../utils/dynamo').createDocClient()

module.exports.handler = (event, context, callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    FilterExpression: 'email = :emailVal and gameOver = :gameOverVal',
    ExpressionAttributeValues: {
      ':emailVal': event.requestContext.authorizer.claims.email,
      ':gameOverVal': true
    }
  }

  docClient.scan(params, (error, games) => {
    if (error) {
      callback(null, failure({ error }))
    }

    callback(
      null,
      success({ games: games.Items.length > 0 ? games.Items : null })
    )
  })
}
