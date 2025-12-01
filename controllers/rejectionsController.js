const RejectionModel = require('../models/rejection');
const ExcelJS = require('exceljs');

exports.createRejection = (req, res) => {
  try {
    const {
      materialType,
      materialName,
      supplierName,
      defectCategory,
      defectDescription,
      quantityRejected,
      quantityUnit,
      shiftCode,
      shiftTime,
      processArea,
      inspectorName,
      inspectorEmployeeId,
      rejectionDateTime
    } = req.body;

    const imageFiles = req.files ? req.files.map(f => f.filename) : [];

    const userInfo = req.user || {};

    const rejection = RejectionModel.createRejection(
      {
        materialType,
        materialName,
        supplierName,
        defectCategory,
        defectDescription,
        quantityRejected,
        quantityUnit,
        shiftCode,
        shiftTime,
        processArea,
        inspectorName,
        inspectorEmployeeId,
        rejectionDateTime,
        enteredByUser: userInfo.id || null,
        enteredByName: userInfo.name || null,
        enteredByEmployeeId: userInfo.employeeId || null
      },
      imageFiles
    );

    res.status(201).json({
      success: true,
      message: 'Rejection submitted successfully',
      data: rejection
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error submitting rejection',
      error: error.message
    });
  }
};

exports.getSummary = (req, res) => {
  try {
    const rejections = RejectionModel.getAllRejections();
    
    const summary = {
      totalCount: rejections.length,
      byMaterialType: {},
      byDefectCategory: {},
      bySupplier: {}
    };

    rejections.forEach(rejection => {
      const materialType = rejection.materialType || 'Unknown';
      const defectCategory = rejection.defectCategory || 'Unknown';
      const supplier = rejection.supplierName || 'Unknown';

      summary.byMaterialType[materialType] = (summary.byMaterialType[materialType] || 0) + 1;
      summary.byDefectCategory[defectCategory] = (summary.byDefectCategory[defectCategory] || 0) + 1;
      summary.bySupplier[supplier] = (summary.bySupplier[supplier] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching summary',
      error: error.message
    });
  }
};

exports.exportRejectionsExcel = async (req, res) => {
  try {
    const rejections = RejectionModel.getAllRejections();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rejections');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Material Type', key: 'materialType', width: 15 },
      { header: 'Material Name', key: 'materialName', width: 20 },
      { header: 'Supplier', key: 'supplierName', width: 20 },
      { header: 'Defect Category', key: 'defectCategory', width: 20 },
      { header: 'Defect Description', key: 'defectDescription', width: 30 },
      { header: 'Qty Rejected', key: 'quantityRejected', width: 12 },
      { header: 'Unit', key: 'quantityUnit', width: 12 },
      { header: 'Shift Code', key: 'shiftCode', width: 10 },
      { header: 'Shift Time', key: 'shiftTime', width: 12 },
      { header: 'Rejection DateTime', key: 'rejectionDateTime', width: 20 },
      { header: 'Inspector Name', key: 'inspectorName', width: 20 },
      { header: 'Inspector ID', key: 'inspectorEmployeeId', width: 15 },
      { header: 'Entered By', key: 'enteredByName', width: 20 },
      { header: 'Entered By ID', key: 'enteredByEmployeeId', width: 15 },
      { header: 'Process Area', key: 'processArea', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    rejections.forEach(rejection => {
      worksheet.addRow({
        id: rejection.id,
        materialType: rejection.materialType,
        materialName: rejection.materialName,
        supplierName: rejection.supplierName,
        defectCategory: rejection.defectCategory,
        defectDescription: rejection.defectDescription,
        quantityRejected: rejection.quantityRejected,
        quantityUnit: rejection.quantityUnit,
        shiftCode: rejection.shiftCode,
        shiftTime: rejection.shiftTime,
        rejectionDateTime: rejection.rejectionDateTime,
        inspectorName: rejection.inspectorName,
        inspectorEmployeeId: rejection.inspectorEmployeeId,
        enteredByName: rejection.enteredByName,
        enteredByEmployeeId: rejection.enteredByEmployeeId,
        processArea: rejection.processArea,
        createdAt: rejection.createdAt
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="rejected_reports.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting to Excel',
      error: error.message
    });
  }
};

exports.getAllRejections = (req, res) => {
  try {
    const rejections = RejectionModel.getAllRejections();
    res.status(200).json({
      success: true,
      data: rejections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    });
  }
};

exports.getRejection = (req, res) => {
  try {
    const rejection = RejectionModel.getRejectionById(req.params.id);
    if (!rejection) {
      return res.status(404).json({
        success: false,
        message: 'Rejection not found'
      });
    }
    res.status(200).json({
      success: true,
      data: rejection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    });
  }
};

exports.deleteRejection = (req, res) => {
  try {
    RejectionModel.deleteRejection(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Rejection deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting rejection',
      error: error.message
    });
  }
};
