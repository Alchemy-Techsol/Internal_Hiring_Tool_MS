# Production Deployment Checklist

## Pre-Deployment

### ✅ Environment Setup
- [ ] Node.js 18+ installed on server
- [ ] PostgreSQL 12+ installed and configured
- [ ] IIS 10+ installed with URL Rewrite module
- [ ] IIS Node.js module installed
- [ ] Application pool created with correct settings

### ✅ Database Preparation
- [ ] Database `recruitment_db` created
- [ ] Database user `recruitment_user` created with proper permissions
- [ ] All SQL scripts executed in correct order:
  - [ ] `approval_tables.sql`
  - [ ] `new_workflow_fields.sql`
  - [ ] `join_confirmation_fields.sql`
  - [ ] `add_missing_columns_to_replacements.sql`
- [ ] Database connection tested

### ✅ Configuration Files
- [ ] `backend/.env.production` configured with production values
- [ ] `recruiter-frontend/.env.production` configured with production URL
- [ ] `web.config` updated with correct domain (if needed)
- [ ] Database credentials updated in environment files

## Deployment

### ✅ Frontend Build
- [ ] Dependencies installed: `npm install --production`
- [ ] Production build created: `npm run build:prod`
- [ ] Build files verified in `recruiter-frontend/build/`

### ✅ Backend Preparation
- [ ] Dependencies installed: `npm install --production`
- [ ] Environment file copied: `.env.production` → `.env`
- [ ] Server tested locally

### ✅ File Deployment
- [ ] Application directory created: `C:\inetpub\wwwroot\recruitment-app`
- [ ] `web.config` copied to application root
- [ ] Frontend build files copied to `recruiter-frontend/build/`
- [ ] Backend files copied to `backend/`
- [ ] Environment files copied with correct names

### ✅ IIS Configuration
- [ ] Application pool `recruitment-app-pool` created
- [ ] Application `recruitment-app` created
- [ ] Physical path set correctly
- [ ] Application pool assigned
- [ ] Permissions granted to IIS_IUSRS

## Post-Deployment

### ✅ Application Testing
- [ ] Application starts without errors
- [ ] Login functionality works
- [ ] All user roles can access their dashboards
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] File uploads/downloads work (if applicable)

### ✅ Security Verification
- [ ] HTTPS enabled (if applicable)
- [ ] Database credentials are secure
- [ ] Environment files not accessible via web
- [ ] CORS policies configured correctly
- [ ] Rate limiting enabled

### ✅ Performance Testing
- [ ] Application loads within acceptable time
- [ ] Database queries perform well
- [ ] Memory usage is reasonable
- [ ] CPU usage is acceptable

### ✅ Monitoring Setup
- [ ] Application logs configured
- [ ] Error monitoring enabled
- [ ] Performance monitoring set up
- [ ] Database monitoring configured

## Documentation

### ✅ Documentation Updated
- [ ] README-PRODUCTION.md created
- [ ] Deployment scripts documented
- [ ] Configuration files documented
- [ ] Troubleshooting guide created

### ✅ Support Information
- [ ] Contact information documented
- [ ] Escalation procedures defined
- [ ] Backup procedures documented
- [ ] Recovery procedures documented

## Final Verification

### ✅ End-to-End Testing
- [ ] Complete user workflow tested
- [ ] All features working as expected
- [ ] Error handling tested
- [ ] Edge cases tested

### ✅ User Acceptance
- [ ] Stakeholders have tested the application
- [ ] Feedback collected and addressed
- [ ] Training materials provided (if needed)
- [ ] Go-live approval received

## Go-Live

### ✅ Production Launch
- [ ] DNS configured (if applicable)
- [ ] SSL certificate installed (if applicable)
- [ ] Load balancer configured (if applicable)
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested

### ✅ Post-Launch Monitoring
- [ ] Application performance monitored
- [ ] Error rates tracked
- [ ] User feedback collected
- [ ] Performance metrics reviewed
- [ ] Issues addressed promptly

## Maintenance

### ✅ Ongoing Maintenance
- [ ] Regular backup schedule established
- [ ] Update procedures documented
- [ ] Monitoring alerts configured
- [ ] Performance review schedule set
- [ ] Security audit schedule established

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Approved By:** _______________

**Notes:**
