from superset.daos.database import DatabaseDAO
from typing import cast
from superset.models.core import Database
import logging
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_ollama.chat_models import ChatOllama
from flask import current_app
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage, HumanMessage

# Formating Structures
# Prompt Response

class VizType(BaseModel):
    viz_type: str = Field(description="Type of visualization")
    instructions: str = Field(description="Instructions for metrics, dimensions, metric labels, filters, etc.")
    viz_title: str = Field(description="Title of the chart")

class PromptResponse(BaseModel):
    ai_response: str = Field(description="AI response or markup")
    sql_query: str = Field(description="SQL query used")
    viz_type: List[VizType] = Field(description="List of visualization types")

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
            self.initialize()
    
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
        self.toolKit = SQLDatabaseToolkit(db=self.db, llm=self.llm)

    def new_agent(self, system_message):
        # Agent
        _agent = create_react_agent(
            self.llm,
            self.toolKit.get_tools(),
            state_modifier=SystemMessage(system_message),
        )
        return _agent
    
    def get_controls(self, controls, current_formdata, viz_type, instructions):
        """
        Returns modified formdata
        """
        return None


    def explain_describe(self, target):
        self.logger.info(f"sql langchain explain_describe {target}")
        """
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
        instructions = f"""
        Describe the table or view named '{target}' in detail. For each column in '{target}', provide its name and a brief description of its contents or purpose. 
        Ensure the response is a valid JSON object.
        Format the response as a JSON object with the following structure:
        {{
            "description": "A brief description of the entire table or view",
            "columns": [
                {{
                    "columnName": "Name of the column",
                    "description": "Description of the column's contents or purpose"
                }},
                ...
            ]
        }}
        
        """
        
        result = self.agent.invoke(instructions)
        self.logger.info(f"sql langchain explain_describe {result}")
        return result

    def explain_image(self, image, additional_data):
        """ Return Schema
        {
            analysis: str,
            insights: str,
            recommendations: str,
            take_away: str
        }
        """
        test_response = {
                    "analysis": "Sample analysis",
                    "insights": "Sample insights",
                    "recommendations": "Sample Recommendation",
                    "take_away": "Sample Take Away"
                }
        
        return test_response
    
   



    def prompt(self, allowed_scope, history, user_prompt):
        """Return schema
        {
            ai_response: str||markup,
            sql_query: str,
            viz_type:[
                {
                    viz_type: str,
                    instructions: str # metrics, dimentions, metric labels, filters etc
                    viz_title:str Title of the chart
                }
            ]

        }
        """
        parser = PydanticOutputParser(pydantic_object=PromptResponse)
        format_instructions = parser.get_format_instructions()

        instructions = f"""

            You are an agent designed to interact with a SQL database.

            Given an input question, create a syntactically correct SQL query to run, then look at the results of the query and return the answer.
            You MUST ONLY query data in the ALLOWED_SCOPE : {allowed_scope}
            You can order the results by a relevant column to return the most interesting examples in the database.
            You have access to tools for interacting with the database.
            Only use the below tools. Only use the information returned by the below tools to construct your final answer.
            You MUST double check your query before executing it. If you get an error while executing a query, rewrite the query and try again.
            You MUST check that your response is relevant to the input question and the database. 
            You MUST give a reasoning to your answer.
            DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
            To start you should ALWAYS look at the tables in the database to see what you can query.
            Do NOT skip this step.
            Then you should query the schema of the most relevant tables. 
            {format_instructions}
        """
        agent = self.new_agent(instructions)
        RECURSION_LIMIT = 2 * 20 + 1
        return agent.invoke(
            {"messages": [HumanMessage(content=user_prompt)]},
            {"recursion_limit": RECURSION_LIMIT},
        )
    
    def viz_suggestion(self, allowed_scope, goal_or_intent, number_of_suggestions=4):
        """Return schema
        [{
            viz_type: str,
            instructions: dict,
            viz_title:str,
            reasoning: str , # Why this viz type is suggested based on goal or intent
        }]
        """
        return None