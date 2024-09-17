from superset.daos.database import DatabaseDAO
from superset.commands.database.exceptions import DatabaseNotFoundError
from typing import cast
from superset.models.core import Database
import logging
from langchain_openai import AzureChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from flask import current_app

# Azure Open AI langchain impl

# Chat with user DB

# Get Suggestions for charts using metrics from the DB
# The Metrics should be determined using either columns or sql ezpressions from a datasource
# The datasource my be a single table or a SQL query wich be used as datasource

class SQLLangchainAzureOpenAI:

    logger = logging.getLogger(__name__)
    dbSqlAlchemyUriDecrypted = None
    isValidDatabase = False
    dbPk = None
    llm = None
    db = None
    geminiApiKey = current_app.config.get("GEMINI_API_KEY")

    def __init__(self, dbPk: int):
        self.dbPk = dbPk
        database = cast(Database, DatabaseDAO.find_by_id(self.dbPk))
        if not database:
            self.isValidDatabase = False
        else:
            self.logger.info(f"Database => {self.dbPk} info: {database.sqlalchemy_uri_decrypted}")
            self.dbSqlAlchemyUriDecrypted = database.sqlalchemy_uri_decrypted
            self.isValidDatabase = True
            self.initialize()
    
    def isValid(self):
        return self.isValidDatabase
    
    def initialize(self):
        # https://superset-open-ai.openai.azure.com/openai/deployments/superset-assistant/chat/completions?api-version=2023-03-15-preview
        # self.llm = AzureChatOpenAI(
        #     azure_endpoint="https://superset-open-ai.openai.azure.com",
        #     api_version="2023-03-15-preview",
        #     api_key="4c503b1879124b67a5db3d0b58c4e0f5",
        #     azure_deployment="superset-assistant"
        # )
        self.llm = ChatGoogleGenerativeAI(
            google_api_key= self.geminiApiKey,
            model="gemini-1.5-flash",
            max_output_tokens=8192,
        )
        self.db = SQLDatabase.from_uri(self.dbSqlAlchemyUriDecrypted)
        agent = create_sql_agent(
            llm=self.llm,
            db=self.db,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5,
        )
        return agent
    

    # boils down to the following outcomes
    #  1. Numbers Response i.e Calculated response
    #  2. SQL query response
    #  3. SQL query response for Vizualization
    #  4. Probe response i.e Tries to stear the conversation towards 1..3
    #  5. 

    system_message = """
                    Peronality. You are a data analyst
                    You can only query schemas, tables and columns depicted in the ALLOWED_SCOPE json {context_scope}

                    Steer the conversation towards these goals
                    GOALS
                    1. Obtaining Information on the schemas, tables and columns depicted in the ALLOWED_SCOPE json
                    2. Do not ask questions that are not related to the goals

                    If the Database does not contain the schemas and tables depicted in the ALLOWED_SCOPE json return
                    {{
                        "stop": "Short Reason for not being able to answer"
                    }}

                    Responses should be a valid Json in the format
                    {{
                        "message": "The response message. ",
                        "sql_query": "DB query to get the response. Must be a valid SQL query",
                        "can_be_visualized": "true or false, can response be visualized using a chart?",
                    }}

                    """
    

    def prompt(self, context_scope: str, prompt:str):
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                self.system_message
            ),
            (
                "human",
                {prompt}
            )
        ]).partial(context_scope=context_scope)
        
        return self.agent.invoke(prompt)