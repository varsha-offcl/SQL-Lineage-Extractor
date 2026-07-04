"""
Column + table lineage extraction using sqlglot's lineage API.
Falls back to manual AST traversal for complex expressions.
"""
from sqlglot import exp
from sqlglot.lineage import lineage as sqlglot_lineage

from .sql_parser import parse_sql, extract_ctes, extract_joins, get_select_node, get_ddl_target


def extract_column_lineage(sql: str, dialect: str = "ansi") -> list:
    ast = parse_sql(sql, dialect)
    select_node = get_select_node(ast)
    if not select_node:
        return []

    results = []
    ddl_target = get_ddl_target(ast)
    ctes = extract_ctes(ast)

    schema_dict = {}
    for cte_name, cte_ast in ctes.items():
        cte_select = get_select_node(cte_ast)
        if cte_select:
            schema_dict[cte_name] = [e.alias_or_name for e in cte_select.expressions]

    for select_expr in select_node.expressions:
        col_name = select_expr.alias_or_name
        output_id = f"{ddl_target}.{col_name}" if ddl_target else f"OUTPUT.{col_name}"

        try:
            safe_dialect = "" if dialect.lower() == "ansi" else dialect
            node = sqlglot_lineage(col_name, sql=sql, dialect=safe_dialect, schema=schema_dict)
            edges = _walk_lineage_node(node, output_id)
            if edges and not any(e["source"].startswith("unknown.") for e in edges):
                results.extend(edges)
            else:
                results.extend(_manual_column_trace(select_expr, output_id, select_node, ctes))
        except Exception as e:
            results.extend(_manual_column_trace(select_expr, output_id, select_node, ctes))

    return results


def _walk_lineage_node(node, target_col: str) -> list:
    edges = []
    # In sqlglot lineage, downstream points to the data sources (upstream in dataflow)
    for d in node.downstream:
        source_id = d.name
        transform = None
        if node.expression:
            unaliased = node.expression.unalias()
            if not isinstance(unaliased, exp.Column):
                transform = str(unaliased)

        edges.append({"source": source_id, "target": target_col, "transform": transform})
        edges.extend(_walk_lineage_node(d, source_id))
    return edges


def _manual_column_trace(select_expr: exp.Expression, target: str, select_node: exp.Select = None, ctes: dict = None) -> list:
    edges = []
    from_tables = []
    if select_node:
        from_clause = select_node.find(exp.From)
        if from_clause and isinstance(from_clause.this, exp.Table):
            from_tables.append(from_clause.this.alias_or_name)
        for join in extract_joins(select_node):
            from_tables.append(join["table"])

    for col in select_expr.find_all(exp.Column):
        source_table = col.table
        
        if not source_table and ctes and from_tables:
            for tbl in from_tables:
                if tbl in ctes:
                    cte_select = get_select_node(ctes[tbl])
                    if cte_select:
                        cte_cols = [e.alias_or_name for e in cte_select.expressions]
                        if col.name in cte_cols:
                            source_table = tbl
                            break
                            
        if not source_table:
            if len(from_tables) == 1:
                source_table = from_tables[0]
            else:
                source_table = "unknown"
                
        source_col = col.name
        edges.append({
            "source": f"{source_table}.{source_col}",
            "target": target,
            "transform": str(select_expr) if not isinstance(select_expr, exp.Column) else None
        })
    return edges


def extract_table_lineage(ast: exp.Expression, ctes: dict) -> list:
    edges = []
    select_node = get_select_node(ast)
    if not select_node:
        return edges

    ddl_target = get_ddl_target(ast)
    output_name = ddl_target or "OUTPUT"

    # Primary FROM
    from_clause = select_node.find(exp.From)
    if from_clause:
        from_expr = from_clause.this
        if isinstance(from_expr, exp.Table):
            src = from_expr.name
            edges.append({"source": src, "target": output_name, "join_type": None, "join_condition": None})
        elif isinstance(from_expr, exp.Subquery):
            subq_alias = from_expr.alias or "__subquery__"
            edges.append({"source": subq_alias, "target": output_name, "join_type": "SUBQUERY", "join_condition": None})

    # JOINs
    for join in select_node.find_all(exp.Join):
        if isinstance(join.this, exp.Table):
            join_parts = []
            if join.side:
                join_parts.append(join.side)
            if join.kind:
                join_parts.append(join.kind)
            join_parts.append("JOIN")
            join_type_str = " ".join(join_parts).upper()
            
            edges.append({
                "source": join.this.name,
                "target": output_name,
                "join_type": join_type_str,
                "join_condition": str(join.args.get("on", "")) or None
            })

    # UNIONs
    for union in ast.find_all(exp.Union):
        for branch in [union.left, union.right]:
            if branch is None:
                continue
            branch_from = branch.find(exp.From)
            if branch_from and isinstance(branch_from.this, exp.Table):
                src = branch_from.this.name
                edges.append({"source": src, "target": output_name, "join_type": "UNION", "join_condition": None})

    # CTE chains
    for cte_name, cte_ast in ctes.items():
        cte_from = cte_ast.find(exp.From)
        if cte_from and isinstance(cte_from.this, exp.Table):
            cte_src = cte_from.this.name
            edges.append({"source": cte_src, "target": cte_name, "join_type": "CTE", "join_condition": None})
        for cte_join in cte_ast.find_all(exp.Join):
            if isinstance(cte_join.this, exp.Table):
                join_parts = []
                if cte_join.side:
                    join_parts.append(cte_join.side)
                if cte_join.kind:
                    join_parts.append(cte_join.kind)
                join_parts.append("JOIN")
                join_type_str = " ".join(join_parts).upper()
                
                edges.append({
                    "source": cte_join.this.name,
                    "target": cte_name,
                    "join_type": join_type_str,
                    "join_condition": str(cte_join.args.get("on", "")) or None
                })

    return edges


def build_table_nodes(ast: exp.Expression, ctes: dict) -> list:
    tables = []
    seen = set()
    ddl_target = get_ddl_target(ast)
    output_name = ddl_target or "OUTPUT"
    output_type = "ddl_target" if ddl_target else "output"

    for tbl in ast.find_all(exp.Table):
        name = tbl.name
        if name and name not in seen and name != output_name:
            node_type = "cte" if name in ctes else "source"
            tables.append({
                "id": name, "name": name, "type": node_type,
                "node_layer": "table", "columns": [], "row_filters": []
            })
            seen.add(name)

    for cte_name in ctes:
        if cte_name not in seen:
            tables.append({
                "id": cte_name, "name": cte_name, "type": "cte",
                "node_layer": "table", "columns": [], "row_filters": []
            })
            seen.add(cte_name)

    if output_name not in seen:
        tables.append({
            "id": output_name, "name": output_name, "type": output_type,
            "node_layer": "table", "columns": [], "row_filters": []
        })

    return tables
