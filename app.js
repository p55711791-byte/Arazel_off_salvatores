```python
import sqlite3
import secrets
import string
import bcrypt

DATABASE = "database.db"

TOTAL_ACCOUNTS = 40
FULL_ACCESS = 2

# اتصال به دیتابیس
conn = sqlite3.connect(DATABASE)
cursor = conn.cursor()

# ساخت جدول کاربران
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
)
""")

# ساخت رمز تصادفی
def generate_password(length=12):
    chars = string.ascii_letters + string.digits
    return "".join(
        secrets.choice(chars)
        for _ in range(length)
    )

accounts = []

# ساخت 40 اکانت
for i in range(1, TOTAL_ACCOUNTS + 1):

    username = f"arazel{i:02d}"

    password = generate_password()

    if i <= FULL_ACCESS:
        role = "full_access"
    else:
        role = "user"

    password_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    try:

        cursor.execute(
            """
            INSERT INTO users
            (
                username,
                password_hash,
                role
            )
            VALUES (?, ?, ?)
            """,
            (
                username,
                password_hash,
                role
            )
        )

        accounts.append(
            (
                username,
                password,
                role
            )
        )

    except sqlite3.IntegrityError:

        print(
            f"{username} قبلاً وجود دارد."
        )

# ذخیره تغییرات
conn.commit()
conn.close()


# نمایش حساب‌های ساخته‌شده
print()
print("=" * 50)
print("        ARAZEL ACCOUNTS")
print("=" * 50)
print()

for username, password, role in accounts:

    print(
        f"{username:<12} | "
        f"{password:<14} | "
        f"{role}"
    )

print()
print("=" * 50)
print(
    f"Created: {len(accounts)} accounts"
)
print(
    "Full Access: 2"
)
print(
    "Normal Users: 38"

)
print("=" * 50)
```
