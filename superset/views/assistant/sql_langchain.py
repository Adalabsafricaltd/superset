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
    
    def get_controls(self, controls, current_formdata, viz_type, instructions):
        """
        Returns modified formdata
        """
        return None


    def explain_describe(self, allowed_scope, target):
        """
        allowed_scope -> [ {
            schemaName: str,
            tables: [{
                tableName: str,
                columns: [{
                    columnName: str,
                    dataType: str,
                    key: str
                }]
            }]
        } ]
        target -> table in allowed scope
        Return schema
        {
            description: str
            column: [{
             columnName: str,
             description: str,
            }]
            ... any additional data 
        }
        """
        return None

    # Chat
    
    def prompt(self, allowed_scope, user_prompt):
        """Return schema
        {
            ai_response: str||markup,
            sql_query: str
            viz_type:[
                {
                    viz_type: str,
                    instructions: str # metrics, dimentions, metric labels, filters etc
                    viz_title:str Title of the chart
                }
            ]

        }
        """
        return None
    
    def viz_suggestion(self, allowed_scope, goal_or_intent):
        """Return schema
        [{
            viz_type: str,
            instructions: dict,
            viz_title:str,
            reasoning: str , # Why this viz type is suggested based on goal or intent
        }]
        """
        return None