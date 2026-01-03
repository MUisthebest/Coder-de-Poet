🚀 Coder-de-Poet – Docker Setup Guide

This project uses Docker and Docker Compose to run all services locally with a single command.

📦 Prerequisites

Make sure you have the following installed:

Docker Desktop (Windows / macOS / Linux)

Git

Git Bash (Windows) or WSL (Ubuntu)

⚠️ On Windows, PowerShell/CMD cannot run .sh files directly.
Please use Git Bash or WSL.

📂 Project Structure
Coder-de-Poet/
├── docker-compose.yml
├── docker.sh
├── auth_service/
│   └── Dockerfile
├── course_service/
│   └── Dockerfile
├── ai_service/
│   └── Dockerfile
├── chat_service/
│   └── Dockerfile
├── ide_service/
│   └── Dockerfile
└── frontend/
    └── Dockerfile


Each service has its own Dockerfile.

▶️ How to Run the Project
1️⃣ Open Terminal (Git Bash)

Right-click in the project folder

Select “Open Git Bash here”
2️⃣ Give Execute Permission (only once)
chmod +x docker.sh

3️⃣ Run the Script
./docker.sh


This script will:

Build Docker images for all services

Start all containers using docker compose up -d

🐳 Services & Ports
Service	Port
Auth Service	5001
Course Service	5002
AI Service	5003
Chat Service	5004
IDE Service	5005
Frontend	8088
Kafka	9092
Zookeeper	2181

Frontend URL:

http://localhost:8088

🔍 Verify Running Containers
docker ps


You should see containers like:

learnix-auth
learnix-course
learnix-ai
learnix-chat
learnix-ide
learnix-frontend
kafka
zookeeper

🛑 Stop the Project
docker compose down


To remove volumes as well:

docker compose down -v