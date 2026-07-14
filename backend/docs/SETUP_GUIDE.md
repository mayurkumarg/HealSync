# HealSync Backend - Setup Guide

## Project Overview
HealSync is a comprehensive healthcare management system with:
- User authentication and authorization
- Pharmacy management
- Medicine inventory
- **NEW:** Advanced Reminder Scheduling System
- Real-time notifications via Socket.IO
- Email notifications

---

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager
- Optional: Nodemailer-compatible email service (Gmail, SendGrid, etc.)

---

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

This will install all required packages:
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **socket.io** - Real-time communication
- **node-cron** - Task scheduling
- **nodemailer** - Email service
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **multer** - File uploads
- **dotenv** - Environment configuration

### 2. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/healsync?retryWrites=true&w=majority

# Server
PORT=5050
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_specific_password_not_regular_password

# Supabase (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_KEY=your_key_here

# Mapbox (Optional)
MAPBOX_ACCESS_TOKEN=your_token_here

# Frontend
FRONTEND_URL=http://localhost:3000

# Scheduler
REMINDER_CHECK_INTERVAL=*/5 * * * *
MAX_REMINDERS_PER_USER=50
NOTIFICATION_LEAD_TIME_MINUTES=15
```

#### Email Setup (Gmail Example):
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use the 16-character App Password in `EMAIL_PASSWORD`

### 3. MongoDB Setup

#### Option A: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string
5. Replace `username:password` with your credentials in `MONGO_URI`

#### Option B: Local MongoDB
```bash
# Install MongoDB locally
# On Windows, download from https://www.mongodb.com/try/download/community

# Update .env:
MONGO_URI=mongodb://localhost:27017/healsync
```

---

## Running the Project

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5050`

---

## Scheduler System

### How It Works

The scheduler automatically runs background tasks:

1. **Every 5 minutes** - Check for pending reminders that need to be sent
   - Compares current time with reminder notification time
   - Sends notifications via email and Socket.IO
   - Updates reminder status

2. **Daily at 2:00 AM** - Clean up expired reminders
   - Removes reminders older than 30 days with status "completed" or "dismissed"

3. **Daily at 3:00 AM** - Process recurring reminders
   - Creates new instances for recurring reminders
   - Sets up next occurrence date

### Cron Expression Format
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *

Examples:
*/5 * * * *     - Every 5 minutes
0 2 * * *       - Daily at 2:00 AM
0 3 * * *       - Daily at 3:00 AM
0 0 * * 0       - Every Sunday at midnight
```

---

## API Endpoints

### Reminder Endpoints
All endpoints require JWT authentication in the `Authorization` header.

#### Create Reminder
```
POST /api/reminders
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "title": "Doctor Appointment",
  "description": "Annual checkup",
  "reminderType": "appointment",
  "reminderDateTime": "2024-12-20T10:30:00Z",
  "notificationTime": "1-hour-before",
  "priority": "high",
  "location": "City Medical Center"
}
```

#### Get All Reminders
```
GET /api/reminders?status=pending&reminderType=appointment
Authorization: Bearer <JWT_TOKEN>
```

#### Get Upcoming Reminders (Next 7 days)
```
GET /api/reminders/upcoming?days=7
Authorization: Bearer <JWT_TOKEN>
```

#### Get Reminder Statistics
```
GET /api/reminders/stats
Authorization: Bearer <JWT_TOKEN>
```

#### Get Single Reminder
```
GET /api/reminders/:reminderId
Authorization: Bearer <JWT_TOKEN>
```

#### Update Reminder
```
PUT /api/reminders/:reminderId
Authorization: Bearer <JWT_TOKEN>

{
  "title": "Updated Title",
  "priority": "critical"
}
```

#### Delete Reminder
```
DELETE /api/reminders/:reminderId
Authorization: Bearer <JWT_TOKEN>
```

#### Mark as Completed
```
PATCH /api/reminders/:reminderId/complete
Authorization: Bearer <JWT_TOKEN>
```

#### Dismiss Reminder
```
PATCH /api/reminders/:reminderId/dismiss
Authorization: Bearer <JWT_TOKEN>
```

---

## Socket.IO Integration

### Frontend Connection Example

```javascript
import io from 'socket.io-client';

// Connect to server
const socket = io('http://localhost:5050', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// On connection, send user ID
socket.on('connect', () => {
  const userId = localStorage.getItem('userId');
  socket.emit('user-connect', userId);
});

// Listen for connection success
socket.on('connection-success', (data) => {
  console.log('Connected:', data);
});

// Listen for reminder notifications
socket.on('reminder-notification', (reminder) => {
  console.log('New reminder notification:', reminder);
  
  // Show browser notification
  new Notification(reminder.title, {
    body: reminder.description,
    icon: '/alert-icon.png'
  });
});

// Acknowledge receipt
socket.emit('reminder-acknowledged', {
  userId: localStorage.getItem('userId'),
  reminderId: reminder.reminderId
});
```

---

## Reminder Schema

### Reminder Types
- `appointment` - Medical appointments
- `prescription` - Medication prescriptions
- `report` - Medical report collection
- `medication` - Medication intake
- `lab-test` - Lab tests
- `follow-up` - Follow-up visits
- `other` - Other

### Notification Times
- `on-time` - At scheduled time
- `15-minutes-before` - 15 minutes early
- `1-hour-before` - 1 hour early
- `1-day-before` - 1 day early
- `custom` - Custom minutes (specify `customNotificationMinutes`)

### Statuses
- `pending` - Waiting to be sent
- `sent` - Notification sent
- `completed` - User marked as completed
- `dismissed` - User dismissed
- `expired` - Past reminder date

### Priority Levels
- `low` - Low priority
- `medium` - Standard priority
- `high` - Important
- `critical` - Urgent

---

## Recurring Reminders

Create a recurring reminder:

```json
{
  "title": "Weekly Doctor Visit",
  "reminderType": "follow-up",
  "reminderDateTime": "2024-12-18T14:00:00Z",
  "recurringPattern": {
    "isRecurring": true,
    "frequency": "weekly",
    "endDate": "2025-12-31T23:59:59Z",
    "daysOfWeek": [1, 3, 5]
  }
}
```

**Frequencies:** daily, weekly, bi-weekly, monthly, quarterly, yearly

---

## Notification Channels

Each reminder can send via multiple channels:

```json
{
  "notificationChannels": {
    "email": true,
    "sms": false,
    "pushNotification": true,
    "inApp": true
  }
}
```

- **email** - Email notification
- **sms** - SMS (optional, requires SMS provider)
- **pushNotification** - Browser push notification
- **inApp** - Socket.IO real-time notification

---

## Testing the System

### 1. Test Basic Server
```bash
curl http://localhost:5050/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-12-15T14:30:00.000Z"
}
```

### 2. Create Test Reminder
```bash
# First, get a valid JWT token from login endpoint
# Then create a reminder:

