// src/pages/Dashboard.jsx
import React, { useMemo } from 'react';
import {
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  TrendingUp,
  Receipt,
  PlusCircle,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useFee } from '../context/FeeContext';
import StatCard from '../components/common/StatCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getStudentTermBreakdown } from '../utils/calculations';

const PIE_COLORS = {
  Paid: '#10b981', // emerald-500
  'Partially Paid': '#f59e0b', // amber-500
  Pending: '#ef4444', // rose-500
};

export default function Dashboard() {
  const {
    students,
    classes,
    terms,
    feeStructures,
    payments,
    lateFeeRule,
    setActiveTab,
    setActiveReceipt,
    setSelectedStudentForPayment,
  } = useFee();

  // Dynamic calculations across all students and terms
  const dashboardStats = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;

    // Student status counts across active terms (Term 1 and Term 2 primarily active)
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;

    // Term-wise breakdown
    const termStats = {};
    terms.forEach((term) => {
      termStats[term.id] = {
        name: term.name,
        expected: 0,
        collected: 0,
        pending: 0,
      };
    });

    // Class-wise breakdown
    const classStats = {};
    classes.forEach((cls) => {
      classStats[cls.id] = {
        name: cls.name,
        expected: 0,
        collected: 0,
        pending: 0,
      };
    });

    students.forEach((student) => {
      let studentHasPaidAll = true;
      let studentHasAnyPayment = false;

      terms.forEach((term) => {
        const breakdown = getStudentTermBreakdown(
          student,
          term,
          feeStructures,
          payments,
          lateFeeRule
        );

        totalExpected += breakdown.effectiveTotalFee;
        totalCollected += breakdown.totalPaid;
        totalPending += breakdown.remainingBalance;

        // Add to term stats
        if (termStats[term.id]) {
          termStats[term.id].expected += breakdown.effectiveTotalFee;
          termStats[term.id].collected += breakdown.totalPaid;
          termStats[term.id].pending += breakdown.remainingBalance;
        }

        // Add to class stats
        if (classStats[student.classId]) {
          classStats[student.classId].expected += breakdown.effectiveTotalFee;
          classStats[student.classId].collected += breakdown.totalPaid;
          classStats[student.classId].pending += breakdown.remainingBalance;
        }

        if (breakdown.totalPaid > 0) studentHasAnyPayment = true;
        if (breakdown.remainingBalance > 0) studentHasPaidAll = false;
      });

      if (studentHasPaidAll && studentHasAnyPayment) {
        paidCount++;
      } else if (studentHasAnyPayment) {
        partialCount++;
      } else {
        pendingCount++;
      }
    });

    const collectionPercentage =
      totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const termChartData = Object.values(termStats).map((item) => ({
      name: item.name,
      Collected: item.collected,
      Pending: item.pending,
    }));

    const classChartData = Object.values(classStats).map((item) => ({
      name: item.name,
      Collected: item.collected,
      Pending: item.pending,
    }));

    const statusPieData = [
      { name: 'Paid', value: paidCount, color: PIE_COLORS.Paid },
      { name: 'Partially Paid', value: partialCount, color: PIE_COLORS['Partially Paid'] },
      { name: 'Pending', value: pendingCount, color: PIE_COLORS.Pending },
    ];

    return {
      totalExpected,
      totalCollected,
      totalPending,
      collectionPercentage,
      termChartData,
      classChartData,
      statusPieData,
    };
  }, [students, classes, terms, feeStructures, payments, lateFeeRule]);

  // Recent 6 transactions
  const recentPayments = useMemo(() => {
    const studentMap = new Map(students.map((s) => [s.id, s]));
    const classMap = new Map(classes.map((c) => [c.id, c.name]));
    const termMap = new Map(terms.map((t) => [t.id, t.name]));

    return payments.slice(0, 6).map((p) => ({
      ...p,
      student: studentMap.get(p.studentId) || { name: p.studentName || 'Student', rollNumber: '-' },
      className: classMap.get(p.classId) || p.classId,
      termName: termMap.get(p.termId) || p.termId,
    }));
  }, [payments, students, classes, terms]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold text-indigo-200 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Academic Year 2026-2027
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Fee Collection Dashboard
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Real-time monitoring of school fee structures, student ledger settlements, and collection targets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('recordPayment')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-md"
            >
              <CreditCard className="w-4 h-4" />
              Record New Payment
            </button>
            <button
              onClick={() => setActiveTab('pendingFees')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold backdrop-blur-sm transition cursor-pointer border border-white/10"
            >
              <Clock className="w-4 h-4 text-amber-300" />
              View Pending List
            </button>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Mandatory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Students"
          value={students.length}
          subtitle={`Across ${classes.length} classes`}
          icon={Users}
          color="blue"
          onClick={() => setActiveTab('students')}
        />
        <StatCard
          title="Fees Expected"
          value={formatCurrency(dashboardStats.totalExpected)}
          subtitle="Full academic year"
          icon={Wallet}
          color="indigo"
        />
        <StatCard
          title="Fees Collected"
          value={formatCurrency(dashboardStats.totalCollected)}
          subtitle="Total settlements"
          icon={CheckCircle2}
          color="emerald"
          badge={`${dashboardStats.collectionPercentage}%`}
          onClick={() => setActiveTab('paymentHistory')}
        />
        <StatCard
          title="Pending Fees"
          value={formatCurrency(dashboardStats.totalPending)}
          subtitle="Outstanding balance"
          icon={Clock}
          color="rose"
          onClick={() => setActiveTab('pendingFees')}
        />
        <StatCard
          title="Collection Rate"
          value={`${dashboardStats.collectionPercentage}%`}
          subtitle="Target completion"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Progress bar visual */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overall Fee Realization Progress
          </span>
          <span className="text-sm font-bold text-slate-800">
            {formatCurrency(dashboardStats.totalCollected)} of {formatCurrency(dashboardStats.totalExpected)} ({dashboardStats.collectionPercentage}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-inner"
            style={{ width: `${Math.min(100, dashboardStats.collectionPercentage)}%` }}
          />
        </div>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Term-wise Collection Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Fee Collection by Academic Term</h3>
              <p className="text-xs text-slate-500 mt-0.5">Collected vs Pending amounts in INR</p>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
              Terms 1, 2 & 3
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats.termChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  tickFormatter={(val) => `₹${val / 1000}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Bar dataKey="Pending" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Status Donut Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-900 text-base">Student Payment Status</h3>
            </div>
            <p className="text-xs text-slate-500 mb-2">Student settlement distribution</p>
            
            <div className="h-52 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardStats.statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dashboardStats.statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} Students`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">{students.length}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            {dashboardStats.statusPieData.map((item) => (
              <div key={item.name} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-600 font-medium block">{item.name}</span>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Collection Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class-wise collection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Class-wise Collection</h3>
              <p className="text-xs text-slate-500 mt-0.5">Class 9 vs Class 10 performance</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats.classChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  tickFormatter={(val) => `₹${val / 1000}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={38} />
                <Bar dataKey="Pending" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Payment Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recent Payment Transactions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Latest receipts issued in the system</p>
              </div>
              <button
                onClick={() => setActiveTab('paymentHistory')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                View All ({payments.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[11px]">
                    <th className="pb-2.5">Receipt #</th>
                    <th className="pb-2.5">Student</th>
                    <th className="pb-2.5">Class / Term</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Mode</th>
                    <th className="pb-2.5 text-right">Amount</th>
                    <th className="pb-2.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition group">
                      <td className="py-2.5 font-bold text-slate-900">{p.receiptNumber}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-slate-800 block">{p.student.name}</span>
                        <span className="text-[10px] text-slate-400">{p.studentId}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-medium text-slate-700">{p.className}</span>
                        <span className="text-[10px] text-indigo-600 block">{p.termName}</span>
                      </td>
                      <td className="py-2.5 text-slate-500">{formatDate(p.paymentDate)}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => setActiveReceipt(p)}
                          title="View & Print Receipt"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
