# Setup Guide - Frontend & Backend Installation und Ausführung

Dieses Dokument beschreibt alle notwendigen Schritte, um das Frontend und Backend der Anwendung lokal zu installieren und auszuführen.

## 📋 Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Projekt-Struktur](#projekt-struktur)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Datenbank Setup](#datenbank-setup)
- [Anwendung starten](#anwendung-starten)
- [Troubleshooting](#troubleshooting)
- [API Endpunkte](#api-endpunkte)

---

## 🛠 Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass folgende Software auf Ihrem System installiert ist:

### Erforderliche Software:

1. **Python 3.10+** (idealerweise Python 3.13)
   ```bash
   python3 --version
   ```

2. **Node.js (v18+)** und **npm**
   ```bash
   node --version
   npm --version
   ```

3. **Docker** und **Docker Compose** (für die Datenbank)
   ```bash
   docker --version
   docker-compose --version
   ```

4. **Git** (zum Klonen des Repositories)
   ```bash
   git --version
   ```

---

## 📁 Projekt-Struktur

```
sws-kopie-main/
├── backend/              # Flask Backend
│   ├── app.py           # Hauptanwendung
│   ├── requirements.txt # Python Dependencies
│   ├── uploads/         # Upload-Verzeichnis
│   └── venv/           # Virtuelles Environment (wird erstellt)
├── frontend/            # React Frontend
│   ├── src/
│   ├── package.json    # Node.js Dependencies
│   └── node_modules/   # Node Dependencies (wird erstellt)
├── etl/                # ETL Pipeline
├── init/               # Datenbank Initialisierung
│   └── init.sql
├── docker-compose.yml  # Docker-Konfiguration
├── start-backend.sh    # Backend-Startskript
└── start-frontend.sh   # Frontend-Startskript
```

---

## 🔧 Backend Setup

### 1. Navigieren Sie zum Backend-Verzeichnis

```bash
cd backend
```

### 2. Erstellen Sie ein virtuelles Python-Environment

```bash
python3 -m venv venv
```

### 3. Aktivieren Sie das virtuelle Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```cmd
venv\Scripts\activate
```

### 4. Installieren Sie die Python-Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Installieren Sie zusätzliche benötigte Pakete

```bash
pip install pandas pm4py lxml pypdf psycopg2-binary pymongo sqlalchemy psycopg "psycopg[binary]" python-dotenv
```

### 6. Erstellen Sie eine .env-Datei (optional)

Falls Sie Umgebungsvariablen benötigen:

```bash
# Im Hauptverzeichnis (sws-kopie-main/)
touch .env
```

Beispielinhalt für `.env`:
```env
# PostgreSQL Konfiguration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=bpi_database

# MongoDB Konfiguration (falls verwendet)
MONGODB_URI=mongodb://localhost:27017/
```

### Backend Dependencies (vollständige Liste):

Die `requirements.txt` sollte mindestens enthalten:
- Flask==3.0.0
- Flask-CORS==4.0.0
- Werkzeug==3.0.1
- pandas
- pm4py
- lxml
- pypdf
- psycopg2-binary
- pymongo
- sqlalchemy
- psycopg[binary]
- python-dotenv

---

## 🎨 Frontend Setup

### 1. Navigieren Sie zum Frontend-Verzeichnis

```bash
cd frontend
```

### 2. Installieren Sie die Node.js-Dependencies

```bash
npm install
```

Dies installiert alle in `package.json` definierten Abhängigkeiten:

**Haupt-Dependencies:**
- react (^18.3.1)
- react-dom (^18.3.1)
- lucide-react (^0.344.0)
- axios (^1.6.7)

**Dev-Dependencies:**
- @vitejs/plugin-react (^4.2.1)
- vite (^7.1.7)
- typescript (^5.9.3)
- tailwindcss (^3.4.17)
- postcss (^8.4.35)
- autoprefixer (^10.4.17)
- eslint und Plugins

---

## 🗄 Datenbank Setup

### 1. Docker Compose starten

Im Hauptverzeichnis (`sws-kopie-main/`):

```bash
docker-compose up -d
```

Dies startet:
- **PostgreSQL Datenbank** auf Port `5432`

### 2. Überprüfen Sie, ob die Datenbank läuft

```bash
docker ps
```

Sie sollten einen Container namens `postgres_db` sehen.

### 3. Datenbank-Initialisierung

Die `init.sql` wird automatisch beim ersten Start ausgeführt. Falls Sie die Datenbank neu initialisieren möchten:

```bash
docker-compose down -v
docker-compose up -d
```

**Wichtig:** Das Flag `-v` löscht die Volumes und damit alle Daten!

---

## 🚀 Anwendung starten

### Option 1: Mit den bereitgestellten Skripten (empfohlen)

#### Terminal 1 - Backend starten:

```bash
chmod +x start-backend.sh  # Nur beim ersten Mal nötig
./start-backend.sh
```

Das Backend läuft dann auf: **http://localhost:5001**

#### Terminal 2 - Frontend starten:

```bash
chmod +x start-frontend.sh  # Nur beim ersten Mal nötig
./start-frontend.sh
```

Das Frontend läuft dann auf: **http://localhost:5173** (Vite Dev Server)

---

### Option 2: Manuell starten

#### Backend manuell starten:

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

oder direkter Pfad:

```bash
cd backend
./venv/bin/python app.py
```

#### Frontend manuell starten:

```bash
cd frontend
npm run dev
```

---

## 🌐 Zugriff auf die Anwendung

Nach erfolgreichem Start:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001
- **Backend Health Check:** http://localhost:5001/api/health

---

## 🐛 Troubleshooting

### Problem: "Port already in use"

**Backend (Port 5001):**
```bash
# Prozess finden
lsof -i :5001
# Prozess beenden
kill -9 <PID>
```

**Frontend (Port 5173):**
```bash
# Prozess finden
lsof -i :5173
# Prozess beenden
kill -9 <PID>
```

### Problem: "Module not found" im Backend

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
# Zusätzliche Pakete installieren
pip install pandas pm4py lxml pypdf psycopg2-binary pymongo sqlalchemy psycopg python-dotenv
```

### Problem: "Cannot find module" im Frontend

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Problem: Datenbank-Verbindungsfehler

1. Überprüfen Sie, ob Docker läuft:
   ```bash
   docker ps
   ```

2. Überprüfen Sie die PostgreSQL-Logs:
   ```bash
   docker logs postgres_db
   ```

3. Starten Sie die Datenbank neu:
   ```bash
   docker-compose restart postgres_db
   ```

### Problem: CORS-Fehler

Stellen Sie sicher, dass:
- Das Backend läuft (`flask_cors` installiert ist)
- Die Frontend-Anfragen an `http://localhost:5001` gehen
- Im Backend `CORS(app)` aktiviert ist

### Problem: Python-Version

Stellen Sie sicher, dass Sie Python 3.10+ verwenden:
```bash
python3 --version
```

Falls eine ältere Version installiert ist, aktualisieren Sie Python oder verwenden Sie `pyenv`:
```bash
# Mit Homebrew (macOS)
brew install python@3.13
```

---

## 📡 API Endpunkte

### Gesundheitscheck
```
GET /api/health
```

### Datei-Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: file (bpmn, xes, xml, csv, txt)
```

### Text-Eingabe
```
POST /api/text-input
Content-Type: application/json
Body: { "text": "..." }
```

### ETL-bereite Uploads auflisten
```
GET /api/etl-ready-uploads
```

### Weitere Endpunkte

Siehe `backend/app.py` für alle verfügbaren Routen.

---

## 📝 Entwicklungsworkflow

### Beide Dienste gleichzeitig starten (empfohlen)

1. **Terminal 1:** Docker-Datenbank starten
   ```bash
   docker-compose up -d
   ```

2. **Terminal 2:** Backend starten
   ```bash
   ./start-backend.sh
   ```

3. **Terminal 3:** Frontend starten
   ```bash
   ./start-frontend.sh
   ```

### Nach Änderungen

**Backend:**
- Beenden Sie den Server (Ctrl+C)
- Starten Sie neu mit `./start-backend.sh`

**Frontend:**
- Vite erkennt Änderungen automatisch (Hot Module Replacement)
- Bei größeren Problemen: Ctrl+C und neu starten

---

## 🔐 Sicherheitshinweise

- **Niemals** `.env`-Dateien mit sensiblen Daten ins Repository committen
- Verwenden Sie `.gitignore` für `venv/`, `node_modules/`, `.env`, etc.
- Ändern Sie Standard-Passwörter für Produktionsumgebungen

---

## 📦 Requirements Zusammenfassung

### Backend (`backend/requirements.txt`):
```
Flask==3.0.0
Flask-CORS==4.0.0
Werkzeug==3.0.1
pandas
pm4py
lxml
pypdf
psycopg2-binary
pymongo
sqlalchemy
psycopg[binary]
python-dotenv
```

### Frontend (`frontend/package.json`):
Siehe `package.json` für die vollständige Liste. Hauptabhängigkeiten:
- React 18.3.1
- Vite 7.1.7
- TypeScript 5.9.3
- Tailwind CSS 3.4.17
- Axios 1.6.7

---

## ✅ Checkliste für Erstinstallation

- [ ] Python 3.10+ installiert
- [ ] Node.js 18+ und npm installiert
- [ ] Docker und Docker Compose installiert
- [ ] Repository geklont
- [ ] Backend venv erstellt und aktiviert
- [ ] Backend-Dependencies installiert
- [ ] Frontend-Dependencies installiert (`npm install`)
- [ ] Docker-Container gestartet (`docker-compose up -d`)
- [ ] Backend läuft auf Port 5001
- [ ] Frontend läuft auf Port 5173
- [ ] Health-Check erfolgreich: http://localhost:5001/api/health

---

## 🆘 Support

Bei Problemen:
1. Überprüfen Sie die Logs in den Terminals
2. Stellen Sie sicher, dass alle Voraussetzungen erfüllt sind
3. Konsultieren Sie die Troubleshooting-Sektion
4. Kontaktieren Sie das Entwicklungsteam

---

**Viel Erfolg! 🚀**
