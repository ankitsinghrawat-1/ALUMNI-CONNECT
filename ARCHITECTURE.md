# ALUMNI CONNECT - System Architecture

## Overview
ALUMNI CONNECT is a comprehensive platform designed to foster connections between alumni, students, faculty, employers, and educational institutions. The platform enables networking, mentorship, job opportunities, event management, blogging, and real-time communication.

## Architecture Pattern
The system follows a **3-Tier Architecture** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│              (Client - Static HTML/CSS/JavaScript)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │ Profile  │  │Directory │  │Messaging │  │
│  │  Pages   │  │   Mgmt   │  │  Search  │  │   Chat   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Jobs &  │  │  Events  │  │  Blogs   │  │Mentorship│  │
│  │  Apply   │  │   RSVP   │  │  Posts   │  │ Sessions │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (HTTP/WebSocket)
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│               (Node.js + Express + Socket.IO)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              RESTful API Endpoints                    │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │ Users  │ │  Jobs  │ │ Events │ │ Blogs  │       │  │
│  │  │  API   │ │  API   │ │  API   │ │  API   │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │Mentors │ │Messages│ │Groups  │ │ Admin  │       │  │
│  │  │  API   │ │  API   │ │  API   │ │  API   │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │Threads │ │Stories │ │Campaigns│ │Social  │       │  │
│  │  │  API   │ │  API   │ │  API   │ │  Feed  │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Real-time Communication (WebSocket)           │  │
│  │  • Chat Messaging                                     │  │
│  │  • Online User Tracking                               │  │
│  │  • Live Thread Viewers                                │  │
│  │  • Typing Indicators                                  │  │
│  │  • Real-time Notifications                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Components                    │  │
│  │  • Authentication (JWT)                               │  │
│  │  • Authorization (Role-based)                         │  │
│  │  • File Upload (Multer)                               │  │
│  │  • Error Handling                                     │  │
│  │  • CORS Management                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (MySQL Protocol)
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│                    (MySQL Database)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Core Tables (84 tables total)                │  │
│  │  • users (multi-role support)                        │  │
│  │  • blogs, events, jobs                               │  │
│  │  • mentors, mentor_sessions                          │  │
│  │  • messages, conversations                           │  │
│  │  • groups, group_members                             │  │
│  │  • notifications                                      │  │
│  │  • social_posts, comments, reactions                 │  │
│  │  • connections, connection_requests                  │  │
│  │  • threads, stories                                  │  │
│  │  • And 70+ more specialized tables                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Client Layer (Presentation)
**Technology**: Vanilla JavaScript, HTML5, CSS3

**Structure**:
```
client/
├── HTML Pages (60+ pages)
│   ├── Authentication: login.html, signup.html, forgot-password.html
│   ├── Dashboards: dashboard.html, admin-dashboard.html, student-dashboard.html, etc.
│   ├── Features: jobs.html, events.html, blogs.html, directory.html, mentors.html
│   ├── Management: profile.html, messages.html, notifications.html, groups.html
│   └── Social: threads.html, stories.html, social-profile.html
│
├── JavaScript Modules (60+ files)
│   ├── Core: api.js, auth.js, utils.js
│   ├── Features: dashboard.js, directory.js, jobs.js, events.js, blogs.js
│   ├── Social: social-feed-*.js, messages.js, notifications-page.js
│   ├── Mentorship: mentors.js, mentor-profile.js, become-mentor.js
│   ├── Management: admin-dashboard.js, user-management.js, approval-management.js
│   └── Real-time: social-feed-websocket.js
│
└── CSS Stylesheets
    └── Responsive design with modern UI/UX
```

**Key Features**:
- Role-based dashboards (Admin, Alumni, Student, Faculty, Employer, Institute)
- Real-time chat and notifications
- Directory with advanced search and filtering
- Job board with application management
- Event management with RSVP functionality
- Blog platform with approval workflow
- Mentorship platform with session scheduling
- Groups and discussion threads
- Stories (social media style)
- Social feed with reactions and comments

### 2. Application Layer (Business Logic)
**Technology**: Node.js, Express.js, Socket.IO

