🏠 Hostel Management System with AI Chatbot
📘 Overview

The Hostel Management System (HMS) is a full-stack web application designed to simplify hostel administration tasks such as student registration, room allocation, payment management, and complaint tracking.
An integrated AI Chatbot helps students and admins interact easily for quick queries about room availability, payments, or general hostel information.

✨ Features
👨‍🎓 Student Module

Student registration with personal details and room assignment

View allocated rooms and payment history

Submit complaints and track their status

🏢 Admin Module

Dashboard overview (total students, rooms, complaints, etc.)

Manage room allocation and availability

Resolve student complaints

View payment and registration records

💬 AI Chatbot

Assists users with FAQs and system navigation

Responds to queries using natural language processing

💰 Payment Management

Record payments in ₹ (Indian Rupees)

View transaction history and status

🖥 Tech Stack
Layer	Technology Used
Frontend	HTML, CSS, JavaScript
Backend	Flask (Python)
Database	MySQL
AI Chatbot	Python (NLTK / rule-based logic)
APIs	RESTful API endpoints using Flask
Hosting (Optional)	Localhost or Render / Vercel for deployment
⚙ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/your-username/hostel-management-system.git
cd hostel-management-system

2️⃣ Set up the backend

Navigate to the backend folder:

cd backend


Install dependencies:

pip install -r requirements.txt


Configure the MySQL connection in config.py:

SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:yourpassword@localhost/hostel_db'


Initialize the database:

python app.py


✅ This will automatically create tables and seed initial data.

3️⃣ Set up the frontend

Open the frontend folder.

Launch index.html in your browser or use a local server:

cd frontend
start index.html

🧠 Chatbot Integration

The chatbot is built into the backend using Python logic.
API Endpoint:

POST /api/chatbot


Example request:

{ "message": "What rooms are available?" }


Example response:

{ "reply": "There are 5 available rooms currently." }

📊 Database Schema

Main Tables:

users — login & registration

students — student profiles

rooms — room details & availability

payments — payment tracking in rupees

complaints — complaint management

📈 Future Enhancements

Add student login portal with JWT authentication

Integrate online payment gateway (e.g., Razorpay)

Add notifications via email or WhatsApp API

Deploy chatbot using a language model API
