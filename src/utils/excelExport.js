// src/utils/excelExport.js
import * as XLSX from 'xlsx';
import { getStudentTermBreakdown } from './calculations';

/**
 * Universal helper to export JSON data to Excel
 */
export function exportJsonToExcel(data, fileName, sheetName = 'Sheet1') {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  const keys = Object.keys(data[0]);
  const colWidths = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((item) => (item[key] !== undefined && item[key] !== null ? String(item[key]).length : 0))
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Export Payment History
 */
export function exportPaymentsReport(payments, students, classes, terms) {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const termMap = new Map(terms.map((t) => [t.id, t.name]));

  const formatted = payments.map((p) => {
    const s = studentMap.get(p.studentId) || {};
    return {
      'Receipt No': p.receiptNumber,
      'Payment Date': p.paymentDate,
      'Student ID': p.studentId,
      'Student Name': s.name || p.studentName || '-',
      'Class': classMap.get(p.classId) || p.classId || '-',
      'Roll No': s.rollNumber || '-',
      'Term': termMap.get(p.termId) || p.termId || '-',
      'Base Fee (₹)': p.baseFee || 0,
      'Concession (₹)': p.concessionAmount || 0,
      'Late Fee (₹)': p.lateFee || 0,
      'Amount Paid (₹)': p.amount || 0,
      'Remaining Balance (₹)': p.remainingBalance || 0,
      'Payment Mode': p.paymentMode,
      'Reference / Txn ID': p.referenceNumber || '-',
      'Remarks': p.remarks || '-',
    };
  });

  exportJsonToExcel(
    formatted,
    `FeeFlow_Payment_History_${new Date().toISOString().slice(0, 10)}`,
    'Payments'
  );
}

/**
 * Export Pending Fees List
 */
export function exportPendingFeesReport(pendingList, termName = 'All Terms') {
  const formatted = pendingList.map((item) => ({
    'Student ID': item.student.id,
    'Student Name': item.student.name,
    'Class': item.className,
    'Roll No': item.student.rollNumber,
    'Parent Name': item.student.parentName,
    'Contact': item.student.contactNumber,
    'Term': item.termName,
    'Base Fee (₹)': item.breakdown.baseFee,
    'Concession (%)': `${item.breakdown.concessionPercent}%`,
    'Concession (₹)': item.breakdown.concessionAmount,
    'Late Fee (₹)': item.breakdown.totalLateFee,
    'Effective Total (₹)': item.breakdown.effectiveTotalFee,
    'Paid Amount (₹)': item.breakdown.totalPaid,
    'Remaining Balance (₹)': item.breakdown.remainingBalance,
    'Status': item.breakdown.status,
  }));

  exportJsonToExcel(
    formatted,
    `FeeFlow_Pending_Fees_${termName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
    'Pending Fees'
  );
}

/**
 * Export Students Directory with fee status
 */
export function exportStudentsReport(students, classes, feeStructures, payments, terms, lateFeeRule) {
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  const formatted = students.map((s) => {
    // Calculate total expected and paid across all terms
    let totalExp = 0;
    let totalPd = 0;
    let totalBal = 0;

    terms.forEach((t) => {
      const b = getStudentTermBreakdown(s, t, feeStructures, payments, lateFeeRule);
      if (b) {
        totalExp += b.effectiveTotalFee;
        totalPd += b.totalPaid;
        totalBal += b.remainingBalance;
      }
    });

    return {
      'Student ID': s.id,
      'Name': s.name,
      'Class': classMap.get(s.classId) || s.classId,
      'Roll No': s.rollNumber,
      'Parent / Guardian': s.parentName,
      'Contact Number': s.contactNumber,
      'Concession %': `${s.concessionPercent || 0}%`,
      'Concession Reason': s.concessionReason || 'N/A',
      'Total Expected (₹)': totalExp,
      'Total Paid (₹)': totalPd,
      'Total Outstanding (₹)': totalBal,
      'Settlement Status': totalBal === 0 && totalPd > 0 ? 'Fully Paid' : totalPd > 0 ? 'Partially Paid' : 'Pending',
    };
  });

  exportJsonToExcel(
    formatted,
    `FeeFlow_Student_Directory_${new Date().toISOString().slice(0, 10)}`,
    'Students'
  );
}
