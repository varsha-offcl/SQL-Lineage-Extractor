"""
Extracts row-level lineage: WHERE, HAVING, GROUP BY, LIMIT, QUALIFY, ORDER BY
"""
from sqlglot import exp
from .sql_parser import parse_sql


def extract_row_filters(sql: str, dialect: str = "ansi") -> list:
    ast = parse_sql(sql, dialect)
    filters = []

    for select_node in ast.find_all(exp.Select):
        table_name = _primary_table(select_node)

        where = select_node.find(exp.Where)
        if where:
            filters.append({
                "clause_type": "WHERE",
                "expression": str(where.this),
                "table": table_name,
                "columns_referenced": _referenced_columns(where)
            })

        having = select_node.find(exp.Having)
        if having:
            filters.append({
                "clause_type": "HAVING",
                "expression": str(having.this),
                "table": table_name,
                "columns_referenced": _referenced_columns(having)
            })

        group = select_node.find(exp.Group)
        if group:
            cols = [str(e) for e in group.expressions]
            filters.append({
                "clause_type": "GROUP BY",
                "expression": ", ".join(cols),
                "table": table_name,
                "columns_referenced": cols
            })

        order = select_node.find(exp.Order)
        if order:
            cols = [str(e.this) for e in order.expressions]
            filters.append({
                "clause_type": "ORDER BY",
                "expression": str(order),
                "table": table_name,
                "columns_referenced": cols
            })

        limit = select_node.find(exp.Limit)
        if limit:
            filters.append({
                "clause_type": "LIMIT",
                "expression": str(limit.this),
                "table": table_name,
                "columns_referenced": []
            })

        qualify = select_node.find(exp.Qualify)
        if qualify:
            filters.append({
                "clause_type": "QUALIFY",
                "expression": str(qualify.this),
                "table": table_name,
                "columns_referenced": _referenced_columns(qualify)
            })

    return filters


def _referenced_columns(node: exp.Expression) -> list:
    cols = []
    for col in node.find_all(exp.Column):
        qualified = f"{col.table}.{col.name}" if col.table else col.name
        cols.append(qualified)
    return list(set(cols))


def _primary_table(select_node: exp.Expression) -> str:
    from_clause = select_node.find(exp.From)
    if from_clause and isinstance(from_clause.this, exp.Table):
        return from_clause.this.alias_or_name
    return "unknown"
