import { SupersetClient } from "@superset-ui/core";
import { AssistantSuggestionProps } from "./AssistantHome/AssistantSuggestion";
import { DatasourceProps } from "./ContextBuilder/Datasource";
import { DatasourceTableProps } from "./ContextBuilder/DatasourceTable";
import { DatasourceSchemaProps } from "./ContextBuilder/DatasourceSchema";

interface Descriptions {
  human_understandable: string,
  llm_optimized: string,
}


export const getTableDescription = async (data: any, target: string) => {
  const endpoint = "assistant/gemini/table"
  const request = {
    data: JSON.stringify(data),
    table_name: target
  }
  console.log("getTableDescription : Request", request);
  try {
    const response = await SupersetClient.post({ endpoint: endpoint, body: JSON.stringify(request), headers: { 'Content-Type': 'application/json' } });
    // console.log("Response", response.json);
    const responseJson = JSON.parse(response.json);
    // console.log("Response 2", responseJson);
    const descriptions: Descriptions = {
      human_understandable: responseJson["human_understandable"],
      llm_optimized: responseJson["llm_optimized"]
    }
    console.log("Response 3 ", descriptions);
    return descriptions;
  } catch (error) {
    console.error("getTableDescription: Error fetching table description:", error);
    return { human_understandable: "", llm_optimized: "" };
  }
};

// retains only selected data from array of DatasourceProps

export function cleanDatasourceProps(data: DatasourceProps[]):DatasourceProps | undefined {
  if(!data){
    return undefined
  }
  const clean = data.map(datasource => filterSelectedSchemas(datasource)).filter(datasource => datasource.schema.length > 0);
  if (clean.length === 0) {
    return undefined;
  }
  return clean[0]
}

function filterSelectedSchemas(data: DatasourceProps): DatasourceProps {
  return {
    ...data,
    schema: data.schema.map(schema => filterSelectedTables(schema)).filter(schema => schema.tables.length > 0)
  }
}

// Returns DatasourceSchemaProps with only selected tables
// Selected tables have selected columns
function filterSelectedTables(data: DatasourceSchemaProps): DatasourceSchemaProps {
  return {
    ...data,
    tables: data.tables.map(table => filterSelectedColumns(table)).filter(table => table.columns.length > 0)
  }
}

// Returns DatasourceTableProps with only selected columns
function filterSelectedColumns(data: DatasourceTableProps): DatasourceTableProps {
  return {
    ...data,
    columns: data.columns.filter((column) => column.selected),
  }
}

export const getVizSuggestions = async (data: DatasourceProps[], purpose: string) => {
  console.log("getVizSuggestions : Request", data);
  const suggestionColors = [
    '#FFD0EC', '#FBD0FF', '#D0E0FF', '#D0F9FF', '#FFD0EC',
  ];
  const endpoint = "assistant/gemini/viz-suggestions"
  const request = {
    data: JSON.stringify(data),
    purpose: purpose
  }
  // console.log("getVizSuggestions: Request", request);
  try {
    const response = await SupersetClient.post({ endpoint: endpoint, body: JSON.stringify(request), headers: { 'Content-Type': 'application/json' } });
    // console.log("getVizSuggestions: Response", response.json);
    const responseJson = JSON.parse(response.json);
    // console.log("getVizSuggestions : Response 2", responseJson);
    const suggestions = responseJson.map((r: any) => {
      const suggestion: AssistantSuggestionProps = {
        ...r,
        title: r["viz_type"],
        suggestion: r["description"],
        backgroundColor: suggestionColors[Math.floor(Math.random() * suggestionColors.length)],
      };
      return suggestion;
    });
    console.log("getVizSuggestions : Suggestion", suggestions);
    return suggestions;
  } catch (error) {
    console.error("getVizSuggestions: Error fetching table description:", error);
    return [];
  }
};

export function saveChartExample(viz_type: string, controls: any, formData: any) {
  const endpoint = 'assistant/gemini/save-control-values/';
  const data = {
    viz_type: viz_type,
    controls: controls,
    form_data: formData,
  };
  SupersetClient.post({ endpoint: endpoint, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).then((response) => {
    console.log("contextUtils saveChartExample Response:", response);
  });
}


export function getChartControlValues(instruction:string, controls: {}, formData: {}) {
  const endpoint = 'assistant/gemini/get-control-values';
  const data = {
    instruction: instruction,
    controls: controls,
    formData: formData
  };
  return SupersetClient.post({ endpoint: endpoint, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
    .then((response) => {
      console.log("assistantUtils getChartControlValues Response:", response);
      return JSON.parse(response.json)
    });
}

export function getChartExplanation(datasource: any, controls: any, form_data: any, image: any) {
  const endpoint = 'assistant/gemini/get-viz-explanation';
  const data = {
    datasource: datasource,
    controls: controls,
    form_data: form_data,
    image: image
  };
  console.log("assistantUtils getChartExplanation data", JSON.stringify(data));
  return SupersetClient.post({ endpoint: endpoint, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
    .then((response) => {
      console.log("assistantUtils getChartExplanation Response:", response);
      return JSON.parse(response.json)
    });
}

export function dbConnection(dbPk: number) {
  console.log("assistantUtils dbConnection dbPk", dbPk);
  const endpoint = `assistant/gemini/db/${dbPk}`
  return SupersetClient.get({ endpoint: endpoint, headers: { 'Content-Type': 'application/json' } })
    .then((response) => {
      console.log("assistantUtils dbConnection Response:", response);

    })
    .catch((error) => {
      console.error("assistantUtils dbConnection Error:", error);
      throw error;
    })
}

export type PromptPayload = {
  databaseId: number;
  context: {
    schemaName: string;
    description?: string;
    tables: {
      tableName: string;
      description?: string;
      descriptionExtra?: string;
      columns: {
        columnName: string;
        columnType: string;
        columnDescription?: string
      }[];
    }[];
  }[]
  prompt: string;
};

export function assistantPrompt(context: DatasourceProps, prompt: string) {
  const endpoint = 'assistant/prompt';
  const data: PromptPayload = {
    databaseId: context.id,
    context: context.schema.map(schema => ({
      schemaName: schema.schemaName,
      description: schema.description,
      tables: schema.tables.map(table => ({
        tableName: table.tableName,
        description: table.description,
        descriptionExtra: table.descriptionExtra,
        columns: table.columns.filter(column => column.selected).map(column => ({
          columnName: column.columnName,
          columnType: column.columnType,
          columnDescription: column.columnDescription
        }))
      }))
    })),
    prompt: prompt
  };

  console.log("assistantPrompt data", JSON.stringify(data));

  return SupersetClient.post({ endpoint: endpoint, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
    .then((response) => {
      console.log("assistantPrompt prompt Response:", response);

    })
    .catch((error) => {
      console.error("assistantPrompt prompt Error:", error);
      throw error;
    });
}