// src/pages/Reports.jsx
import React, { useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Award,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useFee } from '../context/FeeContext';
import { formatCurrency } from '../utils/formatters';
import { getStudentTermBreakdown } from '../utils/calculations';
import { exportJsonToExcel } from '../utils/excelExport';

const MODE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Reports() {
  const { students, classes, terms, feeStructures, payments, lateFeeRule } = useFee();

  // 1. Term-wise Report
  const termReport = useMemo(() => {
    return terms.map((term) => {
      let expected = 0;
      let collected = 0;
      let concessionTotal = 0;
      let lateFeeTotal = 0;
      let pending = 0;
      let fullyPaidStudents = 0;

      students.forEach((student) => {
        const b = getStudentTermBreakdown(student, term, feeStructures, payments, lateFeeRule);
        expected += b.effectiveTotalFee;
        collected += b.totalPaid;
        concessionTotal += b.concessionAmount;
        lateFeeTotal += b.totalLateFee;
        pending += b.remainingBalance;
        if (b.status === 'Paid') fullyPaidStudents++;
      });

      const realizationRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

      return {
        termId: term.id,
        termName: term.name,
        dueDate: term.dueDate,
        expected,
        collected,
        concessionTotal,
        lateFeeTotal,
        pending,
        realizationRate,
        fullyPaidStudents,
        totalStudents: students.length,
      };
    });
  }, [students, terms, feeStructures, payments, lateFeeRule]);

  // 2. Class-wise Report
  const classReport = useMemo(() => {
    return classes.map((cls) => {
      const classStudents = students.filter((s) => s.classId === cls.id);
      let expected = 0;
      let collected = 0;
      let pending = 0;

      classStudents.forEach((student) => {
        terms.forEach((term) => {
          const b = getStudentTermBreakdown(student, term, feeStructures, payments, lateFeeRule);
          expected += b.effectiveTotalFee;
          collected += b.totalPaid;
          pending += b.remainingBalance;
        });
      });

      const realizationRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

      return {
        classId: cls.id,
        className: cls.name,
        studentCount: classStudents.length,
        expected,
        collected,
        pending,
        realizationRate,
      };
    });
  }, [classes, students, terms, feeStructures, payments, lateFeeRule]);

  // 3. Concession Beneficiary Report
  const concessionReport = useMemo(() => {
    const beneficiaries = students.filter((s) => (s.concessionPercent || 0) > 0);

    return beneficiaries.map((s) => {
      const cls = classes.find((c) => c.id === s.classId);
      let totalConcessionValue = 0;

      terms.forEach((term) => {
        const b = getStudentTermBreakdown(s, term, feeStructures, payments, lateFeeRule);
        totalConcessionValue += b.concessionAmount;
      });

      return {
        id: s.id,
        name: s.name,
        className: cls ? cls.name : s.classId,
        rollNumber: s.rollNumber,
        concessionPercent: s.concessionPercent,
        concessionReason: s.concessionReason || 'Scholarship',
        totalConcessionValue,
      };
    });
  }, [students, classes, terms, feeStructures, payments, lateFeeRule]);

  // 4. Payment Mode Distribution
  const modeReport = useMemo(() => {
    const modes = { UPI: 0, Cash: 0, 'Bank Transfer': 0, Card: 0 };
    let grandTotal = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (modes[p.paymentMode] !== undefined) {
        modes[p.paymentMode] += amt;
      } else {
        modes[p.paymentMode] = amt;
      }
      grandTotal += amt;
    });

    const chartData = Object.entries(modes).map(([name, value], i) => ({
      name,
      value,
      percentage: grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0,
      color: MODE_COLORS[i % MODE_COLORS.length],
    }));

    return { modes, grandTotal, chartData };
  }, [payments]);

  // Export handlers
  const exportTermReport = () => {
    const data = termReport.map((t) => ({
      'Academic Term': t.termName,
      'Due Date': t.dueDate,
      'Expected Fees (₹)': t.expected,
      'Collected Fees (₹)': t.collected,
      'Pending Fees (₹)': t.pending,
      'Concessions Granted (₹)': t.concessionTotal,
      'Late Fees (₹)': t.lateFeeTotal,
      'Realization Rate (%)': `${t.realizationRate}%`,
      'Fully Settled Students': `${t.fullyPaidStudents} / ${t.totalStudents}`,
    }));
    exportJsonToExcel(data, `FeeFlow_Term_Report_${new Date().toISOString().slice(0, 10)}`, 'Terms');
  };

  const exportClassReport = () => {
    const data = classReport.map((c) => ({
      'Class': c.className,
      'Students Enrolled': c.studentCount,
      'Expected Fees (₹)': c.expected,
      'Collected Fees (₹)': c.collected,
      'Pending Fees (₹)': c.pending,
      'Collection Rate (%)': `${c.realizationRate}%`,
    }));
    exportJsonToExcel(data, `FeeFlow_Class_Report_${new Date().toISOString().slice(0, 10)}`, 'Classes');
  };

  const exportConcessionReport = () => {
    const data = concessionReport.map((c) => ({
      'Student ID': c.id,
      'Student Name': c.name,
      'Class': c.className,
      'Roll Number': c.rollNumber,
      'Concession (%)': `${c.concessionPercent}%`,
      'Category / Reason': c.concessionReason,
      'Annual Concession Amount (₹)': c.totalConcessionValue,
    }));
    exportJsonToExcel(data, `FeeFlow_Concessions_Audit_${new Date().toISOString().slice(0, 10)}`, 'Concessions');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports & Auditing</h1>
          <p className="text-sm text-slate-500 mt-1">
            In-depth academic term settlements, class comparisons, concession audits, and exportable analytics.
          </p>
        </div>
      </div>

      {/* 1. Term-wise Collection Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Academic Term Financial Summary</h3>
              <p className="text-xs text-slate-500">Term-by-term fee realization targets</p>
            </div>
          </div>
          <button
            onClick={exportTermReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Terms Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Academic Term</th>
                <th className="py-3 px-5 text-right">Expected (₹)</th>
                <th className="py-3 px-5 text-right">Collected (₹)</th>
                <th className="py-3 px-5 text-right">Pending (₹)</th>
                <th className="py-3 px-5 text-right">Concessions (₹)</th>
                <th className="py-3 px-5 text-right">Late Fees (₹)</th>
                <th className="py-3 px-5 text-center">Collection %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {termReport.map((term) => (
                <tr key={term.termId} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-slate-900 block">{term.termName}</span>
                    <span className="text-xs text-slate-400">Due: {term.dueDate}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-semibold text-slate-800">
                    {formatCurrency(term.expected)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold text-emerald-600">
                    {formatCurrency(term.collected)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold text-rose-600">
                    {formatCurrency(term.pending)}
                  </td>
                  <td className="py-3.5 px-5 text-right text-xs text-slate-600">
                    {formatCurrency(term.concessionTotal)}
                  </td>
                  <td className="py-3.5 px-5 text-right text-xs text-slate-600">
                    {formatCurrency(term.lateFeeTotal)}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${term.realizationRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-slate-800">
                        {term.realizationRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Class Breakdown & Payment Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-wise summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Class-wise Audit</h3>
                <p className="text-xs text-slate-500">Class 9 vs Class 10 performance</p>
              </div>
            </div>
            <button
              onClick={exportClassReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export
            </button>
          </div>

          <div className="p-5 space-y-4">
            {classReport.map((cls) => (
              <div key={cls.classId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-base text-slate-900">{cls.className}</span>
                    <span className="text-xs text-slate-500 ml-2">({cls.studentCount} Students)</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-700">
                    {cls.realizationRate}% Settled
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${cls.realizationRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Expected</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(cls.expected)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Collected</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(cls.collected)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pending</span>
                    <span className="font-bold text-rose-600">{formatCurrency(cls.pending)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Mode Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Payment Mode Split</h3>
                <p className="text-xs text-slate-500">Collections by payment channel</p>
              </div>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modeReport.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {modeReport.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Collected']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            {modeReport.chartData.map((item) => (
              <div key={item.name} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-slate-600 mb-0.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-bold">{item.percentage}%</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{formatCurrency(item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Concession Beneficiaries Audit Table (Bonus B) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Fee Concession & Scholarship Audit (Bonus B)
              </h3>
              <p className="text-xs text-slate-500">
                Complete log of students granted financial concessions
              </p>
            </div>
          </div>
          <button
            onClick={exportConcessionReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Audit
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-5">Class & Roll</th>
                <th className="py-3 px-5">Concession Category</th>
                <th className="py-3 px-5 text-center">Concession %</th>
                <th className="py-3 px-5 text-right">Annual Relief Granted (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {concessionReport.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-5">
                    <span className="font-semibold text-slate-900 block">{item.name}</span>
                    <span className="text-xs font-mono text-slate-400">{item.id}</span>
                  </td>
                  <td className="py-3 px-5 text-xs text-slate-600 font-medium">
                    {item.className} (Roll: #{item.rollNumber})
                  </td>
                  <td className="py-3 px-5 text-xs font-semibold text-slate-800">
                    {item.concessionReason}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.concessionPercent}%
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right font-bold text-emerald-600 text-sm">
                    {formatCurrency(item.totalConcessionValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
