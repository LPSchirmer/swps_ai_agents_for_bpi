"""
Test Script für KI-Analyse
Testet die Integration mit echten Upload-Daten
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from ai_analysis import run_ai_analysis

# Test mit uploads Verzeichnis
upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')

print("🧪 Starte KI-Analyse Test...")
print(f"📁 Upload-Verzeichnis: {upload_dir}")
print("\n" + "="*80)

result = run_ai_analysis(upload_dir)

print("\n" + "="*80)
print("📊 TEST-ERGEBNIS:")
print("="*80)

if result.get('success'):
    print("✅ KI-Analyse erfolgreich!")
    print(f"\n📝 Analyse-Ergebnis (erste 500 Zeichen):")
    print("-"*80)
    analysis_text = result.get('analysis_result', '')
    print(analysis_text[:500] + "..." if len(analysis_text) > 500 else analysis_text)
    print("-"*80)
    
    print(f"\n📊 Daten-Zusammenfassung:")
    summary = result.get('data_summary', {})
    print(f"   - Textuelle Daten: {'✅' if summary.get('has_textual_data') else '❌'}")
    print(f"   - Event Log: {'✅' if summary.get('has_event_log') else '❌'}")
    
    if summary.get('kpis_calculated'):
        kpis = summary['kpis_calculated']
        print(f"   - KPIs berechnet:")
        print(f"      • Basic: {'✅' if kpis.get('basic') else '❌'}")
        print(f"      • Performance: {'✅' if kpis.get('performance') else '❌'}")
        print(f"      • Finance: {'✅' if kpis.get('finance') else '❌'}")
        print(f"      • Compliance: {'✅' if kpis.get('compliance') else '❌'}")
else:
    print("❌ KI-Analyse fehlgeschlagen!")
    print(f"\n🔴 Fehler: {result.get('error', 'Unbekannter Fehler')}")
    print(f"🔴 Stage: {result.get('stage', 'Unbekannt')}")

print("\n" + "="*80)