**Structure**:
```
server/
├── server.js (Main application entry point)
│   ├── Express app configuration
│   ├── Socket.IO setup
│   ├── Database connection pooling
│   ├── Middleware setup (CORS, Body Parser, Cookie Parser)
│   ├── File upload configuration (Multer)
│   └── Route registration
│
├── api/ (RESTful API endpoints)
│   ├── admin.js          - Admin statistics and management
│   ├── users.js          - User CRUD, authentication, profile
│   ├── jobs.js           - Job postings and applications
│   ├── events.js         - Event management and RSVPs
│   ├── blogs.js          - Blog posts and publishing
│   ├── mentors.js        - Mentor profiles and sessions
│   ├── messages.js       - Chat and messaging
│   ├── groups.js         - Group management
│   ├── threads.js        - Discussion threads
│   ├── stories.js        - Social stories
│   ├── campaigns.js      - Marketing campaigns
│   ├── notifications.js  - User notifications
│   ├── social.js         - Social features (follow, profile)
│   ├── social-feed-enhanced.js    - Enhanced social feed
│   └── social-feed-phase2.js      - Advanced social features
│
├── middleware/
│   └── authMiddleware.js
│       ├── verifyToken()   - JWT authentication
│       ├── optionalAuth()  - Optional authentication
│       └── isAdmin()       - Role-based authorization
│
└── websocket/
    └── social-feed-realtime.js
        ├── Live viewer tracking
        ├── Typing indicators
        ├── Real-time reactions
        └── Online user management
```

**API Design Pattern**: RESTful API with JWT authentication

**Authentication Flow**:
```
1. User Login → POST /api/users/login
2. Server validates credentials
3. Server generates JWT token
4. Client stores token in localStorage
5. Client includes token in Authorization header for protected routes
6. Middleware verifies token and attaches user to request
7. Route handler processes request with authenticated user context
```

**WebSocket Communication**:
```
1. Client connects to Socket.IO server
2. User joins specific rooms (conversations, threads)
3. Server tracks online users
4. Real-time events: messages, notifications, typing, viewers
5. Broadcast updates to relevant users/rooms
```

### 3. Data Layer (Persistence)
**Technology**: MySQL Database

**Database Schema** (84 tables):

**Core Tables**:
- `users` - Central table for all user roles (alumni, student, faculty, employer, institute, admin)
- `verification_requests` - User verification workflow
- `privacy_settings` - User privacy preferences

**Content Management**:
- `blogs` - Blog posts with approval workflow
- `events` - Events with status management
- `event_rsvps` - Event attendance tracking
- `jobs` - Job postings
- `job_applications` - Job application tracking
- `campaigns` - Marketing campaigns

**Mentorship System**:
- `mentors` - Comprehensive mentor profiles
- `mentor_specializations` - Areas of expertise
- `mentor_availability` - Scheduling availability
- `mentor_sessions` - Mentorship sessions
- `mentor_reviews` - Session feedback
- `mentor_achievements` - Mentor accomplishments
- `mentor_portfolio` - Work samples
- `mentor_analytics` - Usage statistics
- `mentor_pricing_tiers` - Pricing options
- `mentor_requests` - Mentorship requests

**Communication**:
- `conversations` - Chat conversations
- `conversation_participants` - Conversation membership
- `messages` - Chat messages
- `notifications` - User notifications

**Social Features**:
- `groups` - Discussion groups
- `group_members` - Group membership
- `threads` - Discussion threads
- `thread_posts` - Thread comments
- `stories` - Social stories
- `story_views` - Story view tracking
- `social_posts` - Social feed posts
- `social_comments` - Post comments
- `social_reactions` - Reactions (like, love, etc.)
- `social_hashtags` - Hashtag system
- `social_mentions` - User mentions
- `connections` - User connections
- `connection_requests` - Connection requests
- `follows` - Follow relationships
- `profile_highlights` - Profile highlights

**Additional Features**:
- Alumni directory with advanced filtering
- File uploads (resumes, images)
- Global notifications
- Analytics and statistics

## Data Flow

### 1. User Registration & Authentication
```
Client                    Server                   Database
  │                         │                         │
  │ POST /api/users/signup  │                         │
  ├────────────────────────>│                         │
  │                         │ Hash password (bcrypt)  │
  │                         │ INSERT INTO users       │
  │                         ├────────────────────────>│
  │                         │<────────────────────────┤
  │<────────────────────────┤ Return success          │
  │                         │                         │
  │ POST /api/users/login   │                         │
  ├────────────────────────>│                         │
  │                         │ Validate credentials    │
  │                         │ SELECT FROM users       │
  │                         ├────────────────────────>│
  │                         │<────────────────────────┤
  │                         │ Generate JWT            │
  │<────────────────────────┤ Return token + user     │
  │ Store token in          │                         │
  │ localStorage            │                         │
```

