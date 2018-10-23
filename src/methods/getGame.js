'use strict'

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min) + min)

const { failure, success } = require('../utils/response'),
  docClient = require('../utils/dynamo').createDocClient(),
  uuid = require('uuid')

module.exports.handler = (event, context, callback) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    FilterExpression: 'email = :emailVal and gameOver = :gameOverVal',
    ExpressionAttributeValues: {
      ':emailVal': event.requestContext.authorizer.claims.email,
      ':gameOverVal': false
    }
  }

  docClient.scan(params, (error, game) => {
    if (error) {
      callback(null, failure(error))
    }

    if (game.Items.length === 1) {
      callback(
        null,
        success({
          game: {
            id: game.Items[0].id,
            gameOver: game.Items[0].gameOver,
            guesses: game.Items[0].guesses,
            correctGuesses: game.Items[0].correctGuesses,
            guessed: game.Items[0].guessed
          }
        })
      )
    } else {
      const words = require('words.json').words,
        randomWord = randomNumber(0, words.length - 1),
        chosenWord = words[randomWord].toLowerCase()
      const newGameParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          id: uuid.v1(),
          email: event.requestContext.authorizer.claims.email,
          gameOver: false,
          word: chosenWord,
          guessed: chosenWord.split('').map(letter => '_'),
          created: new Date().toString()
        }
      }
      docClient.put(newGameParams, (error, game) => {
        if (error) {
          callback(null, failure(error))
        } else {
          const game = {
            id: newGameParams.Item.id,
            gameOver: false,
            guessed: newGameParams.Item.guessed
          }
          callback(null, success(game))
        }
      })
    }
  })
}
