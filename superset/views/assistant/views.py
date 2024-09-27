# Sample Assiststant Page

from superset.superset_typing import FlaskResponse
from superset.views.base import BaseSupersetView
from flask_appbuilder import expose
from flask_appbuilder.api import safe
from flask_appbuilder.models.sqla.interface import SQLAInterface
from superset.models.core import Database
from flask import current_app
from flask import request
import uuid
import logging
import os
import base64
from superset.views.assistant.support import AssistantSupport
from superset.views.assistant.sql_langchain import SQLLangchain
from superset.views.assistant.context_chain import ContextQuestionnaire
from superset.daos.database import DatabaseDAO
from superset.commands.database.exceptions import DatabaseNotFoundError
from typing import cast
from superset.models.core import Database

class AssistantView(BaseSupersetView):

    support = AssistantSupport()
    available_charts = {
        "pie": {
            "name": "Pie Chart",
            "credits": [
                "https://echarts.apache.org"
            ],
            "description": "The classic. Great for showing how much of a company each investor gets, what demographics follow your blog, or what portion of the budget goes to the military industrial complex.\n\n        Pie charts can be difficult to interpret precisely. If clarity of relative proportion is important, consider using a bar or other chart type instead.",
            "supportedAnnotationTypes": [],
            "behaviors": [
                "INTERACTIVE_CHART",
                "DRILL_TO_DETAIL",
                "DRILL_BY"
            ],
            "datasourceCount": 1,
            "enableNoResults": True,
            "tags": [
                "Categorical",
                "Circular",
                "Comparison",
                "Percentages",
                "Featured",
                "Proportional",
                "ECharts",
                "Nightingale"
            ],
            "category": "Part of a Whole",
            "additionalConsiderations": [
                "Consider using a bar chart instead if clarity of relative proportion is important."
                "Do not use Distict on columns that will be grouped by."
            ]
        },
        "echarts_timeseries_line": {
            "name": "Line Chart",
            "canBeAnnotationTypes": [],
            "canBeAnnotationTypesLookup": {},
            "credits": [
                "https://echarts.apache.org"
            ],
            "description": "Line chart is used to visualize measurements taken over a given category. Line chart is a type of chart which displays information as a series of data points connected by straight line segments. It is a basic type of chart common in many fields.",
            "supportedAnnotationTypes": [
                "EVENT",
                "FORMULA",
                "INTERVAL",
                "TIME_SERIES"
            ],
            "behaviors": [
                "INTERACTIVE_CHART",
                "DRILL_TO_DETAIL",
                "DRILL_BY"
            ],
            "datasourceCount": 1,
            "enableNoResults": True,
            "tags": [
                "ECharts",
                "Predictive",
                "Advanced-Analytics",
                "Line",
                "Featured"
            ],
            "category": "Evolution",
        }
    }
    logger = logging.getLogger(__name__)
    datamodel = SQLAInterface(Database)
    route_base = "/assistant"
    default_view = "root"
    context_questionnaire = ContextQuestionnaire()

    geminiApiKey = current_app.config.get("GEMINI_API_KEY")
    # genai.configure(api_key=geminiApiKey)
    generationConfig = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
        "response_mime_type": "application/json",
    }

    # model = genai.GenerativeModel(
    #     model_name="gemini-1.5-flash",
    #     generation_config=generationConfig,
    #     # safety_settings = Adjust safety settings
    #     # See https://ai.google.dev/gemini-api/docs/safety-settings
    #     )



    logger.info(f"GEMINI API Key: {geminiApiKey}")


    @expose("/")
    def root(self) -> FlaskResponse:
        """ Assistant Home Page """
        return self.render_app_template()
    
    @expose("/prompt", methods=["POST"])
    def prompt(self) -> FlaskResponse:
        """ Request schema 
            {
                databaseId: int
                context: [
                    Schemas
                    {
                    
                    }
                ]
                prompt: str
            }
        """
        body = request.json
        allowed_scope = body["context"]
        prompt = body["prompt"]
        databaseId = body["databaseId"]
        history = body["history"]
        # self.logger.info(f"Database ID: {databaseId}")
        # self.logger.info(f"Context: {allowed_scope}")
        # self.logger.info(f"Prompt: {prompt}")
        azureLang = SQLLangchain(databaseId)
        if not azureLang.isValid():
            raise Exception(f"Database ID {databaseId} is invalid")
        response = azureLang.prompt(allowed_scope,history,prompt)
        # self.logger.info(f"Response: {response}")
        return self.json_response(response)
    
    
    #  Api to interact with gemini and get table descriptions
    @expose("/gemini/table", methods=["POST"])
    @safe
    def gemini(self) -> FlaskResponse:
        
        """ Request schema 
        {
            data: string,
            table_name: string
        }

        'data' is a string containing the json schema of the database see ./samples/gemini_table_data.json

        """
        body = request.json
        data = body["data"]
        target = body["table_name"]
        response = {}
        return self.json_response(response)
    
    # Api to interact with gemini and get visualization suggestions
    @expose("/gemini/viz-suggestions", methods=["POST"])
    @safe
    def geminiViz(self) -> FlaskResponse:
        """ Request schema
        {
            data: string,
            purpose: string,
        }

        'data' is a string containing the json schema of the database see ./samples/gemini_viz_suggestions_data.json
        """
        body = request.json
        data = body["data"]
        purpose = body["purpose"]
        response = {}
        return self.json_response(response)



    # @expose("/gemini/save-control-values", methods=["POST"])
    # @safe
    # def save_control_value_examples(self) -> FlaskResponse:
    #     """Request schema
    #     {
    #         viz_type: string,
    #         form_data: {},
    #         controls: {},

    #     }
    #     """
    #     body = request.json
    #     viz_type = body["viz_type"]
    #     formData = body["form_data"]
    #     controls = body["controls"]
    #     self.support.add_example(viz_type, formData, controls)
    #     return self.json_response({"message": "Saved"})
    
    @expose("/gemini/get-control-values", methods=["POST"])
    def get_control_values(self) -> FlaskResponse:
        """ Request schema
        {
            instruction: string,
            controls: {},
            formData: string, from llm_optimized
        }
        """
        body = request.json
        instruction = body["instruction"]
        controls = body["controls"]
        formData = body["formData"]
        viz_type = formData["viz_type"]
        self.logger.info(f"Getting control values for {viz_type}")
        self.logger.info(f"Controls: {controls}")
        self.logger.info(f"Form data: {formData}")
        self.logger.info(f"Instruction: {instruction}")

        # call you function

        new_form_controls = {}

        return self.json_response(new_form_controls)
    
    # def upload_to_genai(self, fileData):
    #     self.logger.info(f"Uploading to GenAI: {fileData}")

    #     # save fileData to local storage then delete once uploaded to genai
    #     # fileData is always a base64 encoded image with prefix "data:image/jpeg;base64,"
    #     temp_path = f"temp_{uuid.uuid4()}.jpeg"

    #     dataPortion = fileData.split(",")[1] # remove "data:image/jpeg;base64," prefix
        
    #     with open(temp_path, "wb") as f:
    #         f.write(base64.b64decode(dataPortion))

    #     file = genai.upload_file(temp_path)
    #     self.logger.info(f"Uploaded to GenAI: {file.display_name} => {file.uri}")
    #     # delete temp file
    #     os.remove(temp_path)
    #     return file

    @expose("/gemini/get-viz-explanation", methods=["POST"])
    def get_viz_explanation(self) -> FlaskResponse:
        """ Request schema
        {
            datasource: {}, this is the datasource used to create the viz
            form_data: {}, this are the values used to create the viz from the controls
            controls: {}, this are the controls used to create the viz. controls values form the form_data which in turn is used to create the viz.
            image: [], base64 encoded image with prefix "data:image/jpeg;base64,"
            image_type: jpeg
        }
        """
        body = request.json
        self.logger.info(f"get_viz_explanation Request: {body}")
        image = body["image"]
        # file = self.upload_to_genai(image)
        datasource = body["datasource"]
        form_data = body["form_data"]
        controls = body["controls"]
        response = {}
        return self.json_response(response)
        
    @expose("/questionnaire", methods=["POST"])
    def questionnaire(self) -> FlaskResponse:
        """
        conversation: [
            {
                question: string
                answer: string
            }
        ]
        """
        body = request.json
        conversation = body["conversation"]
        response = self.context_questionnaire.nextQuestion(conversation)
        return self.json_response(response)