const NcrModel = require('../models/NcrModel');
const ExcelJS = require('exceljs');

exports.createNcr = async (req, res) => {
  try {
    const {
      report_date,
      area,
      line,
      product_name,
      product_code,
      ncr_source,
      ncr_type,
      severity,
      description,
      immediate_action,
      root_cause,
      root_cause_category,
      corrective_action,
      preventive_action,
      responsible_person,
      responsible_department,
      target_date,
      process_area,
      remarks
    } = req.body;

    if (!severity || !description) {
      return res.status(400).json({
        success: false,
        message: 'Severity and description are required'
      });
    }

    const attachmentPath = req.file ? req.file.filename : null;

    const ncr = await NcrModel.create({
      report_date: report_date || new Date(),
      area,
      line,
      product_name,
      product_code,
      ncr_source,
      ncr_type,
      severity,
      description,
      immediate_action,
      root_cause,
      root_cause_category,
      corrective_action,
      preventive_action,
      responsible_person,
      responsible_department,
      target_date,
      process_area,
      remarks,
      raised_by_name: req.user.name,
      raised_by_id: req.user.employee_id,
      attachment_path: attachmentPath,
      created_by_user_id: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'NCR created successfully',
      data: ncr
    });
  } catch (error) {
    console.error('Error creating NCR:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating NCR',
      error: error.message
    });
  }
};

exports.getAllNcrs = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      area: req.query.area,
      department: req.query.department,
      ncr_source: req.query.ncr_source,
      ncr_type: req.query.ncr_type,
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };

    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const ncrs = await NcrModel.findAll(filters);

    res.json({
      success: true,
      data: ncrs,
      count: ncrs.length
    });
  } catch (error) {
    console.error('Error fetching NCRs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NCRs',
      error: error.message
    });
  }
};

exports.getNcrById = async (req, res) => {
  try {
    const ncr = await NcrModel.findById(req.params.id);

    if (!ncr) {
      return res.status(404).json({
        success: false,
        message: 'NCR not found'
      });
    }

    res.json({
      success: true,
      data: ncr
    });
  } catch (error) {
    console.error('Error fetching NCR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NCR',
      error: error.message
    });
  }
};

exports.updateNcr = async (req, res) => {
  try {
    const existingNcr = await NcrModel.findById(req.params.id);

    if (!existingNcr) {
      return res.status(404).json({
        success: false,
        message: 'NCR not found'
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      updateData.attachment_path = req.file.filename;
    }

    const updatedNcr = await NcrModel.update(req.params.id, updateData);

    res.json({
      success: true,
      message: 'NCR updated successfully',
      data: updatedNcr
    });
  } catch (error) {
    console.error('Error updating NCR:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating NCR',
      error: error.message
    });
  }
};

exports.updateNcrStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Open', 'In Progress', 'Waiting for Verification', 'Closed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const existingNcr = await NcrModel.findById(req.params.id);
    if (!existingNcr) {
      return res.status(404).json({
        success: false,
        message: 'NCR not found'
      });
    }

    const updatedNcr = await NcrModel.updateStatus(req.params.id, status);

    res.json({
      success: true,
      message: 'NCR status updated successfully',
      data: updatedNcr
    });
  } catch (error) {
    console.error('Error updating NCR status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating NCR status',
      error: error.message
    });
  }
};

exports.deleteNcr = async (req, res) => {
  try {
    const deletedNcr = await NcrModel.delete(req.params.id);

    if (!deletedNcr) {
      return res.status(404).json({
        success: false,
        message: 'NCR not found'
      });
    }

    res.json({
      success: true,
      message: 'NCR deleted successfully',
      data: deletedNcr
    });
  } catch (error) {
    console.error('Error deleting NCR:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting NCR',
      error: error.message
    });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const summary = await NcrModel.getSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching summary',
      error: error.message
    });
  }
};

