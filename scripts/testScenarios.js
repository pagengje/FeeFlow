// scripts/testScenarios.js
// Standalone automated test script verifying core business logic, validations, and data models

import {
  INITIAL_CLASSES,
  INITIAL_TERMS,
  INITIAL_FEE_STRUCTURES,
  INITIAL_LATE_FEE_RULE,
  INITIAL_STUDENTS,
  INITIAL_PAYMENTS,
} from '../src/data/initialData.js';
import {
  getClassTotalFee,
  getStudentTermBreakdown,
  calculateLateFeeAmount,
  isTermOverdue,
  getStudentOverallSummary,
} from '../src/utils/calculations.js';
import { formatCurrency, formatDate, numberToWords } from '../src/utils/formatters.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- FeeFlow System Automated Verification ---\n');

// Test 1: Class Fee Totals
const class9Fee = getClassTotalFee('class-9', INITIAL_FEE_STRUCTURES);
const class10Fee = getClassTotalFee('class-10', INITIAL_FEE_STRUCTURES);
assert(class9Fee === 26000, `Class 9 total fee is ₹26,000 (got ${class9Fee})`);
assert(class10Fee === 32000, `Class 10 total fee is ₹32,000 (got ${class10Fee})`);

// Test 2: Concession Calculation (Diya Patel has 15% concession)
const diya = INITIAL_STUDENTS.find((s) => s.id === 'STU-2026-002');
const term1 = INITIAL_TERMS.find((t) => t.id === 'term-1');
const diyaBreakdown = getStudentTermBreakdown(
  diya,
  term1,
  INITIAL_FEE_STRUCTURES,
  INITIAL_PAYMENTS,
  INITIAL_LATE_FEE_RULE,
  '2026-06-15'
);
// Base ₹26,000 - 15% (₹3,900) = ₹22,100
assert(diyaBreakdown.concessionAmount === 3900, `Diya Patel 15% concession is ₹3,900 (got ${diyaBreakdown.concessionAmount})`);
assert(diyaBreakdown.discountedFee === 22100, `Diya Patel discounted fee is ₹22,100 (got ${diyaBreakdown.discountedFee})`);
// She paid ₹22,100 in initial payments for Term 1
assert(diyaBreakdown.remainingBalance === 0, `Diya Patel Term 1 remaining balance is 0 (got ${diyaBreakdown.remainingBalance})`);
assert(diyaBreakdown.status === 'Paid', `Diya Patel Term 1 status is Paid (got ${diyaBreakdown.status})`);

// Test 3: Partial Payment Calculation at payment date (Ishan Verma paid ₹15,000 out of ₹26,000 on 2026-06-20)
const ishan = INITIAL_STUDENTS.find((s) => s.id === 'STU-2026-003');
const ishanBreakdownAtPayment = getStudentTermBreakdown(
  ishan,
  term1,
  INITIAL_FEE_STRUCTURES,
  INITIAL_PAYMENTS,
  INITIAL_LATE_FEE_RULE,
  '2026-06-20'
);
assert(ishanBreakdownAtPayment.totalPaid === 15000, `Ishan Verma Term 1 paid ₹15,000 (got ${ishanBreakdownAtPayment.totalPaid})`);
assert(ishanBreakdownAtPayment.remainingBalance === 11000, `Ishan Verma Term 1 balance at payment date is ₹11,000 (got ${ishanBreakdownAtPayment.remainingBalance})`);
assert(ishanBreakdownAtPayment.status === 'Partially Paid', `Ishan Verma status is Partially Paid (got ${ishanBreakdownAtPayment.status})`);

// Test 3b: Overdue assessment for unpaid balance
const ishanBreakdownOverdue = getStudentTermBreakdown(
  ishan,
  term1,
  INITIAL_FEE_STRUCTURES,
  INITIAL_PAYMENTS,
  INITIAL_LATE_FEE_RULE,
  '2026-11-01'
);
assert(ishanBreakdownOverdue.lateFee === 500, `Ishan Verma incurs ₹500 late fee on overdue balance (got ${ishanBreakdownOverdue.lateFee})`);
assert(ishanBreakdownOverdue.remainingBalance === 11500, `Ishan Verma balance with late fee is ₹11,500 (got ${ishanBreakdownOverdue.remainingBalance})`);

// Test 4: Fully Unpaid Student (Tanvi Deshmukh has zero payments for Term 1)
const tanvi = INITIAL_STUDENTS.find((s) => s.id === 'STU-2026-006');
const tanviBreakdown = getStudentTermBreakdown(
  tanvi,
  term1,
  INITIAL_FEE_STRUCTURES,
  INITIAL_PAYMENTS,
  INITIAL_LATE_FEE_RULE
);
assert(tanviBreakdown.totalPaid === 0, `Tanvi Deshmukh total paid is 0 (got ${tanviBreakdown.totalPaid})`);
assert(tanviBreakdown.remainingBalance > 0, `Tanvi Deshmukh balance is > 0`);
assert(tanviBreakdown.status === 'Pending' || tanviBreakdown.status === 'Overdue', `Tanvi status is pending/overdue (got ${tanviBreakdown.status})`);

// Test 5: Late Fee Calculation
const isOverdue = isTermOverdue(term1, '2026-08-01', 5);
assert(isOverdue === true, `Date 2026-08-01 is past Term 1 due date (2026-06-30)`);
const lateFeeAmt = calculateLateFeeAmount(26000, INITIAL_LATE_FEE_RULE, true);
assert(lateFeeAmt === 500, `Flat late fee is ₹500 (got ${lateFeeAmt})`);

// Test 6: Number to Words conversion
const words = numberToWords(22100);
assert(words.toLowerCase().includes('twenty-two thousand one hundred') || words.toLowerCase().includes('twenty two thousand one hundred'), `numberToWords for 22100 converts correctly: "${words}"`);

// Test 7: Student ID uniqueness & valid payment amounts
const studentIds = new Set(INITIAL_STUDENTS.map(s => s.id));
assert(studentIds.size === INITIAL_STUDENTS.length, `All 20 initial student IDs are unique`);

// Test 8: Receipt Number formatting
const receiptNumbers = INITIAL_PAYMENTS.map(p => p.receiptNumber);
assert(receiptNumbers.every(r => /^FEE-2026-\d{4}$/.test(r)), `All initial receipt numbers match FEE-2026-XXXX format`);

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
