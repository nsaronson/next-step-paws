import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbPut, dbUpdate, dbScan, dbQuery, CLASSES_TABLE } from './dynamodb';
import { requireAuth, requireOwner, responseHeaders } from './middleware';

export const getClasses = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { level } = event.queryStringParameters || {};
    
    let classes;

    if (level) {
      classes = await dbQuery(
        CLASSES_TABLE,
        'LevelIndex',
        '#level = :level',
        { ':level': level }
      );
    } else {
      classes = await dbScan(CLASSES_TABLE);
    }

    // Sort by name
    classes.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(classes)
    };
  } catch (error) {
    console.error('Get classes error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to fetch classes' })
    };
  }
};

export const createClass = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireOwner(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const { name, description, schedule, maxSpots, price, level } = JSON.parse(event.body);

    if (!name || !schedule || !maxSpots || !price || !level) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ 
          error: 'Name, schedule, max spots, price, and level are required' 
        })
      };
    }

    // Validate level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(level)) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ 
          error: 'Level must be Beginner, Intermediate, or Advanced' 
        })
      };
    }

    // Validate maxSpots and price
    if (maxSpots < 1 || maxSpots > 50) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Max spots must be between 1 and 50' })
      };
    }

    if (price < 0) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Price must be non-negative' })
      };
    }

    // Create new class
    const classId = uuidv4();
    const newClass = {
      id: classId,
      name: name.trim(),
      description: description?.trim() || null,
      schedule: schedule.trim(),
      spots: 0,
      maxSpots: parseInt(maxSpots),
      price: parseFloat(price),
      level,
      enrolledStudents: [],
      waitlist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbPut(CLASSES_TABLE, newClass);

    return {
      statusCode: 201,
      headers: responseHeaders,
      body: JSON.stringify(newClass)
    };
  } catch (error) {
    console.error('Create class error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to create class' })
    };
  }
};

export const updateClass = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireOwner(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const classId = event.pathParameters?.id;

    if (!classId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Class ID is required' })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const updates = JSON.parse(event.body);

    // Get existing class
    const existingClass = await dbGet(CLASSES_TABLE, { id: classId });
    
    if (!existingClass) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Class not found' })
      };
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {
      ':updatedAt': new Date().toISOString()
    };
    const expressionAttributeNames: any = {};

    const allowedFields = ['name', 'description', 'schedule', 'maxSpots', 'price', 'level'];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        if (key === 'level') {
          const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
          if (!validLevels.includes(updates[key])) {
            throw new Error('Invalid level');
          }
          updateExpressions.push('#level = :level');
          expressionAttributeNames['#level'] = 'level';
          expressionAttributeValues[':level'] = updates[key];
        } else if (key === 'maxSpots') {
          const maxSpots = parseInt(updates[key]);
          if (maxSpots < 1 || maxSpots > 50) {
            throw new Error('Max spots must be between 1 and 50');
          }
          updateExpressions.push('maxSpots = :maxSpots');
          expressionAttributeValues[':maxSpots'] = maxSpots;
        } else if (key === 'price') {
          const price = parseFloat(updates[key]);
          if (price < 0) {
            throw new Error('Price must be non-negative');
          }
          updateExpressions.push('price = :price');
          expressionAttributeValues[':price'] = price;
        } else {
          updateExpressions.push(`${key} = :${key}`);
          expressionAttributeValues[`:${key}`] = key === 'description' ? 
            (updates[key]?.trim() || null) : updates[key].trim();
        }
      }
    });

    if (updateExpressions.length === 0) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'No valid fields to update' })
      };
    }

    updateExpressions.push('updatedAt = :updatedAt');

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    const updatedClass = await dbUpdate(
      CLASSES_TABLE,
      { id: classId },
      updateExpression,
      expressionAttributeValues,
      Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined
    );

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(updatedClass)
    };
  } catch (error) {
    console.error('Update class error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: (error as Error).message || 'Failed to update class' })
    };
  }
};

export const enrollInClass = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const classId = event.pathParameters?.id;

    if (!classId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Class ID is required' })
      };
    }

    // Get class
    const classData = await dbGet(CLASSES_TABLE, { id: classId });
    
    if (!classData) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Class not found' })
      };
    }

    // Check if user is already enrolled
    const enrolledStudents = classData.enrolledStudents || [];
    const waitlist = classData.waitlist || [];

    if (enrolledStudents.includes(user.userId)) {
      return {
        statusCode: 409,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Already enrolled in this class' })
      };
    }

    if (waitlist.includes(user.userId)) {
      return {
        statusCode: 409,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Already on waitlist for this class' })
      };
    }

    let updateExpression: string;
    let expressionAttributeValues: any;

    if (classData.spots < classData.maxSpots) {
      // Add to enrolled students
      updateExpression = 'SET enrolledStudents = list_append(if_not_exists(enrolledStudents, :emptyList), :userId), spots = spots + :increment, updatedAt = :updatedAt';
      expressionAttributeValues = {
        ':emptyList': [],
        ':userId': [user.userId],
        ':increment': 1,
        ':updatedAt': new Date().toISOString()
      };
    } else {
      // Add to waitlist
      updateExpression = 'SET waitlist = list_append(if_not_exists(waitlist, :emptyList), :userId), updatedAt = :updatedAt';
      expressionAttributeValues = {
        ':emptyList': [],
        ':userId': [user.userId],
        ':updatedAt': new Date().toISOString()
      };
    }

    const updatedClass = await dbUpdate(
      CLASSES_TABLE,
      { id: classId },
      updateExpression,
      expressionAttributeValues
    );

    const message = classData.spots < classData.maxSpots ? 
      'Successfully enrolled in class' : 
      'Class is full, added to waitlist';

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        message,
        class: updatedClass
      })
    };
  } catch (error) {
    console.error('Enroll in class error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to enroll in class' })
    };
  }
};
