# test_mongodb.py (FINAL KORRIGIERTE VERSION)

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from urllib.parse import quote_plus 
from pymongo.errors import ConnectionFailure, OperationFailure

print("--- Skript gestartet ---")

load_dotenv() 

# 1. VARIABLEN ZUWEISEN (MUSS ZUERST PASSIEREN)
MONGO_USER = os.getenv("MONGO_USER") 
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER_URL = os.getenv("MONGO_CLUSTER_URL") 
# Ende der Zuweisungen

# 2. LOGIK UND URI-ERSTELLUNG (CODE NICHT IN EINER FUNKTION!)
if MONGO_CLUSTER_URL and MONGO_USER and MONGO_PASSWORD: 
    
    # Codieren Sie Benutzer und Passwort
    encoded_user = quote_plus(MONGO_USER)
    encoded_pass = quote_plus(MONGO_PASSWORD)

    # Erstellen Sie den finalen URI mit den codierten Werten:
    MONGO_ATLAS_URI = (MONGO_CLUSTER_URL)
else:
    raise ValueError("❌ FEHLER: MONGO_USER, MONGO_PASSWORD oder MONGO_CLUSTER_URL fehlt in der .env-Datei!")


def test_mongodb_connection():
    client = None
    # Verwenden Sie hier die globale Variable MONGO_ATLAS_URI
    try:
        print("Versuche Verbindung zu MongoDB Atlas...")
        client = MongoClient(MONGO_ATLAS_URI) 
        client.admin.command('ping') 
        
        print("✅ Verbindung zur MongoDB Atlas erfolgreich!")

    except ConnectionFailure as e:
        print(f"❌ Fehler bei der Verbindung (Netzwerk/Firewall): {e}")
    except OperationFailure as e:
        print(f"❌ Fehler bei der Authentifizierung: {e}")
    except Exception as e:
        print(f"❌ Ein unerwarteter Fehler ist aufgetreten: {e}")

if __name__ == "__main__":
    test_mongodb_connection() # KORREKTER AUFRUF