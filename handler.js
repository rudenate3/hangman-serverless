'use strict'

const AWS = require('aws-sdk'),
  docClient = new AWS.DynamoDB.DocumentClient({ region: process.env.REGION }),
  uuid = require('uuid')

module.exports.autoConfirmEmail = async (event, context, callback) => {
  event.response.autoConfirmUser = true
  callback(null, event)
}

module.exports.getGame = async (event, context, callback) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ORIGIN
    },
    body: JSON.stringify({
      message: 'Game Returned'
    })
  }
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
