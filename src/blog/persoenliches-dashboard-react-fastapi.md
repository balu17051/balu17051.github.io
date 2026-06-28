---
title: "Persönliches Dashboard mit React, FastAPI und Docker"
date: "2026-06-28"
description: "Wetter, Kalender, Aufgaben und GitHub-Statistiken auf einem Dashboard vereinen — Schritt für Schritt mit React, FastAPI und Docker-Compose."
tags: ["React", "FastAPI", "Docker", "Dashboard", "Webentwicklung"]
slug: "persoenliches-dashboard-react-fastapi"
emoji: "📊"
---

## Warum ein eigenes Dashboard?

Startseiten wie iGoogle gibt es nicht mehr. Netvibes ist tot. Und die meisten Dashboard-Lösungen sind entweder überladen oder lassen sich nicht anpassen. Also bauen wir unser eigenes — mit modernem Stack, Docker-Deployment und genau den Widgets, die wir brauchen.

## Tech-Stack

| Komponente | Technologie |
|-----------|-------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI + Uvicorn |
| Wetter | OpenWeatherMap API (kostenlos) |
| Kalender | iCal-Parser |
| GitHub | GitHub REST API |
| Deployment | Docker + Docker-Compose |

## Projektstruktur

```
dashboard/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── routes/
│       │   ├── weather.py
│       │   ├── calendar.py
│       │   ├── todos.py
│       │   └── github.py
│       └── models.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── WeatherWidget.jsx
        │   ├── CalendarWidget.jsx
        │   ├── TodoWidget.jsx
        │   └── GithubWidget.jsx
        └── api.js
```

## Backend: FastAPI

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import weather, calendar, todos, github

