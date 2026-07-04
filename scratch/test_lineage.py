import sqlglot
from sqlglot.lineage import lineage

sql = """
WITH cte1 AS (
    SELECT a, b, c + 1 as c_computed FROM t1
), cte2 AS (
    SELECT a, SUM(b) as sum_b, c_computed FROM cte1 GROUP BY a, c_computed
)
SELECT a, sum_b, c_computed FROM cte2
"""

for col in ["a", "sum_b", "c_computed"]:
    print(f"--- Lineage for {col} ---")
    node = lineage(col, sql, dialect="ansi")
    print(node.to_html())
    for up in node.upstream:
        print(f"Upstream: {up.source_name}.{up.name}, expression: {up.expression}")
