# Internal Recruitment App - Frontend

A beautiful React TypeScript application for internal recruitment management with Alchemy TechSol branding.

## Features

- 🎨 **Beautiful UI** - Modern design with Alchemy branding
- 🔐 **User Authentication** - Login and signup functionality
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast Performance** - Optimized React components
- 🔗 **API Integration** - Connected to Node.js backend

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3011`

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.js        # Login page component
│   ├── Login.css       # Login page styles
│   ├── Signup.js       # Signup page component
│   └── Signup.css      # Signup page styles
├── services/           # API services
│   └── api.js         # API configuration and functions
├── App.js             # Main app component with routing
└── App.css            # Global styles
```

## Pages

### Login Page (`/login`)
- Email and password authentication
- Form validation
- Error handling
- Link to signup page

### Signup Page (`/signup`)
- Complete user registration form
- Designation and business unit selection
- Password confirmation
- Form validation
- Success/error messages

### Dashboard (`/dashboard`)
- Placeholder dashboard (to be developed)
- Logout functionality

## API Integration

The frontend connects to the Node.js backend at `http://localhost:5000` with these endpoints:

- `POST /api/users/login` - User authentication
- `POST /api/users/register` - User registration
- `GET /api/users` - Get all users
- `GET /api/health` - Health check

## Styling

The app uses custom CSS with:
- Alchemy TechSol branding colors
- Modern gradient backgrounds
- Responsive design
- Smooth animations and transitions
- Professional form styling

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Adding New Features

1. Create new components in `src/components/`
2. Add API functions in `src/services/api.js`
3. Update routing in `src/App.js`
4. Add styles in component-specific CSS files

## Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Backend Requirements

Make sure your Node.js backend is running on port 5000 with:
- CORS enabled for `http://localhost:3000`
- User authentication endpoints
- PostgreSQL database connection

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Ensure backend is running on port 5000
   - Check CORS configuration

2. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in backend `.env`

3. **Port Already in Use**
   - Change port in package.json or kill existing process
   - Use `npm start -- --port 3001` for different port
