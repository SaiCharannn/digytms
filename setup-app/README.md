# Samcomm Setup App — React + Vite

## Setup
```bash
npm install
cp .env.example .env   # add your SETUP_TOKEN
npm run dev            # runs on http://localhost:5173
```

## Behaviour
- On first load: checks if a Super Admin exists via API
- If **no** Super Admin: shows the one-time creation form
- If **Super Admin exists**: shows a locked "Already Setup" screen
- Form validates institution ID uniqueness in real-time
- Submits to backend with X-Setup-Token header
