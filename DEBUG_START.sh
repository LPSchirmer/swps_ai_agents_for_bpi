#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🔍 DEBUGGING: Warum funktioniert die KI-Analyse nicht?      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# 1. Backend neu starten mit vollem Logging
echo "1️⃣  Stoppe altes Backend..."
pkill -f "python.*app.py"
sleep 2

echo "2️⃣  Starte Backend NEU (mit Logging)..."
cd /Users/evgenijkrat/swps_ai_agents_for_bpi/backend

# Starte Backend und leite Output in Datei um
nohup ./venv/bin/python app.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "   ✅ Backend PID: $BACKEND_PID"
echo "   📝 Log-Datei: /tmp/backend.log"

sleep 3

# 2. Prüfe ob Backend läuft
echo ""
echo "3️⃣  Prüfe Backend Status..."
curl -s http://localhost:5001/api/health 2>&1 | grep -q "healthy"
if [ $? -eq 0 ]; then
    echo "   ✅ Backend läuft und antwortet"
else
    echo "   ❌ Backend antwortet nicht!"
    echo "   Prüfe Log:"
    tail -20 /tmp/backend.log
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  📋 JETZT MACH BITTE FOLGENDES:                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Öffne im Browser: http://localhost:3000"
echo ""
echo "2. Öffne die Browser DevTools:"
echo "   • Drücke F12 (oder Rechtsklick → Inspect)"
echo "   • Gehe zum 'Network' Tab"
echo "   • Klicke 'Clear' um alles zu löschen"
echo ""
echo "3. Mache einen Upload:"
echo "   • Gib Text ein: 'DEBUG TEST'"
echo "   • Klicke 'Analyze'"
echo ""
echo "4. Warte und beobachte im Network Tab:"
echo "   • Suche nach 'combined-upload' Request"
echo "   • Klicke drauf"
echo "   • Gehe zum 'Response' Tab"
echo "   • Kopiere die komplette Response"
echo ""
echo "5. Während der Upload läuft, öffne ein Terminal und führe aus:"
echo ""
echo "   tail -f /tmp/backend.log"
echo ""
echo "   Damit siehst du LIVE was das Backend macht!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 WICHTIG - Schau nach diesen Zeilen im Log:"
echo ""
echo "   ✅ '🤖 Starte KI-Analyse mit CrewAI...' = KI startet"
echo "   ✅ '✅ KI-Analyse abgeschlossen' = KI fertig"
echo "   ❌ 'KI-Analyse Fehler' = Fehler aufgetreten"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend läuft jetzt im Hintergrund."
echo "Log-Datei: /tmp/backend.log"
echo ""
echo "Zum Live-Monitoring:"
echo "  tail -f /tmp/backend.log"
echo ""
