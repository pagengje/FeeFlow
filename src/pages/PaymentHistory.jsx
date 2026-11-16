// src/pages/PaymentHistory.jsx
import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { useFee } from '../context/FeeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportPaymentsReport } from '../utils/excelExport';

export default function PaymentHistory() {
  const { payments, students, classes, terms, setActiveReceipt } = useFee();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [termFilter, setTermFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  // Mappings
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const termMap = useMemo(() => new Map(terms.map((t) => [t.id, t.name])), [terms]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const student = studentMap.get(p.studentId) || { name: p.studentName || '' };
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        p.receiptNumber.toLowerCase().includes(q) ||
        p.studentId.toLowerCase().includes(q) ||
        (student.name && student.name.toLowerCase().includes(q)) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q));

      const matchesTerm = termFilter === 'all' || p.termId === termFilter;
      const matchesClass = classFilter === 'all' || p.classId === classFilter;
      const matchesMode = modeFilter === 'all' || p.paymentMode === modeFilter;

      return matchesSearch && matchesTerm && matchesClass && matchesMode;
    });
  }, [payments, searchQuery, termFilter, classFilter, modeFilter, studentMap]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const avgAmount =
      filteredPayments.length > 0 ? Math.round(totalCollected / filteredPayments.length) : 0;

    return {
      totalCollected,
      avgAmount,
      count: filteredPayments.length,
    };
  }, [filteredPayments]);

  const handleExport = () => {
    exportPaymentsReport(filteredPayments, students, classes, terms);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment History & Receipts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete audit trail of all student fee receipts, mode splits, and reprint options.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export to Excel
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Filtered Receipts Count
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {stats.count} Transactions
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Filtered Collections
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {formatCurrency(stats.totalCollected)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Average Ticket Size
          </span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">
            {formatCurrency(stats.avgAmount)}
          </span>
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
            placeholder="Search by receipt #, student, or ID..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Term */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Term:</span>
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
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

          {/* Class */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
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

          {/* Payment Mode */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Mode:</span>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Modes</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Receipt #</th>
                <th className="py-3 px-5">Student Info</th>
                <th className="py-3 px-5">Class & Term</th>
                <th className="py-3 px-5">Payment Date</th>
                <th className="py-3 px-5">Mode & Ref</th>
                <th className="py-3 px-5 text-right">Amount Paid</th>
                <th className="py-3 px-5 text-right">Remaining</th>
                <th className="py-3 px-5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No payment records match your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const s = studentMap.get(p.studentId) || { name: p.studentName || 'Student', rollNumber: '-' };
                  const className = classMap.get(p.classId) || p.classId;
                  const termName = termMap.get(p.termId) || p.termId;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {/* Receipt No */}
                      <td className="py-3.5 px-5 font-bold font-mono text-slate-900 text-xs">
                        {p.receiptNumber}
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-slate-900 block">{s.name}</span>
                        <span className="text-xs font-mono text-slate-400">
                          {p.studentId} • Roll: #{s.rollNumber}
                        </span>
                      </td>

                      {/* Class & Term */}
                      <td className="py-3.5 px-5">
                        <span className="font-medium text-slate-800">{className}</span>
                        <span className="text-xs text-indigo-600 font-semibold block">
                          {termName}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-5 text-xs text-slate-600 font-medium">
                        {formatDate(p.paymentDate)}
                      </td>

                      {/* Mode & Ref */}
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {p.paymentMode}
                        </span>
                        {p.referenceNumber && (
                          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[120px] mt-0.5">
                            {p.referenceNumber}
                          </span>
                        )}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-5 text-right font-bold text-emerald-600 text-sm">
                        {formatCurrency(p.amount)}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-3.5 px-5 text-right text-xs">
                        {p.remainingBalance > 0 ? (
                          <span className="font-semibold text-rose-600">
                            {formatCurrency(p.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Settled</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => setActiveReceipt(p)}
                          title="View & Reprint Receipt"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Receipt</span>
                        </button>
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
