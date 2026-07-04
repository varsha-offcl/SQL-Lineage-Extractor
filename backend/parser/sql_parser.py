"""
Core SQL parser using sqlglot.
Handles: CTEs, subqueries, JOINs, UNION, DDL (CREATE VIEW, CREATE TABLE AS, INSERT INTO).
"""
import sqlglot
from sqlglot import exp


def parse_sql(sql: str, dialect: str = "ansi") -> exp.Expression:
    statements = sqlglot.parse(sql.strip(), dialect=dialect, error_level=sqlglot.ErrorLevel.WARN)
    if not statements:
        raise ValueError("No valid SQL statement found.")
    return statements[0]


def detect_query_type(ast: exp.Expression) -> str:
    if isinstance(ast, exp.Create):
        kind = ast.args.get("kind", "")
        if str(kind).upper() == "VIEW":
            return "CREATE_VIEW"
        return "CREATE_TABLE_AS"
    if isinstance(ast, exp.Insert):
        return "INSERT"
    return "SELECT"


def extract_ctes(ast: exp.Expression) -> dict:
    ctes = {}
    with_clause = ast.find(exp.With)
    if with_clause:
        for cte in with_clause.expressions:
            ctes[cte.alias] = cte.this
    return ctes


def extract_joins(select_ast: exp.Expression) -> list:
    joins = []
    for join in select_ast.find_all(exp.Join):
        table_expr = join.this
        if isinstance(table_expr, exp.Table):
            table_name = table_expr.alias_or_name
        elif isinstance(table_expr, exp.Subquery):
            table_name = table_expr.alias or "__subquery__"
        else:
            table_name = str(table_expr)

        joins.append({
            "table": table_name,
            "join_type": (join.side or "INNER").upper(),
            "condition": str(join.args.get("on", "")) or None,
            "using": [c.name for c in (join.args.get("using") or [])]
        })
    return joins


def get_select_node(ast: exp.Expression):
    if isinstance(ast, exp.Create):
        return ast.find(exp.Select)
    if isinstance(ast, exp.Insert):
        return ast.find(exp.Select)
    if isinstance(ast, exp.Select):
        return ast
    return ast.find(exp.Select)


def get_ddl_target(ast: exp.Expression):
    if isinstance(ast, exp.Create):
        tbl = ast.find(exp.Table)
        return tbl.name if tbl else None
    if isinstance(ast, exp.Insert):
        tbl = ast.find(exp.Table)
        return tbl.name if tbl else None
    return None
