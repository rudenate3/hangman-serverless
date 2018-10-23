'use strict'

const { failure, success } = require('../utils/response')

const AWS = require('aws-sdk'),
  docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.REGION
  })

module.exports.handler = (event, context, callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    FilterExpression: 'email = :emailVal and gameOver = :gameOverVal',
    ExpressionAttributeValues: {
      ':emailVal': event.requestContext.authorizer.claims.email,
      ':gameOverVal': true
    }
  }

  docClient.scan(params, (err, games) => {
    if (err) {
      callback(
        null,
        failure({
          message: 'Error Returned',
          error: err
        })
      )
    }

    callback(
      null,
      success({
        message: 'Games Returned',
        games: games.Items.length > 0 ? games.Items : null
      })
    )
  })
}
