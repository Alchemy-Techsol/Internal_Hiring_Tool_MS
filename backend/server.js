require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5011;

// Middleware
const allowedOrigins = [
  'http://localhost:3011',
  'http://127.0.0.1:3011',
  'https://q9lab.in',
  'https://www.q9lab.in',
  `https://q9lab.in/internal-hiring/`,
  `https://www.q9lab.in/internal-hiring/`,
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`🚫 CORS blocked origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

// PostgreSQL Connection with proper error handling
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'internal_hiring',
  password: process.env.DB_PASSWORD || 'sree', // Add default password
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 5000
};

const pool = new Pool(poolConfig);

// Verify database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Please check your PostgreSQL credentials and make sure the database exists');
  } else {
    console.log('✅ Database connected successfully');
  }
});


// Signup Endpoint
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, designation, business_unit } = req.body;

    if (!name || !email || !password || !designation || !business_unit) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const userExists = await pool.query(
      'SELECT * FROM "Users" WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const newUser = await pool.query(
      `INSERT INTO "Users" (name, email, password, designation, business_unit, created_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
       RETURNING id, name, email, designation, business_unit, created_at`,
      [name, email, password, designation, business_unit]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login Endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const userResult = await pool.query(
      'SELECT * FROM "Users" WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const { password: _, ...userData } = user;

    res.json({
      message: "Login successful",
      user: userData
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all new hiring approvals
app.get('/api/new-hiring-approvals', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "NewHiringApprovals" ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching new hiring approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new hiring approval with approval workflow
app.post('/api/new-hiring-approvals', async (req, res) => {
  try {
    const {
      position_title, business_unit,
      candidate_name, candidate_designation,
      candidate_experience_years, candidate_skills,
      ctc_offered, joining_date,
      hiring_manager_id, hiring_manager_name
    } = req.body;

    // Convert candidate_skills to array if it's a string
    const skillsArray = Array.isArray(candidate_skills)
      ? candidate_skills
      : candidate_skills ? candidate_skills.split(',').map(skill => skill.trim()) : [];

    // When BU Head submits, automatically set bu_head_approved = true
    // so the request goes directly to HR Head
    const result = await pool.query(
      `INSERT INTO "NewHiringApprovals" (
        position_title, business_unit,
        candidate_name, candidate_designation,
        candidate_experience_years, candidate_skills,
        ctc_offered, joining_date,
        hiring_manager_id, hiring_manager_name,
        approval_status, bu_head_approved, bu_head_approval_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        position_title, business_unit,
        candidate_name, candidate_designation,
        candidate_experience_years, skillsArray,
        ctc_offered, joining_date,
        hiring_manager_id, hiring_manager_name,
        'Pending', true, new Date().toISOString()
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating new hiring approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sent approval requests for a user
app.get('/api/approvals/sent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM "NewHiringApprovals" 
       WHERE hiring_manager_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sent approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get received approval requests for a user (BU Heads, HR Heads, and Admins)
app.get('/api/approvals/received/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details to check their role
    const userResult = await pool.query(
      'SELECT designation, business_unit FROM "Users" WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    let query;
    let params;

    if (user.designation === 'Admin') {
      // Admins can see all pending approvals where both BU Head and HR Head have approved
      query = `SELECT * FROM "NewHiringApprovals" 
               WHERE approval_status = 'Pending' 
               AND bu_head_approved = true 
               AND hr_head_approved = true 
               AND ADMIN_approved = false
               ORDER BY created_at DESC`;
      params = [];
    } else if (user.designation === 'HR Head' || user.designation === 'HR HEAD') {
      // HR Heads can see all pending approvals where BU Head has already approved
      query = `SELECT * FROM "NewHiringApprovals" 
               WHERE approval_status = 'Pending' 
               AND bu_head_approved = true 
               AND hr_head_approved = false
               ORDER BY created_at DESC`;
      params = [];
    } else {
      // BU Heads can see approvals from their business unit
      query = `SELECT * FROM "NewHiringApprovals" 
               WHERE approval_status = 'Pending' 
               AND business_unit = $1 
               ORDER BY created_at DESC`;
      params = [user.business_unit];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching received approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a hiring request
app.put('/api/approvals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, comments } = req.body;

    // Get user details to determine their role
    const userResult = await pool.query(
      'SELECT designation FROM "Users" WHERE id = $1',
      [approved_by]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userResult.rows[0].designation;
    let updateQuery;
    let updateParams;

    if (userRole === 'BU Head') {
      // BU Head approval is now automatic when submitting
      // This should not be called anymore, but keeping for backward compatibility
      return res.status(400).json({ error: 'BU Head approval is automatic upon submission' });
    } else if (userRole === 'HR Head' || userRole === 'HR HEAD') {
      // HR Head approval - request goes to Admin
      updateQuery = `UPDATE "NewHiringApprovals" 
                     SET hr_head_approved = true, hr_head_approval_date = $1, hr_head_comments = $2
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [new Date().toISOString(), comments, id];
    } else if (userRole === 'Admin') {
      // Admin approval - request goes back to BU Head for tentative details
      updateQuery = `UPDATE "NewHiringApprovals" 
                     SET ADMIN_approved = true, ADMIN_approval_date = $1, ADMIN_comments = $2, 
                         workflow_status = 'Admin_Approved'
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [new Date().toISOString(), comments, id];
    } else {
      return res.status(403).json({ error: 'Unauthorized to approve requests' });
    }

    const result = await pool.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a hiring request
app.put('/api/approvals/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejected_by, rejection_reason, comments } = req.body;

    // Get user details to determine their role
    const userResult = await pool.query(
      'SELECT designation FROM "Users" WHERE id = $1',
      [rejected_by]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userResult.rows[0].designation;
    let updateQuery;
    let updateParams;

    if (userRole === 'BU Head') {
      updateQuery = `UPDATE "NewHiringApprovals" 
                     SET approval_status = 'Rejected', bu_head_comments = $1, rejection_reason = $2
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [comments, rejection_reason, id];
    } else if (userRole === 'HR Head' || userRole === 'HR HEAD') {
      updateQuery = `UPDATE "NewHiringApprovals" 
                     SET approval_status = 'Rejected', hr_head_comments = $1, rejection_reason = $2
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [comments, rejection_reason, id];
    } else if (userRole === 'Admin') {
      updateQuery = `UPDATE "NewHiringApprovals" 
                     SET approval_status = 'Rejected', ADMIN_comments = $1, rejection_reason = $2
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [comments, rejection_reason, id];
    } else {
      return res.status(403).json({ error: 'Unauthorized to reject requests' });
    }

    const result = await pool.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Get all replacement approvals
app.get('/api/replacement-approvals', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "ReplacementApprovals" ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching replacement approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST endpoint for replacement approvals
app.post('/api/replacement-approvals', async (req, res) => {
  try {
    const {
      outgoing_employee_name, outgoing_employee_id, business_unit, last_working_date, leaving_reason,
      replacement_candidate_name, replacement_current_designation,
      replacement_experience_years, replacement_skills,
      ctc_offered, joining_date,
      hiring_manager_id, hiring_manager_name
    } = req.body;

    // Convert replacement_skills to array if it's a string
    const skillsArray = Array.isArray(replacement_skills)
      ? replacement_skills
      : replacement_skills ? replacement_skills.split(',').map(skill => skill.trim()) : [];

    // When BU Head submits, automatically set bu_head_approved = true
    // so the request goes directly to HR Head
    const result = await pool.query(
      `INSERT INTO "ReplacementApprovals" (
        outgoing_employee_name, outgoing_employee_id, business_unit, last_working_date, leaving_reason,
        replacement_candidate_name, replacement_current_designation,
        replacement_experience_years, replacement_skills,
        ctc_offered, joining_date,
        hiring_manager_id, hiring_manager_name,
        approval_status, bu_head_approved
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *`,
      [
        outgoing_employee_name, outgoing_employee_id, business_unit, last_working_date, leaving_reason,
        replacement_candidate_name, replacement_current_designation,
        replacement_experience_years, skillsArray,
        ctc_offered, joining_date,
        hiring_manager_id, hiring_manager_name,
        'Pending', true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating replacement approval:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  }
});

// Get sent replacement approval requests for a user
app.get('/api/replacement-approvals/sent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM "ReplacementApprovals" 
       WHERE hiring_manager_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sent replacement approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get received replacement approval requests for a user (BU Heads, HR Heads, and Admins)
app.get('/api/replacement-approvals/received/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details to check their role
    const userResult = await pool.query(
      'SELECT designation, business_unit FROM "Users" WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    let query;
    let params;

    if (user.designation === 'Admin') {
      // Admins can see all pending approvals where both BU Head and HR Head have approved
      query = `SELECT * FROM "ReplacementApprovals" 
               WHERE approval_status = 'Pending' 
               AND bu_head_approved = true 
               AND hr_head_approved = true 
               AND admin_approved = false
               ORDER BY created_at DESC`;
      params = [];
    } else if (user.designation === 'HR Head' || user.designation === 'HR HEAD') {
      // HR Heads can see all pending approvals where BU Head has already approved
      query = `SELECT * FROM "ReplacementApprovals" 
               WHERE approval_status = 'Pending' 
               AND bu_head_approved = true 
               AND hr_head_approved = false
               ORDER BY created_at DESC`;
      params = [];
    } else {
      // BU Heads can see approvals from their business unit
      query = `SELECT * FROM "ReplacementApprovals" 
               WHERE approval_status = 'Pending' 
               AND business_unit = $1 
               ORDER BY created_at DESC`;
      params = [user.business_unit];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching received replacement approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a replacement request
app.put('/api/replacement-approvals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, comments } = req.body;

    // Get user details to determine their role
    const userResult = await pool.query(
      'SELECT designation FROM "Users" WHERE id = $1',
      [approved_by]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userResult.rows[0].designation;
    let updateQuery;
    let updateParams;

    if (userRole === 'BU Head') {
      // BU Head approval is now automatic when submitting
      // This should not be called anymore, but keeping for backward compatibility
      return res.status(400).json({ error: 'BU Head approval is automatic upon submission' });
    } else if (userRole === 'HR Head' || userRole === 'HR HEAD') {
      // HR Head approval - request goes to Admin
      updateQuery = `UPDATE "ReplacementApprovals" 
                     SET hr_head_approved = true, hr_head_comments = $1
                     WHERE id = $2 
                     RETURNING *`;
      updateParams = [comments, id];
    } else if (userRole === 'Admin') {
      // Admin approval - request goes back to BU Head for tentative details
      updateQuery = `UPDATE "ReplacementApprovals" 
                     SET admin_approved = true, admin_approval_date = $1, admin_comments = $2, 
                         workflow_status = 'Admin_Approved'
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [new Date().toISOString(), comments, id];
    } else {
      return res.status(403).json({ error: 'Unauthorized to approve requests' });
    }

    const result = await pool.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving replacement request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a replacement request
app.put('/api/replacement-approvals/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejected_by, rejection_reason, comments } = req.body;

    // Get user details to determine their role
    const userResult = await pool.query(
      'SELECT designation FROM "Users" WHERE id = $1',
      [rejected_by]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userResult.rows[0].designation;
    let updateQuery;
    let updateParams;

    if (userRole === 'BU Head') {
      updateQuery = `UPDATE "ReplacementApprovals" 
                     SET approval_status = 'Rejected', bu_head_comments = $1, rejection_reason = $2
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [comments, rejection_reason, id];
    } else if (userRole === 'HR Head' || userRole === 'HR HEAD') {
      updateQuery = `UPDATE "ReplacementApprovals" 
                     SET approval_status = 'Rejected', hr_head_comments = $1, rejection_reason = $2
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [comments, rejection_reason, id];
    } else if (userRole === 'Admin') {
      updateQuery = `UPDATE "ReplacementApprovals" 
                     SET approval_status = 'Rejected', admin_comments = $1, rejection_reason = $2
                     WHERE id = $3 
                     RETURNING *`;
      updateParams = [comments, rejection_reason, id];
    } else {
      return res.status(403).json({ error: 'Unauthorized to reject requests' });
    }

    const result = await pool.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error rejecting replacement request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get replacement details for a business unit
app.get('/api/replacement-details/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    const result = await pool.query(
      `SELECT 
        outgoing_employee_name,
        outgoing_employee_id,
        last_working_date,
        leaving_reason,
        replacement_candidate_name,
        replacement_current_designation,
        replacement_experience_years,
        replacement_skills,
        is_internal_candidate,
        ctc_offered,
        joining_date,
        notice_period_days,
        approval_status,
        workflow_status,
        tentative_join_date,
        tentative_candidate_name,
        exact_join_date,
        exact_salary,
        bu_head_tentative_entered,
        hr_head_final_entered,
        join_confirmation_status,
        join_confirmation_date,
        join_confirmation_notes,
        created_at,
        updated_at
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       ORDER BY created_at DESC`,
      [businessUnit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching replacement details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get existing team details for a business unit (new hires + replacements who joined)
app.get('/api/existing-team-details/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    const newHires = await pool.query(
      `SELECT 
        candidate_name,
        candidate_designation as designation,
        exact_join_date,
        exact_salary,
        ctc_offered,
        join_confirmation_date,
        join_confirmed,
        join_confirmation_status
       FROM "NewHiringApprovals" 
       WHERE business_unit = $1 AND (join_confirmation_status = 'Joined' OR join_confirmed = true)
       ORDER BY join_confirmation_date DESC`,
      [businessUnit]
    );

    const replacements = await pool.query(
      `SELECT 
        replacement_candidate_name as candidate_name,
        replacement_current_designation as designation,
        exact_join_date,
        exact_salary,
        ctc_offered,
        join_confirmation_date,
        join_confirmed,
        join_confirmation_status
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 AND (join_confirmation_status = 'Joined' OR join_confirmed = true)
       ORDER BY join_confirmation_date DESC`,
      [businessUnit]
    );

    const rows = [...newHires.rows, ...replacements.rows]
      .map(r => ({
        candidate_name: r.candidate_name,
        designation: r.designation,
        exact_join_date: r.exact_join_date,
        hired_value: (r.exact_salary && r.exact_salary > 0) ? parseFloat(r.exact_salary) : parseFloat(r.ctc_offered || 0),
        twenty_percent: ((r.exact_salary && r.exact_salary > 0) ? parseFloat(r.exact_salary) : parseFloat(r.ctc_offered || 0)) * 0.20
      }))
      .sort((a, b) => new Date(b.exact_join_date || 0) - new Date(a.exact_join_date || 0));

    res.json(rows);
  } catch (error) {
    console.error('Error fetching existing team details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get new hire details for a business unit
app.get('/api/new-hire-details/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    const result = await pool.query(
      `SELECT 
        position_title,
        business_unit,
        candidate_name,
        candidate_designation,
        candidate_experience_years,
        candidate_skills,
        ctc_offered,
        joining_date,
        approval_status,
        workflow_status,
        tentative_join_date,
        tentative_candidate_name,
        exact_join_date,
        exact_salary,
        bu_head_tentative_entered,
        hr_head_final_entered,
        join_confirmation_status,
        join_confirmation_date,
        join_confirmation_notes,
        created_at,
        updated_at
       FROM "NewHiringApprovals" 
       WHERE business_unit = $1 AND approval_status = 'Approved'
       ORDER BY created_at DESC`,
      [businessUnit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching new hire details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get BU metrics for dashboard
app.get('/api/bu-metrics/:businessUnit/:userId', async (req, res) => {
  try {
    const { businessUnit, userId } = req.params;

    console.log('🔍 BU Metrics Request:', { businessUnit, userId });

    // Get hiring ticket raised (total number of new hiring and replacement requests submitted)
    // Only count requests that are still in the initial stage (not yet approved by HR Head)
    const newHireCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND (hr_head_approved = false OR hr_head_approved IS NULL)`,
      [businessUnit]
    );

    const replacementCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       AND (hr_head_approved = false OR hr_head_approved IS NULL)`,
      [businessUnit]
    );

    const hiringTicketRaised = parseInt(newHireCountResult.rows[0].count) + parseInt(replacementCountResult.rows[0].count);

    // Get approved yet to hire (requests approved by HR Head and Admin but not yet finalized)
    // Only count requests that are approved but BU Head hasn't entered tentative details yet
    const approvedYetToHireResult = await pool.query(
      `SELECT COUNT(*) as count FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND hr_head_approved = true 
       AND admin_approved = true 
       AND (bu_head_tentative_entered = false OR bu_head_tentative_entered IS NULL)`,
      [businessUnit]
    );

    // Get selected yet to offer (requests where BU Head has entered tentative details)
    // Only count requests where BU Head has entered tentative details but HR Head hasn't entered final details yet
    const selectedYetToOfferResult = await pool.query(
      `SELECT COUNT(*) as count FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND bu_head_tentative_entered = true 
       AND (hr_head_final_entered = false OR hr_head_final_entered IS NULL)`,
      [businessUnit]
    );

    // Get offered yet to join (requests where HR Head has entered final details but candidate hasn't joined yet)
    // Only count requests where HR Head has entered final details but HR Head hasn't confirmed join yet
    const offeredYetToJoinResult = await pool.query(
      `SELECT COUNT(*) as count FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND hr_head_final_entered = true 
       AND (join_confirmed = false OR join_confirmed IS NULL)
       AND exact_join_date <= CURRENT_DATE`,
      [businessUnit]
    );

    // Get existing team (total number of joined candidates)
    const existingTeamResult = await pool.query(
      `SELECT COUNT(*) as count FROM "NewHiringApprovals" 
       WHERE business_unit = $1 AND (join_confirmation_status = 'Joined' OR join_confirmed = true)`,
      [businessUnit]
    );

    // Get to be rationalized (total number of replaced candidates that haven't joined yet)
    const toBeRationalizedResult = await pool.query(
      `SELECT COUNT(*) as count FROM "ReplacementApprovals" 
       WHERE business_unit = $1 AND (join_confirmation_status IS NULL OR join_confirmation_status != 'Joined')`,
      [businessUnit]
    );

    // Get team cost (sum of CTC from all confirmed joins in this BU)
    const teamCostResult = await pool.query(
      `SELECT COALESCE(SUM(ctc_offered), 0) as total_cost FROM "NewHiringApprovals" 
       WHERE business_unit = $1 AND join_confirmation_status = 'Joined'`,
      [businessUnit]
    );

    console.log('📊 BU Metrics Results:', {
      hiringTicketRaised: hiringTicketRaised,
      approvedYetToHire: parseInt(approvedYetToHireResult.rows[0].count),
      selectedYetToOffer: parseInt(selectedYetToOfferResult.rows[0].count),
      offeredYetToJoin: parseInt(offeredYetToJoinResult.rows[0].count),
      existingTeam: parseInt(existingTeamResult.rows[0].count),
      toBeRationalized: parseInt(toBeRationalizedResult.rows[0].count),
      teamCost: parseFloat(teamCostResult.rows[0].total_cost) || 0
    });

    res.json({
      hiringTicketRaised: hiringTicketRaised,
      approvedYetToHire: parseInt(approvedYetToHireResult.rows[0].count),
      selectedYetToOffer: parseInt(selectedYetToOfferResult.rows[0].count),
      offeredYetToJoin: parseInt(offeredYetToJoinResult.rows[0].count),
      existingTeam: parseInt(existingTeamResult.rows[0].count),
      toBeRationalized: parseInt(toBeRationalizedResult.rows[0].count),
      teamCost: parseFloat(teamCostResult.rows[0].total_cost) || 0
    });
  } catch (error) {
    console.error('Error fetching BU metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get business unit statistics for HR Head dashboard
app.get('/api/hr/business-unit-stats', async (req, res) => {
  try {
    // Get all unique business units from both tables
    const businessUnitsResult = await pool.query(
      `SELECT DISTINCT business_unit FROM "NewHiringApprovals" WHERE business_unit IS NOT NULL AND business_unit != ''
       UNION 
       SELECT DISTINCT business_unit FROM "ReplacementApprovals" WHERE business_unit IS NOT NULL AND business_unit != ''`
    );

    console.log('Found business units:', businessUnitsResult.rows);

    const businessUnitStats = [];

    for (const row of businessUnitsResult.rows) {
      const businessUnit = row.business_unit;

      // Get counts for NewHiringApprovals table
      const newHireStats = await pool.query(
        `SELECT 
            COUNT(*) FILTER (WHERE join_confirmation_status = 'Joined') as confirmed_count,
            COUNT(*) FILTER (WHERE approval_status = 'Pending') as pending_count,
            COUNT(*) FILTER (WHERE approval_status = 'Rejected') as rejected_count
          FROM "NewHiringApprovals" 
          WHERE business_unit = $1`,
        [businessUnit]
      );

      // Get counts for ReplacementApprovals table
      const replacementStats = await pool.query(
        `SELECT 
            COUNT(*) FILTER (WHERE join_confirmation_status = 'Joined') as confirmed_count,
            COUNT(*) FILTER (WHERE approval_status = 'Pending') as pending_count,
            COUNT(*) FILTER (WHERE approval_status = 'Rejected') as rejected_count
          FROM "ReplacementApprovals" 
          WHERE business_unit = $1`,
        [businessUnit]
      );

      const newHireConfirmed = parseInt(newHireStats.rows[0]?.confirmed_count || 0);
      const newHirePending = parseInt(newHireStats.rows[0]?.pending_count || 0);
      const replacementConfirmed = parseInt(replacementStats.rows[0]?.confirmed_count || 0);
      const replacementPending = parseInt(replacementStats.rows[0]?.pending_count || 0);

      const totalHires = newHireConfirmed + replacementConfirmed;
      const pendingRequests = newHirePending + replacementPending;
      const confirmedRequests = newHireConfirmed + replacementConfirmed;

      businessUnitStats.push({
        business_unit: businessUnit,
        total_hires: totalHires,
        pending_requests: pendingRequests,
        confirmed_requests: confirmedRequests
      });

      console.log(`Business Unit ${businessUnit}:`, {
        totalHires,
        pendingRequests,
        confirmedRequests
      });
    }

    console.log('Final business unit stats:', businessUnitStats);
    res.json(businessUnitStats);
  } catch (error) {
    console.error('Error fetching business unit stats:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get notifications for a user (recently approved requests)
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get recently approved new hire and replacement requests
    const newHireResult = await pool.query(
      `SELECT id, candidate_name, position_title, 'new_hire' as type, updated_at 
       FROM "NewHiringApprovals" 
       WHERE approval_status = 'Approved' 
       AND hiring_manager_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 10`,
      [userId]
    );

    const replacementResult = await pool.query(
      `SELECT id, replacement_candidate_name as candidate_name, 
              'Replacement for ' || outgoing_employee_name as position_title, 
              'replacement' as type, updated_at 
       FROM "ReplacementApprovals" 
       WHERE approval_status = 'Approved' 
       AND hiring_manager_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 10`,
      [userId]
    );

    const allNotifications = [...newHireResult.rows, ...replacementResult.rows]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 10);

    res.json(allNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OLD EMPLOYEE ID WORKFLOW ENDPOINTS REMOVED - REPLACED BY NEW WORKFLOW

// Get hired notifications for BU Head (candidates with Employee ID)
app.get('/api/hired-notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get recently hired new hire candidates
    const newHireResult = await pool.query(
      `SELECT id, candidate_name, position_title, employee_id, hired_date, 'new_hire' as type
       FROM "NewHiringApprovals" 
       WHERE hired_status = 'Hired' 
       AND employee_id IS NOT NULL
       AND hiring_manager_id = $1 
       ORDER BY hired_date DESC 
       LIMIT 10`,
      [userId]
    );

    // Get recently hired replacement candidates
    const replacementResult = await pool.query(
      `SELECT id, replacement_candidate_name as candidate_name, 
              'Replacement for ' || outgoing_employee_name as position_title, 
              employee_id, hired_date, 'replacement' as type
       FROM "ReplacementApprovals" 
       WHERE hired_status = 'Hired' 
       AND employee_id IS NOT NULL
       AND hiring_manager_id = $1 
       ORDER BY hired_date DESC 
       LIMIT 10`,
      [userId]
    );

    const allHiredNotifications = [...newHireResult.rows, ...replacementResult.rows]
      .sort((a, b) => new Date(b.hired_date) - new Date(a.hired_date))
      .slice(0, 10);

    res.json(allHiredNotifications);
  } catch (error) {
    console.error('Error fetching hired notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rejection notifications for BU Head (rejected by HR or Admin)
app.get('/api/rejection-notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const newHireResult = await pool.query(
      `SELECT id, candidate_name, position_title, 'new_hire' as type, updated_at,
              rejection_reason, hr_head_comments, admin_comments
       FROM "NewHiringApprovals" 
       WHERE approval_status = 'Rejected' AND hiring_manager_id = $1 
       ORDER BY updated_at DESC LIMIT 10`,
      [userId]
    );

    const replacementResult = await pool.query(
      `SELECT id, replacement_candidate_name as candidate_name, 
              'Replacement for ' || outgoing_employee_name as position_title, 
              'replacement' as type, updated_at,
              rejection_reason, hr_head_comments, admin_comments
       FROM "ReplacementApprovals" 
       WHERE approval_status = 'Rejected' AND hiring_manager_id = $1 
       ORDER BY updated_at DESC LIMIT 10`,
      [userId]
    );

    const all = [...newHireResult.rows, ...replacementResult.rows]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 10);

    res.json(all);
  } catch (error) {
    console.error('Error fetching rejection notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete rejected new hire (BU head only, own requests)
app.delete('/api/approvals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const check = await pool.query(
      'SELECT id, approval_status, hiring_manager_id FROM "NewHiringApprovals" WHERE id = $1',
      [id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    const row = check.rows[0];
    if (row.hiring_manager_id != userId) return res.status(403).json({ error: 'Not your request' });
    if (row.approval_status !== 'Rejected') return res.status(400).json({ error: 'Can only delete rejected requests' });

    await pool.query('DELETE FROM "NewHiringApprovals" WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete rejected replacement (BU head only, own requests)
app.delete('/api/replacement-approvals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const check = await pool.query(
      'SELECT id, approval_status, hiring_manager_id FROM "ReplacementApprovals" WHERE id = $1',
      [id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    const row = check.rows[0];
    if (row.hiring_manager_id != userId) return res.status(403).json({ error: 'Not your request' });
    if (row.approval_status !== 'Rejected') return res.status(400).json({ error: 'Can only delete rejected requests' });

    await pool.query('DELETE FROM "ReplacementApprovals" WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting replacement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend rejected new hire (BU head only): delete old + create new entry, same as new hire
app.put('/api/approvals/:id/resend', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const body = req.body;
    const userId = body.userId || body.hiring_manager_id;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const check = await client.query(
      'SELECT id, approval_status, hiring_manager_id FROM "NewHiringApprovals" WHERE id = $1',
      [id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    const row = check.rows[0];
    if (row.hiring_manager_id != userId) return res.status(403).json({ error: 'Not your request' });
    if (row.approval_status !== 'Rejected') return res.status(400).json({ error: 'Can only resend rejected requests' });

    await client.query('BEGIN');
    await client.query('DELETE FROM "NewHiringApprovals" WHERE id = $1', [id]);

    const {
      position_title, business_unit, candidate_name, candidate_designation,
      candidate_experience_years, candidate_skills, ctc_offered, joining_date,
      hiring_manager_id, hiring_manager_name
    } = body;

    // Same conversion as POST /api/new-hiring-approvals; handle JSON/array strings like '{"Python"}' or '["Python"]'
    let skillsArray;
    if (Array.isArray(candidate_skills)) {
      skillsArray = candidate_skills;
    } else if (candidate_skills) {
      const s = String(candidate_skills).trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        try {
          const parsed = JSON.parse(s.replace(/'/g, '"'));
          skillsArray = Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch {
          skillsArray = s.split(',').map(x => x.trim().replace(/^"|"$/g, '')).filter(Boolean);
        }
      } else {
        skillsArray = s.split(',').map(x => x.trim()).filter(Boolean);
      }
    } else {
      skillsArray = [];
    }
    const skillsVal = skillsArray.length ? skillsArray.join(', ') : null;

    const insertResult = await client.query(
      `INSERT INTO "NewHiringApprovals" (
        position_title, business_unit,
        candidate_name, candidate_designation,
        candidate_experience_years, candidate_skills,
        ctc_offered, joining_date,
        hiring_manager_id, hiring_manager_name,
        approval_status, bu_head_approved, bu_head_approval_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        position_title || '', business_unit || '',
        candidate_name || '', candidate_designation || '',
        candidate_experience_years != null && candidate_experience_years !== '' ? Number(candidate_experience_years) : null,
        skillsVal,
        ctc_offered != null && ctc_offered !== '' ? Number(ctc_offered) : null,
        joining_date || null,
        hiring_manager_id || userId, hiring_manager_name || '',
        'Pending', true, new Date().toISOString()
      ]
    );
    await client.query('COMMIT');
    res.json(insertResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resending approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Resend rejected replacement (BU head only): delete old + create new entry, same as new replacement
app.put('/api/replacement-approvals/:id/resend', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const body = req.body;
    const userId = body.userId || body.hiring_manager_id;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const check = await client.query(
      'SELECT id, approval_status, hiring_manager_id FROM "ReplacementApprovals" WHERE id = $1',
      [id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    const row = check.rows[0];
    if (row.hiring_manager_id != userId) return res.status(403).json({ error: 'Not your request' });
    if (row.approval_status !== 'Rejected') return res.status(400).json({ error: 'Can only resend rejected requests' });

    await client.query('BEGIN');
    await client.query('DELETE FROM "ReplacementApprovals" WHERE id = $1', [id]);

    const {
      outgoing_employee_name, outgoing_employee_id, business_unit, last_working_date, leaving_reason,
      replacement_candidate_name, replacement_current_designation,
      replacement_experience_years, replacement_skills,
      ctc_offered, joining_date, hiring_manager_id, hiring_manager_name
    } = body;

    const skillsArray = Array.isArray(replacement_skills)
      ? replacement_skills
      : replacement_skills
        ? (() => {
          const s = String(replacement_skills).trim();
          if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
            try {
              const parsed = JSON.parse(s.replace(/'/g, '"'));
              return Array.isArray(parsed) ? parsed : [String(parsed)];
            } catch {
              return s.split(',').map(x => x.trim().replace(/^"|"$/g, '')).filter(Boolean);
            }
          }
          return s.split(',').map(x => x.trim()).filter(Boolean);
        })()
        : [];
    const replSkillsVal = skillsArray.length ? skillsArray.join(', ') : null;

    const insertResult = await client.query(
      `INSERT INTO "ReplacementApprovals" (
        outgoing_employee_name, outgoing_employee_id, business_unit, last_working_date, leaving_reason,
        replacement_candidate_name, replacement_current_designation,
        replacement_experience_years, replacement_skills,
        ctc_offered, joining_date,
        hiring_manager_id, hiring_manager_name,
        approval_status, bu_head_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        outgoing_employee_name || '', outgoing_employee_id || '', business_unit || '',
        last_working_date || null, leaving_reason || '',
        replacement_candidate_name || '', replacement_current_designation || '',
        replacement_experience_years != null && replacement_experience_years !== '' ? Number(replacement_experience_years) : null,
        replSkillsVal,
        ctc_offered != null && ctc_offered !== '' ? Number(ctc_offered) : null,
        joining_date || null,
        hiring_manager_id || userId, hiring_manager_name || '',
        'Pending', true
      ]
    );
    await client.query('COMMIT');
    res.json(insertResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resending replacement:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get requests that need tentative details from BU Head (Admin approved, waiting for BU Head)
app.get('/api/bu/tentative-details-requests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get new hire requests that are approved by Admin but need tentative details
    const newHireResult = await pool.query(
      `SELECT nh.*, u.name as bu_head_name, u.business_unit
       FROM "NewHiringApprovals" nh
       JOIN "Users" u ON nh.hiring_manager_id = u.id
       WHERE nh.workflow_status = 'Admin_Approved' 
       AND nh.ADMIN_approved = true
       AND nh.bu_head_tentative_entered = false
       AND nh.hiring_manager_id = $1
       ORDER BY nh.ADMIN_approval_date DESC`,
      [userId]
    );

    // Get replacement requests that are approved by Admin but need tentative details
    const replacementResult = await pool.query(
      `SELECT r.*, u.name as bu_head_name, u.business_unit
       FROM "ReplacementApprovals" r
       JOIN "Users" u ON r.hiring_manager_id = u.id
       WHERE r.workflow_status = 'Admin_Approved' 
       AND r.admin_approved = true
       AND r.bu_head_tentative_entered = false
       AND r.hiring_manager_id = $1
       ORDER BY r.admin_approval_date DESC`,
      [userId]
    );

    res.json({
      newHire: newHireResult.rows,
      replacement: replacementResult.rows
    });
  } catch (error) {
    console.error('Error fetching tentative details requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BU Head enters tentative details for approved requests
app.put('/api/bu/enter-tentative-details/:requestType/:requestId', async (req, res) => {
  try {
    const { requestType, requestId } = req.params;
    const { tentative_join_date, tentative_candidate_name } = req.body;

    if (!tentative_join_date || !tentative_candidate_name) {
      return res.status(400).json({ error: 'Tentative join date and candidate name are required' });
    }

    let result;

    if (requestType === 'new-hire') {
      result = await pool.query(
        `UPDATE "NewHiringApprovals" 
         SET tentative_join_date = $1, 
             tentative_candidate_name = $2,
             bu_head_tentative_entered = true,
             bu_head_tentative_date = CURRENT_TIMESTAMP,
             workflow_status = 'BU_Tentative_Entered',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND workflow_status = 'Admin_Approved' AND ADMIN_approved = true
         RETURNING *`,
        [tentative_join_date, tentative_candidate_name, requestId]
      );
    } else if (requestType === 'replacement') {
      result = await pool.query(
        `UPDATE "ReplacementApprovals" 
         SET tentative_join_date = $1, 
             tentative_candidate_name = $2,
             bu_head_tentative_entered = true,
             bu_head_tentative_date = CURRENT_TIMESTAMP,
             workflow_status = 'BU_Tentative_Entered',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND workflow_status = 'Admin_Approved' AND admin_approved = true
         RETURNING *`,
        [tentative_join_date, tentative_candidate_name, requestId]
      );
    } else {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not eligible for tentative details entry' });
    }

    const updatedRequest = result.rows[0];

    res.json({
      message: 'Tentative details entered successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error entering tentative details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get requests that need final details from HR Head (BU tentative entered, waiting for HR Head)
app.get('/api/hr/final-details-requests', async (req, res) => {
  try {
    // Get new hire requests that have tentative details but need final details
    const newHireResult = await pool.query(
      `SELECT nh.*, u.name as bu_head_name, u.business_unit
       FROM "NewHiringApprovals" nh
       JOIN "Users" u ON nh.hiring_manager_id = u.id
       WHERE nh.workflow_status = 'BU_Tentative_Entered' 
       AND nh.bu_head_tentative_entered = true
       AND nh.hr_head_final_entered = false
       ORDER BY nh.bu_head_tentative_date DESC`
    );

    // Get replacement requests that have tentative details but need final details
    const replacementResult = await pool.query(
      `SELECT r.*, u.name as bu_head_name, u.business_unit
       FROM "ReplacementApprovals" r
       JOIN "Users" u ON r.hiring_manager_id = u.id
       WHERE r.workflow_status = 'BU_Tentative_Entered' 
       AND r.bu_head_tentative_entered = true
       AND r.hr_head_final_entered = false
       ORDER BY r.bu_head_tentative_date DESC`
    );

    res.json({
      newHire: newHireResult.rows,
      replacement: replacementResult.rows
    });
  } catch (error) {
    console.error('Error fetching final details requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HR Head enters final details for requests with tentative details
app.put('/api/hr/enter-final-details/:requestType/:requestId', async (req, res) => {
  try {
    const { requestType, requestId } = req.params;
    const { exact_join_date, exact_salary, employee_id } = req.body;

    if (!exact_join_date || !exact_salary || !employee_id) {
      return res.status(400).json({ error: 'Exact join date, exact salary, and employee ID are required' });
    }

    let result;

    if (requestType === 'new-hire') {
      result = await pool.query(
        `UPDATE "NewHiringApprovals" 
         SET exact_join_date = $1, 
             exact_salary = $2,
             employee_id = $3,
             hr_head_final_entered = true,
             hr_head_final_date = CURRENT_TIMESTAMP,
             workflow_status = 'HR_Final_Entered',
             hired_status = 'Hired',
             hired_date = CURRENT_TIMESTAMP,
             approval_status = 'Approved',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND workflow_status = 'BU_Tentative_Entered' AND bu_head_tentative_entered = true
         RETURNING *`,
        [exact_join_date, exact_salary, employee_id, requestId]
      );
    } else if (requestType === 'replacement') {
      result = await pool.query(
        `UPDATE "ReplacementApprovals" 
         SET exact_join_date = $1, 
             exact_salary = $2,
             employee_id = $3,
             hr_head_final_entered = true,
             hr_head_final_date = CURRENT_TIMESTAMP,
             workflow_status = 'HR_Final_Entered',
             hired_status = 'Hired',
             hired_date = CURRENT_TIMESTAMP,
             approval_status = 'Approved',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND workflow_status = 'BU_Tentative_Entered' AND bu_head_tentative_entered = true
         RETURNING *`,
        [exact_join_date, exact_salary, employee_id, requestId]
      );
    } else {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not eligible for final details entry' });
    }

    const updatedRequest = result.rows[0];

    res.json({
      message: 'Final details entered successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error entering final details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's team cost
app.get('/api/users/:userId/team-cost', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT team_cost FROM "Users" WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      team_cost: result.rows[0].team_cost || 0
    });
  } catch (error) {
    console.error('Error fetching team cost:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's team cost
app.put('/api/users/:userId/team-cost', async (req, res) => {
  try {
    const { userId } = req.params;
    const { team_cost } = req.body;

    if (team_cost === undefined || team_cost === null || isNaN(team_cost)) {
      return res.status(400).json({ error: 'Invalid team cost value' });
    }

    const result = await pool.query(
      'UPDATE "Users" SET team_cost = $1 WHERE id = $2 RETURNING *',
      [team_cost, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Team cost updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating team cost:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get total CTC consumed from team budget (20% of each hired/joined candidate's salary)
app.get('/api/users/:userId/total-ctc', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's business unit
    const userResult = await pool.query(
      'SELECT business_unit FROM "Users" WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only joined hires: 20% of exact_salary (or ctc_offered if exact_salary not set) deducted from team budget
    const newHireResult = await pool.query(
      `SELECT COALESCE(SUM(
         (CASE 
           WHEN exact_salary IS NOT NULL AND exact_salary > 0 
           THEN (exact_salary::numeric * 0.20)
           ELSE (COALESCE(ctc_offered, 0)::numeric * 0.20)
         END)
       ), 0) as total 
       FROM "NewHiringApprovals" 
       WHERE hiring_manager_id = $1 
       AND (join_confirmed = true OR join_confirmation_status = 'Joined')`,
      [userId]
    );

    const replacementResult = await pool.query(
      `SELECT COALESCE(SUM(
         (CASE 
           WHEN exact_salary IS NOT NULL AND exact_salary > 0 
           THEN (exact_salary::numeric * 0.20)
           ELSE (COALESCE(ctc_offered, 0)::numeric * 0.20)
         END)
       ), 0) as total 
       FROM "ReplacementApprovals" 
       WHERE hiring_manager_id = $1 
       AND (join_confirmed = true OR join_confirmation_status = 'Joined')`,
      [userId]
    );

    const totalCTC = parseFloat(newHireResult.rows[0].total) + parseFloat(replacementResult.rows[0].total);

    res.json({ totalCTC });
  } catch (error) {
    console.error('Error calculating total CTC:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team budget breakdown: joined candidates with hired value and 20%
app.get('/api/users/:userId/team-budget-breakdown', async (req, res) => {
  try {
    const { userId } = req.params;

    const newHires = await pool.query(
      `SELECT candidate_name as name,
         (CASE WHEN exact_salary IS NOT NULL AND exact_salary > 0 
          THEN exact_salary ELSE COALESCE(ctc_offered, 0) END)::numeric as hired_value,
         (CASE WHEN exact_salary IS NOT NULL AND exact_salary > 0 
          THEN (exact_salary::numeric * 0.20) ELSE (COALESCE(ctc_offered, 0)::numeric * 0.20) END) as twenty_percent
       FROM "NewHiringApprovals"
       WHERE hiring_manager_id = $1 AND (join_confirmed = true OR join_confirmation_status = 'Joined')`,
      [userId]
    );

    const replacements = await pool.query(
      `SELECT replacement_candidate_name as name,
         (CASE WHEN exact_salary IS NOT NULL AND exact_salary > 0 
          THEN exact_salary ELSE COALESCE(ctc_offered, 0) END)::numeric as hired_value,
         (CASE WHEN exact_salary IS NOT NULL AND exact_salary > 0 
          THEN (exact_salary::numeric * 0.20) ELSE (COALESCE(ctc_offered, 0)::numeric * 0.20) END) as twenty_percent
       FROM "ReplacementApprovals"
       WHERE hiring_manager_id = $1 AND (join_confirmed = true OR join_confirmation_status = 'Joined')`,
      [userId]
    );

    const candidates = [
      ...newHires.rows.map(r => ({ candidate_name: r.name, hired_value: parseFloat(r.hired_value), twenty_percent: parseFloat(r.twenty_percent) })),
      ...replacements.rows.map(r => ({ candidate_name: r.name, hired_value: parseFloat(r.hired_value), twenty_percent: parseFloat(r.twenty_percent) }))
    ];

    const totalTwentyPercent = candidates.reduce((sum, c) => sum + c.twenty_percent, 0);
    const totalHiredValue = candidates.reduce((sum, c) => sum + c.hired_value, 0);

    res.json({ candidates, total: totalTwentyPercent, totalHiredValue });
  } catch (error) {
    console.error('Error fetching team budget breakdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get business unit cost and CTC data (20% of joined hires deducted from budget)
app.get('/api/bu-cost/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    // Get total team cost (from Users table)
    const budgetResponse = await pool.query(
      'SELECT COALESCE(SUM(team_cost), 0) as team_cost FROM "Users" WHERE business_unit = $1',
      [businessUnit]
    );

    // 20% of exact_salary for each joined hire (or ctc_offered if exact_salary not set)
    const newHireResponse = await pool.query(
      `SELECT COALESCE(SUM(
         (CASE 
           WHEN exact_salary IS NOT NULL AND exact_salary > 0 
           THEN (exact_salary::numeric * 0.20)
           ELSE (COALESCE(ctc_offered, 0)::numeric * 0.20)
         END)
       ), 0) as total 
       FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND (join_confirmed = true OR join_confirmation_status = 'Joined')`,
      [businessUnit]
    );

    const replacementResponse = await pool.query(
      `SELECT COALESCE(SUM(
         (CASE 
           WHEN exact_salary IS NOT NULL AND exact_salary > 0 
           THEN (exact_salary::numeric * 0.20)
           ELSE (COALESCE(ctc_offered, 0)::numeric * 0.20)
         END)
       ), 0) as total 
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       AND (join_confirmed = true OR join_confirmation_status = 'Joined')`,
      [businessUnit]
    );

    const totalCTC = parseFloat(newHireResponse.rows[0].total) + parseFloat(replacementResponse.rows[0].total);

    res.json({
      team_cost: parseFloat(budgetResponse.rows[0].team_cost) || 0,
      totalCTC
    });
  } catch (error) {
    console.error('Error fetching business unit cost:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Get join confirmation requests for BU Head (candidates with exact join date that need confirmation)
app.get('/api/bu/join-confirmation-requests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get new hire requests that need join confirmation
    const newHireResult = await pool.query(
      `SELECT nh.*, u.name as bu_head_name, u.business_unit
       FROM "NewHiringApprovals" nh
       JOIN "Users" u ON nh.hiring_manager_id = u.id
       WHERE nh.workflow_status = 'HR_Final_Entered' 
       AND nh.hr_head_final_entered = true
       AND nh.join_confirmation_status = 'Pending'
       AND nh.exact_join_date <= CURRENT_DATE
       AND nh.hiring_manager_id = $1
       ORDER BY nh.exact_join_date DESC`,
      [userId]
    );

    // Get replacement requests that need join confirmation
    const replacementResult = await pool.query(
      `SELECT r.*, u.name as bu_head_name, u.business_unit
       FROM "ReplacementApprovals" r
       JOIN "Users" u ON r.hiring_manager_id = u.id
       WHERE r.workflow_status = 'HR_Final_Entered' 
       AND r.hr_head_final_entered = true
       AND r.join_confirmation_status = 'Pending'
       AND r.exact_join_date <= CURRENT_DATE
       AND r.hiring_manager_id = $1
       ORDER BY r.exact_join_date DESC`,
      [userId]
    );

    res.json({
      newHire: newHireResult.rows,
      replacement: replacementResult.rows
    });
  } catch (error) {
    console.error('Error fetching join confirmation requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BU Head confirms join status
app.put('/api/bu/confirm-join/:requestType/:requestId', async (req, res) => {
  try {
    const { requestType, requestId } = req.params;
    const { join_confirmation_status, join_confirmation_notes } = req.body;

    if (!join_confirmation_status || !['Joined', 'Not_Joined'].includes(join_confirmation_status)) {
      return res.status(400).json({ error: 'Valid join confirmation status is required' });
    }

    // Get current record to avoid double-deduction (only deduct when newly becoming Joined)
    const table = requestType === 'new-hire' ? 'NewHiringApprovals' : 'ReplacementApprovals';
    const existing = await pool.query(
      `SELECT join_confirmation_status FROM "${table}" WHERE id = $1`,
      [requestId]
    );
    const wasAlreadyJoined = existing.rows[0]?.join_confirmation_status === 'Joined';

    let result;

    if (requestType === 'new-hire') {
      result = await pool.query(
        `UPDATE "NewHiringApprovals" 
         SET join_confirmed = true,
             join_confirmation_date = CURRENT_TIMESTAMP,
             join_confirmation_status = $1,
             join_confirmation_notes = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND workflow_status = 'HR_Final_Entered' AND hr_head_final_entered = true
         RETURNING *`,
        [join_confirmation_status, join_confirmation_notes, requestId]
      );
    } else if (requestType === 'replacement') {
      result = await pool.query(
        `UPDATE "ReplacementApprovals" 
         SET join_confirmed = true,
             join_confirmation_date = CURRENT_TIMESTAMP,
             join_confirmation_status = $1,
             join_confirmation_notes = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND workflow_status = 'HR_Final_Entered' AND hr_head_final_entered = true
         RETURNING *`,
        [join_confirmation_status, join_confirmation_notes, requestId]
      );
    } else {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not eligible for join confirmation' });
    }

    const updatedRequest = result.rows[0];

    // When newly marked Joined: subtract 20% of salary from hiring manager's team budget (no double-deduction)
    if (join_confirmation_status === 'Joined' && !wasAlreadyJoined) {
      const amount = (updatedRequest.exact_salary && updatedRequest.exact_salary > 0)
        ? updatedRequest.exact_salary * 0.20
        : (updatedRequest.ctc_offered || 0) * 0.20;
      const hiringManagerId = updatedRequest.hiring_manager_id;
      if (hiringManagerId && amount > 0) {
        await pool.query(
          `UPDATE "Users" 
           SET team_cost = GREATEST(COALESCE(team_cost, 0) - $1, 0) 
           WHERE id = $2`,
          [amount, hiringManagerId]
        );
      }
    }

    res.json({
      message: 'Join confirmation updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error confirming join status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get join confirmation requests for HR Head (candidates with exact join date that need confirmation)
app.get('/api/hr/join-confirmation-requests', async (req, res) => {
  try {
    // Get new hire requests that need join confirmation
    const newHireResult = await pool.query(
      `SELECT nh.*, u.name as bu_head_name, u.business_unit
       FROM "NewHiringApprovals" nh
       JOIN "Users" u ON nh.hiring_manager_id = u.id
       WHERE nh.workflow_status = 'HR_Final_Entered' 
       AND nh.hr_head_final_entered = true
       AND nh.join_confirmation_status = 'Pending'
       AND nh.exact_join_date <= CURRENT_DATE
       ORDER BY nh.exact_join_date DESC`
    );

    // Get replacement requests that need join confirmation
    const replacementResult = await pool.query(
      `SELECT r.*, u.name as bu_head_name, u.business_unit
       FROM "ReplacementApprovals" r
       JOIN "Users" u ON r.hiring_manager_id = u.id
       WHERE r.workflow_status = 'HR_Final_Entered' 
       AND r.hr_head_final_entered = true
       AND r.join_confirmation_status = 'Pending'
       AND r.exact_join_date <= CURRENT_DATE
       ORDER BY r.exact_join_date DESC`
    );

    res.json({
      newHire: newHireResult.rows,
      replacement: replacementResult.rows
    });
  } catch (error) {
    console.error('Error fetching join confirmation requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HR Head confirms join status
app.put('/api/hr/confirm-join/:requestType/:requestId', async (req, res) => {
  try {
    const { requestType, requestId } = req.params;
    const { join_confirmation_status, join_confirmation_notes } = req.body;

    if (!join_confirmation_status || !['Joined', 'Not_Joined'].includes(join_confirmation_status)) {
      return res.status(400).json({ error: 'Valid join confirmation status is required' });
    }

    const table = requestType === 'new-hire' ? 'NewHiringApprovals' : 'ReplacementApprovals';
    const existing = await pool.query(
      `SELECT join_confirmation_status FROM "${table}" WHERE id = $1`,
      [requestId]
    );
    const wasAlreadyJoined = existing.rows[0]?.join_confirmation_status === 'Joined';

    let result;

    if (requestType === 'new-hire') {
      result = await pool.query(
        `UPDATE "NewHiringApprovals" 
         SET join_confirmed = true,
             join_confirmation_date = CURRENT_TIMESTAMP,
             join_confirmation_status = $1,
             join_confirmation_notes = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND workflow_status = 'HR_Final_Entered' AND hr_head_final_entered = true
         RETURNING *`,
        [join_confirmation_status, join_confirmation_notes, requestId]
      );
    } else if (requestType === 'replacement') {
      result = await pool.query(
        `UPDATE "ReplacementApprovals" 
         SET join_confirmed = true,
             join_confirmation_date = CURRENT_TIMESTAMP,
             join_confirmation_status = $1,
             join_confirmation_notes = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND workflow_status = 'HR_Final_Entered' AND hr_head_final_entered = true
         RETURNING *`,
        [join_confirmation_status, join_confirmation_notes, requestId]
      );
    } else {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not eligible for join confirmation' });
    }

    const updatedRequest = result.rows[0];

    if (join_confirmation_status === 'Joined' && !wasAlreadyJoined) {
      const amount = (updatedRequest.exact_salary && updatedRequest.exact_salary > 0)
        ? updatedRequest.exact_salary * 0.20
        : (updatedRequest.ctc_offered || 0) * 0.20;
      const hiringManagerId = updatedRequest.hiring_manager_id;
      if (hiringManagerId && amount > 0) {
        await pool.query(
          `UPDATE "Users" 
           SET team_cost = GREATEST(COALESCE(team_cost, 0) - $1, 0) 
           WHERE id = $2`,
          [amount, hiringManagerId]
        );
      }
    }

    res.json({
      message: 'Join confirmation updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error confirming join status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get candidate details for "Hiring Ticket Raised" stat card
app.get('/api/candidates/hiring-ticket-raised/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    // Get all new hire and replacement requests for the business unit that are still in initial stage
    const newHireResult = await pool.query(
      `SELECT 
        id, candidate_name, position_title, business_unit, 
        created_at, approval_status,
        'new-hire' as request_type
       FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND (hr_head_approved = false OR hr_head_approved IS NULL)
       ORDER BY created_at DESC`,
      [businessUnit]
    );

    const replacementResult = await pool.query(
      `SELECT 
        id, replacement_candidate_name, replacement_current_designation as position_title, business_unit, 
        outgoing_employee_name, outgoing_designation, outgoing_department,
        created_at, approval_status,
        'replacement' as request_type
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       AND (hr_head_approved = false OR hr_head_approved IS NULL)
       ORDER BY created_at DESC`,
      [businessUnit]
    );

    console.log('New Hire Results:', newHireResult.rows);
    console.log('Replacement Results:', replacementResult.rows);

    const allCandidates = [...newHireResult.rows, ...replacementResult.rows];

    res.json(allCandidates);
  } catch (error) {
    console.error('Error fetching hiring ticket raised candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get candidate details for "Approved yet to hire" stat card
app.get('/api/candidates/approved-yet-to-hire/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    // Get candidates approved by HR Head and Admin but not yet finalized
    const newHireResult = await pool.query(
      `SELECT 
        id, candidate_name, position_title, business_unit, 
        ctc_offered, created_at, approval_status,
        'new-hire' as request_type
       FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND hr_head_approved = true
       AND admin_approved = true
       AND (bu_head_tentative_entered = false OR bu_head_tentative_entered IS NULL)
       ORDER BY created_at DESC`,
      [businessUnit]
    );

    const replacementResult = await pool.query(
      `SELECT 
        id, replacement_candidate_name, replacement_current_designation as position_title, business_unit, 
        outgoing_employee_name, outgoing_designation, outgoing_department,
        ctc_offered, created_at, approval_status,
        'replacement' as request_type
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       AND hr_head_approved = true
       AND admin_approved = true
       AND (bu_head_tentative_entered = false OR bu_head_tentative_entered IS NULL)
       ORDER BY created_at DESC`,
      [businessUnit]
    );

    const allCandidates = [...newHireResult.rows, ...replacementResult.rows];

    res.json(allCandidates);
  } catch (error) {
    console.error('Error fetching approved yet to hire candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get candidate details for "Selected yet to offer" stat card
app.get('/api/candidates/selected-yet-to-offer/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    // Get candidates where BU Head has entered tentative details but HR Head hasn't entered final details
    const newHireResult = await pool.query(
      `SELECT 
        id, tentative_candidate_name as candidate_name, position_title, business_unit, 
        tentative_join_date, bu_head_tentative_date, created_at, ctc_offered,
        'new-hire' as request_type
       FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND bu_head_tentative_entered = true
       AND (hr_head_final_entered = false OR hr_head_final_entered IS NULL)
       ORDER BY bu_head_tentative_date DESC`,
      [businessUnit]
    );

    const replacementResult = await pool.query(
      `SELECT 
        id, tentative_candidate_name, replacement_current_designation as position_title, business_unit, 
        outgoing_employee_name, outgoing_designation, outgoing_department,
        tentative_join_date, bu_head_tentative_date, created_at, ctc_offered,
        'replacement' as request_type
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       AND bu_head_tentative_entered = true
       AND (hr_head_final_entered = false OR hr_head_final_entered IS NULL)
       ORDER BY bu_head_tentative_date DESC`,
      [businessUnit]
    );

    const allCandidates = [...newHireResult.rows, ...replacementResult.rows];

    res.json(allCandidates);
  } catch (error) {
    console.error('Error fetching selected yet to offer candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get candidate details for "Offered, yet to join" stat card
app.get('/api/candidates/offered-yet-to-join/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    // Get candidates where HR Head has entered final details but BU Head hasn't confirmed join
    const newHireResult = await pool.query(
      `SELECT 
        id, tentative_candidate_name as candidate_name, position_title, business_unit, 
        exact_join_date, exact_salary, hr_head_final_date, created_at,
        'new-hire' as request_type
       FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND hr_head_final_entered = true
       AND (join_confirmed = false OR join_confirmed IS NULL)
       ORDER BY hr_head_final_date DESC`,
      [businessUnit]
    );

    const replacementResult = await pool.query(
      `SELECT 
        id, tentative_candidate_name, replacement_current_designation as position_title, business_unit, 
        outgoing_employee_name, outgoing_designation, outgoing_department,
        exact_join_date, exact_salary, hr_head_final_date, created_at,
        'replacement' as request_type
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       AND hr_head_final_entered = true
       AND (join_confirmed = false OR join_confirmed IS NULL)
       ORDER BY hr_head_final_date DESC`,
      [businessUnit]
    );

    const allCandidates = [...newHireResult.rows, ...replacementResult.rows];

    res.json(allCandidates);
  } catch (error) {
    console.error('Error fetching offered yet to join candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get candidate details for "Existing Team" stat card
app.get('/api/candidates/existing-team/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    // Get candidates who have joined (confirmed by BU Head)
    const newHireResult = await pool.query(
      `SELECT 
        id, tentative_candidate_name as candidate_name, position_title, business_unit, 
        exact_join_date, exact_salary, employee_id, join_confirmation_date, created_at,
        'new-hire' as request_type
       FROM "NewHiringApprovals" 
       WHERE business_unit = $1 
       AND (join_confirmed = true OR join_confirmation_status = 'Joined')
       ORDER BY join_confirmation_date DESC`,
      [businessUnit]
    );

    const replacementResult = await pool.query(
      `SELECT 
        id, tentative_candidate_name, replacement_current_designation as position_title, business_unit, 
        outgoing_employee_name, outgoing_designation, outgoing_department,
        exact_join_date, exact_salary, employee_id, join_confirmation_date, created_at,
        'replacement' as request_type
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       AND (join_confirmed = true OR join_confirmation_status = 'Joined')
       ORDER BY join_confirmation_date DESC`,
      [businessUnit]
    );

    const allCandidates = [...newHireResult.rows, ...replacementResult.rows];

    res.json(allCandidates);
  } catch (error) {
    console.error('Error fetching existing team candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get candidate details for "To be Rationalized" stat card
app.get('/api/candidates/to-be-rationalized/:businessUnit', async (req, res) => {
  try {
    const { businessUnit } = req.params;

    // Get replacement candidates who haven't joined yet
    const replacementResult = await pool.query(
      `SELECT 
        id, replacement_candidate_name, replacement_current_designation as position_title, business_unit, 
        outgoing_employee_name, outgoing_designation, outgoing_department,
        ctc_offered, created_at, approval_status,
        'replacement' as request_type
       FROM "ReplacementApprovals" 
       WHERE business_unit = $1 
       AND (join_confirmed = false OR join_confirmed IS NULL)
       AND (join_confirmation_status != 'Joined' OR join_confirmation_status IS NULL)
       ORDER BY created_at DESC`,
      [businessUnit]
    );

    res.json(replacementResult.rows);
  } catch (error) {
    console.error('Error fetching to be rationalized candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin dashboard candidate details endpoints
app.get('/api/admin/total-hires', async (req, res) => {
  try {
    const newHireResult = await pool.query(
      `SELECT 
        candidate_name as name,
        position_title as designation,
        ctc_offered,
        exact_join_date as doj,
        business_unit,
        'new-hire' as request_type,
        id
       FROM "NewHiringApprovals" 
       WHERE join_confirmed = true
       ORDER BY exact_join_date DESC`
    );

    const replacementResult = await pool.query(
      `SELECT 
        replacement_candidate_name as name,
        replacement_current_designation as designation,
        ctc_offered,
        exact_join_date as doj,
        business_unit,
        'replacement' as request_type,
        id
       FROM "ReplacementApprovals" 
       WHERE join_confirmed = true
       ORDER BY exact_join_date DESC`
    );

    const allHires = [...newHireResult.rows, ...replacementResult.rows];
    res.json(allHires);
  } catch (error) {
    console.error('Error fetching total hires:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/pending-requests', async (req, res) => {
  try {
    const newHireResult = await pool.query(
      `SELECT 
        candidate_name as name,
        position_title as designation,
        ctc_offered,
        created_at as request_date,
        business_unit,
        approval_status,
        'new-hire' as request_type,
        id
       FROM "NewHiringApprovals" 
       WHERE approval_status = 'Pending'
       ORDER BY created_at DESC`
    );

    const replacementResult = await pool.query(
      `SELECT 
        replacement_candidate_name as name,
        replacement_current_designation as designation,
        ctc_offered,
        created_at as request_date,
        business_unit,
        approval_status,
        'replacement' as request_type,
        id
       FROM "ReplacementApprovals" 
       WHERE approval_status = 'Pending'
       ORDER BY created_at DESC`
    );

    const allPending = [...newHireResult.rows, ...replacementResult.rows];
    res.json(allPending);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/pending-from-hr', async (req, res) => {
  try {
    const newHireResult = await pool.query(
      `SELECT 
        candidate_name as name,
        position_title as designation,
        ctc_offered,
        created_at as request_date,
        business_unit,
        approval_status,
        'new-hire' as request_type,
        id
       FROM "NewHiringApprovals" 
       WHERE hr_head_approved = true 
       AND (admin_approved = false OR admin_approved IS NULL)
       ORDER BY created_at DESC`
    );

    const replacementResult = await pool.query(
      `SELECT 
        replacement_candidate_name as name,
        replacement_current_designation as designation,
        ctc_offered,
        created_at as request_date,
        business_unit,
        approval_status,
        'replacement' as request_type,
        id
       FROM "ReplacementApprovals" 
       WHERE hr_head_approved = true 
       AND (admin_approved = false OR admin_approved IS NULL)
       ORDER BY created_at DESC`
    );

    const allPendingFromHR = [...newHireResult.rows, ...replacementResult.rows];
    res.json(allPendingFromHR);
  } catch (error) {
    console.error('Error fetching pending from HR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all candidate data with role-based access
app.get('/api/candidates/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details to check their role
    const userResult = await pool.query(
      'SELECT designation, business_unit FROM "Users" WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    let newHireQuery, replacementQuery, newHireParams = [], replacementParams = [];

    // Case-insensitive designation check
    const userDesignation = user.designation?.toLowerCase();

    if (userDesignation === 'bu head') {
      // BU Heads can only see their business unit's candidates
      console.log(`BU Head ${user.name} (ID: ${userId}) accessing data for business unit: ${user.business_unit}`);

      // Debug: Check what business units exist in the database
      const allBusinessUnitsResult = await pool.query(`
        SELECT DISTINCT business_unit FROM "NewHiringApprovals" 
        UNION 
        SELECT DISTINCT business_unit FROM "ReplacementApprovals"
        ORDER BY business_unit
      `);
      console.log('All business units in database:', allBusinessUnitsResult.rows.map(row => row.business_unit));

      // BU Heads should only see candidates they submitted themselves
      newHireQuery = `SELECT nh.*, u.name as bu_head_name, nh.business_unit
                      FROM "NewHiringApprovals" nh
                      JOIN "Users" u ON nh.hiring_manager_id = u.id
                      WHERE nh.hiring_manager_id = $1
                      ORDER BY nh.created_at DESC`;
      replacementQuery = `SELECT r.*, u.name as bu_head_name, r.business_unit
                         FROM "ReplacementApprovals" r
                         JOIN "Users" u ON r.hiring_manager_id = u.id
                         WHERE r.hiring_manager_id = $1
                         ORDER BY r.created_at DESC`;
      newHireParams = [userId];
      replacementParams = [userId];
    } else {
      // HR Heads and Admins can see all candidates
      console.log(`${user.designation} ${user.name} (ID: ${userId}) accessing all candidate data`);

      newHireQuery = `SELECT nh.*, u.name as bu_head_name, nh.business_unit
                      FROM "NewHiringApprovals" nh
                      JOIN "Users" u ON nh.hiring_manager_id = u.id
                      ORDER BY nh.created_at DESC`;
      replacementQuery = `SELECT r.*, u.name as bu_head_name, r.business_unit
                         FROM "ReplacementApprovals" r
                         JOIN "Users" u ON r.hiring_manager_id = u.id
                         ORDER BY r.created_at DESC`;
    }

    const newHireResult = await pool.query(newHireQuery, newHireParams);
    const replacementResult = await pool.query(replacementQuery, replacementParams);

    // Debug logging for BU Head
    if (userDesignation === 'bu head') {
      console.log(`Query executed for business unit: ${user.business_unit}`);
      console.log(`New Hire results: ${newHireResult.rows.length} records`);
      console.log(`Replacement results: ${replacementResult.rows.length} records`);

      // Log unique business units found in results
      const newHireBusinessUnits = [...new Set(newHireResult.rows.map(row => row.business_unit))];
      const replacementBusinessUnits = [...new Set(replacementResult.rows.map(row => row.business_unit))];
      console.log(`Business units in New Hire results:`, newHireBusinessUnits);
      console.log(`Business units in Replacement results:`, replacementBusinessUnits);
    }

    res.json({
      newHire: newHireResult.rows,
      replacement: replacementResult.rows
    });
  } catch (error) {
    console.error('Error fetching candidate data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update candidate data (Admin and HR Head only)
app.put('/api/candidates/:requestType/:requestId', async (req, res) => {
  try {
    const { requestType, requestId } = req.params;
    const { updated_by, ...updateData } = req.body;

    // Check if user has permission to edit
    const userResult = await pool.query(
      'SELECT designation FROM "Users" WHERE id = $1',
      [updated_by]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userResult.rows[0].designation;
    if (userRole !== 'Admin' && userRole !== 'HR Head' && userRole !== 'HR HEAD') {
      return res.status(403).json({ error: 'Unauthorized to edit candidate data' });
    }

    let result;
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date().toISOString());
    paramIndex++;

    updateValues.push(requestId);

    if (requestType === 'new-hire') {
      result = await pool.query(
        `UPDATE "NewHiringApprovals" 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        updateValues
      );
    } else if (requestType === 'replacement') {
      result = await pool.query(
        `UPDATE "ReplacementApprovals" 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        updateValues
      );
    } else {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({
      message: 'Candidate data updated successfully',
      candidate: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating candidate data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Debug endpoint to check join confirmation candidates
app.get('/api/debug/join-confirmation-candidates', async (req, res) => {
  try {
    // Check all candidates that might be eligible for join confirmation
    const allCandidatesResult = await pool.query(
      `SELECT 
        'new-hire' as type,
        id,
        candidate_name,
        position_title,
        business_unit,
        workflow_status,
        hr_head_final_entered,
        join_confirmation_status,
        exact_join_date,
        created_at
       FROM "NewHiringApprovals"
       WHERE hr_head_final_entered = true
       ORDER BY exact_join_date DESC`
    );

    const replacementCandidatesResult = await pool.query(
      `SELECT 
        'replacement' as type,
        id,
        replacement_candidate_name as candidate_name,
        replacement_current_designation as position_title,
        business_unit,
        workflow_status,
        hr_head_final_entered,
        join_confirmation_status,
        exact_join_date,
        created_at
       FROM "ReplacementApprovals"
       WHERE hr_head_final_entered = true
       ORDER BY exact_join_date DESC`
    );

    res.json({
      newHire: allCandidatesResult.rows,
      replacement: replacementCandidatesResult.rows,
      total: allCandidatesResult.rows.length + replacementCandidatesResult.rows.length
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
