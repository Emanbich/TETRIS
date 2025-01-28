const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});


// Database configuration
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'satisfaction_db',
    connectionLimit: 5,
    bigIntAsNumber: true,
    connectTimeout: 10000,
    acquireTimeout: 10000
});

// Database connection handling
async function executeQuery(query, params = []) {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Executing query:', query);
        console.log('With parameters:', params);
        const result = await conn.query(query, params);
        console.log('Query result:', result);
        return result;
    } catch (err) {
        console.error('Database error details:', {
            message: err.message,
            code: err.code,
            sqlState: err.sqlState,
            stack: err.stack
        });
        let errorMessage = 'Database error occurred';
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            errorMessage = 'Database connection was lost';
        } else if (err.code === 'ER_CON_COUNT_ERROR') {
            errorMessage = 'Database has too many connections';
        } else if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Database connection was refused';
        } else if (err.code === 'ER_DUP_ENTRY') {
            errorMessage = 'Duplicate entry found';
        }

        throw new Error(errorMessage + ': ' + err.message);
    } finally {
        if (conn) {
            try {
                await conn.release();
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError);
            }
        }
    }
}

app.get('/api/health', async (req, res) => {
    try {
        await executeQuery('SELECT 1');
        res.json({ status: 'healthy', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'unhealthy', error: err.message });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/api/users', async (req, res) => {
    try {
        console.log('Received user creation request:', req.body);
        const { name, email, phone } = req.body;

        // Input validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid name',
                details: 'Name is required and must be a non-empty string'
            });
        }

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({
                error: 'Invalid email',
                details: 'Email is required and must be a valid email address'
            });
        }

        if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid phone',
                details: 'Phone is required and must be a non-empty string'
            });
        }

        // Check if user exists with better error handling
        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            console.log('Found existing user:', existingUser[0]);
            return res.json({ id: Number(existingUser[0].id) });
        }

        // Create new user with better error handling
        const result = await executeQuery(
            'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)',
            [name.trim(), email.trim().toLowerCase(), phone.trim()]
        );

        console.log('Created new user:', result);
        res.status(201).json({ id: Number(result.insertId) });
    } catch (err) {
        console.error('Error in /api/users:', err);
        res.status(500).json({
            error: 'Failed to create user',
            details: err.message
        });
    }
});

// Route to start the survey
app.post('/api/start-survey', async (req, res) => {
    try {
        const { name, id } = req.body;
        const result = await executeQuery(
            'INSERT INTO surveys (name, id) VALUES (?, ?)',
            [name || 'Nouveau survey', id]
        );

        res.status(201).json({
            id: Number(result.insertId)
        });
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).json({ error: 'Failed to create survey' });
    }
});

// ...
app.post('/api/responses', async (req, res) => {
    try {
        const { survey_id, responses, user_id } = req.body;

        if (!survey_id || !responses || Object.keys(responses).length === 0) {
            return res.status(400).json({ error: 'Invalid data. Make sure to include survey_id and responses.' });
        }

        // Prépare la requête SQL
        const query = 'INSERT INTO responses (survey_id, question_id, answer, user_id, responded_at) VALUES (?, ?, ?, ?, ?)';

        // Pour chaque item dans le tableau responses
        // item = { question_id, answer, optional_answer }
        const currentDateTime = new Date();
        const values = Object.entries(responses).map(([questionId, answer]) => [
            Number(survey_id),
            Number(questionId),
            answer,
            user_id,
            currentDateTime
        ]);

        for (const value of values) {
            await executeQuery(query, value);
        }

        res.status(200).json({ message: 'Responses successfully recorded.' });
    } catch (err) {
        console.error('Error inserting responses:', err);
        res.status(500).json({ error: 'Server error' });
    }
});



// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Add this new endpoint to fetch analytics data
app.get('/api/analytics/responses', async (req, res) => {
    try {
        const result = await executeQuery(`
          SELECT 
              s.id as survey_id,
              r.question_id,
              r.answer,
              r.responded_at
          FROM surveys s
          JOIN responses r ON s.id = r.survey_id
          ORDER BY s.id, r.question_id
      `);

        // Group responses by survey
        const groupedData = result.reduce((acc, row) => {
            if (!acc[row.survey_id]) {
                acc[row.survey_id] = {
                    survey_id: row.survey_id,
                    responses: []
                };
            }
            acc[row.survey_id].responses.push({
                question_id: row.question_id,
                answer: row.answer,
                responded_at: row.responded_at
            });
            return acc;
        }, {});

        res.json(Object.values(groupedData));
    } catch (err) {
        console.error('Error fetching analytics data:', err);
        res.status(500).send('Server error');
    }
});
app.get('/api/analytics/responses', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                s.id as survey_id,
                u.name as user_name,
                u.email as user_email,
                r.question_id,
                r.answer,
                r.responded_at
            FROM surveys s
            JOIN responses r ON s.id = r.survey_id
            ORDER BY s.id, r.question_id
        `);

        const groupedData = result.reduce((acc, row) => {
            if (!acc[row.survey_id]) {
                acc[row.survey_id] = {
                    survey_id: row.survey_id,
                    user_name: row.user_name,
                    user_email: row.user_email,
                    responses: []
                };
            }
            acc[row.survey_id].responses.push({
                question_id: row.question_id,
                answer: row.answer,
                responded_at: row.responded_at
            });
            return acc;
        }, {});

        res.json(Object.values(groupedData));
    } catch (err) {
        console.error('Error fetching analytics data:', err);
        res.status(500).send('Server error');
    }
});
// Route to get all feedback responses
// Add this route to your backend index.js or update if it exists
// Update your /api/feedback/analysis endpoint in index.js
// Update the /api/feedback/analysis endpoint in index.js

app.get('/api/feedback/analysis', async (req, res) => {
    try {
        console.log('Fetching feedback analysis...');

        const result = await executeQuery(`
            SELECT DISTINCT  -- Add DISTINCT to prevent duplicates
                r.id,
                r.survey_id,
                r.answer as originalText,
                r.nlp_analysis as analysis,
                r.responded_at as timestamp
            FROM responses r
            WHERE r.question_id = 10  -- Feedback question
            AND r.nlp_analysis IS NOT NULL
            ORDER BY r.responded_at DESC
        `);

        console.log('Raw result count:', result.length);

        // Add deduplication logic
        const uniqueResponses = result.reduce((acc, current) => {
            // Use survey_id as the key for uniqueness
            if (!acc.some(item => item.survey_id === current.survey_id)) {
                acc.push(current);
            }
            return acc;
        }, []);

        console.log('Unique responses count:', uniqueResponses.length);

        // Format the data
        const formattedResult = uniqueResponses.map(row => {
            let analysis = row.analysis;
            try {
                if (typeof analysis === 'string') {
                    analysis = JSON.parse(analysis);
                }
            } catch (e) {
                console.error('Error parsing analysis JSON:', e);
                analysis = null;
            }

            return {
                id: Number(row.id),
                survey_id: Number(row.survey_id),
                originalText: row.originalText || '',
                analysis: analysis,
                timestamp: row.timestamp
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error('Error in /api/feedback/analysis:', err);
        res.status(500).json({
            error: 'Failed to fetch feedback analysis',
            details: err.message
        });
    }
});

// Route to update NLP analysis for a response
app.post('/api/feedback/analyze', async (req, res) => {
    try {
        const { survey_id, analysis } = req.body;

        if (!survey_id || !analysis) {
            return res.status(400).send('Missing required data');
        }

        await executeQuery(
            `UPDATE responses 
             SET nlp_analysis = ? 
             WHERE survey_id = ? AND question_id = 10`,
            [JSON.stringify(analysis), survey_id]
        );

        res.status(200).send('Analysis updated successfully');
    } catch (err) {
        console.error('Error updating analysis:', err);
        res.status(500).send('Server error');
    }
});

// Route to get aggregated sentiment analysis
app.get('/api/feedback/sentiment-summary', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                COUNT(*) as total_feedback,
                SUM(CASE 
                    WHEN JSON_EXTRACT(nlp_analysis, '$.sentiment.score') > 0.2 THEN 1 
                    ELSE 0 
                END) as positive_count,
                SUM(CASE 
                    WHEN JSON_EXTRACT(nlp_analysis, '$.sentiment.score') BETWEEN -0.2 AND 0.2 THEN 1 
                    ELSE 0 
                END) as neutral_count,
                SUM(CASE 
                    WHEN JSON_EXTRACT(nlp_analysis, '$.sentiment.score') < -0.2 THEN 1 
                    ELSE 0 
                END) as negative_count,
                AVG(JSON_EXTRACT(nlp_analysis, '$.sentiment.score')) as avg_sentiment
            FROM responses
            WHERE question_id = 10 
            AND nlp_analysis IS NOT NULL
        `);

        res.json(result[0]);
    } catch (err) {
        console.error('Error fetching sentiment summary:', err);
        res.status(500).send('Server error');
    }
});

app.get('/api/debug/database', async (req, res) => {
    try {
        // Check database existence
        const databases = await executeQuery('SHOW DATABASES');
        const tables = await executeQuery('SHOW TABLES FROM satisfaction_db');

        // Check users table structure if it exists
        let userTableInfo = null;
        try {
            userTableInfo = await executeQuery('DESCRIBE satisfaction_db.users');
        } catch (e) {
            userTableInfo = `Error getting users table info: ${e.message}`;
        }

        res.json({
            databases: databases,
            tables: tables,
            usersTable: userTableInfo
        });
    } catch (err) {
        res.status(500).json({
            error: 'Database check failed',
            details: err.message
        });
    }
});

// Add this to your index.js (backend)

app.get('/api/analytics/additional', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                s.id as survey_id,
                r.question_id,
                r.answer,
                r.responded_at
            FROM surveys s
            JOIN responses r ON s.id = r.survey_id
            WHERE r.question_id IN (5,6,7,8,9)
            ORDER BY s.id, r.question_id
        `);

        // Transform the raw data into survey objects
        const surveyData = result.reduce((acc, row) => {
            const surveyId = row.survey_id;

            if (!acc.find(s => s.id === surveyId)) {
                acc.push({
                    id: surveyId,
                    responses: []
                });
            }

            const survey = acc.find(s => s.id === surveyId);
            survey.responses.push({
                question_id: row.question_id,
                answer: row.answer,
                responded_at: row.responded_at
            });

            return acc;
        }, []);

        res.json(surveyData);

    } catch (err) {
        console.error('Error fetching additional analytics:', err);
        res.status(500).json({
            error: 'Failed to fetch analytics data',
            details: err.message
        });
    }
});

async function startServer() {
    try {
        // Test database connection
        const conn = await pool.getConnection();
        await conn.ping();
        console.log('Successfully connected to MariaDB');
        conn.release();

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', {
            message: err.message,
            code: err.code,
            sqlState: err.sqlState,
            stack: err.stack
        });
        process.exit(1);
    }
}

startServer();