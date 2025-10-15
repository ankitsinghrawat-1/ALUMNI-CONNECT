# ALUMNI CONNECT - Quick Reference Guide

## System at a Glance

### 📊 Project Statistics
- **Total Pages**: 60+ HTML pages
- **JavaScript Modules**: 60+ files
- **API Endpoints**: 15 modules with 100+ endpoints
- **Database Tables**: 84 tables
- **User Roles**: 6 (Admin, Alumni, Student, Faculty, Employer, Institute)
- **Real-time Features**: Chat, Notifications, Live Updates

---

## 🎨 Architecture Overview

### 3-Tier Architecture
```
┌────────────────────────────────────────┐
│         CLIENT (Frontend)               │
│  HTML5 + CSS3 + Vanilla JavaScript     │
│  • 60+ Pages                           │
│  • 60+ JS Modules                      │
│  • Responsive Design                   │
│  • Real-time UI                        │
└───────────────┬────────────────────────┘
                │ HTTP/WebSocket
┌───────────────▼────────────────────────┐
│       APPLICATION (Backend)            │
│  Node.js + Express.js + Socket.IO     │
│  • 15 API Modules                      │
│  • JWT Authentication                  │
│  • WebSocket Server                    │
│  • File Upload Handler                 │
└───────────────┬────────────────────────┘
                │ MySQL Protocol
┌───────────────▼────────────────────────┐
│         DATABASE (MySQL)               │
│  • 84 Tables                           │
│  • InnoDB Engine                       │
│  • Connection Pool                     │
│  • ACID Compliance                     │
└────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Frontend Stack
| Component | Technology |
|-----------|------------|
| Markup | HTML5 |
| Styling | CSS3 |
| Scripting | JavaScript (ES6+) |
| Real-time | Socket.IO Client |
| API Calls | Fetch API |
| Storage | LocalStorage |

### Backend Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | Latest LTS |
| Framework | Express.js | ^4.18.2 |
| WebSocket | Socket.IO | ^4.7.4 |
| Auth | JWT | ^9.0.2 |
| Password | bcrypt | ^5.1.1 |
| Database Driver | mysql2 | ^3.9.1 |
| File Upload | Multer | ^1.4.5-lts.1 |

### Database
| Component | Specification |
|-----------|---------------|
| DBMS | MySQL 8.0+ |
| Engine | InnoDB |
| Charset | utf8mb4 |
| Collation | utf8mb4_unicode_ci |
| Tables | 84 |

---

## 🎯 Core Features

### 1. User Management
- ✅ Multi-role registration (6 roles)
- ✅ Profile management
- ✅ Privacy settings
- ✅ Verification workflow
- ✅ Password reset

### 2. Networking
- ✅ Alumni directory
- ✅ Advanced search & filters
- ✅ Connection requests
- ✅ Follow system
- ✅ Profile views

### 3. Communication
- ✅ Real-time chat
- ✅ Group messaging
- ✅ File attachments
- ✅ Online status
- ✅ Typing indicators
- ✅ Read receipts

### 4. Mentorship
- ✅ Mentor profiles
- ✅ Session booking
- ✅ Reviews & ratings
- ✅ Portfolio showcase
- ✅ Multiple specializations
- ✅ Pricing tiers

### 5. Job Portal
- ✅ Job postings
- ✅ Application management
- ✅ Resume uploads
- ✅ Search & filtering
- ✅ Application tracking

### 6. Events
- ✅ Event creation
- ✅ RSVP system
- ✅ Event calendar
- ✅ Approval workflow
- ✅ Event notifications

### 7. Blog Platform
- ✅ Rich text editor
- ✅ Image uploads
- ✅ Comment system
- ✅ Approval workflow
- ✅ Featured blogs

### 8. Social Features
- ✅ Social feed
- ✅ Posts & stories
- ✅ Reactions (like, love, etc.)
- ✅ Comments & replies
- ✅ Hashtags & mentions
- ✅ Profile highlights

### 9. Groups
- ✅ Group creation
- ✅ Discussion threads
- ✅ Group membership
- ✅ Group posts & events

### 10. Admin Panel
- ✅ Dashboard analytics
- ✅ User management
- ✅ Content approval
- ✅ Verification management
- ✅ System statistics

---

## 🗂️ File Structure

```
ALUMNI-CONNECT/
│
├── 📁 client/                    # Frontend
│   ├── 📄 *.html (60+ files)    # Pages
│   ├── 📁 css/                   # Styles
│   └── 📁 js/                    # Scripts (60+ files)
│
├── 📁 server/                    # Backend
│   ├── 📄 server.js              # Main entry
│   ├── 📁 api/ (15 modules)      # API routes
│   ├── 📁 middleware/            # Auth & validation
│   └── 📁 websocket/             # Real-time handlers
│
├── 📁 uploads/                   # User uploads
│   ├── resumes/
│   ├── chat/
│   ├── blogs/
│   ├── groups/
│   ├── threads/
│   └── stories/
│
├── 📄 package.json               # Dependencies
├── 📄 database_structure.txt     # Database schema
├── 📄 .env                       # Environment config
├── 📄 README.md                  # Project overview
├── 📄 ARCHITECTURE.md            # System architecture
├── 📄 TECH_STACK.md              # Technology details
└── 📄 QUICK_REFERENCE.md         # This file
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Authentication | JWT tokens |
| Password Storage | bcrypt (10 rounds) |
| Authorization | Role-based (RBAC) |
| SQL Injection | Parameterized queries |
| XSS Protection | Content sanitization |
| CORS | Whitelist policy |
| File Upload | Type & size validation |
| Session Management | Token-based (stateless) |

