from superset.daos.database import DatabaseDAO
from superset.commands.database.exceptions import DatabaseNotFoundError
from typing import cast
from superset.models.core import Database
import logging
from langchain_community.utilities import SQLDatabase
from langchain_ollama import ChatOllama
from langchain_community.agent_toolkits import create_sql_agent, SQLDatabaseToolkit
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from flask import current_app
from langchain.agents.agent_types import AgentType

from pydantic import BaseModel, Field
from langchain_core.output_parsers.pydantic import PydanticOutputParser

# class MessageOutput(BaseModel):
#     message: str = Field(description="The message from the agent")
#     suggestion: list[str] = Field(description="Suggest additional queries to supplement the message")
#     chartable: bool = Field(description="Is the message from the agent represantable on a chart")
#     chart_suggestions: list[dict] = Field(description="Suggested chart types and metrics to visualize the data if applicable empty if not")
#     query: str = Field(description="SQL query to retrieve data used for chat if applicable empty if not")

# output_parser = PydanticOutputParser(pydantic_object=MessageOutput)

class SQLLangchain:

    logger = logging.getLogger(__name__)
    dbSqlAlchemyUriDecrypted = None
    isValidDatabase = False
    dbPk = None
    llm = None
    db = None
    geminiApiKey = current_app.config.get("GEMINI_API_KEY")
    agent = None
    toolKit = None

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
        # Setup
        self.db = SQLDatabase.from_uri(self.dbSqlAlchemyUriDecrypted)
        self.llm = ChatOllama(
            base_url="http://41.215.4.194:11434",
            model="llama3.1",
            verbose=True,
            temperature=0
        )
        
        # Agent
        _agent = create_sql_agent(
            llm=self.llm,
            db=self.db,
            agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        )
        return _agent

    def prompt(self, allowed_scope, user_prompt):
        # Send user's prompt to agent
        human_message = HumanMessage(user_prompt)
        self.logger.info(f"User prompt:=> {user_prompt}")
        agent_response = self.agent.invoke(human_message)
        self.logger.info(f"Agent response:=> {agent_response.text}")
        return agent_response