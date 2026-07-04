from pydantic import BaseModel
from typing import Optional, List


class SQLInput(BaseModel):
    sql: str
    dialect: Optional[str] = "ansi"


class ColumnNodeSchema(BaseModel):
    id: str
    table: str
    column: str
    alias: Optional[str] = None
    expression: Optional[str] = None


class TableNodeSchema(BaseModel):
    id: str
    name: str
    type: str
    columns: List[ColumnNodeSchema] = []


class ColumnEdge(BaseModel):
    source: str
    target: str
    transform: Optional[str] = None


class TableEdge(BaseModel):
    source: str
    target: str
    join_condition: Optional[str] = None
    join_type: Optional[str] = None


class RowFilter(BaseModel):
    table: str
    clause_type: str
    expression: str
    columns_referenced: List[str] = []


class LineageResponse(BaseModel):
    nodes: list
    edges: list
    ctes: List[str] = []
    dialect: str
    query_type: str
