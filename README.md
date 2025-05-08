# Los Compaitos - Restaurant Order Management System

A complete restaurant order management system with menu management, table reservations, order tracking, and reporting capabilities.

## Features

- User authentication with role-based access control (Admin, Waiter, Chef)
- Menu management
- Table management with visual layout
- Order creation and tracking
- Kitchen view for order preparation
- Reporting and analytics
- Responsive design for desktop and mobile devices

## Technologies Used

- HTML/CSS/JavaScript (Vanilla)
- SCSS for styling
- MongoDB Atlas for database
- Express.js for the backend
- Node.js runtime

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following:
   ```
   MONGODB_URI=mongodb+srv://your-mongodb-connection-string
   PORT=3000
   SESSION_SECRET=your-session-secret
   ```
4. Start the development server:
   ```
   npm run dev:all
   ```

## Project Structure

- `/public` - Frontend assets
  - `/css` - Compiled CSS files
  - `/scss` - SCSS source files
  - `/js` - JavaScript files
  - `/img` - Images
- `/server` - Backend code
  - `/models` - MongoDB models
  - `/routes` - API routes
- `server.js` - Main server file

## API Documentation

The API provides endpoints for:

- Authentication (`/api/auth`)
- Menu management (`/api/menu`)
- Table management (`/api/tables`)
- Order management (`/api/orders`)

## Default Users

For initial login, the system will need an admin user to be created directly in the database:

```javascript
{
  "username": "admin",
  "password": "admin123", // This will be hashed by the model
  "name": "Administrator",
  "role": "admin"
}
```