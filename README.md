# 🤖 Multi-Agent System for automated Business Process Improvement 🤖

This repository contains a student project developed at the University of Bayreuth as part of the Software Project Seminar.

The goal of this project is to design and implement a **multi-agent system for automated business process improvement** using CrewAI. The software artifact enables users to upload **process information** (e.g. textual process descriptions, bpmn data, event logs) and **receive text-based process improvement and -redesign recommendations.**

The generated improvements focus on key process dimensions such as:

- Performance
- Finance
- Compliance

Feel free to explore the repository, experiment with the provided features, and adapt the project to your own needs. If you have any questions, suggestions, or feedback, please do not hesitate to get in touch with us 😃

---

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the System](#running-the-system)
- [System Functionality](#system-functionality)
  - Input
  - Input processing
  - [AI Agents](#ai-agents)
    - [Requirements Agent](#requirements-agent)
    - [Economic Context Agent](#economic-context-agent)
    - [Performance Agent](#performance-agent)
    - [Finance Agent](#finance-agent)
    - [Compliance Agent](#compliance-agent)
  - [System Output](#system-output)
- [References](#references)
- [Contact](#contact)

---

## Project Structure

```
swps_ai_agents_for_bpi/
├── backend/
│   ├── etl/
│   |   ├── extract.py                      # Methods for extracting structured and unstructured data
│   |   ├── load.py                         # Methods for loading structured and unstructured data into PostgreSQL
│   |   ├── pipeline.py                     # Methodes for starting the ETL-Process
│   |   └── transform.py                    # Methods for transforming strucured data into a coherent format
│   ├── process_analysis_engine/
│   |    ├── analysis_utils.py              # Methods for calculating process KPI's from event logs
│   |    ├── analysis_workflow.py           # Methods for structuring calculated process KPI's for agents
│   |    └── visual_utils.py                # Method for converting event log to BPMN
│   ├── ai_analysis.py
│   ├── app.py
│   ├── process_visualization.py            # Hauptanwendung
│   ├── requirements.txt                    # Python Dependencies
│   └── venv/                               # Virtuelles Environment (wird erstellt)
├── frontend/                               # React Frontend
│   ├── src/
│   ├── package.json                        # Node.js Dependencies
│   └── node_modules/                       # Node Dependencies (wird erstellt)
│── init/
│   └── init.sql
│── knowledge/
│    └── process_redesign_patterns.json     # 52 process redesign pattern in JSON Format as agent knowledge source
│── src/swps_ai_agents_for_bpi/
│    ├── config/
│        ├── agents.yaml                    # Agent definitions (roal, goal, backstory)
         └── tasks.yaml                     # Task definitions (description, expected output)
│     ├── crew.py                           # Crew definition (agents, tasks, tools, knowledge)
│     └── main.py                           # Running the Crew with inputs
│── tests/
│── uploads/                                # Upload Directory
├── docker-compose.yml                      # Docker database configuration
├── start-backend.sh                        # Backend-Startskript
└── start-frontend.sh                       # Frontend-Startskript
```

---

## Getting Started


---

## Running the System

---

## Troubleshooting

---

## System Workflow

### Input

The system accepts both unstructured and structured process data.

Unstructured inputs include:

- Text entered directly into the frontend text field
- .docx files
- .txt files
- .pdf files

The unstructured data may include, for example, textual process descriptions, process optimization goals, internal compliance constraints, process KPIs, company-specific information, and more.

In addition to unstructured data, the following structured input formats are supported:

- .xes for event logs
- .csv for event logs
- .bpmn

Event Log Requirements:
Event logs must contain the following mandatory columns:

- Case ID
- Activity
- Timestamp

For enhanced analysis, the following optional columns are recommended:

- Resource
- Costs

### Input - best practices

As a best practice, the company name should always be provided, as it enables the enrichment of relevant contextual information. Supplying event logs is strongly recommended, since they are essential for analyzing processes and calculating meaningful process KPIs. Clearly defined process optimization goals help to focus the analysis and improve the quality of the results. Overall, providing comprehensive and high-quality input data leads to better insights and more effective process optimization outcomes.

### Input processing - Unstructured Data

Unstructured data is extracted from the uploaded files, parsed, and passed to the agents as a dictionary.

### Input processing - Structured Data

#### Event Logs

Event Logs im xes oder csv Format werden von unserer Process Analysis Engine verarbeitet. Hier werden generelle Sachen gemacht.

### BPMN Data

BPMN data is simulated and processed as simulated event logs. These simulated event logs are used as input for the analysis in the same way as real event logs, enabling process evaluation and KPI calculation based on the modeled process behavior.

### AI-Agents

#### 📋 Requirements Agent

Once the input has been processed, the **Requirements Agent** is initiated. It structures the unstructured input into a JSON format, enabling the subsequent agents to continue working with the prepared and standardized information.

#### 📊 Economic Context Agent

Subsequently, the **Economic Context Agent** enriches the input data on an external level based on the provided company name. It incorporates macroeconomic data, industry-specific insights, and company-specific information that are relevant for informed process redesign and optimization.

#### ⚡ Performance Agent

The **Performance Agent** receives the structured input data, the externally enriched information, and, if an event log is provided, the performance related KPIs. It further enriches these data in a layered manner similar to an onion model to incorporate deeper insights, such as best practices for the given process within the specific industry obtained via web searches.

Using this enriched dataset in combination with its knowledge repository, a collection of 52 process redesign patterns stored in JSON format, the Performance Agent generates textual process improvement recommendations and redesign options. Its focus is exclusively on improving the performance of the process.

#### 💰 Finance Agent

The **Finance Agent** receives the structured input data, the externally enriched information, and, if an event log is provided, the finance related KPIs. It further enriches these data in a layered manner similar to an onion model to incorporate deeper insights, such as best practices for the given process within the specific industry obtained via web searches.

Using this enriched dataset in combination with its knowledge repository, a collection of 52 process redesign patterns stored in JSON format, the Finance Agent generates textual process improvement recommendations and redesign options. Its focus is exclusively on improving the financial efficiency of the process.

#### ✓ Compliance Agent

Der Compliance Agent bekommt dann sowohl die strukturierten Inputdaten, als auch die extern angereicherten Information und falls Event Log, dann auch compliance-relevante KPI's.

### System Output

The system provides comprehensive outputs depending on the supplied input data:

- If an event log or BPMN file is provided, the process is visualized.
- If an event log is provided, relevant process KPIs are calculated and illustrated.
- Textual improvement recommendations generated by the Performance, Finance, and Compliance Agents.
- Agent explainability, including insights into the agents’ reasoning processes and the tools they utilized.
- A complete execution log documenting the interactions and outputs of all agents involved.

### API Limitations

---

## References

ℹ️ We used the [process pattern app](https://process-pattern.app/) as collection of patterns for primary source
ℹ️ The agents are built using the [CrewAI framework](https://www.crewai.com/)
ℹ️ The Process Analysis Engine is largely based on the [pm4py library](https://processintelligence.solutions/)

---

## Contact

For support, questions, or feedback regarding the repository, don't hesitate to contact us via E-Mail:

- Luca-Paul Schirmer: [lucapaulschirmer@gmail.com](mailto:lucapaulschirmer@gmail.com)
- Evgenij Krat: [evgenijkrat00@gmail.com](mailto:evgenijkrat00@gmail.com)
- Zi-Jun Ochsmann: [abc92112@gmail.com](mailto:abc92112@gmail.com)

🚀 **Have fun exploring our system and discovering the synergies between systematic process improvement and -redesign and the capabilities of AI agents** 🚀
