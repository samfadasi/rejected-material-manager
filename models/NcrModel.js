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
        ncr_number, date_raised, raised_by_name, raised_by_employee_id,
        department, process_area, source_type, nonconformity_description,
        requirement_reference, severity, immediate_correction, root_cause,
        corrective_action, preventive_action, responsible_person, target_date,
        status, attachment_path, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        ncrNumber,
        data.date_raised || new Date(),
        data.raised_by_name,
        data.raised_by_employee_id,
        data.department,
        data.process_area,
        data.source_type,
        data.nonconformity_description,
        data.requirement_reference,
        data.severity,
        data.immediate_correction,
        data.root_cause,
        data.corrective_action,
        data.preventive_action,
        data.responsible_person,
        data.target_date,
        data.status || 'Open',
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

    if (filters.department) {
      query += ` AND department = $${paramIndex++}`;
      params.push(filters.department);
    }

    if (filters.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }

    if (filters.source_type) {
      query += ` AND source_type = $${paramIndex++}`;
      params.push(filters.source_type);
    }

    if (filters.from) {
      query += ` AND date_raised >= $${paramIndex++}`;
      params.push(filters.from);
    }

    if (filters.to) {
      query += ` AND date_raised <= $${paramIndex++}`;
      params.push(filters.to);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    
    const ncrs = result.rows.map(ncr => {
      if (ncr.status !== 'Closed' && ncr.target_date && new Date(ncr.target_date) < new Date()) {
        ncr.computed_status = 'Overdue';
      } else {
        ncr.computed_status = ncr.status;
      }
      return ncr;
    });

    return ncrs;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'date_raised', 'raised_by_name', 'raised_by_employee_id', 'department',
      'process_area', 'source_type', 'nonconformity_description', 'requirement_reference',
      'severity', 'immediate_correction', 'root_cause', 'corrective_action',
      'preventive_action', 'responsible_person', 'target_date', 'closure_date',
      'status', 'attachment_path'
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
    const closedResult = await pool.query("SELECT COUNT(*) as count FROM ncr_reports WHERE status = 'Closed'");
    const overdueResult = await pool.query(
      "SELECT COUNT(*) as count FROM ncr_reports WHERE status != 'Closed' AND target_date < CURRENT_DATE"
    );

    const bySeverityResult = await pool.query(
      'SELECT severity, COUNT(*) as count FROM ncr_reports GROUP BY severity'
    );

    const byDepartmentResult = await pool.query(
      'SELECT department, COUNT(*) as count FROM ncr_reports GROUP BY department'
    );

    const bySourceResult = await pool.query(
      'SELECT source_type, COUNT(*) as count FROM ncr_reports GROUP BY source_type'
    );

    const bySeverity = {};
    bySeverityResult.rows.forEach(row => {
      bySeverity[row.severity] = parseInt(row.count);
    });

    const byDepartment = {};
    byDepartmentResult.rows.forEach(row => {
      byDepartment[row.department] = parseInt(row.count);
    });

    const bySource = {};
    bySourceResult.rows.forEach(row => {
      bySource[row.source_type] = parseInt(row.count);
    });

    return {
      total_ncr: parseInt(totalResult.rows[0].total),
      open_ncr: parseInt(openResult.rows[0].count),
      in_progress_ncr: parseInt(inProgressResult.rows[0].count),
      closed_ncr: parseInt(closedResult.rows[0].count),
      overdue_ncr: parseInt(overdueResult.rows[0].count),
      count_by_severity: bySeverity,
      count_by_department: byDepartment,
      count_by_source: bySource
    };
  }

  static async getAllForExport() {
    const result = await pool.query(
      'SELECT * FROM ncr_reports ORDER BY created_at DESC'
    );
    return result.rows;
  }
}

module.exports = NcrModel;
