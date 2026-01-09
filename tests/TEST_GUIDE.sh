#!/bin/bash

# 🧪 Quick Test Script für KI-Agenten-Integration
# Zeigt Schritt-für-Schritt was zu tun ist

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🚀 KI-Agenten Dashboard - Test Guide                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# 1. Server-Status prüfen
echo "📊 Schritt 1: Server-Status prüfen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_PID=$(ps aux | grep "python.*app.py" | grep -v grep | awk '{print $2}')
FRONTEND_PID=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}')

if [ ! -z "$BACKEND_PID" ]; then
    echo "✅ Backend läuft (PID: $BACKEND_PID)"
    echo "   URL: http://localhost:5001"
else
    echo "❌ Backend läuft NICHT"
    echo "   Starte mit: cd backend && ./venv/bin/python app.py &"
fi

if [ ! -z "$FRONTEND_PID" ]; then
    echo "✅ Frontend läuft (PID: $FRONTEND_PID)"
    echo "   URL: http://localhost:3000"
else
    echo "❌ Frontend läuft NICHT"
    echo "   Starte mit: cd frontend && npm run dev &"
fi

echo ""

# 2. Health Check
echo "📊 Schritt 2: API Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH=$(curl -s http://localhost:5001/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Backend API antwortet"
else
    echo "❌ Backend API antwortet nicht"
fi

echo ""

# 3. Upload-Ordner prüfen
echo "📊 Schritt 3: Upload-Ordner prüfen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

UPLOAD_DIR="/Users/evgenijkrat/swps_ai_agents_for_bpi/uploads"
FILE_COUNT=$(ls -1 "$UPLOAD_DIR" 2>/dev/null | wc -l | tr -d ' ')

echo "📁 Upload-Ordner: $UPLOAD_DIR"
echo "📄 Anzahl Dateien: $FILE_COUNT"

if [ $FILE_COUNT -gt 0 ]; then
    echo ""
    echo "Letzte 5 Uploads:"
    ls -lht "$UPLOAD_DIR" | head -6 | tail -5 | awk '{print "   " $9 " (" $5 ")"}'
fi

echo ""

# 4. Browser-Test Anleitung
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🌐 BROWSER TEST - Folge diesen Schritten:                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Öffne im Browser:"
echo "    👉 http://localhost:3000"
echo ""
echo "2️⃣  Upload-Screen:"
echo "    • Gib Text ein: 'Test für KI-Agenten-Analyse'"
echo "    • ODER lade eine Datei hoch (.xes, .xml, .txt)"
echo "    • Klicke 'Analyze'"
echo ""
echo "3️⃣  Processing-Screen:"
echo "    • Warte 30-60 Sekunden"
echo "    • KI-Agenten arbeiten mit OpenAI API"
echo "    • Animation läuft"
echo ""
echo "4️⃣  Dashboard:"
echo "    • Oben: Kompakte KI-Analyse Box (lila)"
echo "    • Scrolle GANZ NACH UNTEN 👇"
echo "    • NEU: 'Detaillierte KI-Agenten-Analyse'"
echo "    • 5 Agenten-Karten:"
echo "       📋 Requirements Agent"
echo "       📊 Economic Context Agent"
echo "       ⚡ Performance Agent"
echo "       💰 Finance Agent"
echo "       ✓ Compliance Agent"
echo ""
echo "5️⃣  Agenten-Karte öffnen:"
echo "    • Klicke auf eine Karte"
echo "    • Detaillierte Antwort erscheint"
echo "    • Scrollbar zum Lesen"
echo ""
echo "6️⃣  Rohdaten:"
echo "    • Klicke auf '<> Vollständige Rohdaten'"
echo "    • Zeigt komplette KI-Antwort"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 5. Quick Test via API
echo "🧪 QUICK API TEST (optional - zum Testen ohne Browser):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Führe aus (dauert 30-60 Sekunden):"
echo ""
echo 'curl -X POST http://localhost:5001/api/combined-upload \'
echo '  -F "text=Test: Bitte analysiere." \'
echo '  -F "files=@/Users/evgenijkrat/swps_ai_agents_for_bpi/uploads/20251216_142614_tester.xml"'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 6. Troubleshooting
echo "🔧 TROUBLESHOOTING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Problem: 'Ich sehe den neuen Bereich nicht'"
echo "→ Scrolle im Dashboard GANZ nach unten"
echo "→ Der Bereich erscheint nur WENN KI-Analyse vorhanden ist"
echo "→ Mache einen neuen Upload und warte auf Analyse"
echo ""
echo "Problem: 'Upload funktioniert nicht'"
echo "→ Prüfe ob Backend läuft: curl http://localhost:5001/api/health"
echo "→ Prüfe Browser Console (F12) auf Fehler"
echo ""
echo "Problem: 'KI-Analyse dauert ewig'"
echo "→ Normal! OpenAI API braucht 30-60 Sekunden"
echo "→ 5 Agenten arbeiten nacheinander"
echo "→ Warte ab, Processing-Animation läuft"
echo ""
echo "Problem: 'Meine hochgeladene Datei ist nicht im uploads/'"
echo "→ Prüfe ob Upload erfolgreich war (200 OK)"
echo "→ Schaue nach Dateien mit aktuellem Timestamp"
echo "→ Format: 20251216_HHMMSS_filename.ext"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 TIP: Öffne die Browser DevTools (F12) → Network Tab"
echo "    um den Upload und die Response zu sehen!"
echo ""
echo "🚀 Viel Erfolg beim Testen!"
echo ""
