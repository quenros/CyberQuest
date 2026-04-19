# CyberQuest

Interactive cybersecurity education platform for students aged 12-18.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Tailwind CSS + Framer Motion |
| Editor | Monaco Editor |
| Backend | Flask (Python) |
| Database | MongoDB |
| Auth | Flask-JWT-Extended |
| Sandboxing | Docker (docker-py) |
| AI Hints | Claude API |

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
py -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env       # fill in your values
py run.py
```

## Project Structure

```
CyberQuest/
├── frontend/          # React app
│   └── src/
│       ├── api/       # Axios client
│       ├── pages/     # Login, Dashboard, Challenge
│       ├── components/
│       ├── hooks/
│       └── store/     # Zustand auth store
├── backend/           # Flask API
│   └── app/
│       ├── routes/    # auth, challenges, progress
│       ├── services/  # docker_service, ai_service
│       └── models/
└── challenges/        # Docker challenge definitions
    └── xss/
```
