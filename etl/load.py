import pandas as pd
from sqlalchemy import create_engine
from urllib.parse import quote_plus
import psycopg
from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv("POSTGRES_HOST") 
DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
TRANSFORMED_DB_PASSWORD = quote_plus(DB_PASSWORD)

# Hier muss noch der Chat ID als Spalte hinzugefügt werden
def load_event_log_to_database(file_path: str, df: pd.DataFrame):
    engine = create_engine(f"postgresql+psycopg://{DB_USER}:{TRANSFORMED_DB_PASSWORD}@{DB_HOST}:host/{DB_NAME}") # host has to be changed
    table = os.path.splitext(os.path.basename(file_path))[0]
    df.to_sql(table_name=table, engine_name=engine, if_exists="replace", index=False)

# Hier muss noch Chat ID als Foreign Key hinzugefügt werden und der Fall, dass mehrere Dateien hochgeladen werden, abgedeckt werden
def load_textual_process_data_to_database(text: str):
    conn = psycopg.connect(f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST}")
    cur = conn.cursor()
    cur.execute(
    'INSERT INTO "Message" (sender, content) VALUES (%s, %s)',
    ("user", text)
    )

    conn.commit()

    cur.close()
    conn.close()