### 2. Real-time Chat
```
Client A                  Socket.IO Server          Client B
  │                            │                       │
  │ Connect to server          │                       │
  ├──────────────────────────>│                       │
  │ emit("addUser", userId)    │                       │
  ├──────────────────────────>│                       │
  │                            │ Track online user     │
  │                            │                       │
  │ emit("sendMessage", data)  │                       │
  ├──────────────────────────>│                       │
  │                            │ Save to DB (MySQL)    │
  │                            │                       │
  │                            │ emit("getMessage")    │
  │                            ├──────────────────────>│
  │                            │                       │
  │<───────────────────────────┤ Acknowledge           │
```

### 3. Job Application Workflow
```
Student              Server              Employer
  │                    │                    │
  │ Apply for job      │                    │
  ├──────────────────>│                    │
  │                    │ Create application │
  │                    │ Create notification│
  │                    ├───────────────────>│
  │<──────────────────┤                    │
  │                    │                    │
  │                    │ Employer reviews   │
  │                    │<───────────────────┤
  │                    │ Update status      │
  │                    │ Notify student     │
  │<──────────────────┤                    │
```

## Security Architecture

### Authentication & Authorization
- **JWT (JSON Web Tokens)** for stateless authentication
- **bcrypt** for password hashing (10 salt rounds)
- **Role-based access control** (RBAC)
  - Admin: Full system access
  - Alumni: Profile, jobs, mentorship, networking
  - Student: Learning, job search, mentorship
  - Faculty: Academic features, mentorship
  - Employer: Job postings, candidate search
  - Institute: Event management, content approval

### Data Protection
- **Password Reset Flow**: Secure token-based reset
- **Privacy Settings**: User-controlled visibility
- **CORS Policy**: Whitelist of allowed origins
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries with mysql2
- **XSS Prevention**: Content sanitization

### File Upload Security
- **Multer** for handling multipart/form-data
- File type validation
- File size limits
- Organized upload directories:
  - `/uploads/resumes` - Resume files
  - `/uploads/chat` - Chat attachments
  - `/uploads/blogs` - Blog images
  - `/uploads/groups` - Group logos
  - `/uploads/threads` - Thread attachments
  - `/uploads/stories` - Story media

## Scalability Considerations

### Current Architecture
- **Connection Pooling**: MySQL connection pool (10 connections)
- **Stateless API**: JWT-based authentication enables horizontal scaling
- **Real-time**: Socket.IO for WebSocket communication

### Future Enhancements
- **Caching Layer**: Redis for session storage and caching
- **Load Balancing**: Multiple Node.js instances with sticky sessions
- **CDN**: Static asset delivery
- **Database**: Read replicas for scaling reads
- **Microservices**: Split monolith into domain-specific services
- **Message Queue**: RabbitMQ/Kafka for async processing
- **Cloud Storage**: S3/Azure Blob for file uploads

## Deployment Architecture

### Development
```
localhost:3000 (Node.js + Static files)
localhost:3306 (MySQL)
```

### Production Recommendations
```
┌──────────────┐
│   Users      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  CDN / WAF   │  (CloudFlare, AWS CloudFront)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Load Balancer │  (NGINX, AWS ALB)
└──────┬───────┘
       │
       ├─────────┬─────────┬─────────┐
       ▼         ▼         ▼         ▼
   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
   │Node 1│ │Node 2│ │Node 3│ │Node N│
   └───┬──┘ └───┬──┘ └───┬──┘ └───┬──┘
       │        │        │        │
       └────────┴────────┴────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐       ┌─────────┐
   │MySQL    │       │ Redis   │
   │(Primary)│       │ Cache   │
   └────┬────┘       └─────────┘
        │
        ▼
   ┌─────────┐
   │MySQL    │
   │(Replica)│
   └─────────┘
```

## API Endpoints Summary

