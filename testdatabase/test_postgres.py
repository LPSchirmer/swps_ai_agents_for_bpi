import psycopg
import os
from dotenv import load_dotenv # Die notwendige Importanweisung

# 1. Variablen aus der .env-Datei laden
# Dadurch werden die Schlüssel-Wert-Paare in die Umgebungsvariablen geladen
load_dotenv() 

# 2. Variablen über os.environ oder os.getenv() lesen
# Wenn Sie load_dotenv() verwenden, sind die Variablen jetzt verfügbar.
DB_HOST = os.getenv("POSTGRES_HOST") 
DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")

def test_connection():
    """Versucht, eine Verbindung zur PostgreSQL-Datenbank herzustellen."""
    conn = None
    try:
        print(f"Versuche Verbindung zu {DB_NAME} auf {DB_HOST}...")
        
        # Die Variablen werden direkt aus dem OS-Modul gelesen
        conn = psycopg.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        print("✅ Verbindung zur PostgreSQL-Datenbank erfolgreich!")

    except Exception as error:
        print(f"❌ Fehler bei der Verbindung oder Abfrage: {error}")
        
    finally:
        if conn is not None:
            conn.close()

if __name__ == "__main__":
    test_connection()