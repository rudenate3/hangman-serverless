'use strict'

const AWS = require('aws-sdk')

module.exports.createDocClient = () => {
  return new AWS.DynamoDB.DocumentClient({
    region: process.env.REGION
  })
}
