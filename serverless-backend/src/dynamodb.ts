import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
export const dynamodb = DynamoDBDocumentClient.from(client);

// Table names from environment variables
export const USERS_TABLE = process.env.USERS_TABLE!;
export const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE!;
export const CLASSES_TABLE = process.env.CLASSES_TABLE!;
export const SLOTS_TABLE = process.env.SLOTS_TABLE!;

// Helper functions for common DynamoDB operations
export const dbGet = async (tableName: string, key: any) => {
  const command = new GetCommand({
    TableName: tableName,
    Key: key
  });
  const response = await dynamodb.send(command);
  return response.Item;
};

export const dbPut = async (tableName: string, item: any) => {
  const command = new PutCommand({
    TableName: tableName,
    Item: item
  });
  return await dynamodb.send(command);
};

export const dbUpdate = async (tableName: string, key: any, updateExpression: string, expressionAttributeValues: any, expressionAttributeNames?: any) => {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW'
  });
  const response = await dynamodb.send(command);
  return response.Attributes;
};

export const dbDelete = async (tableName: string, key: any) => {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key
  });
  return await dynamodb.send(command);
};

export const dbScan = async (tableName: string, filterExpression?: string, expressionAttributeValues?: any) => {
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues
  });
  const response = await dynamodb.send(command);
  return response.Items || [];
};

export const dbQuery = async (tableName: string, indexName: string, keyConditionExpression: string, expressionAttributeValues: any) => {
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues
  });
  const response = await dynamodb.send(command);
  return response.Items || [];
};
