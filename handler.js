'use strict'

const AWS = require('aws-sdk'),
  docClient = new AWS.DynamoDB.DocumentClient({ region: process.env.REGION }),
  uuid = require('uuid')

module.exports.autoConfirmEmail = async (event, context, callback) => {
  event.response.autoConfirmUser = true
  callback(null, event)
}

module.exports.getGame = (event, context, callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    FilterExpression: 'email = :emailVal and gameOver = :gameOverVal',
    ExpressionAttributeValues: {
      ':emailVal': event.requestContext.authorizer.claims.email,
      ':gameOverVal': false
    }
  }

  docClient.scan(params, (err, game) => {
    if (err) {
      callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.ORIGIN
        },
        body: JSON.stringify({
          message: 'Error Returned',
          error: err
        })
      })
    }

    if (game.Items.length === 1) {
      callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.ORIGIN
        },
        body: JSON.stringify({
          message: 'Game Returned',
          game: game.Items[0]
        })
      })
    } else {
      const newGameParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          id: uuid.v1(),
          email: event.requestContext.authorizer.claims.email,
          gameOver: false,
          word: 'jazz'
        }
      }
      docClient.put(newGameParams, (err, game) => {
        if (err) {
          callback(null, {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': process.env.ORIGIN
            },
            body: JSON.stringify({
              message: 'Error Returned',
              error: err
            })
          })
        } else {
          callback(null, {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': process.env.ORIGIN
            },
            body: JSON.stringify({
              message: 'Game Returned',
              game: newGameParams
            })
          })
        }
      })
    }
  })
}
module.exports.addMove = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ORIGIN
    },
    body: JSON.stringify({
      message: 'Leaderboard returned',
      input: event
    })
  }
}

module.exports.history = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ORIGIN
    },
    body: JSON.stringify({
      message: 'History returned',
      input: event
    })
  }
}
