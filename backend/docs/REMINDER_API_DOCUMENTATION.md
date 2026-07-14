# HealSync Reminder Scheduler - API Documentation

## Overview
The HealSync Reminder Scheduler is a comprehensive system that allows patients to set and manage reminders for medical appointments, prescriptions, medical reports, and other health-related tasks. The system includes:

- **REST API** for CRUD operations on reminders
- **Real-time notifications** via Socket.IO
- **Automated scheduler** using node-cron to check and send reminders
- **Email notifications** for registered users
- **Recurring reminders** support (daily, weekly, monthly, etc.)

---

## Base URL
```
http://localhost:5050/api
```

---

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 1. Create a New Reminder
**POST** `/reminders`

Creates a new reminder for the authenticated user.

**Request Body:**
```json
{
  "title": "Doctor's Appointment",
  "description": "Checkup with Dr. Smith at Clinic Center",
  "reminderType": "appointment",
  "reminderDateTime": "2024-12-20T10:30:00Z",
  "notificationTime": "1-hour-before",
  "notificationChannels": {
    "email": true,
    "sms": false,
    "pushNotification": true,
    "inApp": true
  },
  "priority": "high",
  "location": "City Medical Clinic, Room 304",
  "notes": "Bring insurance card and ID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439010",
    "title": "Doctor's Appointment",
    "reminderType": "appointment",
    "reminderDateTime": "2024-12-20T10:30:00Z",
    "status": "pending",
    "createdAt": "2024-12-15T14:30:00Z"
  }
}
```

---

### 2. Get All Reminders
**GET** `/reminders`

Retrieves all reminders for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (pending, sent, completed, dismissed, expired)
- `reminderType` (optional): Filter by type (appointment, prescription, report, medication, lab-test, follow-up, other)
- `sortBy` (optional): Sort field (default: reminderDateTime)

**Example:**
```
GET /api/reminders?status=pending&reminderType=appointment&sortBy=reminderDateTime
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Doctor's Appointment",
      "reminderType": "appointment",
      "reminderDateTime": "2024-12-20T10:30:00Z",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

---

### 3. Get Upcoming Reminders
**GET** `/reminders/upcoming`

Retrieves reminders scheduled for the next N days.

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 7)

**Example:**
```
GET /api/reminders/upcoming?days=14
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Doctor's Appointment",
      "reminderDateTime": "2024-12-18T10:30:00Z",
      "status": "pending"
    }
  ]
}
```

---

### 4. Get Reminder Statistics
**GET** `/reminders/stats`

Get statistics about reminders grouped by status and type.

**Response:**
```json
{
  "success": true,
  "statusStats": [
    { "_id": "pending", "count": 5 },
    { "_id": "sent", "count": 3 },
    { "_id": "completed", "count": 2 }
  ],
  "typeStats": [
    { "_id": "appointment", "count": 4 },
    { "_id": "prescription", "count": 3 }
  ]
}
```

---

### 5. Get Single Reminder
**GET** `/reminders/:reminderId`

Retrieves a specific reminder by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Doctor's Appointment",
    "description": "Checkup with Dr. Smith",
    "reminderType": "appointment",
    "reminderDateTime": "2024-12-20T10:30:00Z",
    "status": "pending",
    "priority": "high",
    "location": "City Medical Clinic",
    "createdAt": "2024-12-15T14:30:00Z"
  }
}
```

---

### 6. Update a Reminder
**PUT** `/reminders/:reminderId`

Updates an existing reminder.

**Request Body:**
```json
{
  "title": "Doctor's Appointment - Updated",
  "reminderDateTime": "2024-12-21T14:00:00Z",
  "priority": "critical"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Doctor's Appointment - Updated",
    "reminderDateTime": "2024-12-21T14:00:00Z",
    "status": "pending"
  }
}
```

---

### 7. Delete a Reminder
**DELETE** `/reminders/:reminderId`

Deletes a specific reminder.

**Response:**
```json
{
  "success": true,
  "message": "Reminder deleted successfully"
}
```

---

### 8. Mark Reminder as Completed
**PATCH** `/reminders/:reminderId/complete`

Marks a reminder as completed.

**Response:**
```json
{
  "success": true,
  "message": "Reminder marked as completed",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "completed"
  }
}
```

---

### 9. Dismiss a Reminder
**PATCH** `/reminders/:reminderId/dismiss`

Dismisses a reminder without marking it as completed.

**Response:**
```json
{
  "success": true,
  "message": "Reminder dismissed",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "dismissed"
  }
}
```

---

## Socket.IO Events

### Client → Server Events

#### 1. User Connect
```javascript
socket.emit('user-connect', userId);
```
Fired when a user connects to establish real-time notifications.

#### 2. Reminder Acknowledged
```javascript
socket.emit('reminder-acknowledged', {
  userId: '507f1f77bcf86cd799439010',
  reminderId: '507f1f77bcf86cd799439011'
});
```
Fired when a user acknowledges receiving a reminder notification.

