from superset.daos.database import DatabaseDAO
from superset.commands.database.exceptions import DatabaseNotFoundError
from typing import cast
from superset.models.core import Database
import logging

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

    def __init__(self, dbPk):
        self.dbPk = dbPk
        database = cast(Database, DatabaseDAO.find_by_id(self.dbPk))
        if not database:
            self.isValidDatabase = False
        else:
            self.logger.info(f"Database => {self.dbPk} info: {database.sqlalchemy_uri_decrypted}")
            self.dbSqlAlchemyUriDecrypted = database.sqlalchemy_uri_decrypted
            self.isValidDatabase = True
    
    def isValid(self):
        return self.isValidDatabase
    
    def initialize(self):
        return None


def chatWithDB( dbConnection, prompt):
    return None