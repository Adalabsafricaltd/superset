import { QueryResults, SupersetClient } from "@superset-ui/core";
import { nanoid } from "nanoid";
import domToImage from 'dom-to-image-more';


export interface DatabaseContext {
    databases: DatabaseData[];
}

export interface DatabaseData {
    database_id: number;
    database_name: string;
    schemas: DatabaseScemaData[];
    backend: string;
}

export interface DatabaseScemaData {
    schema_name: string;
    description?: string;
    tables: DatabaseSchemaTableData[];
}

export interface DatabaseSchemaTableData {
    table_name: string;
    description?: string;
    suggested?: string;
    columns: ColumnData[];
}

export interface ColumnData {
    column_name: string;
    data_type: string;
    description?: string;
    suggested?: string;
}

export const emptyDatabaseContext: DatabaseContext = {
    databases: [],
};

/**
 * TODO
 * 1. Build DatabseContext
 * 1.1 Get all databases
 * 1.2 Get all Schemas for each database
 * 1.3 Get all tables for each schema
 * 1.4 Get all columns for each table
 * 
 */

/**
 * Fetch Database Data
 * @returns Promise<DatabaseData[]>
 */
export const fetchDatabaseData = async () => {
    try {
        const response = await SupersetClient.get({ endpoint: '/api/v1/database/' });
        console.log("Response:", response.json);
        const databases = await response.json.result.map((database: any) => {
            const databaseId = database.id;
            const database_name = database.database_name;
            const backend = database.backend;
            // const schemas = await fetchSchemaData(databaseId);
            return {
                database_id: databaseId,
                database_name: database_name,
                backend: backend
            };
        });
        return databases;
    } catch (error) {
        console.error("Error fetching database data:", error);
        return [];
    }
}
/**
 * Fetch Schema Data for a given database
 * @param databaseId
 * @returns Promise<DatabaseScemaData>
 */
export const fetchSchemaData = async (databaseId: number) => {
    const endpoint = `/api/v1/database/${databaseId}/schemas/`;
    try {
        const response = await SupersetClient.get({ endpoint: endpoint });
        const schemas: DatabaseScemaData[] = response.json.result.map((schema: any) => {
            const schema_name = schema;
            // const tables = await fetchTableData(databaseId, schema_name);
            return {
                schema_name: schema,
                tables: []
            };
        });
        return schemas;
    } catch (error) {
        console.error("Error fetching schema data:", error);
        return [];
    }
}

/**
 * Fetch Table Data for a given schema
 * @param databaseId
 * @param schemaName
 * @returns Promise<DatabaseSchemaTableData>
 */
export const fetchTableData = async (databaseId: number, schemaName: string) => {
    const params = {
        "force": true,
        "schema_name": schemaName
    }
    const q = encodeURIComponent(JSON.stringify(params));
    const endpoint = `/api/v1/database/${databaseId}/tables/?q=${q}`;
    try {
        const response = await SupersetClient.get({ endpoint: endpoint });
        const tables: DatabaseSchemaTableData[] = response.json.result.map((table: any) => {
           
            // const columns = await fetchColumnData(databaseId, schemaName, table_name);
            return {
                table_name: table.value,
                columns: []
            };
        });
        return tables;
    } catch (error) {
        console.error("Error fetching table data:", error);
        return [];
    }
}

/**
 * Fetch Column Data for a given table
 * @param databaseId 
 * @param schemaName 
 * @param tableName 
 * @returns Promise<ColumnData[]>
 */
export const fetchColumnData = async (databaseId: number, schemaName: string, tableName: string) => {
    const endpoint = `/api/v1/database/${databaseId}/table/${tableName}/${schemaName}/`;
    try {
        const response = await SupersetClient.get({ endpoint: endpoint });
        const columns:ColumnData[]  = response.json.columns.map((column: any) => {
            return {
                column_name: column.name,
                data_type: column.type,
                description: column.comment
            };
        });
        return columns;
    } catch (error) {
        console.error("Error fetching column data:", error);
        return [];
    }
}

/**
 * Request example 
 * {
    "client_id": "nxRxlemJ_5A",
    "database_id": 3,
    "json": true,
    "runAsync": true,
    "schema": "mongo.repo",
    "sql": "SELECT * FROM mongo.repo.ambulances;",
    "sql_editor_id": "1",
    "tab": "Untitled Query 1",
    "tmp_table_name": "",
    "select_as_cta": true,
    "ctas_method": "TABLE",
    "queryLimit": 1000,
    "expand_data": true
}
    endpoint POST: /api/v1/sqllab/execute/
 * @param query 
 */
