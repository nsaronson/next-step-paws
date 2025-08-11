-- Create database schema for dog training scheduler

-- Users table (customers and owners)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('owner', 'customer')) NOT NULL,
    dog_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Group classes table
CREATE TABLE group_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    schedule VARCHAR(255) NOT NULL,
    spots INTEGER NOT NULL DEFAULT 0,
    max_spots INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    level VARCHAR(20) CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Group class enrollments
CREATE TABLE group_class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES group_classes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

-- Available time slots for private lessons
CREATE TABLE available_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER CHECK (duration IN (30, 60)) DEFAULT 60, -- minutes
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, time, duration)
);

-- Private lesson bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID REFERENCES available_slots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dog_name VARCHAR(255) NOT NULL,
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('confirmed', 'pending', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_group_classes_level ON group_classes(level);
CREATE INDEX idx_available_slots_date ON available_slots(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);

-- Insert default owner account
INSERT INTO users (email, name, role, password_hash) VALUES 
('owner@poodletraining.com', 'Training Owner', 'owner', '$2b$10$defaulthash');

-- Insert sample group classes
INSERT INTO group_classes (name, description, schedule, max_spots, price, level) VALUES 
('Puppy Basics', 'Foundation training for puppies 8-16 weeks old', 'Tuesdays 10:00 AM', 6, 120.00, 'Beginner'),
('Basic Obedience', 'Sit, stay, come, and loose leash walking', 'Thursdays 6:00 PM', 8, 150.00, 'Beginner'),
('Advanced Training', 'Complex commands and problem-solving', 'Saturdays 9:00 AM', 4, 200.00, 'Advanced');

-- Insert sample available slots for the next 30 days (both 30 and 60 minute sessions)
INSERT INTO available_slots (date, time, duration) 
SELECT 
    CURRENT_DATE + (interval '1 day' * generate_series(1, 30)),
    t.time,
    d.duration
FROM (VALUES ('09:00'::time), ('10:00'::time), ('11:00'::time), ('14:00'::time), ('15:00'::time), ('16:00'::time)) AS t(time)
CROSS JOIN (VALUES (30), (60)) AS d(duration)
WHERE EXTRACT(dow FROM CURRENT_DATE + (interval '1 day' * generate_series(1, 30))) NOT IN (0, 6); -- Exclude weekends
