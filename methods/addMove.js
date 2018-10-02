'use strict'

const AWS = require('aws-sdk'),
  docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.REGION
  })

module.exports.handler = (event, context, callback) => {
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
    } else if (
      !event.body ||
      event.body.length > 1 ||
      !event.body.toLowerCase().match(/[a-z]/i)
    ) {
      callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.ORIGIN
        },
        body: JSON.stringify({
          message: 'Invalid Move',
          game: game.Item
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
        if (allTrue) {
          gameState.gameOver = true
          gameState.win = true
        } else if (overGuessLimit) {
          gameState.gameOver = true
          gameState.win = false
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
