import { 
    AssistantActions,
    SelectAssistantSuggestionAction,
    LoadDatabaseDataAction,
    LoadDatabaseSchemaPropsAction,
    LoadDatabaseSchemaTablesAction,
    LoadDatabaseSchemaTableColumnsAction,
    UpdateDatabaseSchemaTableAction,
    ClearDatabaseSchemaTablePropsAction,
    ClearDatabaseSchemaTableColumnsAction,
    NewPromptAction,
    PromptResponseAction
} from '../actions';
import * as ActionTypes from '../actions/types';
import { DatasourceProps } from '../ContextBuilder/Datasource';
import { DatasourceSchemaProps } from '../ContextBuilder/DatasourceSchema';
import { DatasourceTableProps } from '../ContextBuilder/DatasourceTable';
import { ChatMessageProps } from '../ChatMessages/ChatMessage';


export default function AssistantReducer(
    state = {
        enabled: false,
        data: [],
        selected: null,
        conversation: []
    }, 
    action: AssistantActions
){
    
    switch(action.type){
        case ActionTypes.SELECT_SUGGESTION:
            return {
                ...state,
                selected: {
                    ...(action as SelectAssistantSuggestionAction).payload
                },
                enabled: true
            }
        
        case ActionTypes.LOAD_DATASOURCE_PROPS:
            console.log("Action Data", action);
            return {
                ...state,
                data: (action as LoadDatabaseDataAction).payload.data
            }
        case ActionTypes.LOAD_DATABASE_SCHEMA_PROPS:
            let actionData = (action as LoadDatabaseSchemaPropsAction).payload.data;
            console.log("Action Data", actionData, state.data);
            return {
                ...state,
                data: state.data.map((datasource: DatasourceProps) => {
                    actionData.forEach((schema: DatasourceSchemaProps) => {
                        if (datasource.id === schema.databaseId) {
                            datasource.schema.push(schema);
                        }
                    });
                    return datasource;
                })
            }

        case ActionTypes.LOAD_DATABASE_SCHEMA_TABLE_PROPS:
            let tableActionData = (action as LoadDatabaseSchemaTablesAction).payload.data;
            // update state.data.schema.tables
            return {
                ...state,
                data: state.data.map((datasource: DatasourceProps) => {
                    datasource.schema = datasource.schema.map((schema: DatasourceSchemaProps) => {
                        tableActionData.forEach((table: DatasourceTableProps) => {
                            if (schema.schemaName === table.schemaName) {
                                schema.tables.push(table);
                            }
                        });
                        return schema;
                    });
                    return datasource;
                })
            }
        
        case ActionTypes.CLEAR_DATABASE_SCHEMA_TABLE_PROPS:
            let schemaToClearTables = (action as ClearDatabaseSchemaTablePropsAction).payload.data;
            // update state.data.schema.tables to empty array
            return {
                ...state,
                data: state.data.map((datasource: DatasourceProps) => {
                    datasource.schema = datasource.schema.map((schema: DatasourceSchemaProps) => {
                        if (datasource.id === schemaToClearTables.databaseId && schema.schemaName === schemaToClearTables.schemaName) {
                            schema.tables = [];
                        }
                        return schema;
                    });
                    return datasource;
                })
            }

        case ActionTypes.LOAD_DATABASE_SCHEMA_TABLE_COLUMNS_PROPS:
            let columnActionData = (action as LoadDatabaseSchemaTableColumnsAction).payload.data;
            let tableToUpdate = (action as LoadDatabaseSchemaTableColumnsAction).payload.table;
            // update state.data.schema.tables.columns
            return {
                ...state,
                data: state.data.map((datasource: DatasourceProps) => {
                    datasource.schema = datasource.schema.map((schema: DatasourceSchemaProps) => {
                        schema.tables = schema.tables.map((table: DatasourceTableProps) => {
                            if (
                                datasource.id === tableToUpdate.databaseId &&
                                schema.schemaName === tableToUpdate.schemaName &&
                                table.tableName === tableToUpdate.tableName
                            ){
                                table.columns = columnActionData;
                            }
                            return table;
                        });
                        return schema;
                    });
                    return datasource;
                })
            }

        case ActionTypes.CLEAR_DATABASE_SCHEMA_TABLE_COLUMNS_PROPS:
            let tableToClearColumns = (action as ClearDatabaseSchemaTableColumnsAction).payload.table;
            // update state.data.schema.tables.columns to empty array
            return {
                ...state,
                data: state.data.map((datasource: DatasourceProps) => {
                    datasource.schema = datasource.schema.map((schema: DatasourceSchemaProps) => {
                        schema.tables = schema.tables.map((table: DatasourceTableProps) => {
                            if (
                                datasource.id === tableToClearColumns.databaseId &&
                                schema.schemaName === tableToClearColumns.schemaName &&
                                table.tableName === tableToClearColumns.tableName
                            ){
                                table.columns = [];
                                table.selectedColumns = [];
                                table.selected = false;
                                table.data = [];
                            }
                            return table;
                        });
                        return schema;
                    });
                    return datasource;
                })
            }
        
        case ActionTypes.UPDATE_DATABASE_SCHEMA_TABLE_PROPS:
            let updatedTable = (action as UpdateDatabaseSchemaTableAction).payload.data;
            console.log("Updated Table", updatedTable);
            // Deselect all tables and columns for datasource not equal to updatedTable.databaseId
            return {
                ...state,
                data: state.data.map((datasource: DatasourceProps) => {
                    datasource.schema = datasource.schema.map((schema: DatasourceSchemaProps) => {

                        schema.tables = schema.tables.map((table: DatasourceTableProps) => {
                            if (datasource.id !== updatedTable.databaseId){
                                table.selected = false;
                                table.selectedColumns = [];
                            }
                            if (
                                datasource.id === updatedTable.databaseId &&
                                schema.schemaName === updatedTable.schemaName &&
                                table.tableName === updatedTable.tableName
                            ){
                                table = updatedTable;
                            }
                            return table;
                        });
                        return schema;
                    });
                    return datasource;
                })
            }
        
        case ActionTypes.NEW_PROMPT:
            const { promptId: newPromptId, data } = (action as NewPromptAction).payload
            console.log("New Prompt", newPromptId, data, state)
            const newState = {
                ...state,
                conversation: [
                    ...state.conversation || [],
                    {
                        id: newPromptId,
                        prompt: data
                    }
                ]
            }
            console.log("New prompt added to conversation state", newState);
            return  newState;
        
        case ActionTypes.UPDATE_PROMPT_RESPONSE:
            const { promptId, response } = (action as PromptResponseAction).payload
            return {
                ...state,
                conversation: state.conversation?.map((prompt: ChatMessageProps) => {
                    if(prompt.id === promptId){
                        return {
                            ...prompt,
                            response
                        }
                    }
                    return prompt;
                })
            }

        default:
            return state;
    }
}