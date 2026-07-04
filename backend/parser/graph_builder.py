"""
Builds ReactFlow compatible nodes and edges from lineage data.
"""

def build_reactflow_graph(table_nodes, table_edges, column_edges, row_filters):
    rf_nodes = []
    rf_edges = []
    
    # 1. Build Tables
    tables_list = []
    for tbl in table_nodes:
        if not tbl.get("id") or not tbl.get("name"):
            continue
            
        tables_list.append({
            "id": tbl["id"],
            "name": tbl["name"],
            "type": tbl["type"],
            "columns": []
        })
        
        # Determine ReactFlow node type
        rf_type = 'sourceTableNode'
        if tbl["type"] in ['output', 'ddl_target']:
            rf_type = 'outputNode'
        elif tbl["type"] in ['cte', 'subquery']:
            rf_type = 'transformNode'

        # Filter row filters for this table
        tbl_filters = [rf for rf in row_filters if rf["table"] == tbl["id"]]

        # We only pass the count of filters to the node, not the full logic
        # Full logic will be passed in the tables_list which goes to the inspector
        rf_nodes.append({
            "id": tbl["id"],
            "type": rf_type,
            "data": {
                "id": tbl["id"],
                "name": tbl["name"],
                "type": tbl["type"],
                "columns": [],  # Will be populated
                "filter_count": len(tbl_filters),
                "isExpanded": False,
                "isSelected": False
            },
            "position": {"x": 0, "y": 0}
        })

    # 2. Build Column edges to know which columns exist
    column_lineage = []
    for edge in column_edges:
        src, tgt = edge["source"], edge["target"]
        if not src or not tgt or src == tgt:
            continue
            
        src_table = src.split(".")[0] if "." in src else "unknown"
        src_col = src.split(".")[1] if "." in src else src
        tgt_table = tgt.split(".")[0] if "." in tgt else "unknown"
        tgt_col = tgt.split(".")[1] if "." in tgt else tgt
        
        transform = edge.get("transform")
        
        # Determine transform type
        transformType = "DIRECT"
        if transform:
            transformType = "COMPUTED"
            transform_upper = transform.upper()
            if any(agg in transform_upper for agg in ['SUM(', 'COUNT(', 'AVG(', 'MAX(', 'MIN(']):
                transformType = "AGGREGATED"
            elif 'OVER (' in transform_upper or any(w in transform_upper for w in ['LAG(', 'LEAD(', 'RANK(', 'ROW_NUMBER(', 'DENSE_RANK(']):
                transformType = "WINDOW"

        column_lineage.append({
            "source": src,
            "target": tgt,
            "transformType": transformType,
            "expression": transform
        })
        
        # Add columns to node data
        for n in rf_nodes:
            if n["id"] == src_table and src_col not in n["data"]["columns"]:
                n["data"]["columns"].append(src_col)
            if n["id"] == tgt_table and tgt_col not in n["data"]["columns"]:
                n["data"]["columns"].append(tgt_col)

    # 3. Build Table Edges
    joins = []
    # To handle multiple joins of the same table at different levels, we need unique IDs
    # But for ReactFlow edges, id must be unique.
    edge_counts = {}
    for edge in table_edges:
        src, tgt = edge["source"], edge["target"]
        if src and tgt and src != tgt:
            join_cond = edge.get("join_condition")
            join_type = edge.get("join_type") or "DIRECT"
            joins.append({
                "source": src,
                "target": tgt,
                "type": join_type,
                "condition": join_cond
            })
            
            base_id = f"te-{src}-{tgt}"
            edge_counts[base_id] = edge_counts.get(base_id, 0) + 1
            unique_id = f"{base_id}-{edge_counts[base_id]}"
            
            # ReactFlow table edge
            rf_edges.append({
                "id": unique_id,
                "source": src,
                "target": tgt,
                "type": "smoothstep",
                "animated": False,
                "data": { "isTableEdge": True, "join_type": join_type, "join_condition": join_cond },
                "style": { "stroke": "#3f3f46", "strokeWidth": 2 }
            })

    # 4. Build ReactFlow Column Edges
    for cedge in column_lineage:
        src_table = cedge["source"].split(".")[0] if "." in cedge["source"] else "unknown"
        tgt_table = cedge["target"].split(".")[0] if "." in cedge["target"] else "unknown"
        
        # Colors: solid blue = passthrough, dashed purple = computed, green = aggregated, orange = window
        stroke = "#3b82f6" # blue
        strokeDasharray = "none"
        if cedge["transformType"] == "COMPUTED":
            stroke = "#a855f7" # purple
            strokeDasharray = "5 5"
        elif cedge["transformType"] == "AGGREGATED":
            stroke = "#10b981" # green
            strokeDasharray = "5 5"
        elif cedge["transformType"] == "WINDOW":
            stroke = "#f59e0b" # orange
            strokeDasharray = "5 5"
            
        rf_edges.append({
            "id": f"ce-{cedge['source']}-{cedge['target']}",
            "source": src_table,
            "sourceHandle": cedge["source"],
            "target": tgt_table,
            "targetHandle": cedge["target"],
            "type": "bezier",
            "animated": True,
            "hidden": True, # Hidden by default
            "data": { "isColumnEdge": True, "srcTable": src_table, "tgtTable": tgt_table, "expression": cedge["expression"] },
            "style": { "stroke": stroke, "strokeWidth": 2, "strokeDasharray": strokeDasharray, "opacity": 0.7, "zIndex": 10 }
        })

    return {
        "tables": tables_list,
        "joins": joins,
        "columnLineage": column_lineage,
        "filters": row_filters,
        "nodes": rf_nodes,
        "edges": rf_edges
    }
