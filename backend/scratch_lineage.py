import sqlglot
from sqlglot.lineage import lineage

sql = """
SELECT a.x + b.y AS z, a.id
FROM table_a a
JOIN table_b b ON a.id = b.a_id
WHERE a.x > 10
"""
node = lineage("z", sql)
print("Lineage for z:")
print(node.to_html())
for n in node.walk():
    print(n.name, type(n.expression), n.alias)
