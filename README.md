# 🎓 Alumni Connect

**Alumni Connect** is a full-featured web platform designed to bridge the gap between alumni, students, faculty, employers, and educational institutes. It provides a centralized space for networking, mentorship, career opportunities, knowledge sharing, and community engagement.

> **🤖 This project was fully built with the assistance of AI.**

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [User Roles](#-user-roles)
- [API Endpoints](#-api-endpoints)
- [Real-Time Features](#-real-time-features)
- [Screenshots](#-screenshots)
- [License](#-license)
- [Author](#-author)

---

## ✨ Features

### 👥 Multi-Role User System
- **Alumni** – Connect with fellow graduates, share experiences, and mentor students.
- **Students** – Discover mentors, explore career opportunities, and engage with the community.
- **Faculty** – Manage academic networking and collaborate with alumni.
- **Employers** – Post job listings and find talented graduates.
- **Institutes** – Oversee alumni engagement at an institutional level.
- **Admin** – Full platform administration with user, content, and verification management.

### 🔗 Networking & Social
- **Alumni Directory** – Search and browse alumni with advanced filters.
- **Social Feed** – Post updates, like, comment, and interact with the community in real time.
- **Social Profiles** – Rich user profiles with skills, achievements, and social links.
- **Follow System** – Follow other users to stay updated on their activity.
- **Stories** – Share short-lived photo/video stories (similar to social media stories).
- **Real-Time Messaging** – Private one-on-one chat powered by Socket.IO with typing indicators and image sharing.
- **Notifications** – In-app notifications for events, messages, and platform activity.

### 💼 Career & Professional Growth
- **Job Board** – Browse and post job listings with resume upload and application tracking.
- **Mentorship Program** – Apply to become a mentor, browse available mentors, and request mentorship sessions.
- **Campaigns** – Create and manage fundraising or awareness campaigns.

### 📝 Content & Knowledge Sharing
- **Blogs** – Write, edit, and publish blog posts with image support.
- **Discussion Threads** – Start and participate in threaded discussions with media attachments.
- **Events** – Create, manage, and discover alumni events and reunions.

### 👨‍💼 Administration
- **Admin Dashboard** – Comprehensive admin panel for managing users, content, and platform settings.
- **User Verification** – Multi-step verification workflow (unverified → pending → verified).
- **Approval Management** – Review and approve user-submitted content.
- **Group Management** – Create and manage community groups with logos, backgrounds, and discussions.

### 🎨 User Experience
- **Dark Mode** – Toggle between light and dark themes.
- **Responsive Design** – Fully responsive UI built for all device sizes.
- **Bookmarks** – Save jobs, blogs, and other content for later.
- **Settings** – Manage profile visibility, email preferences, and account settings.

---

## 🛠 Tech Stack

| Layer        | Technology                                                                 |
|--------------|----------------------------------------------------------------------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Font Awesome, Toastify.js                |
| **Backend**  | Node.js, Express.js                                                        |
| **Database** | MySQL (via `mysql2` with connection pooling)                               |
| **Auth**     | JWT (JSON Web Tokens) with Bearer token authentication, bcrypt for hashing |
| **Real-Time**| Socket.IO (WebSocket-based messaging and social feed)                      |
| **File Upload** | Multer (profile pictures, resumes, blog images, chat images, etc.)     |
| **Other**    | dotenv, cookie-parser, CORS, body-parser, express-async-handler            |

---

## 📁 Project Structure

```
ALUMNI-CONNECT/
├── client/                     # Frontend (static HTML/CSS/JS)
│   ├── css/                    # Stylesheets
│   │   ├── style.css           # Main stylesheet
│   │   ├── *-modern.css        # Modern redesigned styles
│   │   └── *-professional.css  # Professional themed styles
│   ├── js/                     # Client-side JavaScript
│   │   ├── api.js              # API utility functions
│   │   ├── auth.js             # Authentication helpers
│   │   ├── utils.js            # Shared utilities
│   │   ├── dashboard.js        # Dashboard logic
│   │   ├── messages.js         # Real-time messaging
│   │   ├── social-feed-*.js    # Social feed modules
│   │   └── ...                 # Feature-specific scripts
│   ├── index.html              # Landing page
│   ├── login.html              # Login page
│   ├── signup.html             # Registration page
│   ├── dashboard.html          # Main dashboard
│   └── ...                     # Feature pages (70+ HTML pages)
├── server/                     # Backend (Node.js/Express)
│   ├── server.js               # Main server entry point
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication middleware
│   ├── api/                    # RESTful API route modules
│   │   ├── admin.js            # Admin management routes
│   │   ├── users.js            # User registration, login, profiles
│   │   ├── jobs.js             # Job board routes
│   │   ├── blogs.js            # Blog CRUD routes
│   │   ├── events.js           # Event management routes
│   │   ├── mentors.js          # Mentorship routes
│   │   ├── messages.js         # Messaging routes
│   │   ├── groups.js           # Group management routes
│   │   ├── threads.js          # Discussion thread routes
│   │   ├── stories.js          # Stories routes
│   │   ├── campaigns.js        # Campaign routes
│   │   ├── notifications.js    # Notification routes
│   │   ├── social.js           # Social features (follow, profiles)
│   │   ├── social-feed-enhanced.js  # Enhanced social feed
│   │   └── social-feed-phase2.js    # Advanced real-time feed
│   └── websocket/
│       └── social-feed-realtime.js  # WebSocket handlers for live feed
├── uploads/                    # User-uploaded files (auto-created)
│   ├── resumes/
│   ├── chat/
│   ├── blogs/
│   ├── groups/
│   ├── threads/
│   └── stories/
├── database_structure.txt      # Complete MySQL schema definition
├── package.json                # Node.js dependencies and scripts
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v16 or higher recommended)
- **[npm](https://www.npmjs.com/)** (comes with Node.js)
- **[MySQL](https://www.mysql.com/)** (v8.0 or higher recommended)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ankitsinghrawat-1/ALUMNI-CONNECT.git
cd ALUMNI-CONNECT
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASS=your_mysql_password
DB_NAME=alumni_db
JWT_SECRET=your_super_secret_jwt_key
PORT=3000
```

### 4. Set Up the Database

1. Open your MySQL client (e.g., MySQL Workbench, command line).
2. Run the SQL statements found in `database_structure.txt` to create the database and all required tables.

```bash
mysql -u your_mysql_username -p < database_structure.txt
```

### 5. Start the Server

```bash
npm start
```

The application will be available at **http://localhost:3000**.

---

## 🔐 Environment Variables

| Variable      | Description                          | Default     |
|---------------|--------------------------------------|-------------|
| `DB_HOST`     | MySQL database host                  | `localhost` |
| `DB_PORT`     | MySQL database port                  | `3306`      |
| `DB_USER`     | MySQL username                       | —           |
| `DB_PASS`     | MySQL password                       | —           |
| `DB_NAME`     | MySQL database name                  | `alumni_db` |
| `JWT_SECRET`  | Secret key for signing JWT tokens    | —           |
| `PORT`        | Server port                          | `3000`      |

---

## 🗄 Database Setup

The complete database schema is defined in `database_structure.txt`. It includes the following core tables:

- **`users`** – Central user table supporting all roles (alumni, student, faculty, employer, institute, admin) with extensive profile fields.
- **`jobs`** / **`job_applications`** – Job postings and application tracking with resume support.
- **`blogs`** – Blog posts with image attachments.
- **`events`** – Event creation and management.
- **`mentors`** / **`mentor_requests`** – Mentorship profiles and session requests.
- **`conversations`** / **`messages`** – Private messaging system.
- **`groups`** / **`group_members`** / **`group_discussions`** – Community groups.
- **`threads`** – Discussion forums.
- **`stories`** – Ephemeral media stories.
- **`campaigns`** – Fundraising and awareness campaigns.
- **`notifications`** – In-app notification system.
- **`social_posts`** / **`social_comments`** / **`social_likes`** – Social feed interactions.
- **`follows`** – User follow relationships.
- **`bookmarks`** – Saved content.

---

## 👤 User Roles

| Role         | Description                                                              |
|--------------|--------------------------------------------------------------------------|
| **Admin**    | Full platform control – manage users, content, verification, and groups. |
| **Alumni**   | Core users – network, mentor, blog, attend events, and apply for jobs.   |
| **Student**  | Find mentors, explore opportunities, and engage with the community.      |
| **Faculty**  | Academic networking and collaboration with alumni and students.           |
| **Employer** | Post job listings and manage applications from graduates.                |
| **Institute**| Institutional-level alumni engagement and oversight.                     |

---

## 📡 API Endpoints

The server exposes the following RESTful API route groups:

| Route Prefix               | Description                          | Auth Required |
|-----------------------------|--------------------------------------|:-------------:|
| `/api/users`               | Registration, login, profiles         | Partial       |
| `/api/admin`               | Admin management operations           | ✅            |
| `/api/blogs`               | Blog CRUD operations                  | ✅            |
| `/api/campaigns`           | Campaign management                   | ✅            |
| `/api/events`              | Event creation and listing            | ✅            |
| `/api/jobs`                | Job posting and applications          | ✅            |
| `/api/mentors`             | Mentor profiles and requests          | Partial       |
| `/api/messages`            | Private messaging                     | ✅            |
| `/api/notifications`       | User notifications                    | ✅            |
| `/api/groups`              | Group management and discussions      | ✅            |
| `/api/threads`             | Discussion threads                    | Partial       |
| `/api/stories`             | Story creation and viewing            | Partial       |
| `/api/social`              | Follow system, profile stats          | Partial       |
| `/api/social-feed`         | Enhanced social feed features         | ✅            |
| `/api/social-feed-phase2`  | Advanced real-time feed features      | ✅            |

> **Auth**: "Partial" means some endpoints are public (e.g., viewing) while others require authentication.

---

## ⚡ Real-Time Features

Alumni Connect uses **Socket.IO** for real-time functionality:

- **Live Messaging** – Instant message delivery between users with typing indicators.
- **Online Status** – See which users are currently online.
- **Real-Time Notifications** – Get notified instantly when you receive a message.
- **Live Social Feed** – Social feed updates pushed in real time via WebSocket.

---

## 📸 Screenshots

> _Screenshots coming soon._

---

## 📄 License

This project is licensed under the **ISC License**. See the [package.json](package.json) for details.

---

## 👨‍💻 Author

**Ankit Singh Rawat**

- GitHub: [@ankitsinghrawat-1](https://github.com/ankitsinghrawat-1)
- Repository: [ALUMNI-CONNECT](https://github.com/ankitsinghrawat-1/ALUMNI-CONNECT)

---

## 🤖 AI Acknowledgment

> **This project was fully built with the assistance of AI.** From architecture design and database schema to frontend interfaces and backend API logic, artificial intelligence tools were used throughout the entire development process to build, refine, and optimize every aspect of the Alumni Connect platform.

---

<p align="center">Made with ❤️ and AI</p>
