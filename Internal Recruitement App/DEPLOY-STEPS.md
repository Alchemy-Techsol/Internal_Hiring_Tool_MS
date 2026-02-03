# Deploy on Ubuntu Server with Docker

Deploy the Internal Hiring app (React + Node.js + PostgreSQL) on Ubuntu using Docker.

---

## Prerequisites

- Ubuntu server (20.04 or 22.04) with SSH access
- Server IP address (e.g. `192.168.1.100` or your cloud VM IP)
- Ports **80** (HTTP) and **22** (SSH) open on the server firewall

---

## Step 1: Connect to the server

```bash
ssh your_user@YOUR_SERVER_IP
```

Use `root` or a user with sudo (e.g. `ubuntu` on AWS).

---

## Step 2: Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Start and enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to docker group (so you don't need sudo for docker)
sudo usermod -aG docker $USER
# Log out and log back in for this to take effect, or run: newgrp docker

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

## Step 3: Clone the repo from GitHub

```bash
# Install git if needed
sudo apt install -y git

# Clone the company repo
git clone https://github.com/Alchemy-Techsol/Internal_Hiring_Tool_MS.git
cd Internal_Hiring_Tool_MS
```

---

## Step 4: Create the `.env` file

```bash
cp env.example .env
nano .env
```

Set these values (replace with your server IP and a strong password):

```env
DB_USER=postgres
DB_PASSWORD=YourStrongPassword123!
DB_PORT=5432
FRONTEND_URL=http://YOUR_SERVER_IP
```

- **YOUR_SERVER_IP** → e.g. `192.168.1.100` or your domain like `https://recruitment.company.com`
- **DB_PASSWORD** → use a strong password; this is for PostgreSQL.

Save and exit: **Ctrl+O**, **Enter**, **Ctrl+X**.

---

## Step 5: Open port 80 (if using a firewall)

```bash
# If using ufw
sudo ufw allow 80/tcp
sudo ufw allow 22/tcp
sudo ufw reload
sudo ufw status
```

---

## Step 6: Build and run with Docker Compose

```bash
docker compose up -d --build
```

First run may take 5–10 minutes (downloads images and builds frontend). Wait until it finishes.

Check that containers are running:

```bash
docker compose ps
```

You should see three containers: **recruitment-postgres**, **recruitment-backend**, **recruitment-nginx** (all **Up**).

---

## Step 7: Access the app

Open in a browser:

- **http://YOUR_SERVER_IP**

Example: **http://192.168.1.100**

---

## Useful commands after deployment

| Task | Command |
|------|---------|
| View logs | `docker compose logs -f` |
| Backend logs only | `docker compose logs -f backend` |
| Stop app | `docker compose down` |
| Restart app | `docker compose restart` |
| Rebuild after code change | `git pull` then `docker compose up -d --build` |

---

## Optional: Use a domain and HTTPS

1. Point your domain (e.g. `recruitment.company.com`) to the server IP (A record).
2. Update `.env`: set `FRONTEND_URL=https://recruitment.company.com`.
3. Restart: `docker compose up -d`.
4. Add SSL (e.g. Let's Encrypt with Certbot) and configure Nginx to serve HTTPS on port 443.

---

## Troubleshooting

**App not loading in browser**

- Check firewall: `sudo ufw status` — port 80 must be allowed.
- Check containers: `docker compose ps` — all three should be **Up**.
- Check nginx logs: `docker compose logs nginx`.

**Backend or database errors**

- Check backend logs: `docker compose logs backend`
- Check postgres: `docker compose logs postgres`
- Ensure `.env` has correct `DB_PASSWORD` and that you ran `docker compose up -d` from the project root (where `docker-compose.yml` is).

**After changing code on GitHub**

```bash
cd Internal_Hiring_Tool_MS
git pull
docker compose up -d --build
```
