```javascript
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET || "CHANGE_THIS_SECRET_IN_PRODUCTION";

const db = new Database("database.db");

app.use(cors());
app.use(express.json());

/* =========================
   DATABASE
========================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    rank TEXT NOT NULL DEFAULT 'Unranked',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/*
  اگر database.db قبلی باشد و ستون rank نداشته باشد،
  ستون را بدون حذف کاربران اضافه می‌کنیم.
*/
try {
  db.exec(`
    ALTER TABLE users
    ADD COLUMN rank TEXT NOT NULL DEFAULT 'Unranked'
  `);
} catch (error) {
  // ستون rank از قبل وجود دارد؛ کاری لازم نیست.
}

/* =========================
   INITIAL ACCOUNTS
========================= */

/*
  اکانت‌های فعلی حفظ می‌شوند.
  INSERT OR IGNORE باعث می‌شود اگر قبلاً ساخته شده‌اند،
  پسورد یا Rank آنها دوباره نوشته نشود.
*/

const initialAccounts = [
  ["arazel01", "full_access"],
  ["arazel02", "full_access"],

  ["arazel03", "user"],
  ["arazel04", "user"],
  ["arazel05", "user"]
  ["arazel06", "user"],
  ["arazel07", "user"],
  ["arazel08", "user"],
  ["arazel09", "user"],
  ["arazel10", "user"],
  ["arazel11", "user"],
  ["arazel12", "user"],
  ["arazel13", "user"],
  ["arazel14", "user"],
  ["arazel15", "user"],
  ["arazel16", "user"],
  ["arazel17", "user"],
  ["arazel18", "user"],
  ["arazel19", "user"],
  ["arazel20", "user"],
  ["arazel21", "user"],
  ["arazel22", "user"],
  ["arazel23", "user"],
  ["arazel24", "user"],
  ["arazel25", "user"],
  ["arazel26", "user"],
  ["arazel27", "user"],
  ["arazel28", "user"],
  ["arazel29", "user"],
  ["arazel30", "user"],
  ["arazel31", "user"],
  ["arazel32", "user"],
  ["arazel33", "user"],
  ["arazel34", "user"],
  ["arazel35", "user"],
  ["arazel36", "user"],
  ["arazel37", "user"],
  ["arazel38", "user"],
  ["arazel39", "user"],
  ["arazel40", "user"]
];

/*
  مهم:
  این قسمت پسورد جدید تولید نمی‌کند.
  فقط برای نصب اولیه اکانت‌هایی که وجود ندارند است.

  اگر database.db فعلی‌ات اکانت‌ها را دارد،
  این بخش آنها را دستکاری نمی‌کند.
*/

const insertNewUser = db.prepare(`
  INSERT OR IGNORE INTO users
  (username, password_hash, role, rank)
  VALUES (?, ?, ?, ?)
