import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user?: AuthenticatedUser;
}

export const authenticate = (event: APIGatewayProxyEvent): AuthenticatedUser | null => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const requireAuth = (event: APIGatewayProxyEvent): { user: AuthenticatedUser } | { error: any } => {
  const user = authenticate(event);
  
  if (!user) {
    return {
      error: {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    };
  }

  return { user };
};

export const requireOwner = (event: APIGatewayProxyEvent): { user: AuthenticatedUser } | { error: any } => {
  const authResult = requireAuth(event);
  
  if ('error' in authResult) {
    return authResult;
  }

  if (authResult.user.role !== 'owner') {
    return {
      error: {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ error: 'Forbidden: Owner access required' })
      }
    };
  }

  return authResult;
};

export const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};
