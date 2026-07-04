# SQL Lineage Extractor

Paste any SQL query → get an interactive lineage graph showing exactly how data flows.

## What it handles
- SELECT, JOIN, GROUP BY, HAVING, WHERE, LIMIT
- Multi-level CTEs (WITH clauses)
- CREATE VIEW / CREATE TABLE AS SELECT
- INSERT INTO SELECT
- UNION / UNION ALL
- Nested subqueries
- Column-level derivation tracking (SUM, CAST, COALESCE etc.)
- Multiple SQL dialects (Postgres, MySQL, BigQuery, Snowflake, Spark, DuckDB...)

---

## How to Run

### Terminal 1 — Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev
```

### Open browser
```
http://localhost:5173
```

---

## How to Use

1. Paste your SQL in the left panel
2. Select your SQL dialect from the dropdown (default: ansi)
3. Click **⚡ Analyze Lineage**
4. Switch between views:
   - **⬛ Table Flow** — which tables feed which (vertical lineage)
   - **🔗 Column Lineage** — which columns derive from which (horizontal lineage)
   - **🌐 Full Graph** — everything combined
5. Click any node to inspect its filters and expressions in the right panel

---

## Example Queries to Try

### 1. Basic JOIN
```sql
SELECT o.order_id, c.name, SUM(oi.price) AS total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status = 'completed'
GROUP BY o.order_id, c.name
HAVING SUM(oi.price) > 500;
```

### 2. Multi-level CTE
```sql
WITH
  raw AS (SELECT * FROM events WHERE event_type = 'purchase'),
  agg AS (SELECT user_id, COUNT(*) AS cnt FROM raw GROUP BY user_id),
  ranked AS (SELECT *, RANK() OVER (ORDER BY cnt DESC) AS rnk FROM agg)
SELECT user_id, cnt, rnk FROM ranked WHERE rnk <= 10;
```

### 3. CREATE VIEW (shows view lineage)
```sql
CREATE VIEW active_revenue AS
SELECT c.region, SUM(o.amount) AS total_revenue
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status = 'active'
GROUP BY c.region;
```

### 4. UNION ALL
```sql
SELECT id, name, 'active' AS status FROM active_users
UNION ALL
SELECT id, name, 'archived' AS status FROM archived_users;
```
