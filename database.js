const express = require('express');
const { Client } = require('pg');
const path = require('path');

const app = express();
const PORT = 3000;

// PostgreSQL client setup
const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "postgres",
    database: "examdb"
});

// Connect to PostgreSQL
client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

// Define a route to fetch course data based on batch and year
app.get('/api/courses', (req, res) => {
    const year = req.query.year;
    const batch = req.query.batch;

    if (!year || !batch) {
        return res.status(400).send('Year and batch are required');
    }

    const query = `
        SELECT r.year, r.class, c.code AS course_code, c.title AS course_title, h.head, COUNT(s.regno) AS num_students
        FROM recap r
        JOIN course c ON r.cid = c.cid
        JOIN head h ON r.fid = h.hid
        JOIN cmarks cm ON cm.rid = r.rid
        JOIN student s ON s.regno = cm.regno
        WHERE r.year = $1 AND r.class = $2
        GROUP BY r.year, r.class, c.code, c.title, h.head
        ORDER BY c.code
    `;

    client.query(query, [year, batch], (err, result) => {
        if (err) {
            console.error('Query error', err.stack);
            res.status(500).send('Error occurred: ' + err.message);
        } else {
            const courses = result.rows;
            const numStudents = courses.reduce((total, course) => total + parseInt(course.num_students), 0);

            res.json({
                courses,
                numStudents
            });
        }
    });
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
