const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = 'next-step-paws-api-users-prod';
const CLASSES_TABLE = 'next-step-paws-api-classes-prod';
const SLOTS_TABLE = 'next-step-paws-api-slots-prod';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // 1. Create owner account
    const ownerPassword = await bcrypt.hash('paws123', 10);
    const owner = {
      id: uuidv4(),
      email: 'owner@nextsteppaws.com',
      name: 'Next Step Paws Owner',
      role: 'owner',
      passwordHash: ownerPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: owner
    }).promise();

    console.log('✅ Owner account created:', owner.email);

    // 2. Create sample group classes
    const classes = [
      {
        id: uuidv4(),
        name: 'Puppy Basics',
        description: 'Foundation training for puppies 8-16 weeks old',
        schedule: 'Tuesdays 10:00 AM',
        spots: 0,
        maxSpots: 6,
        price: 120.00,
        level: 'Beginner',
        enrolledStudents: [],
        waitlist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Basic Obedience',
        description: 'Sit, stay, come, and loose leash walking',
        schedule: 'Thursdays 6:00 PM',
        spots: 0,
        maxSpots: 8,
        price: 150.00,
        level: 'Beginner',
        enrolledStudents: [],
        waitlist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Advanced Training',
        description: 'Complex commands and problem-solving',
        schedule: 'Saturdays 9:00 AM',
        spots: 0,
        maxSpots: 4,
        price: 200.00,
        level: 'Advanced',
        enrolledStudents: [],
        waitlist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const classData of classes) {
      await dynamodb.put({
        TableName: CLASSES_TABLE,
        Item: classData
      }).promise();
    }

    console.log('✅ Sample classes created:', classes.length);

    // 3. Create sample time slots for the next 30 days
    const slots = [];
    const today = new Date();
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    const durations = [30, 60];

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      for (const time of times) {
        for (const duration of durations) {
          slots.push({
            id: uuidv4(),
            date: dateString,
            time: time,
            duration: duration,
            isBooked: 'false',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    // Batch write slots (DynamoDB batch write limit is 25 items)
    const batchSize = 25;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      const params = {
        RequestItems: {
          [SLOTS_TABLE]: batch.map(slot => ({
            PutRequest: { Item: slot }
          }))
        }
      };
      
      await dynamodb.batchWrite(params).promise();
    }

    console.log('✅ Sample time slots created:', slots.length);

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Owner Login Credentials:');
    console.log('Email: owner@nextsteppaws.com');
    console.log('Password: paws123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
