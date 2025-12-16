import pandas as pd
from sqlalchemy import create_engine
from urllib.parse import quote_plus
import psycopg
from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv("POSTGRES_HOST", "localhost") 
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "bpi_db")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")
TRANSFORMED_DB_PASSWORD = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""

def load_chat_data_to_database(dir_path: str) -> None:
    files = [file for file in os.listdir(dir_path)]

    conn = psycopg.connect(f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST}")
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO "Chat" (documents) VALUES (%s)',
        (files,)
    )

    conn.commit()

    cur.close()
    conn.close()

# Hier muss noch der Chat ID als Spalte hinzugefügt werden
def load_event_log_to_database(file_path: str, df: pd.DataFrame) -> None:
    engine = create_engine(f"postgresql+psycopg://{DB_USER}:{TRANSFORMED_DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    table = os.path.splitext(os.path.basename(file_path))[0]
    df.to_sql(table, engine, if_exists="replace", index=False)

def load_textual_process_data_to_database(text: str) -> None:
    conn = psycopg.connect(f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST}")
    cur = conn.cursor()

    cur.execute('SELECT "chatID" FROM "Chat" ORDER BY "establishTime" DESC LIMIT 1')
    result = cur.fetchone()
    if result is None:
        raise ValueError("Es existiert kein Chat, in den die Nachricht eingefügt werden kann.")
    chatID = result[0]

    cur.execute(
    'INSERT INTO "Message" ("chatID", sender, content) VALUES (%s, %s, %s)',
    (chatID, "user", text)
    )

    conn.commit()

    cur.close()
    conn.close()