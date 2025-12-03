const { pool } = require('./db');

class NcrModel {
  static async generateNcrNumber() {
    const currentYear = new Date().getFullYear();
    
    const counterResult = await pool.query(
      `INSERT INTO ncr_counter (year, counter) VALUES ($1, 1)
       ON CONFLICT (year) DO UPDATE SET counter = ncr_counter.counter + 1
       RETURNING counter`,
      [currentYear]
    );
    
    const counter = counterResult.rows[0].counter;
    return `NCR-${currentYear}-${String(counter).padStart(4, '0')}`;
  }

  static async create(data) {
    const ncrNumber = await this.generateNcrNumber();
    
    const result = await pool.query(
      `INSERT INTO ncr_reports (
        ncr_number, report_date, area, line, product_name, product_code,
        ncr_source, ncr_type, severity, description, immediate_action,
        root_cause, root_cause_category, corrective_action, preventive_action,
        responsible_person, responsible_department, target_date, status,
        raised_by_name, raised_by_id, process_area, remarks, attachment_path,
        created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
      [
        ncrNumber,
        data.report_date || new Date(),
        data.area,
        data.line,
        data.product_name,
        data.product_code,
        data.ncr_source,
        data.ncr_type,
        data.severity,
        data.description,
        data.immediate_action,
        data.root_cause,
        data.root_cause_category,
        data.corrective_action,
        data.preventive_action,
        data.responsible_person,
        data.responsible_department,
        data.target_date,
        data.status || 'Open',
        data.raised_by_name,
        data.raised_by_id,
        data.process_area,
        data.remarks,
        data.attachment_path,
        data.created_by_user_id
      ]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM ncr_reports WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM ncr_reports WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }

    if (filters.area) {
      query += ` AND area ILIKE $${paramIndex++}`;
      params.push(`%${filters.area}%`);
    }

    if (filters.department) {
      query += ` AND responsible_department = $${paramIndex++}`;
      params.push(filters.department);
    }

    if (filters.ncr_source) {
      query += ` AND ncr_source = $${paramIndex++}`;
      params.push(filters.ncr_source);
    }

    if (filters.ncr_type) {
      query += ` AND ncr_type = $${paramIndex++}`;
      params.push(filters.ncr_type);
    }

    if (filters.from_date) {
      query += ` AND report_date >= $${paramIndex++}`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND report_date <= $${paramIndex++}`;
      params.push(filters.to_date);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'report_date', 'area', 'line', 'product_name', 'product_code',
      'ncr_source', 'ncr_type', 'severity', 'description', 'immediate_action',
      'root_cause', 'root_cause_category', 'corrective_action', 'preventive_action',
      'responsible_person', 'responsible_department', 'target_date', 'closure_date',
      'status', 'verified_by_name', 'verified_by_id', 'approved_by_name',
      'approved_by_id', 'process_area', 'remarks', 'attachment_path'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id);

    const query = `UPDATE ncr_reports SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async updateStatus(id, status, closureDate = null) {
    let query;
    let params;

    if (status === 'Closed') {
      query = `UPDATE ncr_reports SET status = $1, closure_date = $2, updated_at = $3 WHERE id = $4 RETURNING *`;
      params = [status, closureDate || new Date(), new Date(), id];
    } else {
      query = `UPDATE ncr_reports SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *`;
      params = [status, new Date(), id];
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM ncr_reports WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async getSummary() {
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM ncr_reports');
    const openResult = await pool.query("SELECT COUNT(*) as count FROM ncr_reports WHERE status = 'Open'");
    const inProgressResult = await pool.query("SELECT COUNT(*) as count FROM ncr_reports WHERE status = 'In Progress'");
    const waitingResult = await pool.query("SELECT COUNT(*) as count FROM ncr_reports WHERE status = 'Waiting for Verification'");
    const closedResult = await pool.query("SELECT COUNT(*) as count FROM ncr_reports WHERE status = 'Closed'");
    const overdueResult = await pool.query(
      "SELECT COUNT(*) as count FROM ncr_reports WHERE status != 'Closed' AND target_date < CURRENT_DATE"
    );

    const closedThisMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM ncr_reports 
       WHERE status = 'Closed' 
       AND closure_date >= DATE_TRUNC('month', CURRENT_DATE)`
    );

    const bySeverityResult = await pool.query(
      'SELECT severity, COUNT(*) as count FROM ncr_reports GROUP BY severity'
    );

    const byTypeResult = await pool.query(
      'SELECT ncr_type, COUNT(*) as count FROM ncr_reports GROUP BY ncr_type'
    );

    const byDepartmentResult = await pool.query(
      'SELECT responsible_department, COUNT(*) as count FROM ncr_reports GROUP BY responsible_department'
    );

    const bySourceResult = await pool.query(
      'SELECT ncr_source, COUNT(*) as count FROM ncr_reports GROUP BY ncr_source'
    );

    const byAreaResult = await pool.query(
      'SELECT area, COUNT(*) as count FROM ncr_reports GROUP BY area'
    );

    const bySeverity = {};
    bySeverityResult.rows.forEach(row => {
      bySeverity[row.severity || 'Unknown'] = parseInt(row.count);
    });

    const byType = {};
    byTypeResult.rows.forEach(row => {
      byType[row.ncr_type || 'Unknown'] = parseInt(row.count);
    });

    const byDepartment = {};
    byDepartmentResult.rows.forEach(row => {
      byDepartment[row.responsible_department || 'Unknown'] = parseInt(row.count);
    });

    const bySource = {};
    bySourceResult.rows.forEach(row => {
      bySource[row.ncr_source || 'Unknown'] = parseInt(row.count);
    });

    const byArea = {};
    byAreaResult.rows.forEach(row => {
      byArea[row.area || 'Unknown'] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult.rows[0].total),
      total_open: parseInt(openResult.rows[0].count),
      total_in_progress: parseInt(inProgressResult.rows[0].count),
      total_waiting: parseInt(waitingResult.rows[0].count),
      total_closed: parseInt(closedResult.rows[0].count),
      total_overdue: parseInt(overdueResult.rows[0].count),
      closed_this_month: parseInt(closedThisMonthResult.rows[0].count),
      count_by_severity: bySeverity,
      count_by_type: byType,
      count_by_department: byDepartment,
      count_by_source: bySource,
      count_by_area: byArea
    };
  }

  static async getAllForExport(filters = {}) {
    return await this.findAll(filters);
  }
}

module.exports = NcrModel;
