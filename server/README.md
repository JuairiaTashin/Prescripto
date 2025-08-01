# Prescripto Server

A TypeScript-based Express.js backend server with MongoDB integration for the Prescripto application.

## Features

-   ✅ TypeScript support
-   ✅ Express.js server
-   ✅ MongoDB integration with Mongoose
-   ✅ CORS enabled
-   ✅ User model with name and email fields
-   ✅ RESTful API endpoints
-   ✅ Input validation
-   ✅ Error handling
-   ✅ Nodemon for development
-   ✅ Test API endpoints

## Project Structure

```
src/
├── config/
│   └── database.ts         # MongoDB connection configuration
├── controllers/
│   ├── userController.ts   # User CRUD operations
│   └── testController.ts   # Test API endpoints
├── models/
│   └── User.ts            # User model and schema
└── server.ts              # Main server file
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:
   Make sure your `.env` file contains:

```
MONGODB_URI=mongodb://127.0.0.1:27017/Prescripto
JWT_SECRET=Prescripto
```

## Scripts

-   `npm run dev` - Start development server with nodemon
-   `npm run build` - Build TypeScript to JavaScript
-   `npm start` - Start production server
-   `npm test` - Run tests (placeholder)

## API Endpoints

### Test Endpoints

-   `GET /` - Welcome message with API documentation
-   `GET /api/test` - Test API functionality
-   `GET /api/health` - Health check endpoint

### User Endpoints

-   `GET /api/users` - Get all users
-   `GET /api/users/:id` - Get user by ID
-   `POST /api/users` - Create new user
-   `PUT /api/users/:id` - Update user
-   `DELETE /api/users/:id` - Delete user

## User Model

The User model contains the following fields:

-   `name` (String, required, 2-50 characters)
-   `email` (String, required, unique, valid email format)
-   `createdAt` (Date, auto-generated)
-   `updatedAt` (Date, auto-generated)

## Usage Examples

### Create a new user

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

### Get all users

```bash
curl http://localhost:5000/api/users
```

### Get user by ID

```bash
curl http://localhost:5000/api/users/USER_ID_HERE
```

### Update user

```bash
curl -X PUT http://localhost:5000/api/users/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com"
  }'
```

### Delete user

```bash
curl -X DELETE http://localhost:5000/api/users/USER_ID_HERE
```

## Development

1. Start the development server:

```bash
npm run dev
```

2. The server will start on `http://localhost:5000`

3. MongoDB should be running on `mongodb://127.0.0.1:27017/Prescripto`

## Production

1. Build the project:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## Response Format

All API responses follow this format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "count": 10 // (for list endpoints)
}
```

### Error Response

```json
{
	"success": false,
	"message": "Error description",
	"errors": ["Validation error 1", "Validation error 2"] // (for validation errors)
}
```

## Error Handling

The server includes comprehensive error handling for:

-   Validation errors
-   Database connection issues
-   Duplicate email addresses
-   Invalid user IDs
-   Server errors

## Environment Variables

-   `PORT` - Server port (default: 5000)
-   `MONGODB_URI` - MongoDB connection string
-   `NODE_ENV` - Environment (development/production)
-   `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Technologies Used

-   **Node.js** - Runtime environment
-   **Express.js** - Web framework
-   **TypeScript** - Type-safe JavaScript
-   **MongoDB** - Database
-   **Mongoose** - ODM for MongoDB
-   **nodemon** - Development server
-   **cors** - Cross-origin resource sharing
-   **dotenv** - Environment variables