---

## 🚀 Quick Start Commands

### Setup
```bash
# 1. Clone repository
git clone https://github.com/ankitsinghrawat-1/ALUMNI-CONNECT.git

# 2. Install dependencies
npm install

# 3. Create .env file
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=alumni_db
# JWT_SECRET=your_secret_key
# PORT=3000

# 4. Setup database
mysql -u root -p < database_structure.txt

# 5. Start server
npm start

# 6. Open browser
# http://localhost:3000
```

---

## 📡 API Overview

### Authentication APIs
```
POST   /api/users/signup          - Register
POST   /api/users/login            - Login
POST   /api/users/forgot-password  - Reset password
```

### User APIs
```
GET    /api/users/profile          - Get profile
PUT    /api/users/profile          - Update profile
GET    /api/users/directory        - Search users
GET    /api/users/:id/public-profile - View profile
```

### Job APIs
```
GET    /api/jobs                   - List jobs
POST   /api/jobs                   - Create job
POST   /api/jobs/:id/apply         - Apply
GET    /api/jobs/:id/applications  - View applications
```

### Event APIs
```
GET    /api/events                 - List events
POST   /api/events                 - Create event
POST   /api/events/:id/rsvp        - RSVP
DELETE /api/events/:id/rsvp        - Cancel RSVP
```

### Mentor APIs
```
GET    /api/mentors                - List mentors
POST   /api/mentors/register       - Become mentor
POST   /api/mentors/:id/book       - Book session
POST   /api/mentors/:id/review     - Leave review
```

### Message APIs
```
GET    /api/messages/conversations - Get conversations
GET    /api/messages/conversations/:id - Get messages
POST   /api/messages/send          - Send message
```

### Admin APIs
```
GET    /api/admin/stats            - Statistics
GET    /api/admin/analytics/*      - Analytics
PUT    /api/admin/approve/:type/:id - Approve content
DELETE /api/admin/:type/:id        - Delete content
```

---

## 🔄 Real-time Events

### Socket.IO Events
```javascript
// Connection
socket.emit('addUser', userId)

// Chat
socket.emit('sendMessage', messageData)
socket.on('getMessage', messageData)

// Thread Viewing
socket.emit('thread:viewing', { threadId, userId, userName })
socket.on('thread:viewer-update', { threadId, viewerCount })

// Typing Indicator
socket.emit('thread:typing', { threadId, userId, userName })
socket.on('thread:typing-update', { threadId, typingUsers })

// Notifications
socket.on('notification', notificationData)
```

---

## 📊 Database Schema Summary

### Categories (84 Total Tables)

**Core (7 tables)**
- Users, Verification, Privacy, Notifications

**Content (15 tables)**
- Blogs, Events, Jobs, Campaigns, Threads, Stories

**Mentorship (10 tables)**
- Mentors, Sessions, Reviews, Specializations

**Communication (6 tables)**
- Messages, Conversations, Participants

**Social (20 tables)**
- Posts, Comments, Reactions, Connections, Follows

**Analytics (8 tables)**
- User Analytics, Engagement Metrics, Tracking

**Additional (18 tables)**
- Directory, Approvals, Settings, Achievements

---

## 🎯 User Roles & Permissions

