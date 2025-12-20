import sqlite3

DB='backend/db.sqlite3'
conn=sqlite3.connect(DB)
cur=conn.cursor()
cur.execute("SELECT id, sku, name, seller_id, is_active FROM catalog_product WHERE sku='SKU00001' LIMIT 1")
row=cur.fetchone()
if row:
    print('FOUND', row)
else:
    print('NOT_FOUND')
cur.execute("SELECT count(*) FROM catalog_product WHERE sku LIKE 'SKU%'")
print('TOTAL_SKU_PRODUCTS', cur.fetchone()[0])
conn.close()
