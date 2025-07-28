# Ideas Tracker

A modern web application for collecting, organizing, and voting on innovative ideas. Built with React, TypeScript, Node.js, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **Idea Submission**: Users can submit ideas with titles, descriptions, and tags
- **Voting System**: Upvote and downvote ideas to show community preference
- **Comments System**: Engage in discussions with threaded comments
- **User Authentication**: Secure registration and login system
- **Tag-based Organization**: Categorize and filter ideas by tags
- **Search & Filtering**: Find ideas by keywords, tags, and authors

### Advanced Features
- **Infinite Scroll**: Seamless browsing experience with automatic content loading
- **Real-time Updates**: Live vote counts and comment updates
- **Admin Panel**: Content moderation and user management
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Modern, eye-friendly interface
- **Error Handling**: Comprehensive error management with user feedback

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **React Hook Form** for form management
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** for data persistence (default) or **PostgreSQL** for production
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Validator** for input validation
- **Rate Limiting** for API protection

### Testing
- **Jest** and **Supertest** for backend testing
- **Vitest** and **React Testing Library** for frontend testing
- **Playwright** for end-to-end testing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

Optional (for production):
- **PostgreSQL** (v12 or higher) - if you prefer PostgreSQL over SQLite

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ideas-tracker.git
cd ideas-tracker
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup
```bash
# Navigate to backend directory
cd ../backend

# Run the interactive database setup
npm run setup:db
```

This will guide you through:
- Choosing between SQLite (default) or PostgreSQL
- Setting up database configuration
- Creating the database (SQLite is created automatically)
- Creating an admin user

**Note:** SQLite is used by default for easy setup. No additional database server installation required!

### 4. Start Development Servers
```bash
# Start backend server (from backend directory)
npm run dev

# In a new terminal, start frontend server (from frontend directory)
cd ../frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📖 Documentation

- **[Setup Guide](docs/SETUP.md)** - Detailed installation and configuration
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests (requires running application)
npm run test:e2e
```

### Test Coverage
```bash
# Backend coverage
cd backend
npm run test:coverage

# Frontend coverage
cd frontend
npm run test:coverage
```

## 🏗 Project Structure

```
ideas-tracker/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Configuration files
│   │   └── utils/          # Utility functions
│   ├── tests/              # Backend tests
│   └── config/             # Database and app config
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
└── docs/                   # Documentation
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ideas_tracker
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 🚀 Deployment

### Production Build
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed production deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure code passes linting and tests

## 📝 API Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Ideas
- `GET /api/ideas` - Get ideas with filtering and pagination
- `POST /api/ideas` - Create new idea
- `GET /api/ideas/:id` - Get specific idea
- `PUT /api/ideas/:id` - Update idea (author only)
- `DELETE /api/ideas/:id` - Delete idea (author/admin only)

### Voting
- `POST /api/ideas/:id/vote` - Cast or change vote
- `DELETE /api/ideas/:id/vote` - Remove vote

### Comments
- `GET /api/comments/idea/:id` - Get comments for idea
- `POST /api/comments/idea/:id` - Add comment
- `PUT /api/comments/:id` - Update comment (author only)
- `DELETE /api/comments/:id` - Delete comment (author/admin only)

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Password Hashing** with bcrypt
- **Rate Limiting** on API endpoints
- **Input Validation** and sanitization
- **SQL Injection Protection** with parameterized queries
- **CORS Configuration** for cross-origin requests
- **Admin-only Routes** for content management

## 🎨 UI/UX Features

- **Dark Theme** with modern design
- **Responsive Layout** for all screen sizes
- **Loading States** for better user experience
- **Error Boundaries** for graceful error handling
- **Toast Notifications** for user feedback
- **Infinite Scroll** for seamless browsing
- **Real-time Updates** for votes and comments

## 📊 Performance

- **Database Indexing** for fast queries
- **Connection Pooling** for database efficiency
- **Query Optimization** with pagination
- **Frontend Caching** with React Query
- **Code Splitting** for faster loading
- **Image Optimization** and lazy loading

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify database credentials in config
cat backend/config/database.json
```

**Port Already in Use**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```

**Frontend Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- PostgreSQL community for the robust database
- All contributors who helped improve this project

## 📞 Support

If you encounter any issues or have questions:
1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/your-username/ideas-tracker/issues)
3. Create a new issue with detailed information

---

**Happy idea tracking! 💡**