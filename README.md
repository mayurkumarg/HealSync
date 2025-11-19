# 🏥 HealSync Backend - Healthcare Reminder System

**A production-ready Node.js/Express backend with real-time reminder scheduling for healthcare management.**

## 📌 Overview

HealSync Backend provides a complete healthcare management system with a focus on patient reminders. Patients can create, manage, and receive notifications for:
- 📅 Medical appointments
- 💊 Prescriptions
- 📋 Medical reports
- 💉 Medications
- 🧪 Lab tests
- 👨‍⚕️ Follow-ups
- And more...

## ✨ Key Features

### 🎯 Smart Reminder Management
- Create reminders with custom details
- Set notification timing (on-time, 15min, 1hr, 1 day before, custom)
- Support for recurring reminders (daily, weekly, monthly, etc.)
- Assign priority levels (low, medium, high, critical)
- Add location and notes to reminders

### 🔔 Multi-Channel Notifications
- 📧 Email notifications (beautifully formatted)
- 🔔 Real-time in-app notifications (Socket.IO)
- 📱 Push notifications ready
- 💬 SMS support (optional)

### ⚡ Real-Time Updates
- WebSocket-based Socket.IO integration
- Instant notification delivery
- Live reminder status updates
- User connection tracking

### 🤖 Automated Scheduling
- node-cron based background scheduler
- Check every 5 minutes for due reminders
- Auto-cleanup of old reminders (daily)
- Process recurring reminders (daily)
- Configurable cron expressions

### 📊 Data Management
- MongoDB with optimized schemas
- User isolation (privacy)
- Comprehensive notification history
- Statistics and analytics endpoints
- Proper indexing for performance

### 🔐 Security
- JWT authentication on all endpoints
- User-level authorization
- Password hashing (bcrypt)
- CORS protection
- Input validation

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- MongoDB (cloud or local)
- npm or yarn

### Installation

```bash
# 1. Clone the repository
cd healsync2/backend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Configure your environment
# Edit .env with your MongoDB URI and email credentials

# 5. Start the server
npm start

# For development (auto-reload):
npm run dev
```

✅ Server running on `http://localhost:5050`

## 📖 Documentation

### Quick Guides
- **[QUICK_START.md](./QUICK_START.md)** - Get running in 5 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What's been built

### API Reference
- **[REMINDER_API_DOCUMENTATION.md](./REMINDER_API_DOCUMENTATION.md)** - Complete API documentation

### Configuration
- **[.env.example](./.env.example)** - Environment variables template

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────┐
│         Frontend (React/Vue)             │
│      REST API + Socket.IO Client        │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   REST API            Real-Time WebSocket
   Endpoints               Events
        │                         │
        └────────────┬────────────┘
                     │
┌────────────────────▼──────────────────────┐
│     Express.js Server                      │
│  - Route Handlers                          │
│  - Authentication Middleware               │
│  - Error Handling                          │
│  - Socket.IO Handler                       │
└────────────────────┬──────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   MongoDB             Scheduler (node-cron)
   Database            - Email Service
                       - Socket Events
                       - Notification Logic
```

### Key Services

1. **Authentication** - JWT-based user authentication
2. **Reminder Engine** - Create, read, update, delete reminders
3. **Scheduler** - Automated background job runner
4. **Notification Service** - Email and real-time notifications
5. **Socket.IO Service** - WebSocket connection management

## 📡 API Endpoints

### Reminders (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reminders` | Create reminder |
| GET | `/api/reminders` | Get all reminders |
| GET | `/api/reminders/upcoming` | Get upcoming reminders |
| GET | `/api/reminders/stats` | Get statistics |
| GET | `/api/reminders/:id` | Get specific reminder |
| PUT | `/api/reminders/:id` | Update reminder |
| DELETE | `/api/reminders/:id` | Delete reminder |
| PATCH | `/api/reminders/:id/complete` | Mark completed |
| PATCH | `/api/reminders/:id/dismiss` | Dismiss reminder |

## 🔌 Socket.IO Events

### Client → Server
```javascript
socket.emit('user-connect', userId);
socket.emit('reminder-acknowledged', { userId, reminderId });
```

### Server → Client
```javascript
socket.on('connection-success', (data) => {});
socket.on('reminder-notification', (reminder) => {});
socket.on('reminder-ack-received', (data) => {});
```

## 🗂️ Project Structure

```
backend/
├── QUICK_START.md                         # 5-min setup
├── SETUP_GUIDE.md                         # Full guide
├── REMINDER_API_DOCUMENTATION.md          # API docs
├── IMPLEMENTATION_SUMMARY.md              # What's built
├── app.js                                 # Express app
├── server.js                              # Entry point
├── package.json                           # Dependencies
├── models/
│   └── medical/
│       └── reminder.js                    # NEW: Reminder schema
├── controllers/
│   └── reminder/
│       └── reminderController.js          # NEW: Reminder CRUD
├── routes/
│   └── reminderRoute.js                   # NEW: Reminder endpoints
└── service/
    ├── email.js                           # UPDATED: Reminder emails
    ├── socket.js                          # NEW: Socket.IO
    └── reminderScheduler.js               # NEW: Cron scheduler
```

## 🔧 Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express** | Web framework |
| **MongoDB** | Database |
| **Socket.IO** | Real-time communication |
| **node-cron** | Task scheduling |
| **Nodemailer** | Email service |
| **JWT** | Authentication |
| **bcrypt** | Password hashing |

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5050/api/health
```

### Create Reminder (requires auth)
```bash
curl -X POST http://localhost:5050/api/reminders \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Doctor Appointment",
    "reminderType": "appointment",
    "reminderDateTime": "2024-12-20T10:30:00Z"
  }'
```

## 🛠️ Configuration

### Environment Variables

```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/healsync

# Server
PORT=5050
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3000

# Scheduler
REMINDER_CHECK_INTERVAL=*/5 * * * *
```

## 🔒 Security Considerations

- ✅ JWT authentication on all protected endpoints
- ✅ User isolation (can't access others' reminders)
- ✅ Password hashing with bcrypt
- ✅ CORS restricted to frontend domain
- ✅ Input validation on all endpoints

## 🚀 Deployment

### Checklist
- [ ] Update `JWT_SECRET` to strong value
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Configure email service
- [ ] Enable SSL/TLS
- [ ] Set up monitoring

## 📞 Support

For issues or questions:
1. Check [QUICK_START.md](./QUICK_START.md) - Common issues
2. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup
3. Check console logs for errors

## 🎉 Next Steps

1. ✅ **Start Server**
   ```bash
   npm start
   ```

2. ✅ **Configure Database** - MongoDB Atlas or local

3. ✅ **Set Up Email** (optional) - Gmail App Password

4. ✅ **Connect Frontend** - Use Socket.IO client

5. ✅ **Deploy** - Choose your platform

---

**Built with ❤️ for HealSync Healthcare System**

🚀 **Ready to improve healthcare management!**