---

### Server → Client Events

#### 1. Connection Success
```javascript
socket.on('connection-success', (data) => {
  console.log(data);
  // {
  //   message: "Connected to notification server",
  //   userId: "507f1f77bcf86cd799439010"
  // }
});
```

#### 2. Reminder Notification
```javascript
socket.on('reminder-notification', (data) => {
  console.log(data);
  // {
  //   reminderId: "507f1f77bcf86cd799439011",
  //   title: "Doctor's Appointment",
  //   description: "Checkup with Dr. Smith",
  //   reminderType: "appointment",
  //   reminderDateTime: "2024-12-20T10:30:00Z",
  //   priority: "high",
  //   location: "City Medical Clinic",
  //   sentAt: "2024-12-20T10:15:00Z"
  // }
});
```

#### 3. Reminder Acknowledgment Received
```javascript
socket.on('reminder-ack-received', (data) => {
  console.log(data);
  // {
  //   reminderId: "507f1f77bcf86cd799439011",
  //   acknowledgedAt: "2024-12-20T10:20:00Z"
  // }
});
```

---

## Frontend Integration Example

### HTML/JavaScript (Socket.IO Setup)
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5050', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Connect and authenticate
socket.on('connect', () => {
  const userId = localStorage.getItem('userId');
  socket.emit('user-connect', userId);
});

// Listen for reminders
socket.on('reminder-notification', (reminder) => {
  console.log('New reminder:', reminder);
  
  // Show notification
  const notification = new Notification(`${reminder.title}`, {
    body: `${reminder.description} at ${reminder.reminderDateTime}`,
    icon: '/healthcare-icon.png',
    tag: reminder.reminderId,
  });

  // Acknowledge receipt
  notification.onclick = () => {
    socket.emit('reminder-acknowledged', {
      userId,
      reminderId: reminder.reminderId,
    });
  };
});
```

---

## Reminder Types
- `appointment` - Medical appointments with healthcare providers
- `prescription` - Medication prescription reminders
- `report` - Medical report collection/pickup
- `medication` - Medication intake reminders
- `lab-test` - Lab test scheduling/results collection
- `follow-up` - Follow-up visits with doctors
- `other` - Any other health-related reminder

---

## Notification Channels
- `email` - Email notifications
- `sms` - SMS notifications (currently optional)
- `pushNotification` - Push notifications
- `inApp` - In-app Socket.IO notifications

---

## Priority Levels
- `low` - Low priority reminders
- `medium` - Standard priority
- `high` - Important reminders
- `critical` - Urgent reminders

---

## Recurring Pattern
For recurring reminders, include:
```json
{
  "recurringPattern": {
    "isRecurring": true,
    "frequency": "daily",
    "endDate": "2025-12-31T23:59:59Z",
    "daysOfWeek": [1, 3, 5]
  }
}
```

**Frequencies:**
- `daily` - Every day
- `weekly` - Every 7 days
- `bi-weekly` - Every 14 days
- `monthly` - Same day each month
- `quarterly` - Every 3 months
- `yearly` - Every year

---

## Scheduler Configuration

The scheduler automatically runs tasks on the following schedule:

1. **Check & Send Reminders** - Every 5 minutes
   - Checks for pending reminders that need to be sent
   - Sends notifications via email and Socket.IO
   - Updates reminder status to "sent"

2. **Clean Up Expired Reminders** - Daily at 2:00 AM
   - Removes reminders older than 30 days with status "completed" or "dismissed"

3. **Process Recurring Reminders** - Daily at 3:00 AM
   - Creates new instances of recurring reminders
   - Updates the next occurrence date

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide title, reminderDateTime, and reminderType"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Reminder not found"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Please login first"
}
```

---

## Environment Variables Required

```
# Reminder Configuration
REMINDER_CHECK_INTERVAL=*/5 * * * *
MAX_REMINDERS_PER_USER=50
NOTIFICATION_LEAD_TIME_MINUTES=15

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Frontend URL for Socket.IO and Email Links
FRONTEND_URL=http://localhost:3000
```

---

## Testing the System

### 1. Create a Reminder
```bash
curl -X POST http://localhost:5050/api/reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Reminder",
    "reminderType": "appointment",
    "reminderDateTime": "2024-12-20T10:30:00Z"
  }'
```

### 2. Get All Reminders
```bash
curl -X GET http://localhost:5050/api/reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Real-Time Notifications
Connect to Socket.IO and create a reminder scheduled for 5 minutes from now to test the notification system.

---

## Notes
- All timestamps are in ISO 8601 format (UTC)
- Reminder dates must be in the future
- Users can have up to 50 active reminders by default
- Socket.IO connections automatically reconnect if disconnected
- Email notifications require proper email configuration in `.env`
