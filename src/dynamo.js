'use strict';

const AWS = require('aws-sdk'); 
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.Submit = async (item, TableName) => {
  const Info = {
    TableName: TableName,
    Item: item,
    ReturnValue: 'ALL_NEW',
  };
  const res = await dynamoDb.put(Info).promise();
  return item;
};

module.exports.List = async (fields, TableName) => {
  const Info = {
    TableName: TableName,
    ProjectionExpression: fields,
  };
  const res = await dynamoDb.scan(Info).promise();
  return res;
};

module.exports.Query = async (projection, attribute, condition, TableName, names) => {
  const Info = {
    TableName: TableName,
    ProjectionExpression: projection,
    ExpressionAttributeValues: attribute,
    KeyConditionExpression: condition,
  };
  if (names) {
    Info['ExpressionAttributeNames'] = names;
  }
  const res = await dynamoDb.query(Info).promise();
  return res;
};

module.exports.Get = async (key, TableName) => {
  const Info = {
    TableName: TableName,
    Key: key,
  };
  const res = await dynamoDb.get(Info).promise();
  return res;
};

module.exports.Update = async (key, item, TableName) => {
  const Info = {
    TableName: TableName,
    Key: key,
    AttributeUpdates: item,
    ReturnValues: 'ALL_NEW',
  };
  const res = await dynamoDb.update(Info).promise();
  return res.Attributes;
}

module.exports.Delete = async (key, TableName) => {
  const Info = {
    TableName: TableName,
    Key: key,
  };
  const res = await dynamoDb.delete(Info).promise();
  return res;
}