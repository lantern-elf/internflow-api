const express = require('express');
const mysql = require('mysql')
const app = express()
const bodyParser = require("body-parser")
const cors = require('cors')
const response = require('./response')
const bcrypt = require('bcrypt');
const host = "localhost"
const port = 3001

const database = mysql.createConnection({
    host: host,
    user: "root",
    password: "",
    database: "internflow"
})
const tableName = "users"

app.use(cors())
app.use(bodyParser.json())

//connect to database
database.connect((err) =>{
    if(err) throw err
    console.log("Database connected")
})

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
            console.error(error);
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

//Running the server
app.listen(port, () => {
    console.log(`Server is running in http://${`${host}:${port}`} `)
})