exports.exportToCsv = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      area: req.query.area,
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };

    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const ncrs = await NcrModel.getAllForExport(filters);

    const headers = [
      'NCR Number', 'Report Date', 'Area', 'Line', 'Product Name', 'Product Code',
      'NCR Source', 'NCR Type', 'Severity', 'Status', 'Description',
      'Immediate Action', 'Root Cause', 'Root Cause Category',
      'Corrective Action', 'Preventive Action', 'Responsible Person',
      'Responsible Department', 'Target Date', 'Closure Date',
      'Raised By', 'Raised By ID', 'Process Area', 'Remarks', 'Created At'
    ];

    let csv = headers.join(',') + '\n';

    ncrs.forEach(ncr => {
      const row = [
        ncr.ncr_number,
        ncr.report_date ? new Date(ncr.report_date).toLocaleDateString() : '',
        ncr.area || '',
        ncr.line || '',
        ncr.product_name || '',
        ncr.product_code || '',
        ncr.ncr_source || '',
        ncr.ncr_type || '',
        ncr.severity || '',
        ncr.status || '',
        (ncr.description || '').replace(/"/g, '""'),
        (ncr.immediate_action || '').replace(/"/g, '""'),
        (ncr.root_cause || '').replace(/"/g, '""'),
        ncr.root_cause_category || '',
        (ncr.corrective_action || '').replace(/"/g, '""'),
        (ncr.preventive_action || '').replace(/"/g, '""'),
        ncr.responsible_person || '',
        ncr.responsible_department || '',
        ncr.target_date ? new Date(ncr.target_date).toLocaleDateString() : '',
        ncr.closure_date ? new Date(ncr.closure_date).toLocaleDateString() : '',
        ncr.raised_by_name || '',
        ncr.raised_by_id || '',
        ncr.process_area || '',
        (ncr.remarks || '').replace(/"/g, '""'),
        ncr.created_at ? new Date(ncr.created_at).toLocaleString() : ''
      ].map(field => `"${field}"`);

      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ncr_reports.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting to CSV',
      error: error.message
    });
  }
};

exports.exportToExcel = async (req, res) => {
  try {
    const ncrs = await NcrModel.getAllForExport();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NCR Reports');

    worksheet.columns = [
      { header: 'NCR Number', key: 'ncr_number', width: 18 },
      { header: 'Report Date', key: 'report_date', width: 12 },
      { header: 'Area', key: 'area', width: 15 },
      { header: 'Line', key: 'line', width: 12 },
      { header: 'Product Name', key: 'product_name', width: 20 },
      { header: 'Product Code', key: 'product_code', width: 12 },
      { header: 'NCR Source', key: 'ncr_source', width: 18 },
      { header: 'NCR Type', key: 'ncr_type', width: 15 },
      { header: 'Severity', key: 'severity', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Immediate Action', key: 'immediate_action', width: 30 },
      { header: 'Root Cause', key: 'root_cause', width: 30 },
      { header: 'Root Cause Category', key: 'root_cause_category', width: 15 },
      { header: 'Corrective Action', key: 'corrective_action', width: 30 },
      { header: 'Preventive Action', key: 'preventive_action', width: 30 },
      { header: 'Responsible Person', key: 'responsible_person', width: 20 },
      { header: 'Responsible Department', key: 'responsible_department', width: 20 },
      { header: 'Target Date', key: 'target_date', width: 12 },
      { header: 'Closure Date', key: 'closure_date', width: 12 },
      { header: 'Raised By', key: 'raised_by_name', width: 18 },
      { header: 'Created At', key: 'created_at', width: 18 }
    ];

    ncrs.forEach(ncr => {
      worksheet.addRow({
        ncr_number: ncr.ncr_number,
        report_date: ncr.report_date ? new Date(ncr.report_date).toLocaleDateString() : '',
        area: ncr.area,
        line: ncr.line,
        product_name: ncr.product_name,
        product_code: ncr.product_code,
        ncr_source: ncr.ncr_source,
        ncr_type: ncr.ncr_type,
        severity: ncr.severity,
        status: ncr.status,
        description: ncr.description,
        immediate_action: ncr.immediate_action,
        root_cause: ncr.root_cause,
        root_cause_category: ncr.root_cause_category,
        corrective_action: ncr.corrective_action,
        preventive_action: ncr.preventive_action,
        responsible_person: ncr.responsible_person,
        responsible_department: ncr.responsible_department,
        target_date: ncr.target_date ? new Date(ncr.target_date).toLocaleDateString() : '',
        closure_date: ncr.closure_date ? new Date(ncr.closure_date).toLocaleDateString() : '',
        raised_by_name: ncr.raised_by_name,
        created_at: ncr.created_at ? new Date(ncr.created_at).toLocaleString() : ''
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ncr_reports.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting to Excel',
      error: error.message
    });
  }
};
