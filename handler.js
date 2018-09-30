'use strict'

const AWS = require('aws-sdk'),
  docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.REGION
  }),
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
          word: words[randomWord].toLowerCase()
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
          const game = {
            id: newGameParams.Item.id,
            email: newGameParams.Item.email,
            gameOver: false,
            word: newGameParams.Item.word
          }
          callback(null, {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': process.env.ORIGIN
            },
            body: JSON.stringify({
              message: 'Game Returned',
              game: game
            })
          })
        }
      })
    }
  })
}
module.exports.addMove = (event, context, callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: event.pathParameters.id
    }
  }
  docClient.get(params, (err, game) => {
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
      const gameState = game.Item
      if (!gameState.guesses) {
        gameState.guesses = []
        gameState.guesses.push(event.body.toLowerCase())
        const updatedGameState = {
          TableName: process.env.DYNAMODB_TABLE,
          Item: gameState
        }
        docClient.put(updatedGameState, (err, game) => {
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
                game: gameState
              })
            })
          }
        })
      } else if (gameState.guesses.includes(event.body.toLowerCase())) {
        callback(null, {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': process.env.ORIGIN
          },
          body: JSON.stringify({
            message: 'Already Guessed',
            game: gameState
          })
        })
      } else {
        gameState.guesses.push(event.body.toLowerCase())
        const wordArray = gameState.word.split(''),
          wordLetterGuessed = wordArray.reduce((prev, curr) => {
            prev[curr] = gameState.guesses.includes(curr)
            return prev
          }, {})
        let allTrue = true,
          correctGuesses = 0
        for (let letter in wordLetterGuessed) {
          if (wordLetterGuessed[letter]) correctGuesses++
          if (!wordLetterGuessed[letter]) allTrue = false
        }
        const overGuessLimit = gameState.guesses.length - correctGuesses === 10
        if (allTrue || overGuessLimit) {
          gameState.gameOver = true
        }
        const updatedGameState = {
          TableName: process.env.DYNAMODB_TABLE,
          Item: gameState
        }
        docClient.put(updatedGameState, (err, game) => {
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
            gameState.guessLength = gameState.guesses.length
            gameState.overGuessLimit = overGuessLimit
            callback(null, {
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': process.env.ORIGIN
              },
              body: JSON.stringify({
                message: 'Game Returned',
                game: gameState
              })
            })
          }
        })
      }
    }
  })
}

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
