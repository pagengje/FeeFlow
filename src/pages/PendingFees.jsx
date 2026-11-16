// src/pages/PendingFees.jsx
import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  Filter,
  CreditCard,
  Download,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  CheckCircle,
  Phone,
} from 'lucide-react';
import { useFee } from '../context/FeeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getStudentTermBreakdown } from '../utils/calculations';
import { exportPendingFeesReport } from '../utils/excelExport';

export default function PendingFees() {
  const {
    students,
    classes,
    terms,
    feeStructures,
    payments,
    lateFeeRule,
    setActiveTab,
    setSelectedStudentForPayment,
  } = useFee();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending_only'); // 'all' | 'pending_only' | 'partial' | 'paid'

  // Build the list of records per student and per term
  const allFeeRecords = useMemo(() => {
    const records = [];

    students.forEach((student) => {
      const cls = classes.find((c) => c.id === student.classId);
      const className = cls ? cls.name : student.classId;

      terms.forEach((term) => {
        const breakdown = getStudentTermBreakdown(
          student,
          term,
          feeStructures,
          payments,
          lateFeeRule
        );

        records.push({
          key: `${student.id}-${term.id}`,
          student,
          className,
          term,
          termName: term.name,
          breakdown,
        });
      });
    });

    return records;
  }, [students, classes, terms, feeStructures, payments, lateFeeRule]);

  // Apply search and filters
  const filteredRecords = useMemo(() => {
    return allFeeRecords.filter((rec) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        rec.student.name.toLowerCase().includes(q) ||
        rec.student.id.toLowerCase().includes(q) ||
        rec.student.rollNumber.toLowerCase().includes(q);

      const matchesClass = selectedClass === 'all' || rec.student.classId === selectedClass;
      const matchesTerm = selectedTerm === 'all' || rec.term.id === selectedTerm;

      let matchesStatus = true;
      if (statusFilter === 'pending_only') {
        matchesStatus = rec.breakdown.remainingBalance > 0;
      } else if (statusFilter === 'partial') {
        matchesStatus = rec.breakdown.status === 'Partially Paid';
      } else if (statusFilter === 'paid') {
        matchesStatus = rec.breakdown.status === 'Paid';
      }

      return matchesSearch && matchesClass && matchesTerm && matchesStatus;
    });
  }, [allFeeRecords, searchQuery, selectedClass, selectedTerm, statusFilter]);

  // Summary Metrics for the current view
  const summary = useMemo(() => {
    let outstandingTotal = 0;
    let expectedTotal = 0;
    let paidTotal = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let paidCount = 0;

    filteredRecords.forEach((r) => {
      outstandingTotal += r.breakdown.remainingBalance;
      expectedTotal += r.breakdown.effectiveTotalFee;
      paidTotal += r.breakdown.totalPaid;

      if (r.breakdown.status === 'Paid') paidCount++;
      else if (r.breakdown.status === 'Partially Paid') partialCount++;
      else pendingCount++;
    });

    return {
      outstandingTotal,
      expectedTotal,
      paidTotal,
      pendingCount,
      partialCount,
      paidCount,
      totalCount: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Navigate to payment recording with prefilled student
  const handlePayNow = (studentId) => {
    setSelectedStudentForPayment(studentId);
    setActiveTab('recordPayment');
  };

  // Export
  const handleExport = () => {
    const termLabel =
      selectedTerm === 'all' ? 'All_Terms' : terms.find((t) => t.id === selectedTerm)?.name || 'Term';
    exportPendingFeesReport(filteredRecords, termLabel);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Fees Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track unpaid and partially paid balances per class and term with direct payment access.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export Report
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Outstanding Dues (Filtered)
          </span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">
            {formatCurrency(summary.outstandingTotal)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Collected / Settled
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {formatCurrency(summary.paidTotal)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Records Breakdown
          </span>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
              {summary.pendingCount} Pending
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
              {summary.partialCount} Partial
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {summary.paidCount} Paid
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name, ID, or roll..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending_only">With Outstanding Dues</option>
              <option value="all">All Statuses (Including Paid)</option>
              <option value="partial">Partially Paid Only</option>
              <option value="paid">Fully Paid Only</option>
            </select>
          </div>

          {/* Term filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Term:</span>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Terms</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pending Fees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-5">Class & Term</th>
                <th className="py-3 px-5">Contact Details</th>
                <th className="py-3 px-5 text-right">Total Fee</th>
                <th className="py-3 px-5 text-right">Paid Amount</th>
                <th className="py-3 px-5 text-right">Remaining Balance</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    No pending dues found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const b = item.breakdown;
                  const isPaid = b.remainingBalance === 0;

                  return (
                    <tr key={item.key} className="hover:bg-slate-50/70 transition">
                      {/* Student */}
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-slate-900 block">{item.student.name}</span>
                        <span className="text-xs font-mono text-slate-400">{item.student.id}</span>
                      </td>

                      {/* Class & Term */}
                      <td className="py-3.5 px-5">
                        <span className="font-medium text-slate-800">{item.className}</span>
                        <span className="text-xs text-indigo-600 font-semibold block">
                          {item.termName}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-5 text-xs">
                        <span className="text-slate-700 block font-medium">
                          {item.student.parentName}
                        </span>
                        <span className="text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {item.student.contactNumber}
                        </span>
                      </td>

                      {/* Total Fee */}
                      <td className="py-3.5 px-5 text-right text-xs">
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(b.effectiveTotalFee)}
                        </span>
                        {b.concessionAmount > 0 && (
                          <span className="text-[10px] text-emerald-600 block">
                            (-{formatCurrency(b.concessionAmount)} disc)
                          </span>
                        )}
                        {b.totalLateFee > 0 && (
                          <span className="text-[10px] text-rose-500 block">
                            (+{formatCurrency(b.totalLateFee)} late)
                          </span>
                        )}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-5 text-right font-medium text-slate-800 text-xs">
                        {formatCurrency(b.totalPaid)}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-3.5 px-5 text-right font-bold text-sm">
                        <span className={b.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {formatCurrency(b.remainingBalance)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            b.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.status === 'Partially Paid'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-center">
                        {b.remainingBalance > 0 ? (
                          <button
                            onClick={() => handlePayNow(item.student.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect Fee</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
