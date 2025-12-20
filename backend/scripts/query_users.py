import sqlite3, os
DB = os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3')
DB = os.path.normpath(DB)
conn = sqlite3.connect(DB)
c = conn.cursor()
try:
    c.execute('SELECT id, email, role, is_verified FROM accounts_user ORDER BY id LIMIT 20')
    for r in c.fetchall():
        print(r)
except Exception as e:
    print('Error:', e)
finally:
    conn.close()
