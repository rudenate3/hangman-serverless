'use strict'

const AWS = require('aws-sdk'),
  docClient = new AWS.DynamoDB.DocumentClient({ region: process.env.REGION }),
  uuid = require('uuid')

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min) + min)

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
      const words = require('words.json').words,
        randomWord = randomNumber(0, words.length - 1)
      const newGameParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          id: uuid.v1(),
          email: event.requestContext.authorizer.claims.email,
          gameOver: false,
          word: words[randomWord]
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
module.exports.addMove = (event, context, callback) => {}

module.exports.history = (event, context, callback) => {
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

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ORIGIN
      },
      body: JSON.stringify({
        message: 'Games Returned',
        games: games.Items.length > 0 ? games.Items : 'None'
      })
    })
  })
}
