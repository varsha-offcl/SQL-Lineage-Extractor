from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlglot

from models.schemas import SQLInput
from parser.sql_parser import parse_sql, extract_ctes, detect_query_type
from parser.lineage_extractor import extract_column_lineage, extract_table_lineage, build_table_nodes
from parser.row_extractor import extract_row_filters
from parser.graph_builder import build_reactflow_graph

app = FastAPI(title="SQL Lineage Extractor", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok", "version": "2.0"}

@app.post("/api/lineage")
def extract_lineage(body: SQLInput):
    try:
        ast = parse_sql(body.sql, body.dialect)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL parse error: {str(e)}")

    query_type = detect_query_type(ast)
    ctes = extract_ctes(ast)

    try:
        column_edges = extract_column_lineage(body.sql, body.dialect)
    except Exception:
        column_edges = []

    table_edges = extract_table_lineage(ast, ctes)
    row_filters = extract_row_filters(body.sql, body.dialect)
    table_nodes = build_table_nodes(ast, ctes)

    result = build_reactflow_graph(table_nodes, table_edges, column_edges, row_filters)
    
    result["ctes"] = list(ctes.keys())
    result["dialect"] = body.dialect
    result["query_type"] = query_type

    return result


@app.post("/api/validate")
def validate_sql(body: SQLInput):
    try:
        sqlglot.transpile(body.sql, read=body.dialect, error_level=sqlglot.ErrorLevel.RAISE)
        return {"valid": True, "errors": []}
    except Exception as e:
        return {"valid": False, "errors": [str(e)]}
