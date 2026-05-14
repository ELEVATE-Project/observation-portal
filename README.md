The Elevate Observation/Survey PWA is developed using the Angular framework. This document provides instructions on setting up the development environment and deploying the application.

Contents
---------------------

 * [Dependencies](#dependencies)
 * [Setting up the CLI and Prerequisites](#setting-up-the-cli-and-prerequisites)
 * [Setup and Configuration](#setup-and-configuration)
 * [Setting up the Project](#setting-up-the-project)
 * [Serving the Application](#serving-the-application)
 * [Debugging the Application](#debugging-the-application)
 * [Deployment Guide](#deployment-guide)
   * [Environment Configuration](#environment-configuration)
   * [User Authentication and Portal Setup](#user-authentication-and-portal-setup)
   * [Native Deployment](#native-deployment)
   * [Docker Deployment](#docker-deployment)

Dependencies
------------

| Requirement       | Description                                                                                                             |
|-------------------|-------------------------------------------------------------------------------------------------------------------------|
| Angular Framework   |  @angular-devkit/build-angular : 19.2.0 @angular-devkit/schematics : 19.2.0 @angular/cli : 19.2.0  |
| System            | [nodejs](https://nodejs.org/) : v20.19.4 npm: 10.7.0           |

Setting up the CLI and Prerequisites
-------------------------------------

Before setting up the project for development or deployment, ensure the following prerequisites are installed:

1. **Install Node.js v20.19.4 and npm 10.7.0** (if not already installed)
   - Download and install from https://nodejs.org
   - Verify installation:
     ```bash
     node -v
     npm -v
     ```

2. **Install Angular CLI Framework**
   ```bash
   npm install -g @angular/cli
   ```


3. **Install PM2 (Process Manager)** (required for deployment)
   ```bash
   npm install -g pm2
   ```

Setup and Configuration
-----------------------

1. **Fork the repository** https://github.com/ELEVATE-Project/observation-portal to your GitHub account

2. **Clone your forked repository**
   ```bash
   git clone <FORKED_REPO_LINK>
   ```

3. **Navigate to the project directory**
   ```bash
   cd observation-portal
   ```

4. **Fetch the branch and pull latest updates**
   ```bash
   git checkout <branch-name>
   git pull origin <branch-name>
   ```

Setting up the Project
----------------------

Part 1: Frontend Setup
----------------------

1. Go to the project folder using the below command.
    ```
    cd observation-portal
    ```
2. Set the environment variables.
   - Follow the [Environment Configuration](#environment-configuration) section.

3. Run `npm i -f`.



Part 2: Backend Setup
----------------------

If you want to connect the portal to the full backend service:

Setup Backend Service: Follow the instructions in the [Samiksha Service Documentation](https://github.com/ELEVATE-Project/samiksha-service/tree/main/documentation/3.4.0).

Update Backend URL: Once the backend is running (typically on port 4301), update the `surveyBaseURL` field in `src/assets/env/env.js`:

```javascript
window["env"] = {
    surveyBaseURL: "http://localhost:4301",
};


Part 3: Elevate Portal Integration (Optional)
----------------------------------------------

If you require a complete user management system with login, registration, and discovery of observation, survey and reports:

Setup Elevate Portal: Follow the installation guide in the [Elevate Portal Repository](https://github.com/ELEVATE-Project/elevate-portal).

Authentication & Access: The portal handles user sessions and provides the interface to launch specific projects and programs within this PWA.

Update Base URL: Once the backend is running (typically on port 3001), update the NEXT_PUBLIC_BASE_URL in your apps/shikshagraha-app/public/env-config.js to http://localhost:3001.

Host the app: Run the following command to serve the portal:

npx nx dev shikshagraha-app --port=3000 --verbose




Serving the Application
------------------------

1. Run the project on your local system using the following command:

    ```
    ng serve
    ```

Debugging the Application
-------------------------

1. Open the running app in the browser.
2. Start inspecting using Chrome dev tools or any alternatives.

## Deployment Guide

### Environment Configuration

Update the environment configuration file:

```bash
cd src/assets/env/env.js
```

Configure the environment variables:

```javascript
window["env"] = {
   production: true,
    surveyBaseURL: '<BaseUrl>',
    hostPath: '/observations/',
};
```


### User Authentication and Portal Setup

**Option 1: Integration with Existing System**
If you have your own user login, registration, and home page to list capabilities, you can integrate this PWA by adding the following nginx path configuration to your existing setup:

```nginx
location /observations/ {
    # Your nginx configuration for the PWA
}
```

**Option 2: Using Elevate Portal**
If you need a complete user authentication system with login, registration, and home page capabilities, you can use our separate portal repository:

**Elevate Portal Repository**: https://github.com/ELEVATE-Project/elevate-portal

This repository provides a complete user management system that can be deployed alongside this PWA. Refer to the setup documentation in that repository for detailed installation and configuration instructions.


### Local Development with Nginx Reverse Proxy (Connect 2 portals and check locally)

This setup allows you to run both the **Elevate Portal** and **Observation Portal** locally using a single URL and port through **Nginx**.

---

## Architecture Overview

| Application | Local URL |
|--------------|------------|
| Elevate Portal | `http://localhost:8000` |
| Observation Portal | `http://localhost:4200` |
| Nginx Unified URL | `http://localhost:8080` |

Using Nginx:

- `http://localhost:8080/` → Elevate Portal
- `http://localhost:8080/observations/` → Observation Portal

---

## Step 1: Run Elevate Portal

Open a terminal and run:

```bash
cd elevate-portal
npm install
npm run dev
```

Verify:

```text
http://localhost:8000
```

---

## Step 2: Run Observation Portal

Open another terminal and run:

```bash
cd observation-portal
npm install
ng serve --port 4200
```

Verify:

```text
http://localhost:4200
```
```text
---

## Step 3: Configure Observation Portal Base Path

Open:

```text
angular.json
```

Inside:

```text
observation-portal.architect.build.options
```

Add:

```json
"baseHref": "/observations/",
"deployUrl": "/observations/"
```

---

## Step 4: Update Environment Configuration

Open:

```text
src/assets/env/env.js
```

Update:

```javascript
window["env"] = {
    production: false,
    surveyBaseURL: "http://localhost:4301",
    hostPath: "/observations/",
};
```

---

## Step 5: Install Nginx

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install nginx -y
```

---

### macOS

```bash
brew install nginx
```

---

### Windows

1. Download Nginx:
   http://nginx.org/en/download.html

2. Extract the zip file.

3. Move extracted folder to:

```text
C:\nginx
```

4. Start Nginx:

```bash
cd C:\nginx
start nginx
```

---

## Step 6: Verify Nginx Installation

Run:

```bash
nginx -v
```

Open:

```text
http://localhost
```

If the Nginx welcome page appears, installation is successful.

---

## Step 7: Configure Nginx

### Linux

Open:

```bash
sudo nano /etc/nginx/nginx.conf
```

---

### macOS

Open:

```bash
nano /usr/local/etc/nginx/nginx.conf
```

---

### Windows

Open:

```text
C:\nginx\conf\nginx.conf
```

---

## Step 8: Add Server Configuration

Inside the existing:

```nginx
http {
}
```

block, add the following `server` configuration:

```nginx
server {
    listen 8080;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }

    location /observations/ {
        proxy_pass http://localhost:4200/observations/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Example:

```nginx
http {

    server {
        listen 8080;

        location / {
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
        }

        location /observations/ {
            proxy_pass http://localhost:4200/observations/;
            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

Save the file.

---

## Step 9: Validate Nginx Configuration

### Linux/macOS

```bash
sudo nginx -t
```

---

### Windows

```bash
cd C:\nginx
nginx -t
```

Expected output:

```text
syntax is ok
test is successful
```

---

## Step 10: Restart Nginx

### Linux

```bash
sudo systemctl restart nginx
```

---

### macOS

```bash
brew services restart nginx
```

---

### Windows

```bash
cd C:\nginx
nginx -s reload
```

---

## Step 11: Access Applications

Open:

| URL | Application |
|------|-------------|
| `http://localhost:8080/` | Elevate Portal |
| `http://localhost:8080/observations/` | Observation Portal |

---

## Troubleshooting

### Check Running Ports

#### Linux/macOS

```bash
lsof -i :8080
lsof -i :8000
lsof -i :4200
```

#### Windows

```bash
netstat -ano | findstr :8080
netstat -ano | findstr :8000
netstat -ano | findstr :4200
```

---

### Observation Portal Not Loading Correctly

Ensure the following exists in `angular.json`:

```json
"baseHref": "/observations/",
"deployUrl": "/observations/"
```

---

## Recommended Development Workflow

Use 3 terminals.

### Terminal 1

```bash
cd elevate-portal
npm run dev
```

---

### Terminal 2

```bash
cd observation-portal
ng serve --port 4200
```

For remote-device/LAN testing, use:

```bash
ng serve --host 0.0.0.0 --port 4200
```

---

### Terminal 3

#### Linux

```bash
sudo systemctl restart nginx
```

#### macOS

```bash
brew services restart nginx
```

#### Windows

```bash
cd C:\nginx
nginx -s reload
```

---

Access the complete application using:

```text
http://localhost:8080
```


##### Native Deployment

Deploy the portal to path at the URL https://xyz.com/observations/

1. **Setup and Configuration**
   - Follow the [Setup and Configuration](#setup-and-configuration) section above to fork, clone, and prepare your repository.

2. **Configure Angular.json**
   ```bash
   cd projectpath/angular.json
   ```
   Add the following key-value pairs in `observation-portal.architect.build.options`:
   ```json
   "baseHref": "/observations/",
   "deployUrl": "/observations/"
   ```

3. **Install dependencies and build the project**
   ```bash
   npm install --force
   ```

4. **Build the project for production**
   ```bash
   ng build --configuration production
   ```

5. **Start the application using PM2**
   ```bash
   pm2 start pm2.config.json
   ```

### Docker Deployment

1. **Setup and Configuration**
   - Follow the [Setup and Configuration](#setup-and-configuration) section above to fork, clone, and prepare your repository.

2. **Configure Angular.json**
   ```bash
   cd projectpath/angular.json
   ```
   Add the following key-value pairs in `app.architect.build.options`:
   ```json
   "baseHref": "/observations/",
   "deployUrl": "/observations/"
   ```

3. **Install Docker** (if not already installed)
   - Download and install Docker from https://www.docker.com/get-started/

4. **Navigate to the project directory**
   ```bash
   cd /path/to/project-directory
   ```

5. **Log in to Docker**
   ```bash
   docker login -u <email-id>
   ```

6. **Build the Docker image**
   ```bash
   docker build -t <image-name>:latest .
   ```
   Note: Ensure the `.` at the end is present — it refers to the current directory.

7. **Run the Docker container**
   ```bash
   docker run -p 8080:<container-port> <image-name>:latest
   ```
   Replace `<container-port>` with the port number exposed in the Dockerfile (refer to the Dockerfile to find the exposed port, e.g., EXPOSE 6006).