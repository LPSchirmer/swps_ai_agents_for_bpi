# CrewAI
from crewai import LLM, Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai_tools import SerperDevTool
from crewai.knowledge.source.text_file_knowledge_source import TextFileKnowledgeSource
# Type annotations
from typing import List, Optional, Union

# Structuring Agent Output
from pydantic import BaseModel

# LLM API Settings
from dotenv import load_dotenv
import os
load_dotenv()
llm_openai = LLM(
    model=os.getenv("BASE_MODEL_OPENAI"),
    api_key= os.getenv("API_KEY_OPENAI"),
    temperature=0.4,
    max_tokens=1500
)

# Instantiate tools - Make SerperDevTool optional
try:
    from crewai_tools import SerperDevTool
    web_search_tool = SerperDevTool() if os.getenv("SERPER_API_KEY") else None
except:
    web_search_tool = None

class Requirements(BaseModel):
    process_name: str
    company_information: str
    process_information: dict
    identified_process_issues: List[str]
    process_improvement_goals: List[str]
    process_compliance_restrictions: List[str]
    process_risk_information: Optional[Union[int, str]]
    non_categorizable_information: List[str]

class EconomicContext(BaseModel):
    company_overview: dict
    financial_posture: dict
    strategic_orientation: dict
    market_position: dict
    regional_macroeconomic_conditions: dict
    process_redesign_considerations: List[str]

# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

@CrewBase
class SwpsAiAgentsForBpi():
    """SwpsAiAgentsForBpi crew"""

    agents: List[BaseAgent]
    tasks: List[Task]
    
    # Add knowledge sources mit absoluten Pfaden
    import os
    _project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    _knowledge_path1 = os.path.join(_project_root, 'knowledge', 'bpi_patterns_1.txt')
    _knowledge_path2 = os.path.join(_project_root, 'knowledge', 'bpi_patterns_2.txt')
    
    bpi_text_source = None
    if os.path.exists(_knowledge_path1) and os.path.exists(_knowledge_path2):
        bpi_text_source = TextFileKnowledgeSource(
            file_paths=[_knowledge_path1, _knowledge_path2]
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
            'max_iter': 5
        }
        if web_search_tool is not None:
            agent_config['tools'] = [web_search_tool]
        if self.bpi_text_source is not None:
            agent_config['knowledge_sources'] = [self.bpi_text_source]
        return Agent(**agent_config)
    
    @agent
    def finance_agent(self) -> Agent:
        agent_config = {
            'config': self.agents_config['finance_agent'],
            'llm': llm_openai,
            'verbose': True,
            'allow_delegation': False,
            'max_iter': 5
        }
        if web_search_tool is not None:
            agent_config['tools'] = [web_search_tool]
        if self.bpi_text_source is not None:
            agent_config['knowledge_sources'] = [self.bpi_text_source]
        return Agent(**agent_config)
    
    @agent
    def compliance_agent(self) -> Agent:
        agent_config = {
            'config': self.agents_config['compliance_agent'],
            'llm': llm_openai,
            'verbose': True,
            'allow_delegation': False,
            'max_iter': 5
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
            markdown=True,
            # async_execution=True # Task is performed in parallel with finance and compliance analysis
        )
    
    @task
    def finance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['finance_analysis_task'],
            agent=self.finance_agent(), 
            context=[self.analyze_user_input_task(), self.analyze_economic_context_task()], 
            markdown=True,
            # async_execution=True # Task is performed in parallel with performance and compliance analysis
        )
    
    @task
    def compliance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['compliance_analysis_task'],
            agent=self.compliance_agent(),
            context=[self.analyze_user_input_task(), self.analyze_economic_context_task()],
            markdown=True,
            # async_execution=True # Task is performed in parallel with performance and finance analysis
        )

    @crew
    def crew(self) -> Crew:
        """Creates the SwpsAiAgentsForBpi crew"""

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True
            # memory=True
        )