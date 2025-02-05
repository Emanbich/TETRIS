const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database configuration
const pool = mariadb.createPool({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '123',
    database: 'satisfaction_db',
    connectionLimit: 5,
    bigIntAsNumber: true  // Convert BigInt to Number
});

// Création de la table low_satisfaction_responses (inchangé)
const createLowSatisfactionTable = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS low_satisfaction_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        survey_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id)
      )
    `;
    
    try {
      await executeQuery(query);
      console.log('Low satisfaction responses table created or already exists');
    } catch (err) {
      console.error('Error creating low satisfaction table:', err);
    }
};

createLowSatisfactionTable();

async function executeQuery(query, params = []) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(query, params);
        return result;
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Route to start the survey
app.post('/api/start-survey', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await executeQuery(
            'INSERT INTO surveys (name) VALUES (?)',
            [name || 'Nouveau survey']
        );
        
        // Convert BigInt to Number before sending
        res.status(201).json({ 
            id: Number(result.insertId)
        });
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).send('Server error');
    }
});

// index.js (backend)
app.post('/api/responses', async (req, res) => {
    try {
      console.log('[POST /api/responses] Body reçu:', req.body);
      const { survey_id, responses, negativeScore } = req.body;
  
      // Log la valeur de negativeScore
      console.log('[POST /api/responses] negativeScore reçu =', negativeScore);
  
      if (!survey_id || !responses) {
        console.error('[POST /api/responses] Erreur: survey_id ou responses manquants');
        return res.status(400).send('Invalid data. Must include survey_id and responses');
      }
  
      // Mise à jour du score_negatif si on a un negativeScore
      if (typeof negativeScore !== 'undefined') {
        const nsValue = Number(negativeScore) || 0.0;
        console.log(`[POST /api/responses] Mise à jour du score_negatif=${nsValue} pour survey_id=${survey_id}`);
  
        await executeQuery(
          'UPDATE surveys SET score_negatif = ? WHERE id = ?',
          [nsValue, Number(survey_id)]
        );
      } else {
        console.log('[POST /api/responses] Pas de negativeScore dans le body, on n update pas la table surveys');
      }
  
      // Insertion des réponses
      const insertQuery = `
        INSERT INTO responses
        (survey_id, question_id, answer, optional_answer, responded_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      const currentDateTime = new Date();
  
      for (const item of responses) {
        console.log('[POST /api/responses] Insertion réponse =>', item);
        const { question_id, answer, optional_answer } = item;
  
        await executeQuery(insertQuery, [
          Number(survey_id),
          Number(question_id),
          answer,
          optional_answer || null,
          currentDateTime
        ]);
      }
  
      console.log('[POST /api/responses] Insertion réussie, envoi 200...');
      res.status(200).send('Responses successfully recorded.');
    } catch (err) {
      console.error('[POST /api/responses] Erreur:', err);
      res.status(500).send('Server error');
    }
  });
  
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log('Attempting to connect to MariaDB...');
    pool.getConnection()
        .then(conn => {
            console.log('Successfully connected to MariaDB!');
            conn.release();
        })
        .catch(err => {
            console.error('Error connecting to MariaDB:', err);
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
          WHERE r.question_id IN (5, 6, 7, 8, 9)  -- Questions for additional analytics
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
      console.error('Error fetching additional analytics data:', err);
      res.status(500).send('Server error');
  }
});

// Route to get all feedback responses
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

