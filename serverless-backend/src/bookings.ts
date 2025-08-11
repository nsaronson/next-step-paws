import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbPut, dbUpdate, dbDelete, dbScan, dbQuery, BOOKINGS_TABLE, SLOTS_TABLE } from './dynamodb';
import { requireAuth, responseHeaders } from './middleware';

export const getBookings = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    let bookings;

    if (user.role === 'owner') {
      // Owner can see all bookings
      bookings = await dbScan(BOOKINGS_TABLE);
    } else {
      // Regular users can only see their own bookings
      bookings = await dbQuery(
        BOOKINGS_TABLE,
        'UserIndex',
        'userId = :userId',
        { ':userId': user.userId }
      );
    }

    // Enhance bookings with slot information
    const enhancedBookings = await Promise.all(
      bookings.map(async (booking: any) => {
        const slot = await dbGet(SLOTS_TABLE, { id: booking.slotId });
        return {
          ...booking,
          slot: slot || null
        };
      })
    );

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(enhancedBookings)
    };
  } catch (error) {
    console.error('Get bookings error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to fetch bookings' })
    };
  }
};

export const createBooking = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    if (!event.body) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const { slotId, dogName, notes } = JSON.parse(event.body);

    if (!slotId || !dogName) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Slot ID and dog name are required' })
      };
    }

    // Check if slot exists and is available
    const slot = await dbGet(SLOTS_TABLE, { id: slotId });
    
    if (!slot) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Time slot not found' })
      };
    }

    if (slot.isBooked === 'true') {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Time slot not available' })
      };
    }

    // Check if the slot is in the future
    const slotDateTime = new Date(`${slot.date}T${slot.time}`);
    if (slotDateTime <= new Date()) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Cannot book past time slots' })
      };
    }

    // Create booking
    const bookingId = uuidv4();
    const booking = {
      id: bookingId,
      slotId,
      userId: user.userId,
      dogName: dogName.trim(),
      notes: notes || null,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbPut(BOOKINGS_TABLE, booking);

    // Mark slot as booked
    await dbUpdate(
      SLOTS_TABLE,
      { id: slotId },
      'SET isBooked = :isBooked, updatedAt = :updatedAt',
      {
        ':isBooked': 'true',
        ':updatedAt': new Date().toISOString()
      }
    );

    return {
      statusCode: 201,
      headers: responseHeaders,
      body: JSON.stringify({
        ...booking,
        slot
      })
    };
  } catch (error) {
    console.error('Create booking error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to create booking' })
    };
  }
};

export const updateBooking = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const bookingId = event.pathParameters?.id;

    if (!bookingId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Booking ID is required' })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const { dogName, notes, status } = JSON.parse(event.body);

    // Get existing booking
    const existingBooking = await dbGet(BOOKINGS_TABLE, { id: bookingId });
    
    if (!existingBooking) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Booking not found' })
      };
    }

    // Check authorization (owner can update any booking, users can only update their own)
    if (user.role !== 'owner' && existingBooking.userId !== user.userId) {
      return {
        statusCode: 403,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Forbidden' })
      };
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {
      ':updatedAt': new Date().toISOString()
    };

    if (dogName !== undefined) {
      updateExpressions.push('dogName = :dogName');
      expressionAttributeValues[':dogName'] = dogName.trim();
    }

    if (notes !== undefined) {
      updateExpressions.push('notes = :notes');
      expressionAttributeValues[':notes'] = notes || null;
    }

    if (status !== undefined) {
      const validStatuses = ['confirmed', 'pending', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ error: 'Invalid status' })
        };
      }
      updateExpressions.push('#status = :status');
      expressionAttributeValues[':status'] = status;
    }

    updateExpressions.push('updatedAt = :updatedAt');

    const updateExpression = `SET ${updateExpressions.join(', ')}`;
    const expressionAttributeNames = status !== undefined ? { '#status': 'status' } : undefined;

    // Handle slot availability if status changes to cancelled
    if (status === 'cancelled' && existingBooking.status !== 'cancelled') {
      // Free up the slot
      await dbUpdate(
        SLOTS_TABLE,
        { id: existingBooking.slotId },
        'SET isBooked = :isBooked, updatedAt = :updatedAt',
        {
          ':isBooked': 'false',
          ':updatedAt': new Date().toISOString()
        }
      );
    }

    const updatedBooking = await dbUpdate(
      BOOKINGS_TABLE,
      { id: bookingId },
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(updatedBooking)
    };
  } catch (error) {
    console.error('Update booking error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to update booking' })
    };
  }
};

export const deleteBooking = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authResult = requireAuth(event);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const bookingId = event.pathParameters?.id;

    if (!bookingId) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Booking ID is required' })
      };
    }

    // Get existing booking
    const existingBooking = await dbGet(BOOKINGS_TABLE, { id: bookingId });
    
    if (!existingBooking) {
      return {
        statusCode: 404,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Booking not found' })
      };
    }

    // Check authorization
    if (user.role !== 'owner' && existingBooking.userId !== user.userId) {
      return {
        statusCode: 403,
        headers: responseHeaders,
        body: JSON.stringify({ error: 'Forbidden' })
      };
    }

    // Delete booking
    await dbDelete(BOOKINGS_TABLE, { id: bookingId });

    // Free up the slot
    await dbUpdate(
      SLOTS_TABLE,
      { id: existingBooking.slotId },
      'SET isBooked = :isBooked, updatedAt = :updatedAt',
      {
        ':isBooked': false,
        ':updatedAt': new Date().toISOString()
      }
    );

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({ message: 'Booking cancelled successfully' })
    };
  } catch (error) {
    console.error('Delete booking error:', error);
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Failed to cancel booking' })
    };
  }
};
