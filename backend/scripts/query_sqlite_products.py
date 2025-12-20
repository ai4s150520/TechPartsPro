import sqlite3
import os
DB = os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3')
DB = os.path.normpath(DB)
print('DB PATH:', DB)
conn = sqlite3.connect(DB)
c = conn.cursor()
# check tables
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'catalog_%';")
print('catalog tables:', c.fetchall())
try:
    c.execute('SELECT count(*) FROM catalog_product')
    print('TOTAL_PRODUCTS:', c.fetchone()[0])
    c.execute('SELECT sku, name, seller_id, created_at FROM catalog_product ORDER BY created_at DESC LIMIT 30')
    rows = c.fetchall()
    for r in rows:
        print(r)
except Exception as e:
    print('Error querying product table:', e)
finally:
    conn.close()
