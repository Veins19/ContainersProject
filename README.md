# 🧠 RAG Neural Engine

![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue?logo=kubernetes)
![NestJS](https://img.shields.io/badge/API%20Gateway-NestJS-E0234E?logo=nestjs)
![FastAPI](https://img.shields.io/badge/AI%20Worker-FastAPI-009688?logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Framer-61DAFB?logo=react)

An **enterprise-grade, multi-tenant Retrieval-Augmented Generation (RAG) platform** deployed on Kubernetes. Built for secure knowledge access, this project features **document chunking, semantic retrieval, cross-encoder re-ranking, and dynamic switching between cloud-based LLMs (Google Gemini) and local privacy-preserving models (Ollama).**

---

# ✨ Features

## 🔹 Microservices Architecture
- Fully containerized using **Docker**
- Orchestrated with **Kubernetes (Kind)**
- Scalable and modular service design

## 🔹 Hybrid AI Execution
- Switch seamlessly between:
  - **Cloud LLMs:** Google Gemini
  - **Local LLMs:** Ollama (`gemma4:e2b`)
- Privacy-first inference support

## 🔹 Advanced RAG Pipeline
- Document parsing support:
  - PDF
  - DOCX
  - PPTX
  - TXT
- Semantic document chunking
- Vector storage with **ChromaDB**
- Cross-encoder re-ranking using:

```text
ms-marco-MiniLM-L-6-v2
```

## 🔹 Enterprise Security
- Multi-tenant architecture
- Authentication with **NestJS**
- Secure password hashing
- Session management using **PostgreSQL**

## 🔹 Reactive UI/UX
- Built with:
  - React
  - Tailwind CSS
  - Framer Motion
- Glassmorphism design
- Real-time health polling
- Live document upload tracking via WebSockets

---

# 🏗️ Architecture & Tech Stack

## Frontend (React Dashboard)

| Technology | Purpose |
|------------|---------|
| React (Vite) + TypeScript | Frontend Framework |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| WebSockets | Live upload tracking |

### Features
- Real-time system health monitoring
- Interactive dashboard
- Modern responsive UI

---

## API Gateway (NestJS)

| Technology | Purpose |
|------------|---------|
| NestJS + TypeScript | API Gateway |
| Prisma | ORM |
| PostgreSQL | Database |

### Responsibilities
- Authentication
- Routing
- Rate limiting
- User management
- Query logging
- Document metadata management

---

## AI Worker (Python)

| Technology | Purpose |
|------------|---------|
| FastAPI | AI Backend |
| ChromaDB | Vector Database |
| Google Generative AI | Embeddings |
| Ollama | Local LLM Routing |
| LangChain | Text Processing |

### Processing Pipeline
- PDF parsing (`PyPDF`)
- DOCX parsing (`python-docx`)
- PPTX parsing (`python-pptx`)
- Semantic chunking
- Embedding generation
- Vector search
- Re-ranking

---

# 📁 Project Structure

```text
ContainersProject/
│── frontend/          # React frontend
│── api-gateway/       # NestJS backend
│── ai-worker/         # FastAPI AI service
│── k8s/               # Kubernetes manifests
│── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

### Required Software
- Docker
- Kind (Kubernetes in Docker)
- kubectl
- Node.js (v20+)
- Python (3.10+)
- Ollama (for local LLM execution)

### Recommended Environment
- **WSL2 + Ubuntu** (recommended for Windows users)

---

# 1️⃣ Clone the Repository

```bash
git clone https://github.com/Veins19/ContainersProject.git
cd ContainersProject
```

---

# 2️⃣ Environment Configuration

Create `.env` files for backend services.

## API Gateway (`api-gateway/.env`)

```env
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_SECURE_PASSWORD@postgres:5432/rag_db?schema=public"

JWT_SECRET="your_super_secret_jwt_key"
```

---

## AI Worker (`ai-worker/.env`)

```env
GEMINI_API_KEY="your_gemini_api_key_here"

# Points Kubernetes container to host machine running Ollama
OLLAMA_URL="http://host.docker.internal:11434"
```

---

# 3️⃣ Kubernetes Deployment

## Start Cluster

```bash
kind create cluster --name rag-cluster
```

---

## Build Docker Images

### API Gateway

```bash
docker build -t api-gateway:latest ./api-gateway

kind load docker-image api-gateway:latest --name rag-cluster
```

### AI Worker

```bash
docker build -t ai-worker:latest ./ai-worker

kind load docker-image ai-worker:latest --name rag-cluster
```

---

## Apply Kubernetes Manifests

```bash
kubectl apply -f k8s/
```

---

# 4️⃣ Database Setup (Prisma)

After PostgreSQL pod is running:

### Verify Connection

```bash
kubectl exec -it postgres-0 -- psql -U postgres -d rag_db -c 'SELECT 1;'
```

### Run Prisma Migrations

Ensure migrations are executed inside:

- Gateway container
**OR**
- Kubernetes Job

---

# 5️⃣ Local AI Setup (Ollama)

To enable **privacy-first local inference**, run Ollama on your host machine.

## Windows PowerShell

### Terminal 1

```powershell
$env:OLLAMA_HOST="0.0.0.0"

ollama serve
```

### Terminal 2

```powershell
ollama run gemma4:e2b
```

---

# 🌐 Accessing the Application

## API Gateway

Run port forwarding:

```bash
kubectl port-forward deployment/api-gateway 3000:3000
```

Keep this terminal running.

---

## Frontend

Open a new terminal:

```bash
cd frontend

npm install

npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

---

# 🛠️ Troubleshooting

## ❌ UI Shows Offline / Locked

The React frontend continuously polls:

```text
localhost:3000
```

If the UI flashes red or locks inputs:

### Fix
Restart:

```bash
kubectl port-forward deployment/api-gateway 3000:3000
```

---

## ❌ Kubernetes Pods in Error State

Usually caused by:

**Cold-start race condition**

(API Gateway starts before PostgreSQL)

### Fix

Restart deployment:

```bash
kubectl rollout restart deployment api-gateway
```

---

## ❌ WSL2 Disk Space Full (`SIGBUS Error`)

Failed Docker builds may bloat the WSL virtual disk.

### Cleanup

```bash
docker system prune -a -f --volumes

docker builder prune -a -f
```

Then shrink disk using:

```powershell
diskpart
```

---

## ❌ Ollama Connection Timeout

Ensure Ollama is started with:

```powershell
$env:OLLAMA_HOST="0.0.0.0"
```

Also allow firewall access for:

```text
Port 11434
```

---

# 📌 Future Improvements

- Multi-model support
- Better tenant isolation
- Redis caching
- GPU acceleration
- Kubernetes autoscaling
- Advanced analytics dashboard

---

# 👨‍💻 Author

Developed by **Veins19**

GitHub Repo:

https://github.com/Veins19/ContainersProject

---

> Architected as a secure, scalable Neural Engine for modern knowledge retrieval and enterprise-grade Retrieval-Augmented Generation (RAG).
