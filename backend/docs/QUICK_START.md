# Quick Start Guide - HealSync Backend

## 🚀 Get Running in 5 Minutes

### Step 1: MongoDB Setup (2 minutes)

#### Using MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string

#### Using Local MongoDB
Install from https://www.mongodb.com/try/download/community

### Step 2: Environment Setup (1 minute)

Update your `.env` file:

```env
# Database - Copy from MongoDB Atlas
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/healsync?retryWrites=true&w=majority

# Change these for production
PORT=5050
JWT_SECRET=your_secret_key_here_change_this
NODE_ENV=development

# Optional: Email setup (skip if not testing emails)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000

# Scheduler (optional, defaults work fine)
REMINDER_CHECK_INTERVAL=*/5 * * * *
```

### Step 3: Install & Run (2 minutes)

```bash
# Install dependencies
npm install

# Start server
npm start
# Or with auto-reload:
npm run dev
```

✅ Server running on `http://localhost:5050`

---

## 📝 Test the API

### Test Server Health
```bash
curl http://localhost:5050/api/health
```

### Create a Reminder (requires JWT token)

First, you need to login/register to get a token:

```bash
# Create user
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "phone": "9876543210"
  }'

# Login to get token
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Copy the token from response, then create reminder:
curl -X POST http://localhost:5050/api/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Doctor Appointment",
    "reminderType": "appointment",
    "reminderDateTime": "2024-12-20T10:30:00Z",
    "priority": "high",
    "description": "Annual checkup"
  }'
```

### Get All Reminders
```bash
curl -X GET http://localhost:5050/api/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Upcoming Reminders
```bash
curl -X GET "http://localhost:5050/api/reminders/upcoming?days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔌 Test Real-Time Notifications (Socket.IO)

### In Browser Console:

```javascript
// Connect to server
const socket = io('http://localhost:5050');

// Listen for connection
socket.on('connect', () => {
  console.log('Connected!');
  
  // Get your userId from localStorage or the login response
  const userId = 'YOUR_USER_ID';
  socket.emit('user-connect', userId);
});

// Listen for connection success
socket.on('connection-success', (data) => {
  console.log('Connected successfully:', data);
});

// Listen for reminder notifications
socket.on('reminder-notification', (reminder) => {
  console.log('📬 New Reminder:', reminder);
  
  // Show browser notification
  new Notification(reminder.title, {
    body: reminder.description,
    tag: reminder.reminderId
  });
});

// Listen for errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

---

## 📋 Reminder Types

When creating reminders, use these types:
- `appointment` - Doctor appointments
- `prescription` - Medication prescriptions
- `report` - Medical report collection
- `medication` - Medication reminders
- `lab-test` - Lab tests
- `follow-up` - Follow-up visits
- `other` - Anything else

---

## 🔔 Notification Options

Control how you receive notifications:

```json
{
  "notificationTime": "1-hour-before",
  "notificationChannels": {
    "email": true,
    "sms": false,
    "pushNotification": true,
    "inApp": true
  }
}
```

**notificationTime options:**
- `on-time` - At exact time
- `15-minutes-before` - 15 min early
- `1-hour-before` - 1 hour early
- `1-day-before` - 1 day early
- `custom` - Set custom minutes

---

## 🔄 Recurring Reminders

Create weekly medication reminder:

```json
{
  "title": "Take Medication",
  "reminderType": "medication",
  "reminderDateTime": "2024-12-18T08:00:00Z",
  "recurringPattern": {
    "isRecurring": true,
    "frequency": "weekly",
    "endDate": "2025-06-30T23:59:59Z",
    "daysOfWeek": [1, 3, 5]
  }
}
```

**Frequencies:**
- `daily` - Every day
- `weekly` - Every week
- `bi-weekly` - Every 2 weeks
- `monthly` - Monthly
- `quarterly` - Every 3 months
- `yearly` - Every year

---

## 📊 View Reminder Statistics

```bash
curl -X GET http://localhost:5050/api/reminders/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response shows reminders grouped by status and type.

---

## 🛠️ Common Issues

### Server won't connect to MongoDB
```
❌ Error: ENOTFOUND _mongodb._tcp.your_cluster.mongodb.net
✅ Solution: Update MONGO_URI in .env with correct credentials
```

### Reminders not sending emails
```
❌ Error: Invalid login credentials
✅ Solution: 
  1. Enable 2FA on Gmail
  2. Generate App Password at myaccount.google.com/apppasswords
  3. Use App Password (not regular password) in EMAIL_PASSWORD
```

### Socket.IO not connecting
```
❌ Error: Connection failed
✅ Solution:
  1. Check FRONTEND_URL in .env
  2. Verify socket.io is initialized in server
  3. Check browser console for CORS errors
```

### "Port 5050 already in use"
```bash
# Find process using port
netstat -ano | findstr :5050

# Kill it (replace PID)
taskkill /PID <PID> /F

# Or use different port
PORT=5051 npm start
```

---

## 📚 Full Documentation

- **API Documentation:** See `REMINDER_API_DOCUMENTATION.md`
- **Setup Guide:** See `SETUP_GUIDE.md`
- **Project Structure:** See `SETUP_GUIDE.md`

---

## 🎯 Next Steps

1. ✅ Start the server: `npm start`
2. ✅ Test health endpoint
3. ✅ Create a test user (register/login)
4. ✅ Create your first reminder
5. ✅ Test Socket.IO notifications
6. ✅ Set up email notifications
7. ✅ Create recurring reminders

---

## 💡 Tips

- Use Postman for easier API testing
- Check console logs for scheduler activity
- Reminders are checked every 5 minutes by default
- Test dates should be in the future
- Socket.IO events are real-time, no page reload needed

---

## 🆘 Need Help?

Check the `REMINDER_API_DOCUMENTATION.md` for detailed endpoint information.

Happy coding! 🚀
