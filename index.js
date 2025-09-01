const express = require('express');
const mysql = require('mysql');
const app = express()
const bodyParser = require("body-parser")
const cors = require('cors')
const response = require('./response')
const bcrypt = require('bcrypt');
const host = "localhost"
const port = 3001
let database;

async function prepare_db() {
    const mysql_temp = require("mysql2/promise");
    const database_temp = await mysql_temp.createConnection({
        host: host,
        user: "root",
        password: ""
    });

    // create database if not exists
    const check_database = await database_temp.query("SHOW DATABASES LIKE 'internflow'");
    if (check_database[0] === undefined) return;

    await database_temp.query("CREATE DATABASE IF NOT EXISTS internflow");
    await database_temp.query("USE internflow");

    // create table
    await database_temp.query(`CREATE TABLE tasks (
  id int(11) NOT NULL,
  title varchar(255) DEFAULT NULL,
  description text DEFAULT NULL,
  due_date datetime DEFAULT NULL,
  created_at datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`)
    await database_temp.query(`CREATE TABLE task_users (
  id int(11) NOT NULL,
  task_id int(11) DEFAULT NULL,
  user_id int(11) DEFAULT NULL,
  submission text NOT NULL,
  status enum('in_progress','completed') DEFAULT 'in_progress',
  finished_at datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`);
    await database_temp.query(`CREATE TABLE users (
  id int(11) NOT NULL,
  name varchar(20) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role enum('admin','intern','disabled') NOT NULL DEFAULT 'intern',
  created_at date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`);

    // insert table
    await database_temp.query(`INSERT INTO users (id, name, password_hash, role, created_at) VALUES
(1, 'Admin1', '$2b$13$aPk.Hm2cn7oNDDNRxC.xGunu6/yhrfzRtmO6jTiDPNN9wPtrca/lS', 'admin', '2025-06-11'),
(2, 'user2', '$2b$13$nEh0ca6lC6t3VQU4eKt.j.lT4kEZLNG0AsLwiiB9ZrSCK1qJIRmJy', 'intern', '2025-06-13'),
(3, 'user3', '$2b$13$XX4kfonEAc6nkaArHkvBaupA1aBlUIqztXtMShDS/xVawWhgAUAxC', 'intern', '2025-06-13'),
(4, 'user4', '$2b$13$6zndug6HGn6487gsOMMsruCe4S5AQdA1FnciC.jikQFgtu0ufyK1O', 'intern', '2025-06-13'),
(5, 'user5', '$2b$13$GKwYyQyxZxUcj92r8HctQO8tW.rQhTzOCsUv9KgVf8CgVpoxY9Fra', 'intern', '2025-06-13'),
(6, 'user6', '$2b$13$DyV4wBIVugXb1ecKfrH62.EedY3VbpAuTveW6f2CrBfT/4hps7pGG', 'intern', '2025-06-13'),
(7, 'user7', '$2b$13$HUBLB7Y7/c/AkXEbP5TH2e4rjwkvOkFLMwZuuop65K9Z8GdLKRG2G', 'intern', '2025-06-13'),
(8, 'user8', '$2b$13$PApMFGIMIRwSSbBSL8Zdq.CDXH7eVpe39lGbaSuYfiCDTwvT.yU9S', 'intern', '2025-06-13'),
(9, 'user9', '$2b$13$0IYYGehL5wK7OtNx4xpL2u4qVow8j1v07Ts.ha4EGylVJQLR/NkGi', 'intern', '2025-06-13');
`);
    await database_temp.query(`INSERT INTO task_users (id, task_id, user_id, submission, status, finished_at) VALUES
(84, 56, 2, '', 'in_progress', NULL),
(85, 56, 3, '', 'in_progress', NULL),
(86, 56, 4, '', 'in_progress', NULL),
(87, 56, 5, 'https://drive.google.com', 'completed', '2025-07-04 14:21:14'),
(88, 56, 6, '', 'in_progress', NULL),
(89, 56, 7, '', 'in_progress', NULL),
(90, 56, 8, '', 'in_progress', NULL),
(91, 56, 9, '', 'in_progress', NULL),
(93, 57, 1, '', 'in_progress', NULL),
(94, 57, 2, '', 'in_progress', NULL),
(95, 57, 3, '', 'in_progress', NULL),
(96, 57, 4, '', 'in_progress', NULL),
(97, 57, 5, 'https://drive.com', 'completed', '2025-08-28 09:55:53'),
(98, 57, 6, '', 'in_progress', NULL),
(99, 57, 7, '', 'in_progress', NULL),
(100, 57, 8, '', 'in_progress', NULL),
(101, 57, 9, '', 'in_progress', NULL),
(103, 58, 2, '', 'in_progress', NULL),
(104, 58, 3, '', 'in_progress', NULL),
(105, 58, 4, '', 'in_progress', NULL),
(106, 58, 5, 'https://google.drive.com', 'completed', '2025-08-28 10:18:25'),
(107, 59, 7, '', 'in_progress', NULL),
(108, 59, 8, '', 'in_progress', NULL),
(109, 59, 9, '', 'in_progress', NULL);
`)
    await database_temp.query(`INSERT INTO tasks (id, title, description, due_date, created_at) VALUES
(56, 'Desain Halaman Login', 'Buat halaman login responsif menggunakan HTML, CSS, dan Bootstrap.', '2025-07-12 00:00:00', '2025-06-17 09:02:04'),
(57, 'Membuat API CRUD untuk Manajemen Pengguna', 'Implementasikan fungsi Create, Read, Update, dan Delete menggunakan Express.js untuk tabel users', '2025-07-12 00:00:00', '2025-06-17 09:19:30'),
(58, 'Integrasi Frontend dengan API', 'Ambil dan tampilkan daftar intern dari backend menggunakan React.', '2025-07-12 00:00:00', '2025-06-17 09:23:28'),
(59, 'Dokumentasi Setup Proyek', 'Buat README yang menjelaskan cara menjalankan proyek secara lokal untuk intern baru.', '2025-06-28 00:00:00', '2025-06-17 09:28:08');`)

    // alter table
    await database_temp.query("ALTER TABLE tasks ADD PRIMARY KEY (id);");
    await database_temp.query("ALTER TABLE task_users ADD PRIMARY KEY (id), ADD KEY task_id (task_id), ADD KEY user_id (user_id);");
    await database_temp.query("ALTER TABLE users ADD PRIMARY KEY (id);");
    await database_temp.query("ALTER TABLE tasks MODIFY id int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;");
    await database_temp.query("ALTER TABLE task_users MODIFY id int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=130;");
    await database_temp.query("ALTER TABLE users MODIFY id int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;");
    
    await database_temp.query(`ALTER TABLE task_users
  ADD CONSTRAINT task_users_ibfk_1 FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  ADD CONSTRAINT task_users_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
`)

    // close connection
    await database_temp.end();
}

