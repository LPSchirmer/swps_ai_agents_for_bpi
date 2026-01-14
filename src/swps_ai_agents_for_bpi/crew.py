# CrewAI Imports
from crewai import LLM, Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai.knowledge.source.json_knowledge_source import JSONKnowledgeSource
# Type annotation imports
from typing import List

# Structuring Agent Output imports
from pydantic import BaseModel, Field

# LLM API Settings
from dotenv import load_dotenv
import os
load_dotenv()
llm_openai = LLM(
    model=os.getenv("BASE_MODEL_OPENAI"),
    api_key= os.getenv("API_KEY_OPENAI"),
    temperature=0.4,
    max_tokens=4096
)

# Instantiate tools - Make SerperDevTool optional
try:
    from crewai_tools import SerperDevTool
    web_search_tool = SerperDevTool() if os.getenv("SERPER_API_KEY") else None
except:
    web_search_tool = None

# Structuring Output of Requirements Agent
class ProcessInformation(BaseModel):
    process_description: str = Field(description="Textual description of the process.")
    process_data: dict = Field(description="Data/KPI's about the process.")

class Requirements(BaseModel):
    process_name: str = Field(description="Name of the given business process (e.g., Order to Cash, Warranty Handling, etc.)")
    company_name: str = Field(description="Name of the company in which the process is embedded.")
    company_information: List[str] = Field(description="Relevant information about the company in which the process is embedded.")
    process_information: ProcessInformation
    identified_process_issues: List[str] = Field(description="List of given or identified performance/finance/compliance issues.")
    process_improvement_goals: List[str] = Field(description="List of given or identified process improvement goals.")
    process_compliance_restrictions: List[str] = Field(description="Internal or external compliance restrictions that the process need to comply with.")
    process_risk_information: List[str] = Field(description="Information about the risk tolerance of the user.")
    non_categorizable_information: List[str] = Field(description="Given data or information that can't be categorized in one of the previous categories.")

# Structuring Output of Economic Context Agent
class EconomicContext(BaseModel):
    company_overview: dict
    financial_posture: dict
    strategic_orientation: dict
    market_position: dict
    regional_macroeconomic_conditions: dict
    process_redesign_considerations: List[str]

@CrewBase
class SwpsAiAgentsForBpi():
    """SwpsAiAgentsForBpi crew"""

    agents: List[BaseAgent]
    tasks: List[Task]
    
    # Add knowledge source - use relative path for CrewAI
    bpi_json_source = JSONKnowledgeSource(
        file_paths=["process_redesign_patterns.json"]
    )

    @agent
    def requirements_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['requirements_agent'],
            llm=llm_openai,
            verbose=True,
            allow_delegation = False,
            max_iter=5
        )
    
    @agent
    def economic_context_agent(self) -> Agent:
        agent_config = {
            'config': self.agents_config['economic_context_agent'],
            'llm': llm_openai,
            'verbose': True,
            'allow_delegation': False,
            'max_iter': 5
        }
        if web_search_tool is not None:
            agent_config['tools'] = [web_search_tool]
        return Agent(**agent_config)
    
    @agent
    def performance_agent(self) -> Agent:
        agent_config = {
            'config': self.agents_config['performance_agent'],
            'llm': llm_openai,
            'verbose': True,
            'allow_delegation': False,
            'max_iter': 10
        }
        if web_search_tool is not None:
            agent_config['tools'] = [web_search_tool]
        return Agent(**agent_config)
    
    @agent
    def finance_agent(self) -> Agent:
        agent_config = {
            'config': self.agents_config['finance_agent'],
            'llm': llm_openai,
            'verbose': True,
            'allow_delegation': False,
            'max_iter': 10
        }
        if web_search_tool is not None:
            agent_config['tools'] = [web_search_tool]
        return Agent(**agent_config)
    
    @agent
    def compliance_agent(self) -> Agent:
        agent_config = {
            'config': self.agents_config['compliance_agent'],
            'llm': llm_openai,
            'verbose': True,
            'allow_delegation': False,
            'max_iter': 10
        }
        if web_search_tool is not None:
            agent_config['tools'] = [web_search_tool]
        return Agent(**agent_config)

    @task
    def analyze_user_input_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_user_input_task'],
            agent=self.requirements_agent(),
            output_json=Requirements
        )
    
    @task
    def analyze_economic_context_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_economic_context_task'],
            agent=self.economic_context_agent(),
            context=[self.analyze_user_input_task()],
            output_json=EconomicContext
        )
    
    @task
    def performance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['performance_analysis_task'],
            agent=self.performance_agent(),
            context=[self.analyze_user_input_task(), self.analyze_economic_context_task()],
            markdown=True
        )
    
    @task
    def finance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['finance_analysis_task'],
            agent=self.finance_agent(), 
            context=[self.analyze_user_input_task(), self.analyze_economic_context_task()], 
            markdown=True
        )
    
    @task
    def compliance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['compliance_analysis_task'],
            agent=self.compliance_agent(),
            context=[self.analyze_user_input_task(), self.analyze_economic_context_task()],
            markdown=True
        )

    @crew
    def crew(self) -> Crew:
        """Creates the SwpsAiAgentsForBpi crew"""

        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
            knowledge_sources=[self.bpi_json_source]
            # memory=True
        )