| Role | Access Level | Key Features |
|------|--------------|--------------|
| **Admin** | Full Access | System management, Approvals, Analytics |
| **Alumni** | High | Networking, Mentoring, Jobs, All features |
| **Student** | Medium | Learning, Job search, Networking |
| **Faculty** | Medium | Academic features, Mentoring |
| **Employer** | Medium | Job postings, Candidate search |
| **Institute** | Medium | Events, Content management |

---

## 📈 Performance Specs

### Current Implementation
- **Connection Pool**: 10 MySQL connections
- **Concurrency**: Async/await non-blocking I/O
- **Static Files**: Express static middleware
- **WebSocket**: Socket.IO for real-time

### Recommended Production Setup
- **Caching**: Redis (sessions, hot data)
- **CDN**: CloudFront/CloudFlare (static assets)
- **Load Balancer**: NGINX (multiple Node instances)
- **Database**: Read replicas for scaling
- **Monitoring**: APM tools (New Relic, Datadog)

---

## 🛠️ Development Tools

| Tool | Purpose |
|------|---------|
| npm | Package management |
| Git | Version control |
| MySQL Workbench | Database management |
| Postman | API testing |
| VS Code | Code editor |

---

## 📞 Support & Resources

### Documentation
- **README.md** - Quick start and overview
- **ARCHITECTURE.md** - Complete system architecture (600 lines)
- **TECH_STACK.md** - Technology stack details (760 lines)
- **QUICK_REFERENCE.md** - This quick reference

### Links
- Repository: https://github.com/ankitsinghrawat-1/ALUMNI-CONNECT
- Issues: https://github.com/ankitsinghrawat-1/ALUMNI-CONNECT/issues

---

## 🎓 Learning Resources

### For Frontend Developers
- Study `client/js/api.js` - API client implementation
- Study `client/js/auth.js` - Authentication flow
- Study `client/js/dashboard.js` - Dashboard logic

### For Backend Developers
- Study `server/server.js` - Server setup
- Study `server/api/*.js` - API implementations
- Study `server/middleware/authMiddleware.js` - Auth middleware

### For Database Developers
- Study `database_structure.txt` - Complete schema
- Review foreign key relationships
- Understand indexing strategy

---

## 🚢 Deployment Checklist

- [ ] Configure production `.env`
- [ ] Setup MySQL with production credentials
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Configure CORS for production domain
- [ ] Setup PM2 for process management
- [ ] Configure NGINX reverse proxy
- [ ] Setup Redis for caching (optional)
- [ ] Configure CDN for static assets (optional)
- [ ] Setup monitoring and logging
- [ ] Configure database backups
- [ ] Setup CI/CD pipeline
- [ ] Load testing
- [ ] Security audit

---

## 💡 Tips & Best Practices

### Development
1. Always use environment variables for sensitive data
2. Test authentication flows thoroughly
3. Validate all user inputs on server-side
4. Use parameterized queries for SQL
5. Handle errors gracefully
6. Log important events
7. Comment complex logic

### Security
1. Never commit `.env` file
2. Use strong JWT secrets
3. Implement rate limiting in production
4. Sanitize user inputs
5. Keep dependencies updated
6. Use HTTPS in production
7. Implement CSRF protection

### Performance
1. Use database indexes wisely
2. Implement caching strategy
3. Optimize database queries
4. Compress responses
5. Lazy load content
6. Optimize images
7. Monitor performance metrics

---

## 🐛 Common Issues & Solutions

### "Port 3000 already in use"
```bash
# Solution: Kill process or change port
lsof -ti:3000 | xargs kill -9
# OR change PORT in .env
```

### "Cannot connect to MySQL"
```bash
# Solution: Check MySQL is running
sudo service mysql status
# Verify credentials in .env
```

### "JWT token expired"
```bash
# Solution: Clear localStorage and re-login
localStorage.clear()
# Then login again to get new token
```

### "File upload failed"
```bash
# Solution: Check uploads directory permissions
chmod -R 755 uploads/
```

---

## 📝 Version History

- **v1.0.0** - Initial release
  - Complete alumni networking platform
  - 60+ pages, 84 tables, 15 API modules
  - Real-time chat and notifications
  - Mentorship platform
  - Job portal
  - Event management
  - Blog platform
  - Social features

---

**Last Updated**: October 2024
**Maintained By**: Ankit Singh Rawat
**License**: ISC

---

*For detailed information, refer to ARCHITECTURE.md and TECH_STACK.md*
