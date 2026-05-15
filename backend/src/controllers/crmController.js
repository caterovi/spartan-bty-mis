const db = require('../config/db');

// ── Helper: activity log ──────────────────────────────────────────────────────
const log = async (customer_id, feedback_id, action_type, description, performed_by) => {
  try {
    await db.query(
      `INSERT INTO crm_activity_logs (customer_id, feedback_id, action_type, description, performed_by)
       VALUES (?,?,?,?,?)`,
      [customer_id||null, feedback_id||null, action_type, description, performed_by||'System']
    );
  } catch(e){ console.error('Activity log error:', e.message); }
};

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────

exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*,
        COUNT(DISTINCT f.id)                                             AS total_feedback,
        SUM(f.status NOT IN ('resolved','closed') AND f.id IS NOT NULL) AS unresolved_feedback,
        ROUND(AVG(f.rating),1)                                           AS average_rating,
        MAX(f.created_at)                                                AS last_feedback_date
      FROM customers c
      LEFT JOIN feedback f ON f.customer_id = c.id AND f.is_archived = FALSE
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const [[customer]] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const [feedbackHistory] = await db.query(
      'SELECT * FROM feedback WHERE customer_id = ? AND is_archived = FALSE ORDER BY created_at DESC',
      [id]
    );
    const [activityLogs] = await db.query(
      'SELECT * FROM crm_activity_logs WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50',
      [id]
    );
    const [[stats]] = await db.query(`
      SELECT COUNT(*) AS total_feedback,
        SUM(status NOT IN ('resolved','closed')) AS unresolved_feedback,
        ROUND(AVG(rating),1) AS average_rating,
        MAX(created_at) AS last_feedback_date
      FROM feedback WHERE customer_id = ? AND is_archived = FALSE
    `, [id]);

    res.json({ ...customer, ...stats, feedback_history: feedbackHistory, activity_logs: activityLogs });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.addCustomer = async (req, res) => {
  const { full_name, email, phone, address, segment, notes, performed_by } = req.body;
  if (!full_name?.trim()) return res.status(400).json({ message: 'Full name is required.' });
  if (email && !emailRx.test(email)) return res.status(400).json({ message: 'Invalid email format.' });

  if (email) {
    const [[dup]] = await db.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (dup) return res.status(400).json({ message: 'A customer with this email already exists.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO customers (full_name, email, phone, address, segment, notes, status)
       VALUES (?,?,?,?,?,?,'active')`,
      [full_name.trim(), email||null, phone||null, address||null,
       segment||'New Customer', notes||null]
    );
    await log(result.insertId, null, 'Customer Created', `Customer "${full_name}" manually created.`, performed_by||'CRM Staff');
    res.json({ message: 'Customer added successfully', customer_id: result.insertId });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateCustomer = async (req, res) => {
  const { full_name, email, phone, address, notes, segment, last_contacted_at, performed_by } = req.body;
  const { id } = req.params;

  if (!full_name?.trim()) return res.status(400).json({ message: 'Full name is required.' });
  if (email && !emailRx.test(email)) return res.status(400).json({ message: 'Invalid email format.' });

  if (email) {
    const [[dup]] = await db.query('SELECT id FROM customers WHERE email = ? AND id != ?', [email, id]);
    if (dup) return res.status(400).json({ message: 'Email already used by another customer.' });
  }

  try {
    const [result] = await db.query(
      `UPDATE customers SET full_name=?, email=?, phone=?, address=?, notes=?, segment=?, last_contacted_at=? WHERE id=?`,
      [full_name.trim(), email||null, phone||null, address||null, notes||null,
       segment||'New Customer', last_contacted_at||null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });
    await log(id, null, 'Customer Updated', `Customer "${full_name}" was updated.`, performed_by||'CRM Staff');
    res.json({ message: 'Customer updated successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.archiveCustomer = async (req, res) => {
  const { id } = req.params;
  const { performed_by } = req.body;
  try {
    const [[cust]] = await db.query('SELECT full_name FROM customers WHERE id = ?', [id]);
    if (!cust) return res.status(404).json({ message: 'Customer not found' });
    await db.query("UPDATE customers SET status = 'archived' WHERE id = ?", [id]);
    await log(id, null, 'Customer Archived', `Customer "${cust.full_name}" was archived.`, performed_by||'CRM Staff');
    res.json({ message: 'Customer archived successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── FEEDBACK ──────────────────────────────────────────────────────────────────

exports.getFeedback = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, c.email AS customer_email, c.phone AS customer_phone,
             c.segment AS customer_segment, c.status AS customer_status
      FROM feedback f
      LEFT JOIN customers c ON f.customer_id = c.id
      WHERE f.is_archived = FALSE
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.addFeedback = async (req, res) => {
  const {
    customer_id, customer_name, email, phone, address,
    type, subject, message, rating, priority,
    assigned_to, crm_user, due_date, performed_by,
  } = req.body;

  // Validation
  const customerName = customer_name?.trim() || '';
  if (!customer_id && !customerName) return res.status(400).json({ message: 'Customer name or existing customer is required.' });
  if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required.' });
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required.' });
  if (!rating)          return res.status(400).json({ message: 'Rating is required.' });
  if (!assigned_to)     return res.status(400).json({ message: 'Assigned CRM staff is required.' });
  if (email && !emailRx.test(email)) return res.status(400).json({ message: 'Invalid email format.' });

  const VALID_TYPES     = ['complaint','suggestion','compliment','inquiry'];
  const VALID_PRIORITIES = ['low','medium','high','urgent'];
  if (type && !VALID_TYPES.includes(type))         return res.status(400).json({ message: 'Invalid feedback type.' });
  if (priority && !VALID_PRIORITIES.includes(priority)) return res.status(400).json({ message: 'Invalid priority.' });

  try {
    let resolvedCustomerId = null;
    let resolvedCustomerName = customerName;
    let autoCreated = false;

    if (customer_id) {
      // Use existing customer
      const [[cust]] = await db.query('SELECT id, full_name FROM customers WHERE id = ?', [customer_id]);
      if (!cust) return res.status(400).json({ message: 'Selected customer not found.' });
      resolvedCustomerId = cust.id;
      resolvedCustomerName = cust.full_name;
    } else {
      // Try to find by email → phone → name
      let found = null;
      if (email) {
        const [[r]] = await db.query('SELECT id, full_name FROM customers WHERE email = ?', [email]);
        if (r) found = r;
      }
      if (!found && phone) {
        const [[r]] = await db.query('SELECT id, full_name FROM customers WHERE phone = ?', [phone]);
        if (r) found = r;
      }
      if (!found && customerName) {
        const [[r]] = await db.query('SELECT id, full_name FROM customers WHERE full_name = ?', [customerName]);
        if (r) found = r;
      }

      if (found) {
        resolvedCustomerId = found.id;
        resolvedCustomerName = found.full_name;
        await log(found.id, null, 'Feedback Linked', `Feedback linked to existing customer "${found.full_name}".`, performed_by||crm_user||'System');
      } else {
        // Auto-create customer
        const [newCust] = await db.query(
          `INSERT INTO customers (full_name, email, phone, address, segment, status)
           VALUES (?,?,?,?,'New Customer','active')`,
          [customerName, email||null, phone||null, address||null]
        );
        resolvedCustomerId = newCust.insertId;
        autoCreated = true;
        await log(resolvedCustomerId, null, 'Customer Auto-Created',
          `Customer "${customerName}" automatically created from feedback submission.`,
          performed_by||crm_user||'System');
      }
    }

    const [result] = await db.query(
      `INSERT INTO feedback
        (customer_id, customer_name, type, subject, message, rating, priority,
         assigned_to, crm_user, due_date, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,'new')`,
      [resolvedCustomerId, resolvedCustomerName,
       type||'inquiry', subject.trim(), message.trim(),
       Number(rating), priority||'medium',
       assigned_to||null, crm_user||null, due_date||null]
    );

    await log(resolvedCustomerId, result.insertId, 'Feedback Submitted',
      `Feedback "${subject}" submitted by ${resolvedCustomerName}.`,
      performed_by||crm_user||'System');

    res.json({
      message: autoCreated
        ? `Feedback submitted and new customer "${resolvedCustomerName}" was automatically created.`
        : 'Feedback submitted successfully.',
      feedback_id: result.insertId,
      customer_id: resolvedCustomerId,
      auto_created: autoCreated,
    });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateFeedback = async (req, res) => {
  const { id } = req.params;
  const {
    type, subject, message, rating, priority,
    assigned_to, due_date, action_taken, resolution_notes,
    follow_up_status, performed_by,
  } = req.body;

  try {
    const [[fb]] = await db.query('SELECT * FROM feedback WHERE id = ?', [id]);
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    await db.query(
      `UPDATE feedback SET type=?, subject=?, message=?, rating=?, priority=?,
        assigned_to=?, due_date=?, action_taken=?, resolution_notes=?, follow_up_status=?
       WHERE id=?`,
      [type||fb.type, subject||fb.subject, message||fb.message, rating||fb.rating,
       priority||fb.priority, assigned_to||fb.assigned_to, due_date||fb.due_date,
       action_taken||fb.action_taken, resolution_notes||fb.resolution_notes,
       follow_up_status||fb.follow_up_status, id]
    );
    await log(fb.customer_id, id, 'Feedback Updated', `Feedback "${subject||fb.subject}" was updated.`, performed_by||'CRM Staff');
    res.json({ message: 'Feedback updated successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.updateFeedbackStatus = async (req, res) => {
  const { status, action_taken, resolution_notes, performed_by } = req.body;
  const { id } = req.params;

  const VALID = ['new','assigned','in-review','contacted','resolved','closed'];
  if (!VALID.includes(status)) return res.status(400).json({ message: 'Invalid status value.' });

  try {
    const [[fb]] = await db.query('SELECT * FROM feedback WHERE id = ?', [id]);
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });

    if (status === 'resolved' && !action_taken?.trim() && !resolution_notes?.trim() && !fb.action_taken && !fb.resolution_notes)
      return res.status(400).json({ message: 'Action Taken or Resolution Notes are required before marking as Resolved.' });

    const resolved_at = status === 'resolved' && !fb.resolved_at ? new Date() : fb.resolved_at;
    const closed_at   = status === 'closed'   && !fb.closed_at   ? new Date() : fb.closed_at;

    await db.query(
      `UPDATE feedback SET status=?, resolved_at=?, closed_at=?,
        action_taken=COALESCE(?,action_taken),
        resolution_notes=COALESCE(?,resolution_notes)
       WHERE id=?`,
      [status, resolved_at, closed_at, action_taken||null, resolution_notes||null, id]
    );
    await log(fb.customer_id, id, 'Status Changed',
      `Feedback status changed from "${fb.status}" to "${status}".`,
      performed_by||'CRM Staff');
    res.json({ message: 'Status updated successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.archiveFeedback = async (req, res) => {
  const { id } = req.params;
  const { performed_by } = req.body;
  try {
    const [[fb]] = await db.query('SELECT * FROM feedback WHERE id = ?', [id]);
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    await db.query('UPDATE feedback SET is_archived = TRUE WHERE id = ?', [id]);
    await log(fb.customer_id, id, 'Feedback Archived', `Feedback "${fb.subject}" was archived.`, performed_by||'CRM Staff');
    res.json({ message: 'Feedback archived successfully' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.deleteFeedback = async (req, res) => {
  try {
    await db.query('DELETE FROM feedback WHERE id = ?', [req.params.id]);
    res.json({ message: 'Feedback deleted' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── ACTIVITY LOGS ─────────────────────────────────────────────────────────────

exports.getCustomerActivity = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM crm_activity_logs WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.params.id]
    );
    res.json(rows);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.getFeedbackActivity = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM crm_activity_logs WHERE feedback_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

exports.addActivity = async (req, res) => {
  const { customer_id, feedback_id, action_type, description, performed_by } = req.body;
  if (!action_type || !description) return res.status(400).json({ message: 'action_type and description are required.' });
  if (!customer_id && !feedback_id) return res.status(400).json({ message: 'customer_id or feedback_id is required.' });
  try {
    await log(customer_id||null, feedback_id||null, action_type, description, performed_by||'CRM Staff');
    res.json({ message: 'Activity logged' });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── SUMMARY ───────────────────────────────────────────────────────────────────

exports.getSummary = async (req, res) => {
  try {
    const [[{ total }]]          = await db.query("SELECT COUNT(*) as total FROM feedback WHERE is_archived=FALSE");
    const [[{ avg_rating }]]     = await db.query("SELECT ROUND(AVG(rating),1) as avg_rating FROM feedback WHERE is_archived=FALSE");
    const [[{ resolved }]]       = await db.query("SELECT COUNT(*) as resolved FROM feedback WHERE status='resolved' AND is_archived=FALSE");
    const [[{ new_count }]]      = await db.query("SELECT COUNT(*) as new_count FROM feedback WHERE status='new' AND is_archived=FALSE");
    const [[{ total_customers }]]= await db.query("SELECT COUNT(*) as total_customers FROM customers WHERE status='active'");
    const [byType]               = await db.query("SELECT type, COUNT(*) as count FROM feedback WHERE is_archived=FALSE GROUP BY type");
    const [byRating]             = await db.query("SELECT rating, COUNT(*) as count FROM feedback WHERE is_archived=FALSE GROUP BY rating ORDER BY rating DESC");
    const [byPriority]           = await db.query("SELECT priority, COUNT(*) as count FROM feedback WHERE is_archived=FALSE GROUP BY priority");

    // Overdue
    const [[{ overdue_count }]]  = await db.query(
      "SELECT COUNT(*) as overdue_count FROM feedback WHERE due_date < CURDATE() AND status NOT IN ('resolved','closed') AND is_archived=FALSE"
    );

    // Avg resolution time (hours)
    const [[{ avg_resolution_hours }]] = await db.query(
      "SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR,created_at,resolved_at)),1) as avg_resolution_hours FROM feedback WHERE resolved_at IS NOT NULL AND is_archived=FALSE"
    );

    // Low rating feedback
    const [low_rating_feedback] = await db.query(
      "SELECT id, customer_name, subject, rating, status, created_at FROM feedback WHERE rating <= 2 AND is_archived=FALSE ORDER BY created_at DESC LIMIT 10"
    );

    // Overdue feedback list
    const [overdue_feedback] = await db.query(
      "SELECT id, customer_name, subject, due_date, status, priority FROM feedback WHERE due_date < CURDATE() AND status NOT IN ('resolved','closed') AND is_archived=FALSE ORDER BY due_date ASC"
    );

    // High priority unresolved
    const [high_priority] = await db.query(
      "SELECT id, customer_name, subject, priority, status, created_at FROM feedback WHERE priority IN ('high','urgent') AND status NOT IN ('resolved','closed') AND is_archived=FALSE ORDER BY created_at DESC LIMIT 10"
    );

    // Unresolved by CRM user
    const [unresolved_by_user] = await db.query(
      "SELECT assigned_to, COUNT(*) as count FROM feedback WHERE status NOT IN ('resolved','closed') AND assigned_to IS NOT NULL AND is_archived=FALSE GROUP BY assigned_to ORDER BY count DESC"
    );

    res.json({
      total, avg_rating: avg_rating||0, resolved, new_count,
      total_customers, byType, byRating, byPriority,
      overdue_count, avg_resolution_hours: avg_resolution_hours||0,
      low_rating_feedback, overdue_feedback, high_priority, unresolved_by_user,
    });
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};

// ── GENERATE SUGGESTIONS ──────────────────────────────────────────────────────

exports.generateSuggestions = async (req, res) => {
  try {
    const [feedbacks] = await db.query(
      `SELECT type, COUNT(*) as count, ROUND(AVG(rating),1) as avg_rating,
        SUM(priority IN ('high','urgent')) as high_count
       FROM feedback WHERE is_archived=FALSE GROUP BY type ORDER BY count DESC`
    );

    const [[{ low_rating_count }]] = await db.query(
      "SELECT COUNT(*) as low_rating_count FROM feedback WHERE rating <= 2 AND is_archived=FALSE"
    );
    const [[{ unresolved_count }]] = await db.query(
      "SELECT COUNT(*) as unresolved_count FROM feedback WHERE status NOT IN ('resolved','closed') AND is_archived=FALSE"
    );

    const suggestions = [];

    for (const f of feedbacks) {
      if (f.type === 'complaint' && f.count >= 1) {
        suggestions.push({
          title: `Address Customer Complaints (${f.count} received)`,
          source: 'crm_feedback', feedback_type: 'complaint',
          suggestion: `${f.count} complaint(s) received with avg rating ${f.avg_rating}. Consider targeted service improvement campaigns.`,
          priority: f.count >= 5 ? 'high' : f.count >= 3 ? 'medium' : 'low',
          suggested_action: 'Review complaints and create a service improvement campaign or FAQ content.',
        });
      }
      if (f.type === 'compliment' && f.avg_rating >= 4) {
        suggestions.push({
          title: 'Leverage Positive Feedback for Marketing',
          source: 'crm_feedback', feedback_type: 'compliment',
          suggestion: `${f.count} compliment(s) with avg rating ${f.avg_rating}. Use for testimonial campaigns and social media content.`,
          priority: 'medium',
          suggested_action: 'Create social proof content — testimonials, UGC posts, TikTok highlights.',
        });
      }
      if (f.type === 'suggestion' && f.count >= 1) {
        suggestions.push({
          title: `Review Customer Suggestions (${f.count} submitted)`,
          source: 'crm_feedback', feedback_type: 'suggestion',
          suggestion: `${f.count} suggestion(s) submitted. Review and prioritize popular requests for upcoming campaigns.`,
          priority: 'low',
          suggested_action: 'Compile suggestions and assess feasibility for upcoming product or service updates.',
        });
      }
      if (f.type === 'inquiry' && f.count >= 2) {
        suggestions.push({
          title: `Answer Common Inquiries (${f.count} received)`,
          source: 'crm_feedback', feedback_type: 'inquiry',
          suggestion: `${f.count} inquiry/inquiries received. Create FAQ content or explainer videos.`,
          priority: 'medium',
          suggested_action: 'Create FAQ posts on TikTok, Reels, or Shopee product descriptions to address common questions.',
        });
      }
    }

    if (low_rating_count >= 1) {
      suggestions.push({
        title: `Recover Low-Rating Customers (${low_rating_count} reviews)`,
        source: 'crm_feedback', feedback_type: 'low_rating',
        suggestion: `${low_rating_count} feedback(s) with rating ≤ 2. Implement proactive customer recovery strategy.`,
        priority: 'high',
        suggested_action: 'Reach out to low-rating customers with apology messaging and exclusive offers.',
      });
    }

    if (unresolved_count >= 3) {
      suggestions.push({
        title: `Resolve Pending Feedback (${unresolved_count} unresolved)`,
        source: 'crm_feedback', feedback_type: 'unresolved',
        suggestion: `${unresolved_count} unresolved feedback items. Assign CRM staff and fast-track resolution.`,
        priority: unresolved_count >= 10 ? 'urgent' : 'high',
        suggested_action: 'Assign unresolved feedback to available CRM staff and set due dates.',
      });
    }

    // Prevent duplicates: delete existing crm_feedback suggestions then re-insert
    await db.query("DELETE FROM marketing_suggestions WHERE source = 'crm_feedback'");

    let inserted = 0;
    for (const s of suggestions) {
      await db.query(
        `INSERT INTO marketing_suggestions (source, feedback_type, suggestion, priority)
         VALUES (?,?,?,?)`,
        [s.source, s.feedback_type, s.suggestion, s.priority]
      );
      inserted++;
    }

    res.json({
      message: `${inserted} marketing suggestion${inserted!==1?'s':''} generated from CRM feedback.`,
      count: inserted,
      suggestions,
    });
  } catch(err){ res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.getSuggestions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM marketing_suggestions ORDER BY created_at DESC');
    res.json(rows);
  } catch(err){ res.status(500).json({ message: 'Server error' }); }
};