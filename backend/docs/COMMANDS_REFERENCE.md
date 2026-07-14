# 🚀 Command Reference - HealSync Backend

Quick reference for all common commands.

## 📦 Installation

```bash
# Install dependencies (one-time)
npm install

# Check installed packages
npm list

# Update packages
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

## 🚀 Running the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev

# Alternative: Start with custom port
PORT=5051 npm start

# Run in background (Linux/Mac)
npm start &

# Run in background (Windows PowerShell)
Start-Process npm -ArgumentList "start" -NoNewWindow
```

## 🧪 Testing API Endpoints

### Health Check
```bash
curl http://localhost:5050/api/health
```

### Create User (Registration)
```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "phone": "9876543210"
  }'
```

### Login (Get JWT Token)
```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
# Copy the token from response
```

### Create Reminder
```bash
# Replace YOUR_JWT_TOKEN with actual token from login
curl -X POST http://localhost:5050/api/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Doctor Appointment",
    "description": "Annual checkup",
    "reminderType": "appointment",
    "reminderDateTime": "2024-12-20T10:30:00Z",
    "priority": "high",
    "notificationTime": "1-hour-before",
    "location": "City Medical Center"
  }'
```

### Get All Reminders
```bash
curl -X GET http://localhost:5050/api/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Upcoming Reminders (Next 7 Days)
```bash
curl -X GET "http://localhost:5050/api/reminders/upcoming?days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Reminder Statistics
```bash
curl -X GET http://localhost:5050/api/reminders/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Single Reminder
```bash
curl -X GET http://localhost:5050/api/reminders/REMINDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Reminder
```bash
curl -X PUT http://localhost:5050/api/reminders/REMINDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "priority": "critical"
  }'
```

### Mark Reminder Completed
```bash
curl -X PATCH http://localhost:5050/api/reminders/REMINDER_ID/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Dismiss Reminder
```bash
curl -X PATCH http://localhost:5050/api/reminders/REMINDER_ID/dismiss \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete Reminder
```bash
curl -X DELETE http://localhost:5050/api/reminders/REMINDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Configuration Commands

### Set Environment Variables (Windows PowerShell)
```powershell
$env:PORT="5050"
$env:NODE_ENV="development"
$env:JWT_SECRET="your_secret_key_here"
npm start
```

### Set Environment Variables (Linux/Mac)
```bash
export PORT=5050
export NODE_ENV=development
export JWT_SECRET="your_secret_key_here"
npm start
```

### View Environment Variables
```bash
# Windows
set | findstr PORT

# Linux/Mac
env | grep PORT
```

### Check If Port Is In Use
```bash
# Windows PowerShell
netstat -ano | findstr :5050

# Linux/Mac
lsof -i :5050
```

### Kill Process Using Port (Windows)
```bash
# Get PID from above command, then:
taskkill /PID <PID> /F

# Or use different port:
PORT=5051 npm start
```

## 📚 Documentation Commands

```bash
# View documentation
cat QUICK_START.md
cat SETUP_GUIDE.md
cat REMINDER_API_DOCUMENTATION.md
cat IMPLEMENTATION_SUMMARY.md

# On Windows, use:
type QUICK_START.md
```

## 🧹 Cleaning Up

```bash
# Remove node_modules (free up space)
rm -r node_modules
rmdir /s /q node_modules  # Windows

# Clean cache
npm cache clean --force

# Clear npm registry cache
npm cache clean --force

# Fresh install
rm package-lock.json
npm install
```

## 🐛 Debugging Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List running Node processes
# Windows:
tasklist /FI "IMAGENAME eq node.exe"

# Linux/Mac:
ps aux | grep node

# Check MongoDB connection
# This requires mongo shell:
mongo
# Then: show dbs

# Test connectivity
ping localhost
```

## 📊 Monitoring Commands

```bash
# Monitor running server (real-time)
# Requires npm install -g nodemon (already installed locally)
npm run dev

# View server logs
# Depends on where logs are written
tail -f logs/server.log  # Linux/Mac
Get-Content logs\server.log -Tail 10  # Windows PowerShell
```