const tableName = "users"

app.use(cors())
app.use(bodyParser.json())

//Main gates of API
app.get("/", (req, res) => {
    res.send("Wellcome to API")
}) 

//Get Users
app.get("/users", (req, res) => {
    const sql = `SELECT * FROM ${tableName}`
    database.query(sql, (err, rows) => {
       if(err) throw err
       response(200, rows, "Succeed Getting Data", res)
   })
})

//Get Users by ID
app.get("/users/:id", (req, res) => {
    const id = req.params.id
    const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
    database.query(sql, [id], (err, fields) => {
        if(err) throw err
        response(200, fields, "Succeed Getting Data", res)
    })
})

//Submit Users Data
app.post("/users", async (req, res) => {
    const { name, password} = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 13); // Hash the plain password
        const sql = `INSERT INTO ${tableName} (name, password_hash) VALUES (?, ?)`;
        const values = [name, hashedPassword];
        database.query(sql, values, (err, fields) => {
            if (err) return response(500, null, "Error adding user", res);
            if (fields?.affectedRows) {
                response(200, fields, "Succeed Adding Data", res);
            }
        });
    } catch (err) {
        response(500, null, "Server error", res);
    }
});

//Update Data
app.put("/users", async (req, res) => {
    const { id, name, role } = req.body;
    try {
        const sql = `UPDATE ${tableName} SET name = ?, role = ? WHERE id = ?`;
        const values = [name, role, id];

        database.query(sql, values, (err, fields) => {
            if (err) return response(500, null, "Error updating user", res);
            if (fields?.affectedRows) {
                response(200, fields, "Succeed Updating Data", res);
            } else {
                response(404, null, "User not found", res);
            }
        });
    } catch (err) {
        response(500, null, "Server error", res);
    }
});

