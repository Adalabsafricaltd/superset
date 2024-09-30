from langchain.memory import ConversationBufferMemory
from langchain_community.chat_models import ChatOllama
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.pydantic_v1 import BaseModel
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from typing import cast
from superset.models.core import Database
from superset.daos.database import DatabaseDAO
import logging

class SQLQueryHandler:

    logger = logging.getLogger(__name__)
    isValidDatabase = False
    db = None

    def __init__(self, dbPk: int):
        self.dbPk = dbPk
        database = cast(Database, DatabaseDAO.find_by_id(self.dbPk))
        if not database:
            self.isValidDatabase = False
        else:
            self.isValidDatabase = True
            self.ollama_llm = "zephyr"
            self.llm = ChatOllama(
                base_url="http://41.215.4.194:11434",
                model=self.ollama_llm
            )
            self.db = SQLDatabase.from_uri(database.sqlalchemy_uri_decrypted, sample_rows_in_table_info=0)
            self.memory = ConversationBufferMemory(return_messages=True)
            self.sql_chain = self.create_sql_chain()
            self.chain = self.create_chain()

    def get_schema(self, _):
        return self.db.get_table_info()

    def run_query(self, query):
        return self.db.run(query)

    def create_sql_chain(self):
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Given an input question, convert it to a SQL query. No pre-amble."),
            MessagesPlaceholder(variable_name="history"),
            ("human", """Based on the table schema below, write a SQL query that would answer the user's question: {schema} Question: {question} SQL Query:""")
        ])
        return (RunnablePassthrough.assign(
                    schema=self.get_schema,
                    history=RunnableLambda(lambda x: self.memory.load_memory_variables(x)["history"])
                ) | prompt | self.llm.bind(stop=["\nSQLResult:"]) | StrOutputParser())

    def save(self, input_output):
        output = {"output": input_output.pop("output")}
        self.memory.save_context(input_output, output)
        return output["output"]

    def create_chain(self):
        sql_response_memory = RunnablePassthrough.assign(output=self.sql_chain) | self.save
        prompt_response = ChatPromptTemplate.from_messages([
            ("system", "Given an input question and SQL response, convert it to a natural language answer. No pre-amble."),
            ("human", """Based on the table schema below, question, sql query, and sql response, write a natural language response: {schema} Question: {question} SQL Query: {query} SQL Response: {response}""")
        ])
        return (RunnablePassthrough.assign(query=sql_response_memory).with_types(input_type=BaseModel) |
                RunnablePassthrough.assign(schema=self.get_schema, response=lambda x: self.db.run(x["query"])) |
                prompt_response | self.llm)

    def handle_query(self, question):
        input_data = {"question": question}
        return self.chain.invoke(input_data)