# Internal Recruitment Application - Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Internal Recruitment Application to an IIS server in production.

## Prerequisites

### Server Requirements
- Windows Server with IIS 10+ installed
- Node.js 18+ installed
- PostgreSQL 12+ installed
- IIS Node.js module installed

### Software Installation
1. **Install Node.js**: Download and install from https://nodejs.org/
2. **Install PostgreSQL**: Download and install from https://www.postgresql.org/
3. **Install IIS Node.js**: Run `npm install -g iisnode`

## Database Setup

### 1. Create Database
```sql
CREATE DATABASE recruitment_db;
CREATE USER recruitment_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE recruitment_db TO recruitment_user;
```

### 2. Run Database Scripts
Execute the following SQL scripts in order:
1. `database/approval_tables.sql`
2. `database/new_workflow_fields.sql`
3. `database/join_confirmation_fields.sql`
4. `database/add_missing_columns_to_replacements.sql`

## Configuration

### 1. Environment Variables

#### Backend (.env.production)
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recruitment_db
DB_USER=recruitment_user
DB_PASSWORD=your_secure_password
```

#### Frontend (.env.production)
```env
REACT_APP_API_BASE_URL=https://your-domain.com/api
REACT_APP_ENVIRONMENT=production
```

### 2. Update Production URLs
Replace `your-domain.com` with your actual domain name in:
- `recruiter-frontend/.env.production`
- `web.config` (if needed)

## Deployment

### Option 1: Automated Deployment (Recommended)
1. Run the deployment script:
   ```powershell
   .\deploy-production.ps1
   ```

### Option 2: Manual Deployment

#### 1. Build Frontend
```bash
cd recruiter-frontend
npm install --production
npm run build
```

#### 2. Prepare Backend
```bash
cd backend
npm install --production
```

#### 3. Deploy to IIS
1. Create application directory: `C:\inetpub\wwwroot\recruitment-app`
2. Copy files:
   - `web.config` → `C:\inetpub\wwwroot\recruitment-app\`
   - `recruiter-frontend\build\*` → `C:\inetpub\wwwroot\recruitment-app\recruiter-frontend\build\`
   - `backend\*` → `C:\inetpub\wwwroot\recruitment-app\backend\`
3. Copy environment files:
   - `recruiter-frontend\.env.production` → `C:\inetpub\wwwroot\recruitment-app\recruiter-frontend\.env`
   - `backend\.env.production` → `C:\inetpub\wwwroot\recruitment-app\backend\.env`

## IIS Configuration

### 1. Application Pool
- Create new Application Pool: `recruitment-app-pool`
- Set .NET CLR Version: "No Managed Code"
- Set Managed Pipeline Mode: "Integrated"

### 2. Website/Application
- Create new Application: `recruitment-app`
- Set Physical Path: `C:\inetpub\wwwroot\recruitment-app`
- Set Application Pool: `recruitment-app-pool`

### 3. URL Rewrite Module
Ensure URL Rewrite module is installed in IIS.

### 4. Permissions
Grant appropriate permissions to the application directory:
```powershell
icacls "C:\inetpub\wwwroot\recruitment-app" /grant "IIS_IUSRS:(OI)(CI)F"
```

## Security Considerations

### 1. Database Security
- Use strong passwords for database users
- Restrict database access to application server only
- Enable SSL connections if possible

### 2. Application Security
- Keep Node.js and npm packages updated
- Use HTTPS in production
- Implement proper CORS policies
- Enable rate limiting

### 3. Server Security
- Configure Windows Firewall
- Enable Windows Updates
- Use strong passwords for server accounts

## Monitoring and Maintenance

### 1. Logs
- Application logs: `C:\inetpub\wwwroot\recruitment-app\backend\logs\`
- IIS logs: `C:\inetpub\LogFiles\`

### 2. Performance Monitoring
- Monitor CPU and memory usage
- Set up database performance monitoring
- Configure application performance monitoring

### 3. Backup Strategy
- Regular database backups
- Application file backups
- Configuration backups

## Troubleshooting

### Common Issues

#### 1. Application Not Starting
- Check Node.js installation
- Verify environment variables
- Check application pool configuration
- Review IIS logs

#### 2. Database Connection Issues
- Verify database credentials
- Check network connectivity
- Ensure database service is running

#### 3. Static Files Not Loading
- Check file permissions
- Verify URL Rewrite rules
- Ensure build files are copied correctly

### Debug Commands
```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Test database connection
psql -h localhost -U recruitment_user -d recruitment_db

# Check IIS application status
Get-IISAppPool -Name "recruitment-app-pool"
```

## Support

For technical support or issues:
1. Check application logs
2. Review IIS logs
3. Verify configuration files
4. Contact system administrator

## Version History
- v1.0.0: Initial production release
- Includes all dashboard functionalities
- Role-based access control
- Complete hiring workflow
