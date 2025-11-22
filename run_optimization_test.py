import os
import logging
from dotenv import load_dotenv
from urllib.parse import quote_plus

from langchain_community.utilities import SQLDatabase
from langchain_community.tools.sql_database.tool import QuerySQLDatabaseTool
from langchain_openai import OpenAI
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool

# Logging reduzieren
logging.basicConfig(level=logging.WARNING)
load_dotenv()

# --- 1. DB Setup ---
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_NAME = os.getenv("POSTGRES_DB")
TRANSFORMED_DB_PASSWORD = quote_plus(DB_PASSWORD)
DB_URI = f"postgresql+psycopg://{DB_USER}:{TRANSFORMED_DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

try:
    db = SQLDatabase.from_uri(DB_URI)
    lc_query_tool = QuerySQLDatabaseTool(db=db)
except Exception as e:
    print(f"❌ DB Fehler: {e}")
    exit()

# --- 2. Vorab-Datenabfrage (Python) ---
# Wir holen die Spaltennamen und eine Zeile VORHER.
# Das verhindert, dass der Agent raten muss.
def get_data_context():
    print("\n🔎 [PYTHON] Hole Daten-Kontext für den Agenten...")
    try:
        # Hole Spaltennamen
        cols = lc_query_tool.run("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'running-example';")
        # Hole eine Beispielzeile
        row = lc_query_tool.run('SELECT * FROM "running-example" LIMIT 1;')
        return f"COLUMNS: {cols}\nSAMPLE ROW: {row}"
    except Exception as e:
        return f"Error getting context: {e}"

# --- 3. Das Werkzeug ---
class SafeQueryTool(BaseTool):
    name: str = "Execute SQL"
    description: str = "Executes SQL. Input must be a valid SQL string."
    def _run(self, sql_query: str) -> str:
        clean_query = sql_query.replace("```sql", "").replace("```", "").strip()
        print(f"\n🔌 [SQL EXEC] {clean_query}")
        try:
            return f"SQL RESULT: {lc_query_tool.run(clean_query)}"
        except Exception as e:
            return f"SQL Error: {e}"

query_tool = SafeQueryTool()

# --- 4. Die Analyse ---

def run_optimization():
    # 1. Kontext holen (Sicher & Kostenlos)
    context_data = get_data_context()
    print(f"✅ Kontext geladen. Agent startet...\n")
    
    llm = OpenAI(temperature=0.3) # Leicht erhöht für bessere Text-Generierung

    # 2. Der Agent
    analyst = Agent(
        role='Business Process Consultant',
        goal='Identify cost drivers and propose textual optimization strategies.',
        backstory="""
            You are an expert consultant. 
            You analyze database data to find inefficiencies, which must based on the attribute from the table.
            Your output is NOT just numbers, but a written recommendation for the management.
        """,
        llm=llm,
        tools=[query_tool],
        verbose=True,
        allow_delegation=False,
        max_iter=2
    )

    # 3. Die Task (Hier passiert die Magie)
    optimization_task = Task(
        description=f"""
            I have prepared the database context for you:
            {context_data}
            
            YOUR MISSION:
            1. Identify the column for 'Activity Name' (likely 'concept:name') and 'Cost' (likely 'cost:amount').
            2. Use the 'Execute SQL' tool to find the TOP 3 activities with the HIGHEST TOTAL COST.
               (SQL Hint: SELECT "concept:name", SUM("cost:amount") ... GROUP BY 1 ORDER BY 2 DESC LIMIT 3)
            3. Analyze the result.
            4. Write a TEXTUAL REPORT (in German/English mix is okay, or English) containing:
               - **Problem Analysis**: Which activity is the most expensive and why?
               - **Optimization Proposal**: Propose specific measures (e.g. "Automate this step", "Reduce check frequency") to lower the costs for these top activities.
            
            Return a professional text, not just the table.
        """,
        expected_output="A textual optimization report with identified cost drivers and concrete improvement proposals.",
        agent=analyst
    )

    crew = Crew(
        agents=[analyst],
        tasks=[optimization_task],
        verbose=True
    )

    result = crew.kickoff()
    print("\n\n########################################")
    print("## PROZESS-OPTIMIERUNGS-BERICHT ##")
    print("########################################\n")
    print(result)

if __name__ == "__main__":
    run_optimization()