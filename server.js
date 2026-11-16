
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();

// ---------- DATABASE CONNECTION ----------
const db = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Jeru2526',
    database: 'student_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ---------- TEST MYSQL CONNECTION ----------
db.getConnection()
    .then(connection => {
        console.log('MySQL connected successfully!');
        connection.release();
    })
    .catch(err => {
        console.error('MySQL connection failed:', err.message);
    });

// ---------- MIDDLEWARE ----------
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'change-this-to-any-long-random-text',
    resave: false,
    saveUninitialized: false
}));

// ---------- ADMIN PROTECTION ----------
function requireAdmin(req, res, next) {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Admins only.');
    }
    next();
}

// ---------- ADMIN ROUTES ----------
app.get('/admin.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin page.html'));
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, fullname, student_id, email, role, created_at FROM users ORDER BY created_at DESC'
        );

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).send('Database error.');
    }
});

app.get('/api/admin/logins', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT l.id, l.attempted_username, l.success,
                    l.ip_address, l.logged_at, u.fullname
             FROM login_logs l
             LEFT JOIN users u ON u.id = l.user_id
             ORDER BY l.logged_at DESC LIMIT 200`
        );

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).send('Database error.');
    }
});

// ---------- PUBLIC WEBSITE FILES ----------
app.use(express.static(path.join(__dirname, 'Public')));

// ---------- REGISTER ----------
app.post('/register', async (req, res) => {

    const { fullname, studentid, email, password } = req.body;
    const confirm = req.body['confirm-password'];

    if (password !== confirm) {
        return res.send(
            'Passwords do not match. <a href="/register.html">Go back</a>'
        );
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO users
            (fullname, student_id, email, password_hash)
            VALUES (?, ?, ?, ?)`,
            [fullname, studentid, email, hash]
        );

        console.log('Registration successful:', email);

        // Redirect to login after successful registration
        res.redirect('/login.html');

    } catch (err) {
        console.error('Registration error:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.send(
                'Email or Student ID already registered. <a href="/register.html">Go back</a>'
            );
        }

        res.status(500).send(
            'Registration failed: ' + err.message
        );
    }
});

// ---------- LOGIN ----------
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ? OR student_id = ?',
            [username, username]
        );

        const user = rows[0];

        if (!user) {
            return res.send(
                'Account not found. <a href="/login.html">Try again</a>'
            );
        }

        const ok = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!ok) {
            return res.send(
                'Incorrect password. <a href="/login.html">Try again</a>'
            );
        }

        req.session.userId = user.id;
        req.session.fullname = user.fullname;
        req.session.role = user.role;

        console.log('Login successful:', username);

        res.redirect('/home.html');

    } catch (err) {
        console.error('Login error:', err);

        res.status(500).send(
            'Server error: ' + err.message
        );
    }
});

// ---------- LOGOUT ----------
app.get('/logout', (req, res) => {

    req.session.destroy(() => {
        res.redirect('/login.html');
    });

});

// ---------- START SERVER ----------
app.listen(3000, () => {
    console.log('Running at http://localhost:3000');
});
