from superset.daos.database import DatabaseDAO
from superset.commands.database.exceptions import DatabaseNotFoundError
from typing import cast
from superset.models.core import Database
import logging
from langchain_openai import AzureChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent, SQLDatabaseToolkit
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from flask import current_app
from langchain_ollama import ChatOllama
from langchain.agents import AgentType
from pydantic import BaseModel, Field
from langchain_core.output_parsers.pydantic import PydanticOutputParser
# Azure Open AI langchain impl

# Chat with user DB

# Get Suggestions for charts using metrics from the DB
# The Metrics should be determined using either columns or sql ezpressions from a datasource
# The datasource my be a single table or a SQL query wich be used as datasource

class MessageOutput(BaseModel):
    message: str = Field(description="The message from the agent")
    suggestion: list[str] = Field(description="Suggest additional queries to supplement the message")
    chartable: bool = Field(description="Is the message from the agent represantable on a chart")
    chart_suggestions: list[dict] = Field(description="Suggested chart types and metrics to visualize the data if applicable empty if not")
    query: str = Field(description="SQL query to retrieve data used for chat if applicable empty if not")

output_parser = PydanticOutputParser(pydantic_object=MessageOutput)


class SQLLangchainAzureOpenAI:

    logger = logging.getLogger(__name__)
    dbSqlAlchemyUriDecrypted = None
    isValidDatabase = False
    dbPk = None
    llm = None
    db = None
    geminiApiKey = current_app.config.get("GEMINI_API_KEY")
    agent = None

    def __init__(self, dbPk: int):
        self.dbPk = dbPk
        database = cast(Database, DatabaseDAO.find_by_id(self.dbPk))
        if not database:
            self.isValidDatabase = False
        else:
            self.logger.info(f"Database => {self.dbPk} info: {database.sqlalchemy_uri_decrypted}")
            self.dbSqlAlchemyUriDecrypted = database.sqlalchemy_uri_decrypted
            self.isValidDatabase = True
            self.agent = self.initialize()
    
    def isValid(self):
        return self.isValidDatabase
    
    def initialize(self):
        # https://superset-open-ai.openai.azure.com/openai/deployments/superset-assistant/chat/completions?api-version=2023-03-15-preview
        self.llm = ChatOllama(
            base_url="http://host.docker.internal:11434/",
            model="qwen2.5:3b",
            temperature=0.5,
            top_k=80,
            top_p=0.4,
            format='json',
        )
        # test = self.llm.invoke(
        #     "Hello there"
        # )
        # self.logger.info(f"Test LLM: {test}")
        # self.llm = AzureChatOpenAI(
        #     azure_endpoint="https://superset-open-ai.openai.azure.com",
        #     api_version="2023-03-15-preview",
        #     api_key="4c503b1879124b67a5db3d0b58c4e0f5",
        #     azure_deployment="superset-assistant"
        # )
        # self.llm = ChatGoogleGenerativeAI(
        #     google_api_key= self.geminiApiKey,
        #     model="gemini-1.5-pro",
        # )
        self.db = SQLDatabase.from_uri(self.dbSqlAlchemyUriDecrypted)
        toolKit = SQLDatabaseToolkit(
            db=self.db,
            llm=self.llm,
        )
        sqlagent = create_sql_agent(
            llm=self.llm,
            toolkit=toolKit,
            verbose=True,
            handle_parsing_errors=True,
            agent_type="tool-calling",
            format_instructions=output_parser.get_format_instructions()
        )
        return sqlagent
    

    # boils down to the following outcomes
    #  1. Numbers Response i.e Calculated response
    #  2. SQL query response
    #  3. SQL query response for Vizualization
    #  4. Probe response i.e Tries to stear the conversation towards 1..3
    #  5. 

    system_message = """
                    Peronality. You are a data analyst
                    You can only query schemas, tables and columns depicted in the ALLOWED_SCOPE json {context_scope}
                    Always return greeting responses without checking the database.
                    Steer the conversation towards these goals
                    GOALS
                    1. Obtaining Information on the schemas, tables and columns depicted in the ALLOWED_SCOPE json
                    2. Do not ask questions that are not related to the goal of analyzing data in the database
                    """

    def prompt(self, context_scope: str, input_prompt:str):
        if self.agent is None:
            return "No agent initialized"
        
        prompt_template = ChatPromptTemplate.from_messages([
            (
                "system",
                self.system_message
            ),
            (
                "human",
                "{prompt}"
            )
        ]).partial(context_scope=context_scope)
        # self.logger.info(f"Tools: {self.agent.get_prompts}")
        p = prompt_template.format_messages(prompt=input_prompt)
        self.logger.info(f"Prompt=========================================: {p}")
        response = self.agent.invoke(p,handle_parsing_errors=True)
        self.logger.info(f"Response: {response}")
        return response['output']


    def custom_prompt(self, prompt: ChatPromptTemplate):

        return self.agent.invoke(prompt)