export const executeQuery = async (databaseId: number, schema: string, query: string) => {
    const endpoint = `/api/v1/sqllab/execute/`;
    const data = {
        client_id: nanoid(11),
        database_id: databaseId,
        json: true,
        runAsync: false,
        catalog: null,
        schema: schema,
        sql: query,
        sql_editor_id: "2",
        tab: "Assistant Query Lab",
        tmp_table_name: "",
        select_as_cta: false,
        ctas_method: "TABLE",
        queryLimit: 20,
        expand_data: true
      };
      // required schema, sql 
    try {
        const response = await SupersetClient.post({ endpoint: endpoint, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
        console.log("Request: ", JSON.stringify(data));
        console.log("Response:", response);
        const queryResults: QueryResults = {
            results: {
                displayLimitReached: false,
                columns: response.json.columns,
                data: response.json.data,
                expanded_columns: response.json.expanded_columns,
                selected_columns: response.json.selected_columns,
                query: response.json.query,
                query_id: response.json.query_id,
            }
        }
        return queryResults
    } catch (error) {
        console.log("Request: ", JSON.stringify(data));
        console.log("Error executing query:", error);
        return null;
    }
};

/**
 * Get Select Star Query for a given table
 */
export const getSelectStarQuery = async ( databaseId: number, tableName: string, schemaName: string ) =>{
    // http://localhost:8088/api/v1/database/3/select_star/activate_org_laboratory/mongo.repo/
    const endpoint = `/api/v1/database/${databaseId}/select_star/${tableName}/${schemaName}/`;
    try {
        const response = await SupersetClient.get({ endpoint: endpoint });
        console.log("Response:", response.json.result);
        return response.json.result;
    } catch (error) {
        console.error("Error fetching select star query:", error);
        return '';
    }
};


export function getDatabaseContext(): DatabaseContext {
    const appContainer = document.getElementById('app');
    const dataBootstrap = appContainer?.getAttribute('data-bootstrap');
    return dataBootstrap ? JSON.parse(dataBootstrap) : emptyDatabaseContext;
}

export function readableColor(hex: string, thresholdBright: number = 150, thresholdDark: number = 140): string {
    // If hex is invalid, return black
    if (!hex || hex.length < 7) {
        return '#000000';
    }

    // Remove the alpha channel if present
    if (hex.length === 9) {
        hex = hex.slice(0, 7);
    }

    // Convert hex to RGB
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    // console.log('Color: %s, Brightness: %d, Threshold: %d <> %d', hex, brightness, thresholdBright, thresholdDark);

    if (brightness > thresholdBright) {
        return '#000000';
    } else if (brightness < thresholdDark) {
        return '#FFFFFF';
    } else {
        // Adjust color for better contrast
        const adjustColor = (color: number) => Math.min(255, color + 50);
        const adjustedColor = `#${((1 << 24) + (adjustColor(r) << 16) + (adjustColor(g) << 8) + adjustColor(b)).toString(16).slice(1)}`;
        return adjustedColor;
    }
}

export function adjustOpacity(hex: string, opacity: number) {
    const validOpacity = Math.min(1, Math.max(0, opacity));
    // if hex is invalid, return white
    // If hex is invalid, return white
    if (!hex || (hex.length !== 7 && hex.length !== 9)) {
        return '#FFFFFF';
    }

    // Remove the alpha channel if present
    if (hex.length === 9) {
        hex = hex.slice(0, 7);
    }

    //  valid opacity to hex part
    const opacityHex = Math.round(validOpacity * 255).toString(16);
    const opacityHexStr = opacityHex.length === 1 ? `0${opacityHex}` : opacityHex;
    return '#' + hex.slice(1) + opacityHexStr;

}

export async function getDomAsImageByteArray(selector: string) {
    const element = document.querySelector(selector);
    if (!element) {
        console.error(`getDomAsImageByteArray Element with selector "${selector}" not found.`);
        return;
    }

    // Mapbox controls are loaded from different origin, causing CORS error
    // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL#exceptions
    const filter = (node: Element) => {
        if (typeof node.className === 'string') {
          return (
            node.className !== 'mapboxgl-control-container' &&
            !node.className.includes('header-controls')
          );
        }
        return true;
    };

    let retVal = null;
    try {
        const data = await domToImage.toJpeg(element, {
            filter: filter,
            bgcolor: '#ffffff',
        });
        retVal = data;
        console.log('getDomAsImageByteArray converted DOm to image:', data);
    } catch (error: any) {
     console.error('getDomAsImageByteArray Error converting DOM to image:', error);
    }
    return retVal;
}
