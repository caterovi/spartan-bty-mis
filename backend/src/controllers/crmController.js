const db = require('../config/db');

exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addCustomer = async (req, res) => {
  const { full_name, email, phone, address } = req.body;
  try {
    await db.query('INSERT INTO customers (full_name, email, phone, address) VALUES (?,?,?,?)', [full_name, email, phone, address]);
    res.json({ message: 'Customer added successfully' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getFeedback = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, c.email as customer_email
       FROM feedback f
       LEFT JOIN customers c ON f.customer_id = c.id
       ORDER BY f.created_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.addFeedback = async (req, res) => {
  const { customer_id, customer_name, type, subject, message, rating, crm_user } = req.body;
  try {
    await db.query(
      'INSERT INTO feedback (customer_id, customer_name, type, subject, message, rating, crm_user) VALUES (?,?,?,?,?,?,?)',
      [customer_id || null, customer_name, type, subject, message, rating, crm_user || null]
    );
    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateFeedbackStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE feedback SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteFeedback = async (req, res) => {
  try {
    await db.query('DELETE FROM feedback WHERE id = ?', [req.params.id]);
    res.json({ message: 'Feedback deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getSummary = async (req, res) => {
  try {
    const [[{ total }]]           = await db.query('SELECT COUNT(*) as total FROM feedback');
    const [[{ avg_rating }]]      = await db.query('SELECT ROUND(AVG(rating), 1) as avg_rating FROM feedback');
    const [[{ resolved }]]        = await db.query("SELECT COUNT(*) as resolved FROM feedback WHERE status = 'resolved'");
    const [[{ new_count }]]       = await db.query("SELECT COUNT(*) as new_count FROM feedback WHERE status = 'new'");
    const [byType]                = await db.query('SELECT type, COUNT(*) as count FROM feedback GROUP BY type');
    const [byRating]              = await db.query('SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating ORDER BY rating DESC');
    const [[{ total_customers }]] = await db.query('SELECT COUNT(*) as total_customers FROM customers');
    res.json({ total, avg_rating, resolved, new_count, byType, byRating, total_customers });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.generateSuggestions = async (req, res) => {
  try {
    const [feedbacks] = await db.query(
      `SELECT type, COUNT(*) as count, ROUND(AVG(rating),1) as avg_rating FROM feedback GROUP BY type ORDER BY count DESC`
    );
    const suggestions = [];
    for (const f of feedbacks) {
      if (f.type === 'complaint' && f.count >= 1) {
        suggestions.push({ source: 'crm_feedback', feedback_type: 'complaint',
          suggestion: `${f.count} complaint(s) received. Consider addressing pain points through targeted promotions or service improvements.`,
          priority: f.count >= 3 ? 'high' : 'medium' });
      }
      if (f.type === 'compliment' && f.avg_rating >= 4) {
        suggestions.push({ source: 'crm_feedback', feedback_type: 'compliment',
          suggestion: `Customers are happy (avg rating: ${f.avg_rating}). Leverage positive feedback for social media content and testimonial campaigns.`,
          priority: 'medium' });
      }
      if (f.type === 'suggestion') {
        suggestions.push({ source: 'crm_feedback', feedback_type: 'suggestion',
          suggestion: `${f.count} customer suggestion(s) received. Review and consider implementing popular requests in upcoming campaigns.`,
          priority: 'low' });
      }
      if (f.type === 'inquiry' && f.count >= 2) {
        suggestions.push({ source: 'crm_feedback', feedback_type: 'inquiry',
          suggestion: `${f.count} customer inquiries received. Create FAQ content or explainer posts on TikTok/Reels to address common questions.`,
          priority: 'medium' });
      }
    }
    await db.query("DELETE FROM marketing_suggestions WHERE source = 'crm_feedback'");
    for (const s of suggestions) {
      await db.query(
        'INSERT INTO marketing_suggestions (source, feedback_type, suggestion, priority) VALUES (?,?,?,?)',
        [s.source, s.feedback_type, s.suggestion, s.priority]
      );
    }
    res.json({ message: `${suggestions.length} suggestions generated`, suggestions });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.getSuggestions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM marketing_suggestions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};