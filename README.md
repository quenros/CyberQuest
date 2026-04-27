# CyberQuest

Interactive cybersecurity education platform for students aged 12-18.

## Stack

| Layer      | Tech                                    |
| ---------- | --------------------------------------- |
| Frontend   | React 18 + Tailwind CSS + Framer Motion |
| Editor     | Monaco Editor                           |
| Backend    | Flask (Python)                          |
| Database   | MongoDB                                 |
| Auth       | Flask-JWT-Extended                      |
| Sandboxing | Docker (docker-py)                      |
| AI Hints   | Claude API                              |

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

**Prerequisites:** [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed and running locally (default port 27017).

```bash
cd backend
py -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env       # then edit .env with your values
py app.py
```

Create .env in the backend
**Environment variables** (`.env`):

| Variable            | Description                                                    | Example                                |
| ------------------- | -------------------------------------------------------------- | -------------------------------------- |
| `MONGO_URI`         | MongoDB connection string — **must include the database name** | `mongodb://localhost:27017/cyberquest` |
| `JWT_SECRET_KEY`    | Secret used to sign JWT tokens                                 | any random string                      |
| `SECRET_KEY`        | Flask app secret key                                           | any random string                      |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI hints                                 | `sk-ant-...`                           |

The app uses three MongoDB collections created automatically on first use:

| Collection   | Purpose                                                                     |
| ------------ | --------------------------------------------------------------------------- |
| `users`      | Registered accounts (`email`, `password_hash`, `role`, `created_at`)        |
| `challenges` | Challenge definitions (`_id`, `title`, `difficulty`, `points`, `module_id`) |
| `progress`   | Per-user challenge progress (`user_id`, ...)                                |

> **Common error:** `No default database name defined or provided` — the database name is missing from `MONGO_URI`. Make sure your URI ends with `/cyberquest` (or whatever name you choose).

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