## 🔐 Security Commands

```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break compatibility)
npm audit fix --force
```

## 📦 Dependency Management

```bash
# Install specific package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Uninstall package
npm uninstall package-name

# Update specific package
npm update package-name

# List outdated packages
npm outdated

# View dependency tree
npm list

# Check for duplicate packages
npm list --depth=0
```

## 🚀 Production Commands

```bash
# Install production-only dependencies
npm install --production

# Build for production (if needed)
npm run build

# Start in production mode
NODE_ENV=production npm start

# Using PM2 (install first: npm install -g pm2)
pm2 start server.js --name "healsync-api"
pm2 logs healsync-api
pm2 stop healsync-api
pm2 restart healsync-api
```

## 🔄 Git Commands (if using version control)

```bash
# Initialize repository
git init

# Add files
git add .

# Commit changes
git commit -m "Added reminder scheduler system"

# Check status
git status

# View logs
git log

# Create branch
git branch feature/new-feature
git checkout feature/new-feature
```

## 📝 File Editing

```bash
# Edit .env file
# Windows:
notepad .env

# Linux/Mac:
nano .env
vim .env

# View file contents
cat .env
cat package.json

# Create new file
echo "content" > newfile.txt

# View directory structure
# Windows:
dir /s

# Linux/Mac:
ls -la
tree
```

## 🌍 Network Commands

```bash
# Test server connectivity
curl http://localhost:5050/api/health

# Make POST request
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'

# View request headers
curl -i http://localhost:5050/api/health

# Verbose output (debug)
curl -v http://localhost:5050/api/health

# Check DNS
nslookup localhost
```

## 💾 Database Commands

```bash
# For MongoDB (if using locally):
# Start MongoDB
mongod

# Open MongoDB shell
mongo

# List databases
show dbs

# Use database
use healsync

# Show collections
show collections

# Query data
db.reminders.find()

# Count documents
db.reminders.countDocuments()

# Export data
mongoexport --db healsync --collection reminders --out reminders.json

# Import data
mongoimport --db healsync --collection reminders --file reminders.json
```

## 🎯 Quick Start Sequence

```bash
# 1. Navigate to project
cd d:\healsync2\backend

# 2. Install (if first time)
npm install

# 3. Configure
# Edit .env with your credentials
# Use your favorite editor or:
code .env  # Opens in VS Code

# 4. Start server
npm start

# 5. In another terminal, test:
curl http://localhost:5050/api/health

# 6. Create test user
curl -X POST http://localhost:5050/api/auth/register ...

# 7. Test reminders API
curl -X POST http://localhost:5050/api/reminders ...
```

## 🆘 Troubleshooting Commands

```bash
# Check port in use
netstat -ano | findstr :5050  # Windows
lsof -i :5050  # Mac/Linux

# Kill port
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # Mac/Linux

# Check Node version compatibility
node --version

# Check npm version
npm --version

# Reinstall modules
rm -r node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force

# Run with verbose output
DEBUG=* npm start

# Check file permissions (Linux/Mac)
ls -la .env
chmod 600 .env
```

## 📞 Help Commands

```bash
# npm help
npm help

# npm version info
npm version

# List npm scripts
npm run

# List global packages
npm list -g

# npm documentation
npm help <command>
npm help install
```

---

## 💡 Tips

1. **Always start with**: `npm install` first time
2. **Always update**: `.env` before first run
3. **Always test**: `curl http://localhost:5050/api/health` after start
4. **Use Postman** for easier API testing
5. **Check console logs** for debugging
6. **Use `npm run dev`** during development
7. **Set strong JWT_SECRET** for security
8. **Keep .env out of git** (add to .gitignore)

---

## 🎓 Learning Resources

- Express: https://expressjs.com/
- MongoDB: https://docs.mongodb.com/
- Socket.IO: https://socket.io/docs/
- node-cron: https://github.com/kelektiv/node-cron
- Nodemailer: https://nodemailer.com/
- JWT: https://jwt.io/

---

**Last Updated:** November 19, 2025
**Status:** Complete & Ready to Use ✓
