# ALUMNI CONNECT

A comprehensive platform for connecting alumni, students, faculty, employers, and educational institutions.

## 🎯 Overview

ALUMNI CONNECT is a full-featured web platform that facilitates networking, mentorship, job opportunities, event management, and real-time communication within the alumni community.

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture and design
- **[TECH_STACK.md](./TECH_STACK.md)** - Detailed technology stack and dependencies

## 🚀 Quick Start

### Prerequisites
- Node.js 14.x or higher
- MySQL 8.0 or higher
- npm package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ankitsinghrawat-1/ALUMNI-CONNECT.git
cd ALUMNI-CONNECT
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=alumni_db
JWT_SECRET=your_secret_key
PORT=3000
```

4. **Setup database**
```bash
mysql -u root -p < database_structure.txt
```

5. **Start the server**
```bash
npm start
```

6. **Access the application**
Open your browser and navigate to `http://localhost:3000`

## 🏗️ Architecture

### High-Level Architecture
```
┌─────────────────┐
│  Client Layer   │  HTML5, CSS3, JavaScript
│  (Frontend)     │  60+ pages, Real-time UI
└────────┬────────┘
         │
         ▼ HTTP/WebSocket
┌─────────────────┐
│ Application     │  Node.js + Express
│  Layer          │  15 API modules
│  (Backend)      │  Socket.IO for real-time
└────────┬────────┘
         │
         ▼ MySQL Protocol
┌─────────────────┐
│   Data Layer    │  MySQL Database
│  (Database)     │  84 tables
└─────────────────┘
```

## 💻 Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Vanilla JS (no framework)
- Socket.IO Client
- Responsive design

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Database Driver**: mysql2

### Database
- MySQL 8.0+
- 84 tables
- InnoDB engine
- utf8mb4 encoding

## ✨ Key Features

### User Management
- Multi-role support (Admin, Alumni, Student, Faculty, Employer, Institute)
- Profile management with privacy controls
- Alumni directory with advanced search
- User verification workflow

### Networking & Communication
- Real-time chat messaging
- Connection requests and management
- Follow/unfollow system
- Direct messaging with file attachments
- Online status tracking

### Mentorship Platform
- Mentor registration and profiles
- Session booking and scheduling
- Reviews and ratings
- Multiple specializations
- Portfolio and achievements showcase

### Job Portal
- Job postings by employers
- Application management
- Resume uploads
- Job search and filtering
- Application tracking

### Events Management
- Event creation and publishing
- RSVP system
- Event calendar
- Approval workflow

### Blog Platform
- Blog post creation with rich content
- Image uploads
- Commenting system
- Approval workflow
- Featured blogs

### Social Features
- Social feed with posts
- Reactions (like, love, etc.)
- Comments and replies
- Stories (24-hour expiry)
- Hashtags and mentions
- Profile highlights

### Groups & Discussions
- Group creation and management
- Discussion threads
- Group membership
- Group events and posts

### Admin Panel
- Dashboard with analytics
- User management
- Content approval (blogs, events, jobs)
- Verification requests
- System statistics

### Real-time Features
- Live chat with typing indicators
- Online user tracking
- Real-time notifications
- Live thread viewers
- Instant message delivery

## 📁 Project Structure