### Authentication
- `POST /api/users/signup` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/forgot-password` - Password reset request
- `POST /api/users/reset-password` - Reset password with token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password
- `GET /api/users/directory` - Search alumni directory
- `GET /api/users/:id/public-profile` - View public profile

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create job posting (employer/institute)
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/:id/applications` - View applications

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/rsvp` - RSVP to event
- `DELETE /api/events/:id/rsvp` - Cancel RSVP

### Blogs
- `GET /api/blogs` - List approved blogs
- `POST /api/blogs` - Create blog post
- `GET /api/blogs/:id` - Get blog details
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog

### Mentorship
- `GET /api/mentors` - List all mentors
- `POST /api/mentors/register` - Become a mentor
- `GET /api/mentors/:id` - Get mentor profile
- `POST /api/mentors/:id/book` - Book mentorship session
- `POST /api/mentors/:id/review` - Leave review

### Messaging
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/conversations/:id` - Get conversation messages
- `POST /api/messages/send` - Send message
- `POST /api/messages/mark-read/:id` - Mark message as read

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/analytics/signups` - Signup analytics
- `GET /api/admin/analytics/user-roles` - User role distribution
- `PUT /api/admin/approve/:type/:id` - Approve content
- `DELETE /api/admin/:type/:id` - Delete content

### Social Features
- `POST /api/social/follow/:id` - Follow user
- `DELETE /api/social/unfollow/:id` - Unfollow user
- `GET /api/social/stats/:id` - Get profile statistics
- `POST /api/social-feed/posts` - Create post
- `POST /api/social-feed/posts/:id/react` - React to post
- `POST /api/social-feed/posts/:id/comment` - Comment on post

## Technology Choices & Rationale

### Why Node.js + Express?
- **Event-driven architecture** ideal for real-time features
- **JavaScript everywhere** (client and server)
- **Large ecosystem** of packages (npm)
- **Fast development** cycle
- **Socket.IO integration** for WebSockets

### Why MySQL?
- **ACID compliance** for data integrity
- **Relational data** with complex relationships
- **Mature ecosystem** with excellent tooling
- **Transaction support** for critical operations
- **JOIN performance** for complex queries

### Why Socket.IO?
- **Real-time bidirectional** communication
- **Automatic reconnection** handling
- **Room/namespace** support for organization
- **Fallback mechanisms** (long-polling)
- **Broadcasting** capabilities

### Why JWT?
- **Stateless authentication** enables horizontal scaling
- **No server-side session** storage needed
- **Cross-domain** authentication
- **Mobile-friendly** token-based auth
- **Secure** with proper implementation

## Performance Optimizations

### Current Implementations
1. **Database Connection Pooling** - Reuse connections
2. **Async/Await** - Non-blocking I/O operations
3. **Parameterized Queries** - Prepared statements
4. **Static File Serving** - Express static middleware
5. **Error Handling** - Centralized error middleware

### Recommended Additions
1. **Database Indexing** - Add indexes on frequently queried columns
2. **Query Optimization** - Analyze slow queries
3. **Response Compression** - Gzip middleware
4. **Rate Limiting** - Prevent API abuse
5. **Caching Strategy** - Redis for hot data
6. **Pagination** - Limit result sets
7. **Lazy Loading** - Load content on demand
8. **Image Optimization** - Compress uploads
9. **Monitoring** - APM tools (New Relic, Datadog)
10. **Logging** - Structured logging (Winston)

## Development Workflow

### Setup
```bash
npm install
# Configure .env file
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=alumni_db
JWT_SECRET=your_secret_key
PORT=3000
```

### Database Setup
```bash
# Import database structure
mysql -u root -p alumni_db < database_structure.txt
```

### Running the Application
```bash
npm start
# Server runs on http://localhost:3000
```

## Monitoring & Maintenance

### Health Checks
- Database connection status
- API response times
- Error rates
- WebSocket connections

### Logging
- Application logs (errors, warnings, info)
- Access logs (requests, responses)
- Database query logs
- WebSocket event logs

### Backup Strategy
- Database backups (daily)
- File upload backups (incremental)
- Configuration backups

## Future Roadmap

### Phase 1: Optimization
- Implement caching layer
- Add comprehensive logging
- Database query optimization
- Performance monitoring

### Phase 2: Features
- Video calling for mentorship
- AI-powered job matching
- Advanced analytics dashboard
- Mobile application (React Native)

### Phase 3: Scale
- Microservices architecture
- Kubernetes deployment
- Multi-region support
- Advanced security (2FA, OAuth)

### Phase 4: Intelligence
- Machine learning recommendations
- Chatbot assistance
- Predictive analytics
- Natural language processing

## Conclusion

ALUMNI CONNECT is built on a solid foundation using proven technologies. The architecture supports the current feature set while providing clear paths for scaling and enhancement. The system demonstrates good separation of concerns, security best practices, and real-time capabilities essential for a modern social platform.