// Add this new endpoint to your index.js
app.get('/api/comments', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                r.survey_id,
                r.question_id,
                r.answer,
                r.optional_answer
            FROM responses r
            WHERE r.optional_answer IS NOT NULL 
            AND r.optional_answer != ''
            AND r.question_id != 10
            ORDER BY r.survey_id, r.question_id
        `);
        
        res.json(result);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).send('Server error');
    }
});

// Endpoint to store low satisfaction contact details
app.post('/api/low-satisfaction', async (req, res) => {
    try {
      const { id, name, phone, email } = req.body;
  
      if (!id || !name || !phone || !email) {
        return res.status(400).json({ 
          error: 'Missing required fields' 
        });
      }
  
      const query = `
        INSERT INTO low_satisfaction_responses 
        (survey_id, name, phone, email)
        VALUES (?, ?, ?, ?)
      `;
  
      await executeQuery(query, [id, name, phone, email]);
  
      res.status(201).json({ 
        message: 'Low satisfaction response recorded successfully' 
      });
    } catch (err) {
      console.error('Error storing low satisfaction response:', err);
      res.status(500).json({ 
        error: 'Failed to store low satisfaction response' 
      });
    }
});
  
// Endpoint to get all low satisfaction responses
app.get('/api/low-satisfaction', async (req, res) => {
    try {
      const query = `
        SELECT 
          lsr.id,
          lsr.survey_id,
          lsr.name,
          lsr.phone,
          lsr.email,
          lsr.created_at
        FROM low_satisfaction_responses lsr
        ORDER BY lsr.created_at DESC
      `;
  
      const results = await executeQuery(query);
      
      if (!results) {
        return res.status(404).json({ 
          error: 'No low satisfaction responses found' 
        });
      }
  
      // Format the dates before sending
      const formattedResults = results.map(result => ({
        ...result,
        created_at: new Date(result.created_at).toISOString()
      }));
  
      res.json(formattedResults);
    } catch (err) {
      console.error('Error fetching low satisfaction responses:', err);
      res.status(500).json({ 
        error: 'Failed to fetch low satisfaction responses',
        details: err.message 
      });
    }
});

// Get all questions
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await executeQuery(`
            SELECT 
                id, 
                question_text, 
                question_type, 
                max_value, 
                class,
                importance,
                options
            FROM questions
            ORDER BY id ASC
        `);
        
        // Format the response
        const formattedQuestions = questions.map(q => {
            let parsedOptions = null;
            if (q.options) {
                try {
                    parsedOptions = typeof q.options === 'string' 
                        ? JSON.parse(q.options) 
                        : q.options;
                } catch (e) {
                    console.error('Error parsing options for question', q.id, e);
                    parsedOptions = [];
                }
            }

            return {
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                max_value: q.max_value,
                class: q.class,
                // On renvoie directement la valeur d'importance en pourcentage (2 décimales)
                importance: q.importance !== null && q.importance !== undefined 
                            ? Number(q.importance).toFixed(2) 
                            : "0.00",
                options: parsedOptions || []
            };
        });

        res.json(formattedQuestions);
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ error: 'Error fetching questions', details: err.message });
    }
});

// Update or create questions
app.post('/api/questions/update', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { questions } = req.body;

        // Fonction de validation pour l'importance (doit être entre 0 et 100)
        const validateImportance = (imp) => {
            let value = parseFloat(imp);
            if (isNaN(value) || value < 0 || value > 100) {
                return 0;
            }
            return value;
        };

        for (const question of questions) {
            const checkResult = await conn.query(
                'SELECT id FROM questions WHERE id = ?',
                [question.id]
            );

            const options = question.options ? JSON.stringify(question.options) : null;
            // Valider et convertir l'importance en pourcentage
            const importancePercent = validateImportance(question.importance);

            if (checkResult.length > 0) {
                // Update existing question
                await conn.query(`
                    UPDATE questions
                    SET 
                        question_text = ?,
                        question_type = ?,
                        max_value = ?,
                        class = ?,
                        importance = ?,
                        options = ?
                    WHERE id = ?
                `, [
                    question.question_text,
                    question.question_type,
                    question.max_value,
                    question.class,
                    importancePercent,
                    options,
                    question.id
                ]);
            } else {
                // Insert new question
                await conn.query(`
                    INSERT INTO questions 
                    (id, question_text, question_type, max_value, class, importance, options)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    question.id,
                    question.question_text,
                    question.question_type,
                    question.max_value,
                    question.class,
                    importancePercent,
                    options
                ]);
            }
        }

        await conn.commit();
        res.status(200).send('Questions updated successfully');
    } catch (err) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Error updating questions:', err);
        res.status(500).send('Server error');
    } finally {
        if (conn) conn.release();
    }
});

// Delete question endpoint
app.delete('/api/questions/delete', async (req, res) => {
    let conn;
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Question ID is required' });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Delete the question
        const result = await conn.query('DELETE FROM questions WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Question not found' });
        }

        await conn.commit();
        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (err) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Error deleting question:', err);
        res.status(500).json({ error: 'Failed to delete question' });
    } finally {
        if (conn) conn.release();
    }
});