//Delete Data
app.delete("/users", (req, res) => {
    const { id } = req.body
    const sql = `DELETE FROM ${tableName} WHERE id = ${id}`
    const sqlAutoInc = `ALTER TABLE ${tableName} AUTO_INCREMENT = 1;`
    database.query(sql, (err, fields) => {
        if(err) response(500, "Invalid", "Error", res)
        if(fields?.affectedRows){ 
            response(200, fields, "Succeed Deleting Data", res)
            database.query(sqlAutoInc)
        }
    })
})

app.post("/login", (req, res) => {
    const { id, password } = req.body;

    // Find user by email
    const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
    database.query(sql, [id], async (err, result) => {
        if (err) return response(500, null, "Database error", res);
        if (result.length === 0) {
            return response(401, null, "ID not registered", res);
        }

        const user = result[0];
        try {
            // Compare hashed password
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return response(401, null, "Incorrect User ID or password", res);
            }

            // Don't send password hash back
            delete user.password_hash;

            return response(200, user, "Login successful", res);
        } catch (error) {
            console.log(error)
            //console.error(error);
            return response(500, null, "Server error", res);
        }
    });
});

app.get("/tasks", (req, res) => {
    const sql = `SELECT * FROM tasks`;

    database.query(sql, (err, rows) => {
        if (err) return response(500, null, "Error fetching tasks", res);
        response(200, rows, "Succeed Getting Tasks", res);
    });
});

app.post("/tasks", (req, res) => {
    const { user_ids, title, description, due_date } = req.body;

    const sql = `
        INSERT INTO tasks (title, description, due_date)
        VALUES (?, ?, ?)
    `;
    const values = [title, description, due_date];

    database.query(sql, values, (err, result) => {
        if (err) return response(500, null, "Error creating task", res);

        const taskId = result.insertId;

        // Insert into task_users
        const bridgeValues = user_ids.map(user_id => [taskId, user_id]);
        const bridgeSql = `INSERT INTO task_users (task_id, user_id) VALUES ?`;

        database.query(bridgeSql, [bridgeValues], (err2, result2) => {
            if (err2) return response(500, null, "Error assigning users to task", res);
            response(201, { taskId, assigned: result2.affectedRows }, "Task created and assigned", res);
        });
    });
});