```
ALUMNI-CONNECT/
├── client/                  # Frontend files
│   ├── *.html              # 60+ HTML pages
│   ├── css/                # Stylesheets
│   └── js/                 # JavaScript modules (60+ files)
│       ├── api.js          # API client
│       ├── auth.js         # Authentication
│       ├── dashboard.js    # Dashboard logic
│       ├── directory.js    # Alumni directory
│       ├── jobs.js         # Job portal
│       ├── events.js       # Events management
│       ├── blogs.js        # Blog platform
│       ├── mentors.js      # Mentorship system
│       ├── messages.js     # Chat system
│       └── ...             # More modules
│
├── server/                  # Backend files
│   ├── server.js           # Main server file
│   ├── api/                # API routes (15 modules)
│   │   ├── users.js        # User API
│   │   ├── jobs.js         # Jobs API
│   │   ├── events.js       # Events API
│   │   ├── blogs.js        # Blogs API
│   │   ├── mentors.js      # Mentors API
│   │   ├── messages.js     # Messages API
│   │   ├── groups.js       # Groups API
│   │   ├── admin.js        # Admin API
│   │   └── ...             # More APIs
│   ├── middleware/         # Express middleware
│   │   └── authMiddleware.js
│   └── websocket/          # WebSocket handlers
│       └── social-feed-realtime.js
│
├── uploads/                 # File uploads directory
│   ├── resumes/
│   ├── chat/
│   ├── blogs/
│   ├── groups/
│   ├── threads/
│   └── stories/
│
├── database_structure.txt   # MySQL schema (84 tables)
├── package.json            # Dependencies
├── .env                    # Environment variables (create this)
├── .gitignore             # Git ignore rules
├── ARCHITECTURE.md         # System architecture
├── TECH_STACK.md          # Technology stack
└── README.md              # This file
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- SQL injection prevention (parameterized queries)
- XSS protection
- CORS policy enforcement
- Secure file uploads
- Password reset with tokens

## 📊 Database Schema

The application uses 84 MySQL tables organized into categories:

- **Core**: User management, authentication, privacy
- **Content**: Blogs, events, jobs, campaigns
- **Mentorship**: Mentor profiles, sessions, reviews
- **Communication**: Messages, conversations, notifications
- **Social**: Posts, comments, reactions, connections
- **Analytics**: Engagement tracking, statistics

See `database_structure.txt` for complete schema.

## 🌐 API Endpoints

### Authentication
- `POST /api/users/signup` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/forgot-password` - Password reset

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/directory` - Search alumni

### Jobs
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job (employer)
- `POST /api/jobs/:id/apply` - Apply for job

### Events
- `GET /api/events` - List events
- `POST /api/events/:id/rsvp` - RSVP to event

### Blogs
- `GET /api/blogs` - List blogs
- `POST /api/blogs` - Create blog post

### Mentorship
- `GET /api/mentors` - List mentors
- `POST /api/mentors/:id/book` - Book session

### Messaging
- `GET /api/messages/conversations` - Get conversations
- `POST /api/messages/send` - Send message

### Groups
- `GET /api/groups` - List groups
- `POST /api/groups/:id/join` - Join group

### Admin
- `GET /api/admin/stats` - System statistics
- `PUT /api/admin/approve/:type/:id` - Approve content

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

## 🔄 Real-time Communication

WebSocket events powered by Socket.IO:

- `addUser` - User comes online
- `sendMessage` - Send chat message
- `getMessage` - Receive chat message
- `thread:viewing` - User viewing thread
- `thread:typing` - User typing in thread
- `notification` - Real-time notification

## 👥 User Roles

1. **Admin** - Full system access
2. **Alumni** - Networking, mentorship, job search
3. **Student** - Learning, job search, mentorship
4. **Faculty** - Academic features, mentorship
5. **Employer** - Job postings, candidate search
6. **Institute** - Event management, content approval

## 🛠️ Development

### Scripts
```bash
npm start        # Start the server
npm test         # Run tests (to be implemented)
```

### Adding New Features

1. Backend API: Add route in `server/api/`
2. Frontend: Create/modify files in `client/js/`
3. Database: Update `database_structure.txt`
4. Test the feature
5. Update documentation

## 🚢 Deployment

### Production Recommendations
- Use PM2 for process management
- NGINX as reverse proxy
- SSL/TLS certificates
- Redis for caching
- CDN for static assets
- Database connection pooling
- Environment-based configuration
- Monitoring and logging

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed deployment architecture.

## 📈 Performance

### Current Optimizations
- Database connection pooling
- Async/await for non-blocking I/O
- Static file serving
- Prepared SQL statements

### Recommended Enhancements
- Redis caching layer
- Response compression
- Image optimization
- Database indexing
- CDN integration
- Load balancing

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Check MySQL is running
- Verify `.env` credentials
- Ensure database exists

**JWT Token Error**
- Check JWT_SECRET in `.env`
- Clear browser localStorage
- Re-login to get new token

**File Upload Error**
- Check `/uploads` directory exists
- Verify write permissions
- Check file size limits

**Port Already in Use**
- Change PORT in `.env`
- Kill process using port 3000

## 📝 License

ISC License

## 👨‍💻 Author

Ankit Singh Rawat

## 🔗 Links

- **Repository**: https://github.com/ankitsinghrawat-1/ALUMNI-CONNECT
- **Issues**: https://github.com/ankitsinghrawat-1/ALUMNI-CONNECT/issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support, please open an issue on GitHub.

---

**Note**: This is a comprehensive platform with 60+ pages, 84 database tables, and extensive features. See [ARCHITECTURE.md](./ARCHITECTURE.md) and [TECH_STACK.md](./TECH_STACK.md) for complete documentation.
