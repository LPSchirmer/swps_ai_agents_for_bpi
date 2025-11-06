from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

@CrewBase
class SwpsAiAgentsForBpi():
    """SwpsAiAgentsForBpi crew"""

    agents: List[BaseAgent]
    tasks: List[Task]

    # Learn more about YAML configuration files here:
    # Agents: https://docs.crewai.com/concepts/agents#yaml-configuration-recommended
    # Tasks: https://docs.crewai.com/concepts/tasks#yaml-configuration-recommended
    
    # If you would like to add tools to your agents, you can learn more about it here:
    # https://docs.crewai.com/concepts/agents#agent-tools
    @agent
    def orchestrator_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['orchestrator_agent'],
            allow_delegation=True,
            reasoning=True,
            memory=True, # type: ignore[index]
            verbose=True
        )

    @agent
    def requirements_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['requirements_agent'], # type: ignore[index]
            verbose=True,
            allow_delegation = False,
            reasoning = True,
            memory = True
        )
    
    @agent
    def performance_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['performance_agent'], # type: ignore[index]
            verbose=True,
            allow_delegation= False
        )
    
    @agent
    def finance_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['finance_agent'], # type: ignore[index]
            verbose=True,
            allow_delegation= False
        )
    
    @agent
    def risk_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['risk_agent'], # type: ignore[index]
            verbose=True,
            allow_delegation= False
        )
    
    @agent
    def compliance_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['compliance_agent'], # type: ignore[index]
            verbose=True,
            allow_delegation= False
        )
    
    @agent
    def evaluation_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['evaluation_agent'], # type: ignore[index]
            verbose=True,
            allow_delegation=True
        )

    # To learn more about structured task outputs,
    # task dependencies, and task callbacks, check out the documentation:
    # https://docs.crewai.com/concepts/tasks#overview-of-a-task
    @task
    def analyze_user_input_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_user_input_task'], # type: ignore[index]
            agent=self.requirements_agent()
        )

    @task
    def plan_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['plan_analysis_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.orchestrator_agent()
        )
    
    @task
    def performance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['performance_analysis_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.performance_agent()
        )
    
    @task
    def finance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['finance_analysis_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.finance_agent()
        )
    
    @task
    def risk_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['risk_analysis_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.risk_agent()
        )
    
    @task
    def compliance_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config['compliance_analysis_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.compliance_agent()
        )
    
    @task
    def aggregate_findings_task(self) -> Task:
        return Task(
            config=self.tasks_config['aggregate_findings_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.orchestrator_agent()
        )
    
    @task
    def generate_improvements_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_improvements_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.orchestrator_agent()
        )
    
    @task
    def evaluate_improvements_task(self) -> Task:
        return Task(
            config=self.tasks_config['evaluate_improvements_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.evaluation_agent()
        )
    
    @task
    def compile_final_report_task(self) -> Task:
        return Task(
            config=self.tasks_config['compile_final_report_task'], # type: ignore[index]
            output_file='report.md',
            agent=self.orchestrator_agent()
        )

    @crew
    def crew(self) -> Crew:
        """Creates the SwpsAiAgentsForBpi crew"""
        # To learn how to add knowledge sources to your crew, check out the documentation:
        # https://docs.crewai.com/concepts/knowledge#what-is-knowledge

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            # process=Process.hierarchical, # In case you wanna use that instead https://docs.crewai.com/how-to/Hierarchical/
        )
