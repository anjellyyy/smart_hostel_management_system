-- Create database
CREATE DATABASE IF NOT EXISTS hostel_management;
USE hostel_management;

-- Students table
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    contact VARCHAR(15) NOT NULL,
    room_no VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    room_no VARCHAR(10) PRIMARY KEY,
    type ENUM('Single', 'Double', 'Suite') NOT NULL,
    capacity INT NOT NULL,
    availability ENUM('Available', 'Occupied') DEFAULT 'Available',
    amenities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_type ENUM('Semester Fee', 'Security Deposit', 'Other') NOT NULL,
    status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    issue_type ENUM('Electrical', 'Plumbing', 'Furniture', 'Cleaning', 'WiFi', 'Other') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending', 'Resolved') DEFAULT 'Pending',
    complaint_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Insert sample rooms
INSERT IGNORE INTO rooms (room_no, type, capacity, amenities) VALUES
('101', 'Single', 1, 'WiFi, Study Table, Wardrobe'),
('102', 'Double', 2, 'WiFi, Study Table, Wardrobe, AC'),
('103', 'Single', 1, 'WiFi, Study Table, Wardrobe'),
('104', 'Double', 2, 'WiFi, Study Table, Wardrobe, AC'),
('201', 'Single', 1, 'WiFi, Study Table, Wardrobe, AC'),
('202', 'Double', 2, 'WiFi, Study Table, Wardrobe, AC'),
('203', 'Suite', 3, 'WiFi, Study Table, Wardrobe, AC, Attached Bathroom');

-- Insert sample students
INSERT IGNORE INTO students (student_id, name, age, gender, contact, room_no) VALUES
('S1001', 'John Doe', 20, 'Male', '+1234567890', '101'),
('S1002', 'Jane Smith', 21, 'Female', '+1234567891', '102'),
('S1003', 'Mike Johnson', 22, 'Male', '+1234567892', '201');

-- Insert sample payments
INSERT IGNORE INTO payments (student_id, amount, payment_date, payment_type) VALUES
('S1001', 500.00, '2023-09-01', 'Semester Fee'),
('S1002', 500.00, '2023-09-02', 'Semester Fee'),
('S1003', 300.00, '2023-09-01', 'Security Deposit');

-- Insert sample complaints
INSERT IGNORE INTO complaints (student_id, issue_type, description, status) VALUES
('S1001', 'Electrical', 'Light not working in room', 'Resolved'),
('S1002', 'Plumbing', 'Water leakage in bathroom', 'Pending'),
('S1003', 'WiFi', 'Poor network connectivity', 'Resolved');