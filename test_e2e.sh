#!/bin/bash

# End-to-End Test für KI-Integration
# Simuliert einen Upload über die API mit anschließender KI-Analyse

echo "🧪 End-to-End Test: Upload → ETL → KI-Analyse"
echo "=============================================="
echo ""

# 1. Health Check
echo "1️⃣  Backend Health Check..."
HEALTH=$(curl -s http://localhost:5001/api/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Backend läuft"
else
    echo "❌ Backend nicht erreichbar"
    exit 1
fi
echo ""

# 2. Test-Datei vorbereiten
echo "2️⃣  Vorbereite Test-Datei..."
TEST_FILE="/Users/evgenijkrat/swps_ai_agents_for_bpi/uploads/20251216_142614_tester.xml"
TEST_TEXT="KI-Test: Bitte analysiere diesen Prozess mit allen verfügbaren Agenten."

if [ -f "$TEST_FILE" ]; then
    echo "✅ XES-Testdatei gefunden: $(basename $TEST_FILE)"
else
    echo "⚠️  XES-Datei nicht gefunden, verwende nur Text"
fi
echo ""

# 3. Combined Upload
echo "3️⃣  Sende Combined Upload (Text + Datei)..."
echo "   Achtung: Dies kann 30-60 Sekunden dauern (KI-Agenten arbeiten)..."
echo ""

if [ -f "$TEST_FILE" ]; then
    RESPONSE=$(curl -s -X POST http://localhost:5001/api/combined-upload \
      -F "text=$TEST_TEXT" \
      -F "files=@$TEST_FILE" \
      -w "\n%{http_code}")
else
    RESPONSE=$(curl -s -X POST http://localhost:5001/api/combined-upload \
      -F "text=$TEST_TEXT" \
      -w "\n%{http_code}")
fi

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "📊 HTTP Status Code: $HTTP_CODE"
echo ""

# 4. Analysiere Antwort
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Upload erfolgreich!"
    echo ""
    
    # Prüfe ob KI-Analyse vorhanden ist
    if echo "$BODY" | grep -q '"ai_analysis"'; then
        echo "🤖 KI-Analyse gefunden!"
        
        # Extrahiere Erfolg
        if echo "$BODY" | grep -q '"success":true' | head -1; then
            echo "✅ KI-Analyse erfolgreich durchgeführt"
            
            # Zeige Zusammenfassung
            echo ""
            echo "📝 Analyseergebnis (Ausschnitt):"
            echo "-----------------------------------"
            echo "$BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    ai = data.get('data', {}).get('ai_analysis', {})
    if ai.get('success'):
        result = ai.get('analysis_result', '')
        print(result[:500] + '...' if len(result) > 500 else result)
        
        summary = ai.get('data_summary', {})
        print('\n📊 Daten-Zusammenfassung:')
        print(f\"   - Textuelle Daten: {'✅' if summary.get('has_textual_data') else '❌'}\")
        print(f\"   - Event Log: {'✅' if summary.get('has_event_log') else '❌'}\")
    else:
        print('❌ Fehler:', ai.get('error', 'Unbekannt'))
except Exception as e:
    print('Fehler beim Parsen:', e)
"
        else
            echo "❌ KI-Analyse fehlgeschlagen"
            echo "$BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    ai = data.get('data', {}).get('ai_analysis', {})
    print('Fehler:', ai.get('error', 'Unbekannt'))
    print('Stage:', ai.get('stage', 'Unbekannt'))
except:
    pass
"
        fi
    else
        echo "⚠️  Keine KI-Analyse in Antwort gefunden"
    fi
else
    echo "❌ Upload fehlgeschlagen (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

echo ""
echo "=============================================="
echo "🏁 Test abgeschlossen"
