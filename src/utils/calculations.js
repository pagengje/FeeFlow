// src/utils/calculations.js

/**
 * Calculates total base fee for a class from its fee components
 */
export function getClassTotalFee(classId, feeStructures) {
  const components = feeStructures[classId] || [];
  return components.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

/**
 * Check if a term is overdue given a payment date or current date
 */
export function isTermOverdue(term, checkDateStr = null, graceDays = 0) {
  if (!term || !term.dueDate) return false;
  const checkDate = checkDateStr ? new Date(checkDateStr) : new Date();
  const dueDate = new Date(term.dueDate);
  dueDate.setDate(dueDate.getDate() + Number(graceDays || 0));
  return checkDate.getTime() > dueDate.getTime();
}

/**
 * Computes late fee based on rule
 */
export function calculateLateFeeAmount(baseAmount, lateFeeRule, isOverdue) {
  if (!lateFeeRule || !lateFeeRule.enabled || !isOverdue) return 0;
  if (lateFeeRule.type === 'percentage') {
    return Math.round(((Number(baseAmount) || 0) * (Number(lateFeeRule.amount) || 0)) / 100);
  }
  return Number(lateFeeRule.amount) || 0;
}

/**
 * Calculates complete fee breakdown for a student for a specific term
 */
export function getStudentTermBreakdown(student, term, feeStructures, payments, lateFeeRule, paymentDateStr = null) {
  if (!student || !term) {
    return {
      baseFee: 0,
      concessionPercent: 0,
      concessionAmount: 0,
      discountedFee: 0,
      lateFee: 0,
      effectiveTotalFee: 0,
      totalPaid: 0,
      remainingBalance: 0,
      status: 'Pending',
      isOverdue: false,
    };
  }

  const baseFee = getClassTotalFee(student.classId, feeStructures);
  const concessionPercent = Number(student.concessionPercent) || 0;
  const concessionAmount = Math.round((baseFee * concessionPercent) / 100);
  const discountedFee = Math.max(0, baseFee - concessionAmount);

  // Payments already recorded for this student & term
  const termPayments = payments.filter(
    (p) => p.studentId === student.id && p.termId === term.id
  );
  const totalPaid = termPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Late fees previously assessed in recorded payments
  const previouslyAssessedLateFees = termPayments.reduce(
    (sum, p) => sum + (Number(p.lateFee) || 0),
    0
  );

  // Check if current payment or pending view incurs late fee
  const overdue = isTermOverdue(term, paymentDateStr, lateFeeRule?.gracePeriodDays);
  
  // Outstanding before this session
  const standardDue = discountedFee - totalPaid;
  
  let currentApplicableLateFee = 0;
  if (standardDue > 0 && overdue && previouslyAssessedLateFees === 0) {
    currentApplicableLateFee = calculateLateFeeAmount(discountedFee, lateFeeRule, true);
  }

  const totalLateFee = previouslyAssessedLateFees + currentApplicableLateFee;
  const effectiveTotalFee = discountedFee + totalLateFee;
  const remainingBalance = Math.max(0, effectiveTotalFee - totalPaid);

  let status = 'Pending';
  if (remainingBalance === 0 && totalPaid > 0) {
    status = 'Paid';
  } else if (totalPaid > 0 && remainingBalance > 0) {
    status = 'Partially Paid';
  } else if (remainingBalance > 0 && overdue) {
    status = 'Overdue';
  } else {
    status = 'Pending';
  }

  return {
    studentId: student.id,
    termId: term.id,
    baseFee,
    concessionPercent,
    concessionAmount,
    discountedFee,
    lateFee: currentApplicableLateFee,
    previouslyAssessedLateFees,
    totalLateFee,
    effectiveTotalFee,
    totalPaid,
    remainingBalance,
    status,
    isOverdue: overdue,
    paymentsCount: termPayments.length,
  };
}

/**
 * Calculates overall summary across all terms for a student
 */
export function getStudentOverallSummary(student, terms, feeStructures, payments, lateFeeRule) {
  if (!student) return { totalExpected: 0, totalPaid: 0, totalPending: 0, status: 'Pending' };

  let totalExpected = 0;
  let totalPaid = 0;
  let totalPending = 0;
  const termDetails = [];

  terms.forEach((term) => {
    const breakdown = getStudentTermBreakdown(student, term, feeStructures, payments, lateFeeRule);
    totalExpected += breakdown.effectiveTotalFee;
    totalPaid += breakdown.totalPaid;
    totalPending += breakdown.remainingBalance;
    termDetails.push({
      term,
      breakdown,
    });
  });

  let status = 'Pending';
  if (totalPending === 0 && totalPaid > 0) {
    status = 'Paid';
  } else if (totalPaid > 0 && totalPending > 0) {
    status = 'Partially Paid';
  }

  return {
    totalExpected,
    totalPaid,
    totalPending,
    status,
    termDetails,
  };
}
