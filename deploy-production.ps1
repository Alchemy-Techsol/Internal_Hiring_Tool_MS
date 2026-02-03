# Production Deployment Script for IIS
Write-Host "🚀 Starting Production Deployment..." -ForegroundColor Green

# Set variables
$FRONTEND_DIR = "recruiter-frontend"
$BACKEND_DIR = "backend"
$BUILD_DIR = "build"
$PRODUCTION_DIR = "C:\inetpub\wwwroot\recruitment-app"

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location $FRONTEND_DIR
npm install --production

Write-Host "🔨 Building frontend for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "..\$BACKEND_DIR"
npm install --production

# Create production directory if it doesn't exist
if (!(Test-Path $PRODUCTION_DIR)) {
    Write-Host "📁 Creating production directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $PRODUCTION_DIR -Force
}

# Copy files to production directory
Write-Host "📋 Copying files to production directory..." -ForegroundColor Yellow
Copy-Item "..\web.config" -Destination $PRODUCTION_DIR -Force
Copy-Item "..\$FRONTEND_DIR\$BUILD_DIR\*" -Destination "$PRODUCTION_DIR\$FRONTEND_DIR\$BUILD_DIR" -Recurse -Force
Copy-Item ".\*" -Destination "$PRODUCTION_DIR\$BACKEND_DIR" -Recurse -Force

# Copy environment files
Copy-Item "..\$FRONTEND_DIR\.env.production" -Destination "$PRODUCTION_DIR\$FRONTEND_DIR\.env" -Force
Copy-Item ".\.env.production" -Destination "$PRODUCTION_DIR\$BACKEND_DIR\.env" -Force

Write-Host "✅ Production deployment completed successfully!" -ForegroundColor Green
Write-Host "📍 Application deployed to: $PRODUCTION_DIR" -ForegroundColor Cyan
Write-Host "🌐 Access your application at: http://your-server-name/recruitment-app" -ForegroundColor Cyan

Set-Location ".."