app = FastAPI(title="Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(todos.router, prefix="/api/todos", tags=["todos"])
app.include_router(github.router, prefix="/api/github", tags=["github"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

### Wettern-API (weather.py)

```python
from fastapi import APIRouter, HTTPException
import httpx
import os

router = APIRouter()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
CITY = os.getenv("CITY", "Berlin")
UNITS = os.getenv("WEATHER_UNITS", "metric")  # metric = Celsius

@router.get("/")
async def get_weather():
    if not OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENWEATHER_API_KEY nicht gesetzt")
    
    async with httpx.AsyncClient() as client:
        # Aktuelles Wetter
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": CITY,
            "appid": OPENWEATHER_API_KEY,
            "units": UNITS,
            "lang": "de"
        }
        resp = await client.get(url, params=params)
        
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Wetter-API Fehler")
        
        data = resp.json()
        
        # 5-Tage-Vorhersage
        forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
        forecast_resp = await client.get(forecast_url, params=params)
        forecast = forecast_resp.json() if forecast_resp.status_code == 200 else {}
    
    return {
        "city": data["name"],
        "temp": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"],
        "wind_speed": data["wind"]["speed"],
        "forecast": [
            {
                "dt": item["dt"],
                "temp": item["main"]["temp"],
                "description": item["weather"][0]["description"],
                "icon": item["weather"][0]["icon"],
            }
            for item in forecast.get("list", [])[:8]  # Nächste 24h
        ]
    }
```

### Kalender-Widget (calendar.py)

```python
from fastapi import APIRouter
import httpx
from datetime import datetime, timedelta
from icalendar import Calendar
import os

router = APIRouter()

ICAL_URL = os.getenv("ICAL_URL", "")

@router.get("/")
async def get_calendar():
    if not ICAL_URL:
        return {"events": []}
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(ICAL_URL)
    
    cal = Calendar.from_ical(resp.text)
    now = datetime.now()
    week_ahead = now + timedelta(days=7)
    
    events = []
    for component in cal.walk():
        if component.name == "VEVENT":
            dtstart = component.get("dtstart").dt
            if hasattr(dtstart, "strftime"):
                if now <= dtstart <= week_ahead:
                    events.append({
                        "title": str(component.get("summary", "")),
                        "start": dtstart.isoformat(),
                        "end": component.get("dtend").dt.isoformat() if component.get("dtend") else None,
                        "location": str(component.get("location", "")),
                    })
    
    events.sort(key=lambda e: e["start"])
    return {"events": events[:10]}
```

### Aufgaben-Widget (todos.py)

```python
from fastapi import APIRouter
from pydantic import BaseModel
import json
import os

router = APIRouter()

TODO_FILE = os.getenv("TODO_FILE", "/data/todos.json")

class TodoItem(BaseModel):
    id: int | None = None
    text: str
    done: bool = False

def load_todos():
    if os.path.exists(TODO_FILE):
        with open(TODO_FILE, "r") as f:
            return json.load(f)
    return []

def save_todos(todos):
    os.makedirs(os.path.dirname(TODO_FILE), exist_ok=True)
    with open(TODO_FILE, "w") as f:
        json.dump(todos, f, ensure_ascii=False, indent=2)

@router.get("/")
async def list_todos():
    return {"todos": load_todos()}

@router.post("/")
async def add_todo(item: TodoItem):
    todos = load_todos()
    item.id = max([t["id"] for t in todos], default=0) + 1
    todos.append(item.model_dump())
    save_todos(todos)
    return {"todo": item.model_dump()}

@router.put("/{todo_id}")
async def update_todo(todo_id: int, item: TodoItem):
    todos = load_todos()
    for t in todos:
        if t["id"] == todo_id:
            t["text"] = item.text
            t["done"] = item.done
            break
    save_todos(todos)
    return {"status": "ok"}

@router.delete("/{todo_id}")
async def delete_todo(todo_id: int):
    todos = [t for t in load_todos() if t["id"] != todo_id]
    save_todos(todos)
    return {"status": "ok"}
```

### GitHub-Statistiken (github.py)

```python
from fastapi import APIRouter, HTTPException
import httpx
import os

router = APIRouter()

GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

@router.get("/")
async def get_github_stats():
    if not GITHUB_USERNAME:
        return {"error": "GITHUB_USERNAME nicht gesetzt"}
    
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    
    async with httpx.AsyncClient() as client:
        # User-Info
        user_resp = await client.get(
            f"https://api.github.com/users/{GITHUB_USERNAME}",
            headers=headers
        )
        user = user_resp.json()
        
        # Repositories
        repos_resp = await client.get(
            f"https://api.github.com/users/{GITHUB_USERNAME}/repos?per_page=100&sort=updated",
            headers=headers
        )
        repos = repos_resp.json()
        
        # Beitrags-Graph via Events
        events_resp = await client.get(
            f"https://api.github.com/users/{GITHUB_USERNAME}/events?per_page=30",
            headers=headers
        )
        events = events_resp.json()
    
    top_repos = sorted(repos, key=lambda r: r.get("stargazers_count", 0), reverse=True)[:5]
    
    return {
        "username": user.get("login"),
        "avatar_url": user.get("avatar_url"),
        "public_repos": user.get("public_repos", 0),
        "followers": user.get("followers", 0),
        "following": user.get("following", 0),
        "top_repos": [
            {
                "name": r["name"],
                "stars": r.get("stargazers_count", 0),
                "language": r.get("language"),
                "description": r.get("description", ""),
                "url": r["html_url"],
            }
            for r in top_repos
        ],
        "recent_events": len(events),
    }
```

### requirements.txt

```
fastapi==0.115.0
uvicorn==0.30.0
httpx==0.27.0
icalendar==5.0.0
pydantic==2.9.0
```

## Frontend: React

### App.jsx

```jsx
import { useState, useEffect } from 'react';
import WeatherWidget from './components/WeatherWidget';
import CalendarWidget from './components/CalendarWidget';
import TodoWidget from './components/TodoWidget';
import GithubWidget from './components/GithubWidget';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Mein Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WeatherWidget apiBase={API_BASE} />
        <CalendarWidget apiBase={API_BASE} />
        <TodoWidget apiBase={API_BASE} />
        <GithubWidget apiBase={API_BASE} />
      </div>
    </div>
  );
}
```

### Wetter-Widget (WeatherWidget.jsx)

```jsx
import { useState, useEffect } from 'react';

export default function WeatherWidget({ apiBase }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/weather`)
      .then(res => res.json())
      .then(data => { setWeather(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card animate-pulse h-48" />;
  if (!weather) return <div className="card">Wetter nicht verfügbar</div>;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3">🌤️ Wetter in {weather.city}</h2>
      <div className="flex items-center gap-4 mb-4">
        <img 
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
          alt={weather.description}
          className="w-16 h-16"
        />
        <div>
          <div className="text-4xl font-bold">{Math.round(weather.temp)}°C</div>
          <div className="text-gray-400 capitalize">{weather.description}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
        <div>Gefühlt: {Math.round(weather.feels_like)}°C</div>
        <div>Wind: {weather.wind_speed} km/h</div>
        <div>Feuchtigkeit: {weather.humidity}%</div>
      </div>
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="mt-4 border-t border-gray-800 pt-3">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Vorhersage</h3>
          <div className="flex gap-3 overflow-x-auto">
            {weather.forecast.map((f, i) => (
              <div key={i} className="text-center min-w-[60px]">
                <div className="text-xs text-gray-500">
                  {new Date(f.dt * 1000).getHours()}:00
                </div>
                <img 
                  src={`https://openweathermap.org/img/wn/${f.icon}.png`} 
                  alt="" className="w-8 h-8 mx-auto"
                />
                <div className="text-sm">{Math.round(f.temp)}°</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Aufgaben-Widget (TodoWidget.jsx)

```jsx
import { useState, useEffect } from 'react';

export default function TodoWidget({ apiBase }) {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const loadTodos = () => {
    fetch(`${apiBase}/api/todos`)
      .then(res => res.json())
      .then(data => setTodos(data.todos || []));
  };

  useEffect(loadTodos, []);

  const addTodo = async () => {
    if (!input.trim()) return;
    await fetch(`${apiBase}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, done: false })
    });
    setInput('');
    loadTodos();
  };

  const toggleTodo = async (todo) => {
    await fetch(`${apiBase}/api/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: todo.text, done: !todo.done })
    });
    loadTodos();
  };

  const deleteTodo = async (id) => {
    await fetch(`${apiBase}/api/todos/${id}`, { method: 'DELETE' });
    loadTodos();
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3">✅ Aufgaben</h2>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Neue Aufgabe..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <button onClick={addTodo} className="px-3 py-1.5 bg-blue-600 rounded text-sm hover:bg-blue-700">
          +
        </button>
      </div>
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo)}
              className="rounded"
            />
            <span className={todo.done ? 'line-through text-gray-500' : ''}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="ml-auto text-gray-600 hover:text-red-500">
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Docker-Compose

### docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
      - ICAL_URL=${ICAL_URL}
      - CITY=${CITY:-Berlin}
      - GITHUB_USERNAME=${GITHUB_USERNAME}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - TODO_FILE=/data/todos.json
    volumes:
      - todo-data:/data
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://backend:8000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  todo-data:
```

### Backend Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf (für Frontend)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## .env-Datei

```env
OPENWEATHER_API_KEY=dein_api_key_hier
CITY=Berlin
ICAL_URL=https://calendar.google.com/calendar/ical/.../basic.ics
GITHUB_USERNAME=dein_username
GITHUB_TOKEN=ghp_...  # Optional, für höhere Rate-Limits
```

## Starten

```bash
# Umgebungsvariablen setzen
cp .env.example .env
# .env bearbeiten...

# Starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f
```

Dashboard erreichbar unter **http://localhost:3000**

## Fazit

Mit React, FastAPI und Docker hat man in wenigen Stunden ein voll funktionsfähiges persönliches Dashboard. Der Stack ist erweiterbar — weitere Widgets (RSS-Feeds, Crypto-Kurse, Spotify-Now-Playing) lassen sich einfach als neue Routen und Komponenten hinzufügen. Durch Docker ist das Deployment auf jedem Server reproduzierbar.