`);

/*
  اگر اکانتی در DB موجود نباشد، اینجا ساخته می‌شود.
  برای امنیت، پسوردها را اینجا قرار نده.
  اکانت‌های موجود فعلی دست‌نخورده باقی می‌مانند.
*/

/* =========================
   REGISTER
========================= */

app.post("/api/register", async (req, res) => {
  try {
    const { username, password, rank } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "نام کاربری و رمز عبور الزامی است."
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        message: "نام کاربری باید حداقل ۳ کاراکتر باشد."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "رمز عبور باید حداقل ۶ کاراکتر باشد."
      });
    }

    const existing = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username);

    if (existing) {
      return res.status(409).json({
        message: "این نام کاربری قبلاً ثبت شده است."
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = db
      .prepare(`
        INSERT INTO users
        (username, password_hash, role, rank)
        VALUES (?, ?, 'user', ?)
      `)
      .run(
        username,
        hash,
        rank || "Unranked"
      );

    res.status(201).json({
      message: "اکانت با موفقیت ساخته شد.",
      user: {
        id: result.lastInsertRowid,
        username,
        role: "user",
        rank: rank || "Unranked"
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "خطای داخلی سرور."
    });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "نام کاربری و رمز عبور الزامی است."
      });
    }

    const user = db
      .prepare(`
        SELECT
          id,
          username,
          password_hash,
          role,
          rank
        FROM users
        WHERE username = ?
      `)
      .get(username);

    if (!user) {
      return res.status(401).json({
        message: "نام کاربری یا رمز عبور اشتباه است."
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        message: "نام کاربری یا رمز عبور اشتباه است."
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "ورود موفق بود.",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        rank: user.rank
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "خطای داخلی سرور."
    });
  }
});

/* =========================
   AUTHENTICATION
========================= */

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "توکن ارسال نشده است."
    });
  }

  try {
    req.user = jwt.verify(
      header.slice(7),
      JWT_SECRET
    );

    next();

  } catch {
    return res.status(401).json({
      message: "توکن منقضی یا نامعتبر است."
    });
  }
}

/* =========================
   CURRENT USER
========================= */

app.get("/api/me", authenticate, (req, res) => {
  const user = db
    .prepare(`
      SELECT
        id,
        username,
        role,
        rank,
        created_at
      FROM users
      WHERE id = ?
    `)
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({
      message: "کاربر پیدا نشد."
    });
  }

  res.json({
    user
  });
});

/* =========================
   GET ALL USERS
========================= */

app.get("/api/users", authenticate, (req, res) => {

  /*
    نقش را دوباره از دیتابیس می‌خوانیم
    تا اگر Rank/دسترسی تغییر کرده باشد،
    اطلاعات قدیمی JWT باعث دسترسی اشتباه نشود.
  */

  const currentUser = db
    .prepare(`
      SELECT id, username, role
      FROM users
      WHERE id = ?
    `)
    .get(req.user.id);

  if (!currentUser || currentUser.role !== "full_access") {
    return res.status(403).json({
      message: "دسترسی کافی ندارید."
    });
  }

  const users = db
    .prepare(`
      SELECT
        id,
        username,
        role,
        rank,
        created_at
      FROM users
      ORDER BY id ASC
    `)
    .all();

  res.json({
    users
  });
});

/* =========================
   CHANGE USER RANK
========================= */

app.patch(
  "/api/users/:id/rank",
  authenticate,
  (req, res) => {

    const currentUser = db
      .prepare(`
        SELECT id, username, role
        FROM users
        WHERE id = ?
      `)
      .get(req.user.id);

    /*
      فقط Full Access
    */

    if (!currentUser || currentUser.role !== "full_access") {
      return res.status(403).json({
        message: "فقط Full Access می‌تواند Rank را تغییر دهد."
      });
    }

    const userId = Number(req.params.id);
    const { rank } = req.body;

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        message: "شناسه اکانت نامعتبر است."
      });
    }

    if (
      typeof rank !== "string" ||
      rank.trim().length === 0
    ) {
      return res.status(400).json({
        message: "Rank را انتخاب کنید."
      });
    }

    /*
      اکانت 1 و 2 همچنان Full Access می‌مانند.
      Rank آنها را هم می‌توان ذخیره کرد،
      اما role آنها تغییر نمی‌کند.
    */

    const targetUser = db
      .prepare(`
        SELECT id, username, role, rank
        FROM users
        WHERE id = ?
      `)
      .get(userId);

    if (!targetUser) {
      return res.status(404).json({
        message: "اکانت پیدا نشد."
      });
    }

    db.prepare(`
      UPDATE users
      SET rank = ?
      WHERE id = ?
    `).run(
      rank.trim(),
      userId
    );

    const updatedUser = db
      .prepare(`
        SELECT
          id,
          username,
          role,
          rank,
          created_at
        FROM users
        WHERE id = ?
      `)
      .get(userId);

    res.json({
      success: true,
      message: "Rank با موفقیت تغییر کرد.",
      user: updatedUser
    });
  }
);

/* =========================
   CHANGE RANK + ROLE
   OPTIONAL ADMIN API
========================= */

app.patch(
  "/api/users/:id/access",
  authenticate,
  (req, res) => {

    const currentUser = db
      .prepare(`
        SELECT id, username, role
        FROM users
        WHERE id = ?
      `)
      .get(req.user.id);

    if (!currentUser || currentUser.role !== "full_access") {
      return res.status(403).json({
        message: "فقط Full Access اجازه تغییر دسترسی دارد."
      });
    }

    const userId = Number(req.params.id);
    const { rank, role } = req.body;

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        message: "شناسه اکانت نامعتبر است."
      });
    }

    const targetUser = db
      .prepare(`
        SELECT id, username, role, rank
        FROM users
        WHERE id = ?
      `)
      .get(userId);

    if (!targetUser) {
      return res.status(404).json({
        message: "اکانت پیدا نشد."
      });
    }

    /*
      اکانت 1 و 2 را Full Access نگه می‌داریم.
    */

    let newRole = role || targetUser.role;

    if (targetUser.id === 1 || targetUser.id === 2) {
      newRole = "full_access";
    }

    /*
      فقط این دو نوع نقش را قبول می‌کنیم.
    */

    if (
      newRole !== "user" &&
      newRole !== "full_access"
    ) {
      return res.status(400).json({
        message: "Role نامعتبر است."
      });
    }

    const newRank =
      typeof rank === "string" && rank.trim()
        ? rank.trim()
        : targetUser.rank;

    db.prepare(`
      UPDATE users
      SET role = ?, rank = ?
      WHERE id = ?
    `).run(
      newRole,
      newRank,
      userId
    );

    const updatedUser = db
      .prepare(`
        SELECT
          id,
          username,
          role,
          rank,
          created_at
        FROM users
        WHERE id = ?
      `)
      .get(userId);

    res.json({
      success: true,
      message: "اطلاعات اکانت تغییر کرد.",
      user: updatedUser
    });
  }
);

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({
    name: "Arazel Backend",
    status: "online"
  });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `Arazel backend running on port ${PORT}`
  );
});
```
    