app.get("/tasks/user/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT tasks.*, task_users.status
        FROM tasks
        JOIN task_users ON tasks.id = task_users.task_id
        WHERE task_users.user_id = ?
    `;

    database.query(sql, [user_id], (err, rows) => {
        if (err) return response(500, null, "Error fetching user's tasks", res);
        response(200, rows, "Succeed Getting User's Tasks", res);
    });
});

app.get("/task/:id", (req, res) => {
    const { id } = req.params;

    const sqlTask = `SELECT * FROM tasks WHERE id = ?`;
    const sqlUsers = `
        SELECT users.id, users.name, users.role, task_users.status
        FROM users
        JOIN task_users ON users.id = task_users.user_id
        WHERE task_users.task_id = ?
    `;

    database.query(sqlTask, [id], (err, taskRows) => {
        if (err) return response(500, null, "Error fetching task", res);
        if (taskRows.length === 0) return response(404, null, "Task not found", res);

        database.query(sqlUsers, [id], (err2, userRows) => {
            if (err2) return response(500, null, "Error fetching assigned users", res);

            response(200, { ...taskRows[0], assigned_users: userRows }, "Succeed Getting Task & Assigned Users", res);
        });
    });
});

app.put("/tasks", (req, res) => {
    const { id, title, description, due_date } = req.body;

    const sql = `
        UPDATE tasks 
        SET title = ?, description = ?, due_date = ?
        WHERE id = ?
    `;

    const values = [title, description, due_date, id];

    database.query(sql, values, (err, fields) => {
        if (err) return response(500, null, "Error updating task", res);
        if (fields?.affectedRows) {
            response(200, fields, "Succeed Updating Task", res);
        } else {
            response(404, null, "Task not found", res);
        }
    });
});

app.delete("/tasks", (req, res) => {
    const { id } = req.body;

    const deleteBridgeSql = `DELETE FROM task_users WHERE task_id = ?`;
    const deleteTaskSql = `DELETE FROM tasks WHERE id = ?`;

    database.query(deleteBridgeSql, [id], (err1) => {
        if (err1) return response(500, null, "Error deleting task assignments", res);

        database.query(deleteTaskSql, [id], (err2, fields) => {
            if (err2) return response(500, null, "Error deleting task", res);
            if (fields?.affectedRows) {
                response(200, fields, "Succeed Deleting Task", res);
            } else {
                response(404, null, "Task not found", res);
            }
        });
    });
});

app.post("/task/status", (req, res) => {
    const { task_id, user_id } = req.body;
    const sql = 'SELECT status FROM task_users WHERE task_id = ? AND user_id = ?';
    const values = [task_id, user_id];

    database.query(sql, values, (err, result) => {
        if (err) return response(500, null, "Error finding status", res);
        if (result.length > 0) {
            return response(200, result[0], "Status found", res);
        } else {
            return response(404, result, "Status not found", res);
        }
    });
});

app.post("/task/submit", (req, res) => {
    const { task_id, user_id, submission } = req.body;
    const status = "completed";
    const finished_at = new Date(); // current timestamp

    const sql = `
        UPDATE task_users
        SET submission = ?, status = ?, finished_at = ?
        WHERE task_id = ? AND user_id = ?
    `;

    const values = [submission, status, finished_at, task_id, user_id];

    database.query(sql, values, (err, result) => {
        if (err) return response(500, result, err, res);
        if (result?.affectedRows){
            return response(200, result, "Success submiting data", res);
        } else {
            return response(404, result, err, res);
        }
    });
});

app.get("/task/submission/:task_id/:user_id", (req, res) => {
    const { task_id, user_id } = req.params;

    const sql = `
        SELECT 
            task_users.submission,
            task_users.finished_at,
            task_users.status,
            tasks.title AS task_title,
            users.name AS user_name
        FROM task_users
        JOIN tasks ON tasks.id = task_users.task_id
        JOIN users ON users.id = task_users.user_id
        WHERE task_users.task_id = ? AND task_users.user_id = ?
    `;

    database.query(sql, [task_id, user_id], (err, results) => {
        if (err) return response(500, null, "Database error", res);
        if (results.length > 0) {
            return response(200, results[0], "Submission data retrieved", res);
        } else {
            return response(404, null, "No submission found", res);
        }
    });
});

app.put("/disable_account",(req, res) => {
    const { user_id, change } = req.body

    const sql = 'UPDATE users SET role = ? WHERE id = ?'

    database.query(sql, [change, user_id], (err, result) => {
        if (err) return response(500, null, "Database error", res);
        if (result?.affectedRows) {
            return response(200, result[0], "Account Role Changed", res);
        } else {
            return response(404, null, "No submission found", res);
        }
    })
});

(async () => {
    await prepare_db();

    database = mysql.createConnection({
        host: host,
        user: "root",
        password: "",
        database: "internflow"
    });

    //connect to database
    database.connect((err) =>{
        if(err) throw err
        console.log("Database connected")
    });

    //Running the server
    app.listen(port, () => {
        console.log(`Server is running in http://${`${host}:${port}`} `)
    })
})();


