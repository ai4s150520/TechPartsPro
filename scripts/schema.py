import sqlite3
conn=sqlite3.connect('backend/db.sqlite3')
cur=conn.cursor()
cur.execute("PRAGMA table_info('catalog_product')")
rows=cur.fetchall()
for r in rows:
    print(r)
conn.close()
