import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as bcrypt from 'bcryptjs';
import { dbGet, dbUpdate, dbScan, dbQuery, USERS_TABLE } from './dynamodb';
import { requireAuth, requireOwner, responseHeaders } from './middleware';

export const getUsers = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireOwner(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { role } = event.queryStringParameters || {};
    
    let users;

    if (role) {
      users = await dbQuery(
        USERS_TABLE,
        'RoleIndex',
        '#role = :role',
        { ':role': role }
      );
    } else {
      users = await dbScan(USERS_TABLE);
    }

    // Remove password hashes from response
    const sanitizedUsers = users.map((user: any) => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    // Sort by name
    sanitizedUsers.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(sanitizedUsers)
    };
  } catch (error) {
    console.error('Get users error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to fetch users' })
    };
  }
};

export const getUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user: currentUser } = authResult;
    const userId = event.pathParameters?.id;

    if (!userId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Users can only access their own data, owners can access any user's data
    if (currentUser.role !== 'owner' && currentUser.userId !== userId) {
      return {
        statusCode: 403,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Forbidden' })
      };
    }

    const user = await dbGet(USERS_TABLE, { id: userId });
    
    if (!user) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(userWithoutPassword)
    };
  } catch (error) {
    console.error('Get user error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to fetch user' })
    };
  }
};

export const updateUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user: currentUser } = authResult;
    const userId = event.pathParameters?.id;

    if (!userId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    // Users can only update their own data, owners can update any user's data
    if (currentUser.role !== 'owner' && currentUser.userId !== userId) {
      return {
        statusCode: 403,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Forbidden' })
      };
    }

    const updates = JSON.parse(event.body);

    // Get existing user
    const existingUser = await dbGet(USERS_TABLE, { id: userId });
    
    if (!existingUser) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {
      ':updatedAt': new Date().toISOString()
    };
    const expressionAttributeNames: any = {};

    // Handle different update fields
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Name cannot be empty' })
        };
      }
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = updates.name.trim();
    }

    if (updates.dogName !== undefined) {
      updateExpressions.push('dogName = :dogName');
      expressionAttributeValues[':dogName'] = updates.dogName ? updates.dogName.trim() : null;
    }

    if (updates.email !== undefined) {
      // Check if email is already taken by another user
      const emailCheck = await dbQuery(
        USERS_TABLE,
        'EmailIndex',
        'email = :email',
        { ':email': updates.email }
      );

      if (emailCheck.length > 0 && emailCheck[0].id !== userId) {
        return {
          statusCode: 409,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Email already in use' })
        };
      }

      updateExpressions.push('email = :email');
      expressionAttributeValues[':email'] = updates.email.trim().toLowerCase();
    }

    if (updates.password !== undefined) {
      if (updates.password.length < 6) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Password must be at least 6 characters' })
        };
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(updates.password, saltRounds);
      updateExpressions.push('passwordHash = :passwordHash');
      expressionAttributeValues[':passwordHash'] = passwordHash;
    }

    // Only owners can update role
    if (updates.role !== undefined && currentUser.role === 'owner') {
      const validRoles = ['owner', 'customer'];
      if (!validRoles.includes(updates.role)) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Invalid role' })
        };
      }
      updateExpressions.push('#role = :role');
      expressionAttributeNames['#role'] = 'role';
      expressionAttributeValues[':role'] = updates.role;
    }

    if (updateExpressions.length === 0) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'No valid fields to update' })
      };
    }

    updateExpressions.push('updatedAt = :updatedAt');

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    const updatedUser = await dbUpdate(
      USERS_TABLE,
      { id: userId },
      updateExpression,
      expressionAttributeValues,
      Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined
    );

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = updatedUser as any;

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(userWithoutPassword)
    };
  } catch (error) {
    console.error('Update user error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to update user' })
    };
  }
};
