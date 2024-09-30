from superset.daos.database import DatabaseDAO
from typing import cast
from superset.models.core import Database
import logging
from langchain_community.utilities import SQLDatabase
from langchain_ollama.llms import OllamaLLM
from langchain.agents import create_sql_agent
from langchain_core.prompts import PromptTemplate
from flask import current_app
from langchain.agents.agent_types import AgentType


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
        self.llm = OllamaLLM(
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
            verbose=True,
            agent_executor_kwargs={
                "handle_parsing_errors": True
            }
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
        Describe the table or view named '{target}' in detail. For each column in '{target}', provide its name and a brief description of its contents or purpose. Format the response as a JSON object with the following structure:
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
        Ensure the response is a valid JSON object.
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
        response = self.agent.invoke(user_prompt)
        self.logger.info(f"sql_langchain prompt {response}")
        return response
    
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