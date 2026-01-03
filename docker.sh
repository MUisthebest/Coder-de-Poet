#!/usr/bin/env bash
set -e

echo "🚀 Build all services..."

# =========================
# Auth Service
# =========================
echo "🔧 Building auth_service..."
cd auth_service
docker build -t learnix-auth .

echo "🗄️ Running EF Core migrations for auth_service..."
dotnet ef database update

cd ..

# =========================
# Course Service
# =========================
echo "🔧 Building course_service..."
cd course_service
docker build -t learnix-course .
cd ..

# =========================
# AI Service
# =========================
echo "🔧 Building ai_service..."
cd ai_service
docker build -t learnix-ai .
cd ..

# =========================
# Frontend
# =========================
echo "🔧 Building frontend..."
cd frontend
docker build -t learnix-frontend .
cd ..

# =========================
# Chat Service
# =========================
echo "🔧 Building chat_service..."
cd chat_service
docker build -t learnix-chat .
cd ..

# =========================
# IDE Service
# =========================
echo "🔧 Building ide_service..."
cd ide_service
docker build -t learnix-ide .
cd ..

# =========================
# Run Docker Compose
# =========================
echo "🐳 Starting containers..."
docker compose up -d

echo "✅ Done!"
