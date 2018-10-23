'use strict'

const { failure, success } = require('../utils/response'),
  docClient = require('../utils/dynamo').createDocClient()

const processMove = (guesses, word) => {
  const wordArray = word.split(''),
    lettersGuessed = wordArray.reduce((prev, curr) => {
      if (guesses.includes(curr)) {
        prev[curr] = true
      }
      return prev
    }, {}),
    correctGuesses = Object.keys(lettersGuessed),
    guessed = wordArray.map(letter => {
      if (lettersGuessed[letter]) {
        return letter
      } else {
        return '_'
      }
    }),
    win = wordArray.toString() === guessed.toString(),
    overGuessLimit = guesses.length - correctGuesses.length === 10
  return { guessed, win, overGuessLimit, correctGuesses }
}

module.exports.handler = (event, context, callback) => {
  if (
    !event.body ||
    event.body.length > 1 ||
    !event.body.toLowerCase().match(/[a-z]/i)
  ) {
    return callback(null, failure({ error: 'Invalid Move' }))
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: event.pathParameters.id
    }
  }

  docClient.get(params, (error, game) => {
    if (error) {
      callback(null, failure(error))
    } else {
      const gameState = game.Item
      if (!gameState.guesses) {
        gameState.guesses = []
        gameState.guesses.push(event.body.toLowerCase())
        Object.assign(gameState, processMove(gameState.guesses, gameState.word))
        const updatedGameState = {
          TableName: process.env.DYNAMODB_TABLE,
          Item: gameState
        }
        docClient.put(updatedGameState, (error, game) => {
          if (error) {
            callback(null, failure(error))
          } else {
            callback(
              null,
              success({
                game: {
                  id: gameState.id,
                  gameOver: gameState.gameOver,
                  guesses: gameState.guesses,
                  guessed: gameState.guessed,
                  correctGuesses: gameState.correctGuesses
                }
              })
            )
          }
        })
      } else if (gameState.guesses.includes(event.body.toLowerCase())) {
        callback(null, failure({ error: 'Already Guessed' }))
      } else {
        gameState.guesses.push(event.body.toLowerCase())
        Object.assign(gameState, processMove(gameState.guesses, gameState.word))
        if (gameState.win || gameState.overGuessLimit) gameState.gameOver = true
        const updatedGameState = {
          TableName: process.env.DYNAMODB_TABLE,
          Item: gameState
        }
        docClient.put(updatedGameState, (error, game) => {
          if (error) {
            callback(null, failure(error))
          } else {
            callback(
              null,
              success({
                game: {
                  id: gameState.id,
                  gameOver: gameState.gameOver,
                  guesses: gameState.guesses,
                  guessed: gameState.guessed,
                  correctGuesses: gameState.correctGuesses
                }
              })
            )
          }
        })
      }
    }
  })
}
