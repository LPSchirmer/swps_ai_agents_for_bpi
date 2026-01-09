#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ SYSTEM READY - Kompletter Funktionstest                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Status
echo "📊 Server Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_PID=$(ps aux | grep "57092" | grep -v grep | awk '{print $2}' | head -1)
FRONTEND_PID=$(ps aux | grep "57751" | grep -v grep | awk '{print $2}' | head -1)

if [ ! -z "$BACKEND_PID" ]; then
    echo "✅ Backend läuft (PID: $BACKEND_PID)"
    echo "   → http://localhost:5001"
else
    echo "❌ Backend läuft NICHT!"
fi

if [ ! -z "$FRONTEND_PID" ]; then
    echo "✅ Frontend läuft (PID: $FRONTEND_PID)"
    echo "   → http://localhost:3000"
else
    echo "❌ Frontend läuft NICHT!"
fi

echo ""
echo "🧪 API Health Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH=$(curl -s http://localhost:5001/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Backend API: OK"
else
    echo "❌ Backend API: FEHLER"
fi

FRONTEND_CHECK=$(curl -s http://localhost:3000 2>/dev/null | head -1)
if echo "$FRONTEND_CHECK" | grep -q "<!doctype html"; then
    echo "✅ Frontend: OK"
else
    echo "⏳ Frontend: Lädt noch..."
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🎯 SO TESTEST DU JETZT DIE KI-AGENTEN:                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Öffne Browser:"
echo "    👉 http://localhost:3000"
echo ""
echo "2️⃣  Öffne Browser DevTools (F12):"
echo "    • Gehe zum 'Network' Tab"
echo "    • Klicke 'Clear' (🗑️)"
echo ""
echo "3️⃣  Mache Upload:"
echo "    • Text: 'Test für KI-Agenten-Analyse'"
echo "    • Klicke 'Analyze'"
echo ""
echo "4️⃣  Warte 30-60 Sekunden:"
echo "    • Processing-Animation läuft"
echo "    • KI-Agenten arbeiten mit OpenAI"
echo ""
echo "5️⃣  Im Dashboard:"
echo "    • Scrolle GANZ NACH UNTEN 👇"
echo "    • Suche: '🌟 Detaillierte KI-Agenten-Analyse'"
echo "    • 5 Agenten-Karten:"
echo "       📋 Requirements Agent"
echo "       📊 Economic Context Agent"
echo "       ⚡ Performance Agent"
echo "       💰 Finance Agent"
echo "       ✓ Compliance Agent"
echo ""
echo "6️⃣  Klicke auf eine Karte:"
echo "    • Detaillierte Antwort öffnet sich"
echo "    • Scrollbar zum Lesen"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 DEBUGGING - Falls etwas nicht funktioniert:"
echo ""
echo "Schau ins Backend-Log:"
echo "  tail -f /tmp/backend_*.log"
echo ""
echo "Schau in Browser DevTools:"
echo "  • Network Tab → 'combined-upload' → Response"
echo "  • Suche nach: \"ai_analysis\":{\"success\":true"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 WICHTIG:"
echo "   Der Agenten-Bereich erscheint NUR bei NEUEN Uploads!"
echo "   Alte Dateien haben keine KI-Analyse gespeichert."
echo ""
echo "🚀 Viel Erfolg!"
echo ""
