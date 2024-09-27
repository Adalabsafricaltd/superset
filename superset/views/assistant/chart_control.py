import json
from superset import db
from superset.models.slice import Slice  # Assuming you are using models from Superset

class ChartControl:
    def __init__(self,datasource_id,chart_type):
        self.datasource_id = datasource_id
        self.chart_type = chart_type

    def create_chart_payload(self):
        datasource_id = self.datasource_id
        chart_type = self.chart_type
        x_axis = "Id"
        y_axis = "Name"
       
        
        if chart_type == "pie":
            common_params = {
                        "time_range": "No filter",
                        "metric": {
                            "expressionType": "SQL",
                            "sqlExpression":f"COUNT('{y_axis}')",
                            "label": "Values",
                            "optionName": "metric_1"
                        },
                        "adhoc_filters": [],
                        "groupby": [f"{y_axis}"],
                        "columns": [],
                        "row_limit": 1000,
                        "color_scheme": "bnbColors",
                        "show_legend": True
                    }
            return {
                "slice_name": "Test Pie Chart Version 2",
                "viz_type": "pie",
                "datasource_id": datasource_id,
                "datasource_type": "table",
                # "params": json.dumps({**form_data, **common_params}),
                # "chart_id": form_data["slice_id"]
                # "params": json.dumps({
                    **common_params,
                    "label_type": "value"  # Options: 'value', 'percent'
                # })
            }
        elif chart_type == "bar":
            common_params = {
                            "time_range": "No filter",
                            "metrics": {
                                "expressionType": "SQL",
                                "sqlExpression":f"COUNT('{y_axis}')",
                                "label": "Values",
                                "optionName": "metric_2"
                            },
                            "adhoc_filters": [],
                            "groupby": [f"{y_axis}"],
                            "columns": [],
                            "row_limit": 1000,
                            "color_scheme": "bnbColors",
                            "show_legend": True
                        }

            return {
                "slice_name": "Test Bar Chart",
                "viz_type": "echarts_timeseries_bar",
                "datasource_id": datasource_id,
                "datasource_type": "table",
                # "params": 
                "label_type": "value",
                "x_axis_label": "Category",
                "y_axis_label": "Values",
                "y_axis_format": "d",
                "bar_stacked": False,
                "x_axis":f"{x_axis}",
                **common_params
                
            }
        elif chart_type == "area":
            common_params = {
                            "time_range": "No filter",
                            "metrics": {
                                "expressionType": "SQL",
                                "sqlExpression":f"COUNT('{y_axis}')",
                                "label": "Values",
                                "optionName": "metric_3"
                            },
                            "adhoc_filters": [],
                            "groupby": [f"{y_axis}"],
                            "columns": [],
                            "row_limit": 1000,
                            "color_scheme": "bnbColors",
                            "show_legend": True
                        }
            return {
                "slice_name": "Test Area Chart",
                "viz_type": "echarts_area",
                "datasource_id": datasource_id,
                "datasource_type": "table",
                # "params": json.dumps({
                    **common_params,
                    "x_axis_label": "Category",
                    "y_axis_label": "Values",
                    "y_axis_format": "d",
                    "stacked_style": "normal",
                    "x_axis":f"{x_axis}"
                # })
            }
        else:
            raise ValueError(f"Unsupported chart type: {chart_type}")
        
    def create_chart_in_superset(self):
        payload = self.create_chart_payload()

        # Create a new slice (chart) instance
        new_slice = Slice(
            slice_name=payload["slice_name"],
            viz_type=payload["viz_type"],
            datasource_id=payload["datasource_id"],
            datasource_type=payload["datasource_type"],
            params=payload["params"]
        )
        
        # Add the slice to the database
        db.session.add(new_slice)
        db.session.commit()
        print(f"Created {self.chart_type} chart: {new_slice.slice_name}")

    # # Example of automating chart creation
    # datasource_id = 1  # Replace with your actual datasource ID
    # chart_types = ["pie", "line", "area"]

    # for chart_type in chart_types:
    #     create_chart_in_superset(datasource_id, chart_type)

