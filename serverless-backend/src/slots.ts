import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbPut, dbDelete, dbScan, dbQuery, SLOTS_TABLE } from './dynamodb';
import { requireAuth, requireOwner, responseHeaders } from './middleware';

export const getSlots = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get query parameters
    const { date, available } = event.queryStringParameters || {};
    
    let slots;

    if (date) {
      // Get slots for a specific date
      slots = await dbQuery(
        SLOTS_TABLE,
        'DateIndex',
        '#date = :date',
        { ':date': date }
      );
    } else if (available === 'true') {
      // Get only available slots
      slots = await dbQuery(
        SLOTS_TABLE,
        'BookingStatusIndex',
        'isBooked = :isBooked',
        { ':isBooked': 'false' }
      );
    } else {
      // Get all slots
      slots = await dbScan(SLOTS_TABLE);
    }

    // Filter future slots only for customers
    const { user } = authResult;
    if (user.role !== 'owner') {
      const now = new Date();
      slots = slots.filter((slot: any) => {
        const slotDateTime = new Date(`${slot.date}T${slot.time}`);
        return slotDateTime > now;
      });
    }

    // Sort by date and time
    slots.sort((a: any, b: any) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(slots)
    };
  } catch (error) {
    console.error('Get slots error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to fetch slots' })
    };
  }
};

export const createSlot = async (
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

    const { date, time, duration = 60 } = JSON.parse(event.body);

    if (!date || !time) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Date and time are required' })
      };
    }

    // Validate duration
    if (![30, 60].includes(duration)) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Duration must be 30 or 60 minutes' })
      };
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Date must be in YYYY-MM-DD format' })
      };
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Time must be in HH:MM format' })
      };
    }

    // Check if slot already exists
    const existingSlots = await dbQuery(
      SLOTS_TABLE,
      'DateIndex',
      '#date = :date',
      { ':date': date }
    );

    const slotExists = existingSlots.some((slot: any) => 
      slot.time === time && slot.duration === duration
    );

    if (slotExists) {
      return {
        statusCode: 409,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Slot already exists for this date and time' })
      };
    }

    // Create new slot
    const slotId = uuidv4();
    const slot = {
      id: slotId,
      date,
      time,
      duration,
      isBooked: 'false',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbPut(SLOTS_TABLE, slot);

    return {
      statusCode: 201,
      headers: responseHeaders,
      body: JSON.stringify(slot)
    };
  } catch (error) {
    console.error('Create slot error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to create slot' })
    };
  }
};

export const deleteSlot = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireOwner(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const slotId = event.pathParameters?.id;

    if (!slotId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Slot ID is required' })
      };
    }

    // Check if slot exists
    const slot = await dbGet(SLOTS_TABLE, { id: slotId });
    
    if (!slot) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Slot not found' })
      };
    }

    // Don't allow deletion of booked slots
    if (slot.isBooked === 'true') {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Cannot delete booked slot' })
      };
    }

    await dbDelete(SLOTS_TABLE, { id: slotId });

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Slot deleted successfully' })
    };
  } catch (error) {
    console.error('Delete slot error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to delete slot' })
    };
  }
};