curl -X POST http://localhost:5050/api/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Reminder",
    "reminderType": "appointment",
    "reminderDateTime": "2024-12-20T10:30:00Z"
  }'
```

### 3. Test Real-Time Notifications
1. Create a reminder scheduled for 5 minutes from now
2. Connect to Socket.IO in browser console
3. Watch for `reminder-notification` event

---

## Project Structure

```
backend/
├── app.js                          # Express app setup
├── server.js                       # Server entry point with Socket.IO
├── .env                           # Environment variables
├── package.json                   # Dependencies
├── configure/
│   ├── mongoDB.js                # MongoDB connection
│   └── supabase.js               # Supabase config
├── models/
│   ├── userModel.js              # User schema
│   └── medical/
│       ├── medicine.js           # Medicine schema
│       ├── pharmacy.js           # Pharmacy schema
│       ├── pharmacyStock.js      # Stock schema
│       └── reminder.js           # Reminder schema (NEW)
├── controllers/
│   ├── authorization.js          # Auth middleware
│   ├── authentication/           # Login/Register
│   ├── pharmacy/                 # Pharmacy operations
│   ├── Error/                    # Error handling
│   └── reminder/
│       └── reminderController.js # Reminder CRUD (NEW)
├── routes/
│   ├── userRoute.js             # Auth routes
│   ├── pharmacyRoute.js         # Pharmacy routes
│   ├── medicineRoute.js         # Medicine routes
│   └── reminderRoute.js         # Reminder routes (NEW)
├── service/
│   ├── email.js                 # Email service (UPDATED)
│   ├── socket.js                # Socket.IO setup (NEW)
│   ├── reminderScheduler.js     # Cron scheduler (NEW)
│   ├── JWT.js                   # JWT utilities
│   ├── token.js                 # Token generation
│   ├── geocode.js               # Geolocation
│   └── multer.js                # File uploads
└── utils/
    ├── asyncFunctionHandler.js  # Async wrapper
    ├── customError.js           # Error class
    ├── uploadToCloud.js         # Cloud upload
    └── deleteFromCloud.js       # Cloud delete
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `PORT` | No | Server port (default: 5050) |
| `NODE_ENV` | No | Environment (development/production) |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `JWT_EXPIRE` | No | JWT expiration time (default: 7d) |
| `EMAIL_USER` | No | Email sender address |
| `EMAIL_PASSWORD` | No | Email password/app token |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | No | Supabase service key |
| `MAPBOX_ACCESS_TOKEN` | No | Mapbox API token |
| `FRONTEND_URL` | No | Frontend base URL |
| `REMINDER_CHECK_INTERVAL` | No | Cron expression for scheduler |
| `MAX_REMINDERS_PER_USER` | No | Max reminders limit |
| `NOTIFICATION_LEAD_TIME_MINUTES` | No | Default notification advance time |

---

## Troubleshooting

### Server Won't Start
- Check MongoDB connection string in `.env`
- Verify MongoDB is running
- Check if port 5050 is already in use

### Reminders Not Sending
- Verify email configuration in `.env`
- Check scheduler is initialized (see console logs)
- Ensure reminder date is in future
- Check browser console for Socket.IO connection errors

### Socket.IO Connection Failed
- Verify FRONTEND_URL in `.env`
- Check CORS settings in `app.js`
- Ensure Socket.IO is initialized in `server.js`

### Email Not Sending
- Use Gmail App Password, not regular password
- Enable 2FA on Gmail account
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`

---

## Deployment Checklist

- [ ] Update `NODE_ENV` to `production`
- [ ] Set strong `JWT_SECRET`
- [ ] Configure production MongoDB URI
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Configure email service credentials
- [ ] Set up SSL certificate
- [ ] Enable CORS for production domain
- [ ] Configure logging and monitoring
- [ ] Set up database backups
- [ ] Test scheduler on production

---

## Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Node-Cron Documentation](https://github.com/kelektiv/node-cron)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express Documentation](https://expressjs.com/)
- [Nodemailer Documentation](https://nodemailer.com/)

---

## Support

For issues or questions about the reminder system, refer to:
- `REMINDER_API_DOCUMENTATION.md` - Complete API reference
- Console logs when server is running
- Browser console for Socket.IO debugging
