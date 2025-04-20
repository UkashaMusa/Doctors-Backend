🔗 API Overview
The U-MEDIC API is built with Express.js and connected to a MongoDB database. It powers the backend functionalities of the platform, allowing users to seamlessly book medical appointments, manage user accounts, and handle payment processing via PayPal.

📌 Key Features
User Authentication & Authorization

Register and log in users securely

JWT-based authentication for protected routes

Doctor Management

Fetch all registered doctors

Filter doctors by speciality

Admin routes to add, update, or delete doctor profiles

Appointment Booking

Users can book, view, and cancel appointments

Doctors can manage their appointments

Time slot conflict checks

Speciality Search

Filter doctors by specific specialities

Enables quick navigation for users seeking specific care

Payment Integration

Integrated with PayPal API for secure payments

Users can complete payment while booking an appointment

Payment status stored and verified in the backend

Admin Panel Endpoints

Access to manage users and doctor records

View statistics and platform data insights

🛠️ Technologies Used
Express.js – Web framework for Node.js

MongoDB – NoSQL database for storing users, appointments, doctors, etc.

Mongoose – MongoDB object modeling for Node.js

PayPal REST SDK – For integrating PayPal payments

JWT – For user authentication and route protection

