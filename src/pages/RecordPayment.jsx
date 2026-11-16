// src/pages/RecordPayment.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Calendar,
  DollarSign,
  Receipt,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { useFee } from '../context/FeeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getStudentTermBreakdown } from '../utils/calculations';

const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Card'];

export default function RecordPayment() {
  const {
    students,
    classes,
    terms,
    feeStructures,
    payments,
    lateFeeRule,
    recordPayment,
    selectedStudentForPayment,
    setSelectedStudentForPayment,
  } = useFee();

  // Search & Selected Student
  const [studentSearch, setStudentSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(
    selectedStudentForPayment || students[0]?.id || ''
  );

  // Selected Term
  const [selectedTermId, setSelectedTermId] = useState(terms[0]?.id || 'term-1');

  // Form inputs
  const [amountInput, setAmountInput] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [applyLateFeeToggle, setApplyLateFeeToggle] = useState(true);

  // Sync if selectedStudentForPayment comes from another page
  useEffect(() => {
    if (selectedStudentForPayment) {
      setSelectedStudentId(selectedStudentForPayment);
      setSelectedStudentForPayment(null);
    }
  }, [selectedStudentForPayment, setSelectedStudentForPayment]);

  // Current Student & Class & Term objects
  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const currentClass = classes.find((c) => c.id === currentStudent?.classId);
  const currentTerm = terms.find((t) => t.id === selectedTermId);

  // Filtered student list for searchable dropdown
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const query = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        s.rollNumber.toLowerCase().includes(query)
    );
  }, [students, studentSearch]);

  // Breakdown for current student and term
  const breakdown = useMemo(() => {
    if (!currentStudent || !currentTerm) return null;
    return getStudentTermBreakdown(
      currentStudent,
      currentTerm,
      feeStructures,
      payments,
      lateFeeRule,
      paymentDate
    );
  }, [currentStudent, currentTerm, feeStructures, payments, lateFeeRule, paymentDate]);

  // Determine late fee to apply
  const effectiveLateFee = useMemo(() => {
    if (!breakdown) return 0;
    if (!lateFeeRule.enabled) return 0;
    // If late fee was already assessed in a previous payment for this term, don't charge again
    if (breakdown.previouslyAssessedLateFees > 0) return 0;
    if (breakdown.isOverdue && applyLateFeeToggle) {
      return breakdown.lateFee;
    }
    return 0;
  }, [breakdown, lateFeeRule, applyLateFeeToggle]);

  // Net outstanding amount payable right now
  const outstandingAmount = useMemo(() => {
    if (!breakdown) return 0;
    return breakdown.remainingBalance + effectiveLateFee;
  }, [breakdown, effectiveLateFee]);

  // When student or term changes, autofill amountInput with outstanding amount
  useEffect(() => {
    if (outstandingAmount > 0) {
      setAmountInput(String(outstandingAmount));
    } else {
      setAmountInput('');
    }
  }, [outstandingAmount, selectedStudentId, selectedTermId]);

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const paymentAmount = Number(amountInput);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    if (paymentAmount > outstandingAmount) {
      alert(
        `Payment amount (₹${paymentAmount}) cannot exceed the outstanding balance of ₹${outstandingAmount}`
      );
      return;
    }

    const res = recordPayment({
      studentId: selectedStudentId,
      termId: selectedTermId,
      amount: paymentAmount,
      paymentMode,
      paymentDate,
      referenceNumber,
      remarks,
      applyLateFeeManually: effectiveLateFee > 0,
    });

    if (res.success) {
      // Clear or adjust input for next action
      setReferenceNumber('');
      setRemarks('');
    }
  };

  // Quick amount buttons
  const handleQuickAmount = (ratio) => {
    if (ratio === 1) {
      setAmountInput(String(outstandingAmount));
    } else {
      setAmountInput(String(Math.round(outstandingAmount * ratio)));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Record Fee Payment</h1>
        <p className="text-sm text-slate-500 mt-1">
          Collect term fees, generate instant official receipts, and update student ledger balance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Payment Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Searchable Dropdown */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Student *
              </label>
              
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm flex items-center justify-between cursor-pointer hover:border-slate-400 focus:ring-2 focus:ring-blue-500"
              >
                {currentStudent ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{currentStudent.name}</span>
                    <span className="text-xs font-mono text-slate-500">({currentStudent.id})</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {classes.find((c) => c.id === currentStudent.classId)?.name} • Roll: #{currentStudent.rollNumber}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400">Search and select a student...</span>
                )}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search student by name, ID or roll..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          setIsDropdownOpen(false);
                          setStudentSearch('');
                        }}
                        className={`p-3 text-xs hover:bg-blue-50 cursor-pointer flex items-center justify-between transition ${
                          s.id === selectedStudentId ? 'bg-blue-50/60 font-semibold' : ''
                        }`}
                      >
                        <div>
                          <div className="text-slate-900 font-semibold">{s.name}</div>
                          <div className="text-slate-400 text-[11px] font-mono">
                            {s.id} • {classes.find((c) => c.id === s.classId)?.name} (Roll #{s.rollNumber})
                          </div>
                        </div>
                        {s.concessionPercent > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                            {s.concessionPercent}% Off
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auto-populated Class & Academic Term Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Class (Auto-populated)
                </label>
                <input
                  type="text"
                  disabled
                  value={currentClass ? `${currentClass.name} (Section ${currentClass.section || 'A'})` : '-'}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Academic Term *
                </label>
                <select
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Due: {formatDate(t.dueDate)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Amount & Quick Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Payment Amount (₹) *
                </label>
                {outstandingAmount > 0 && (
                  <span className="text-xs text-slate-500">
                    Max Payable:{' '}
                    <strong className="text-slate-900">{formatCurrency(outstandingAmount)}</strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  max={outstandingAmount}
                  disabled={outstandingAmount === 0}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={outstandingAmount === 0 ? 'No balance due' : 'Enter amount'}
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              {/* Quick partial / full payment pills */}
              {outstandingAmount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(1)}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    Full ({formatCurrency(outstandingAmount)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(0.5)}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    50% ({formatCurrency(Math.round(outstandingAmount * 0.5))})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(0.25)}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    25% ({formatCurrency(Math.round(outstandingAmount * 0.25))})
                  </button>
                </div>
              )}
            </div>

            {/* Payment Mode & Payment Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        paymentMode === mode
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reference Number & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UPI/61728192 or CHQ-9912"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Paid by father via Netbanking"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Late Fee toggle if overdue */}
            {breakdown?.isOverdue && breakdown.previouslyAssessedLateFees === 0 && lateFeeRule.enabled && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Overdue Payment (Late Fee: {formatCurrency(breakdown.lateFee)})
                    </span>
                    <span className="text-[11px] text-amber-700">
                      Term due date was {formatDate(currentTerm.dueDate)}.
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyLateFeeToggle}
                    onChange={(e) => setApplyLateFeeToggle(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-xs font-semibold text-slate-800">Apply Late Fee</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={outstandingAmount === 0 || !amountInput || Number(amountInput) <= 0}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Receipt className="w-5 h-5" />
                {outstandingAmount === 0
                  ? 'Fee Already Fully Paid'
                  : `Record Payment & Generate Receipt (${formatCurrency(Number(amountInput) || 0)})`}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Calculation Breakdown Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-slate-900 text-base mb-1">Financial Summary</h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time calculation for {currentTerm?.name}
            </p>

            {breakdown ? (
              <div className="space-y-3 text-xs">
                {/* Base Fee */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Base Class Fee</span>
                  <span className="font-bold text-slate-800">{formatCurrency(breakdown.baseFee)}</span>
                </div>

                {/* Concession discount */}
                {breakdown.concessionAmount > 0 && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-emerald-700 bg-emerald-50/50 px-2 rounded">
                    <span>
                      Concession ({breakdown.concessionPercent}%
                      {currentStudent.concessionReason ? ` - ${currentStudent.concessionReason}` : ''})
                    </span>
                    <span className="font-bold">- {formatCurrency(breakdown.concessionAmount)}</span>
                  </div>
                )}

                {/* Net Fee */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Net Discounted Fee</span>
                  <span className="font-bold text-slate-800">{formatCurrency(breakdown.discountedFee)}</span>
                </div>

                {/* Late fee */}
                {effectiveLateFee > 0 && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-rose-700 bg-rose-50/50 px-2 rounded">
                    <span>Overdue Late Fee</span>
                    <span className="font-bold">+ {formatCurrency(effectiveLateFee)}</span>
                  </div>
                )}

                {/* Previously Paid */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Previously Paid</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(breakdown.totalPaid)}</span>
                </div>

                {/* Current Outstanding */}
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 text-sm">Outstanding Due</span>
                  <span className="text-base font-extrabold text-blue-700">
                    {formatCurrency(outstandingAmount)}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Current Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold ${
                      breakdown.remainingBalance === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : breakdown.totalPaid > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {breakdown.remainingBalance === 0
                      ? 'Fully Paid'
                      : breakdown.totalPaid > 0
                      ? 'Partially Paid'
                      : 'Pending'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select a student to view fee calculations.</p>
            )}
          </div>

          {/* Student Profile Snapshot */}
          {currentStudent && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-3">
                Student Snapshot
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Parent / Guardian:</span>
                  <span className="font-semibold">{currentStudent.parentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Contact:</span>
                  <span className="font-mono">{currentStudent.contactNumber}</span>
                </div>
                {currentStudent.concessionPercent > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-emerald-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>Beneficiary of {currentStudent.concessionPercent}% concession</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
