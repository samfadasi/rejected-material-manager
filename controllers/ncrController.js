const NcrModel = require('../models/NcrModel');
const ExcelJS = require('exceljs');

exports.createNcr = async (req, res) => {
  try {
    const {
      date_raised,
      raised_by_name,
      raised_by_employee_id,
      department,
      process_area,
      source_type,
      nonconformity_description,
      requirement_reference,
      severity,
      immediate_correction,
      root_cause,
      corrective_action,
      preventive_action,
      responsible_person,
      target_date
    } = req.body;

    if (!department || !source_type || !severity || !nonconformity_description) {
      return res.status(400).json({
        success: false,
        message: 'Department, source type, severity, and description are required'
      });
    }

    const attachmentPath = req.file ? req.file.filename : null;

    const ncr = await NcrModel.create({
      date_raised: date_raised || new Date(),
      raised_by_name: raised_by_name || req.user.name,
      raised_by_employee_id: raised_by_employee_id || req.user.employee_id,
      department,
      process_area,
      source_type,
      nonconformity_description,
      requirement_reference,
      severity,
      immediate_correction,
      root_cause,
      corrective_action,
      preventive_action,
      responsible_person,
      target_date,
      attachment_path: attachmentPath,
      created_by_user_id: req.user.id
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
      department: req.query.department,
      severity: req.query.severity,
      source_type: req.query.source_type,
      from: req.query.from,
      to: req.query.to
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

    if (ncr.status !== 'Closed' && ncr.target_date && new Date(ncr.target_date) < new Date()) {
      ncr.computed_status = 'Overdue';
    } else {
      ncr.computed_status = ncr.status;
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

exports.deleteNcr = async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Only managers and admins can delete NCRs'
      });
    }

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

exports.exportToExcel = async (req, res) => {
  try {
    const ncrs = await NcrModel.getAllForExport();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NCR Reports');

    worksheet.columns = [
      { header: 'NCR Number', key: 'ncr_number', width: 18 },
      { header: 'Date Raised', key: 'date_raised', width: 12 },
      { header: 'Raised By', key: 'raised_by_name', width: 20 },
      { header: 'Employee ID', key: 'raised_by_employee_id', width: 15 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Process Area', key: 'process_area', width: 20 },
      { header: 'Source Type', key: 'source_type', width: 18 },
      { header: 'Description', key: 'nonconformity_description', width: 40 },
      { header: 'Requirement Ref', key: 'requirement_reference', width: 20 },
      { header: 'Severity', key: 'severity', width: 10 },
      { header: 'Immediate Correction', key: 'immediate_correction', width: 30 },
      { header: 'Root Cause', key: 'root_cause', width: 30 },
      { header: 'Corrective Action', key: 'corrective_action', width: 30 },
      { header: 'Preventive Action', key: 'preventive_action', width: 30 },
      { header: 'Responsible Person', key: 'responsible_person', width: 20 },
      { header: 'Target Date', key: 'target_date', width: 12 },
      { header: 'Closure Date', key: 'closure_date', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created At', key: 'created_at', width: 18 }
    ];

    ncrs.forEach(ncr => {
      worksheet.addRow({
        ncr_number: ncr.ncr_number,
        date_raised: ncr.date_raised ? new Date(ncr.date_raised).toLocaleDateString() : '',
        raised_by_name: ncr.raised_by_name,
        raised_by_employee_id: ncr.raised_by_employee_id,
        department: ncr.department,
        process_area: ncr.process_area,
        source_type: ncr.source_type,
        nonconformity_description: ncr.nonconformity_description,
        requirement_reference: ncr.requirement_reference,
        severity: ncr.severity,
        immediate_correction: ncr.immediate_correction,
        root_cause: ncr.root_cause,
        corrective_action: ncr.corrective_action,
        preventive_action: ncr.preventive_action,
        responsible_person: ncr.responsible_person,
        target_date: ncr.target_date ? new Date(ncr.target_date).toLocaleDateString() : '',
        closure_date: ncr.closure_date ? new Date(ncr.closure_date).toLocaleDateString() : '',
        status: ncr.status,
        created_at: ncr.created_at ? new Date(ncr.created_at).toLocaleString() : ''
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };

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
