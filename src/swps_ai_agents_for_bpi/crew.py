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

class Requirements(BaseModel):
    process_name: str
    company_information: str
    process_activities: List[str]
    process_variants: List[List[str]]
    perspectives_on_process: dict
    roles: List[str]
    ressources: List[str]
    identified_issues: List[str]
    process_improvement_goals: List[str]
    process_compliance_restrictions: List[str]
    risk_tolerance: Optional[Union[int, str]]
    non_categorizable_information: List[str]

class EconomicContext(BaseModel):
    company_overview: dict
    financial_posture: dict
    strategic_orientation: dict
    market_position: dict
    macroeconomic_factors: List[str]
    global_regional_economic_conditions: dict
    process_redesign_considerations: List[str]

# LLM API Settings
from dotenv import load_dotenv
import os
load_dotenv()
llm_openai = LLM(
    model=os.getenv("BASE_MODEL_OPENAI"),
    api_key= os.getenv("API_KEY_OPENAI"),
    temperature=0.4, # Mock data
    max_tokens=1000 # Mock data
)
# Instantiate tools
web_search_tool = SerperDevTool()

# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

@CrewBase
class SwpsAiAgentsForBpi():
    """SwpsAiAgentsForBpi crew"""

    agents: List[BaseAgent]
    tasks: List[Task]
    
    # Add knowledge sources
    text_source = TextFileKnowledgeSource(
        file_paths=["../knowledge/bpi_patterns_1.txt", "../knowledge/bpi_patterns_2.txt"]
    )
    # If you would like to add tools to your agents, you can learn more about it here:
    # https://docs.crewai.com/concepts/agents#agent-tools
    # @agent
    # def orchestrator_agent(self) -> Agent:
    #     return Agent(
    #         config=self.agents_config['orchestrator_agent'],
    #         llm=llm_openai,
    #         verbose=True,
    #         allow_delegation=True,
    #         reasoning=True,
    #         memory=True,
    #         max_iter=5
    #     )

    @agent
    def requirements_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['requirements_agent'], # type: ignore[index]
            llm=llm_openai,
            verbose=True,
            allow_delegation = False,
            max_iter=5
        )
    
    @agent
    def economic_context_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['economic_context_agent'], # type: ignore[index]
            llm=llm_openai,
            verbose=True,
            allow_delegation= False,
            tools=[web_search_tool],
            max_iter=5
        )
    
    @agent
    def performance_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['performance_agent'], # type: ignore[index]
            llm=llm_openai,
            verbose=True,
            allow_delegation= False,
            max_iter=5,
            tools=[web_search_tool],
            knowledge_sources=[self.text_source]
            # Eventuell custom Analysis Tools
        )
    
    @agent
    def finance_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['finance_agent'], # type: ignore[index]
            llm=llm_openai,
            verbose=True,
            allow_delegation= False,
            max_iter=5,
            tools=[web_search_tool],
            knowledge_sources=[self.text_source]
            # Eventuell custom Analysis Tools
        )
    
    # @agent
    # def risk_agent(self) -> Agent:
    #     return Agent(
    #         config=self.agents_config['risk_agent'], # type: ignore[index]
    #         llm=llm_openai,
    #         verbose=True,
    #         allow_delegation= False,
    #         max_iter=5
    #         # Eventuell custom Analysis Tools
    #     )
    
    @agent
    def compliance_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['compliance_agent'], # type: ignore[index]
            llm=llm_openai,
            verbose=True,
            allow_delegation= False,
            tools=[web_search_tool], # Web Search, um aktuelle gesetzliche Vorgaben und Normen recherchieren zu können
            max_iter=5
            # Eventuell custom Analysis Tools
        )
    
    # @agent
    # def evaluation_agent(self) -> Agent:
    #     return Agent(
    #         config=self.agents_config['evaluation_agent'], # type: ignore[index]
    #         llm=llm_openai,
    #         verbose=True,
    #         allow_delegation=True,
    #         max_iter=5
    #     )

    # To learn more about structured task outputs,
    # task dependencies, and task callbacks, check out the documentation:
    # https://docs.crewai.com/concepts/tasks#overview-of-a-task
    @task
    def analyze_user_input_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_user_input_task'], # type: ignore[index]
            agent=self.requirements_agent(),
            output_json=Requirements
        )
    
    @task
    def analyze_economic_context_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_economic_context_task'], # type: ignore[index]
            agent=self.economic_context_agent(),
            context=[self.analyze_user_input_task()],
            output_json=EconomicContext
        )

    # @task
    # def plan_analysis_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['plan_analysis_task'], # type: ignore[index]
    #         agent=self.orchestrator_agent(),
    #         context=[self.analyze_user_input_task(), self.analyze_economic_context_task()]
    #     )
    
    @task
    def performance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['performance_analysis_task'], # type: ignore[index]
            agent=self.performance_agent(),
            context=[self.analyze_user_input_task(), self.analyze_economic_context_task()],
            # async_execution=True # Task is performed in parallel with finance and compliance analysis
        )
    
    @task
    def finance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['finance_analysis_task'], # type: ignore[index]
            agent=self.finance_agent(), 
            context=[self.analyze_user_input_task(), self.analyze_economic_context_task()], 
            # async_execution=True # Task is performed in parallel with performance and compliance analysis
        )
    
    # @task
    # def risk_analysis_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['risk_analysis_task'], # type: ignore[index]
    #         agent=self.risk_agent(),
    #         context=[self.plan_analysis_task()],
    #         async_execution=True # Task is performed in parallel with performance, finance and compliance analysis
    #     )
    
    @task
    def compliance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['compliance_analysis_task'], # type: ignore[index]
            agent=self.compliance_agent(),
            context=[self.analyze_user_input_task(), self.analyze_economic_context_task()],
            # async_execution=True # Task is performed in parallel with performance and finance analysis
        )
    
    # @task
    # def aggregate_findings_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['aggregate_findings_task'], # type: ignore[index]
    #         agent=self.orchestrator_agent(),
    #         context=[self.performance_analysis_task(), 
    #                  self.finance_analysis_task(),  
    #                  self.compliance_analysis_task()]
    #     )
    
    # @task
    # def generate_improvements_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['generate_improvements_task'], # type: ignore[index]
    #         agent=self.orchestrator_agent(),
    #         context= [self.analyze_user_input_task(), self.analyze_economic_context_task(), self.aggregate_findings_task()]
    #     )
    
    # @task
    # def evaluate_improvements_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['evaluate_improvements_task'], # type: ignore[index]
    #         agent=self.evaluation_agent(),
    #         context=[self.analyze_user_input_task(), self.generate_improvements_task()]
    #     )
    
    # @task
    # def compile_final_report_task(self) -> Task:
    #     return Task(
    #         config=self.tasks_config['compile_final_report_task'], # type: ignore[index]
    #         output_file='report.md',
    #         agent=self.orchestrator_agent(),
    #         markdown=True,
    #         context=[self.generate_improvements_task(), self.evaluate_improvements_task()]
    #     )

    @crew
    def crew(self) -> Crew:
        """Creates the SwpsAiAgentsForBpi crew"""
        # To learn how to add knowledge sources to your crew, check out the documentation:
        # https://docs.crewai.com/concepts/knowledge#what-is-knowledge

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            # manager_agent=self.orchestrator_agent(),
            verbose=True,
            # memory=True
        )