// src/pages/Students.jsx
import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CreditCard,
  Download,
  Award,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';
import { useFee } from '../context/FeeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getStudentOverallSummary, getStudentTermBreakdown } from '../utils/calculations';
import { exportStudentsReport } from '../utils/excelExport';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Students() {
  const {
    students,
    classes,
    terms,
    feeStructures,
    payments,
    lateFeeRule,
    addStudent,
    updateStudent,
    deleteStudent,
    setActiveTab,
    setSelectedStudentForPayment,
  } = useFee();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Add/Edit Student Modal state
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    classId: classes[0]?.id || 'class-9',
    rollNumber: '',
    contactNumber: '',
    parentName: '',
    concessionPercent: 0,
    concessionReason: '',
  });

  // View Student Ledger modal
  const [viewingStudent, setViewingStudent] = useState(null);

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.parentName && student.parentName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesClass =
        selectedClassFilter === 'all' || student.classId === selectedClassFilter;

      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, selectedClassFilter]);

  // Open Add modal
  const handleOpenAdd = () => {
    // Generate next student ID suggestion
    const nextNum = students.length + 1;
    const suggestedId = `STU-2026-${String(nextNum).padStart(3, '0')}`;

    setFormData({
      id: suggestedId,
      name: '',
      classId: classes[0]?.id || 'class-9',
      rollNumber: '',
      contactNumber: '+91 ',
      parentName: '',
      concessionPercent: 0,
      concessionReason: '',
    });
    setModalMode('add');
  };

  // Open Edit modal
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      id: student.id,
      name: student.name,
      classId: student.classId,
      rollNumber: student.rollNumber || '',
      contactNumber: student.contactNumber || '',
      parentName: student.parentName || '',
      concessionPercent: student.concessionPercent || 0,
      concessionReason: student.concessionReason || '',
    });
    setModalMode('edit');
  };

  // Save Add/Edit
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const res = addStudent(formData);
      if (res.success) setModalMode(null);
    } else if (modalMode === 'edit' && editingStudent) {
      const res = updateStudent(formData);
      if (res.success) setModalMode(null);
    }
  };

  // Handle Quick Pay
  const handleQuickPay = (student) => {
    setSelectedStudentForPayment(student.id);
    setActiveTab('recordPayment');
  };

  // Export
  const handleExportExcel = () => {
    exportStudentsReport(students, classes, feeStructures, payments, terms, lateFeeRule);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage enrolled students, fee concessions, and view individual fee statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, ID, or roll..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Class:</span>
          </div>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Classes ({students.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-5">Class & Roll</th>
                <th className="py-3 px-5">Parent / Contact</th>
                <th className="py-3 px-5">Concession</th>
                <th className="py-3 px-5 text-right">Fee Settlement</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const classItem = classes.find((c) => c.id === student.classId);
                  const summary = getStudentOverallSummary(
                    student,
                    terms,
                    feeStructures,
                    payments,
                    lateFeeRule
                  );

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & ID */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{student.name}</div>
                            <div className="text-xs font-mono text-slate-400">{student.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Class & Roll */}
                      <td className="py-3.5 px-5">
                        <span className="font-medium text-slate-800">
                          {classItem?.name || student.classId}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          Roll: #{student.rollNumber || '-'}
                        </span>
                      </td>

                      {/* Parent & Contact */}
                      <td className="py-3.5 px-5">
                        <span className="text-xs text-slate-700 block font-medium">
                          {student.parentName || '-'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {student.contactNumber || '-'}
                        </span>
                      </td>

                      {/* Concession */}
                      <td className="py-3.5 px-5">
                        {student.concessionPercent > 0 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Award className="w-3 h-3 text-emerald-600" />
                            {student.concessionPercent}% Off
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Regular (0%)</span>
                        )}
                        {student.concessionReason && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[130px]" title={student.concessionReason}>
                            {student.concessionReason}
                          </span>
                        )}
                      </td>

                      {/* Fee Settlement Summary */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="text-xs">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(summary.totalPaid)}
                          </span>
                          <span className="text-slate-400"> / {formatCurrency(summary.totalExpected)}</span>
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {summary.totalPending === 0 ? (
                            <span className="text-emerald-600 font-semibold">Fully Settled</span>
                          ) : (
                            <span className="text-rose-600 font-medium">
                              Pending: {formatCurrency(summary.totalPending)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingStudent(student)}
                            title="View Fee Ledger"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuickPay(student)}
                            title="Record Payment for Student"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            title="Edit Student Info"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(student)}
                            title="Delete Student"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'add' ? 'Add New Student' : 'Edit Student Details'}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Student ID *
              </label>
              <input
                type="text"
                required
                disabled={modalMode === 'edit'}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g. STU-2026-021"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 uppercase font-mono focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Reyansh Verma"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Class *
              </label>
              <select
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="e.g. 111"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Parent / Guardian Name *
              </label>
              <input
                type="text"
                required
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="e.g. Rakesh Verma"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                required
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bonus Feature B: Concession Percentage Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Fee Concession / Scholarship (Bonus Feature B)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Concession Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.concessionPercent}
                  onChange={(e) => setFormData({ ...formData, concessionPercent: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                  placeholder="0 - 100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Concession Category / Reason
                </label>
                <input
                  type="text"
                  value={formData.concessionReason}
                  onChange={(e) => setFormData({ ...formData, concessionReason: e.target.value })}
                  placeholder="e.g. Merit Scholarship, Sibling Discount"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              {modalMode === 'add' ? 'Add Student' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Student Fee Ledger Modal */}
      {viewingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setViewingStudent(null)}
          title={`Fee Ledger • ${viewingStudent.name} (${viewingStudent.id})`}
        >
          <div className="space-y-5">
            {/* Student Basic Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 block">Class</span>
                <span className="font-semibold text-slate-800">
                  {classes.find((c) => c.id === viewingStudent.classId)?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Roll No</span>
                <span className="font-semibold text-slate-800">{viewingStudent.rollNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Concession</span>
                <span className="font-bold text-emerald-700">
                  {viewingStudent.concessionPercent > 0
                    ? `${viewingStudent.concessionPercent}% (${viewingStudent.concessionReason || 'Active'})`
                    : 'None (0%)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Parent</span>
                <span className="font-semibold text-slate-800">{viewingStudent.parentName}</span>
              </div>
            </div>

            {/* Term-by-Term breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                Term-wise Fee Status
              </h4>
              <div className="space-y-2">
                {terms.map((term) => {
                  const b = getStudentTermBreakdown(
                    viewingStudent,
                    term,
                    feeStructures,
                    payments,
                    lateFeeRule
                  );
                  const termPayments = payments.filter(
                    (p) => p.studentId === viewingStudent.id && p.termId === term.id
                  );
                  const paid = termPayments.reduce((s, p) => s + p.amount, 0);

                  return (
                    <div
                      key={term.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{term.name}</span>
                          <span className="text-slate-400">• Due: {formatDate(term.dueDate)}</span>
                        </div>
                        <div className="text-slate-500 mt-1 flex flex-wrap gap-x-4">
                          <span>Base Fee: <strong>{formatCurrency(b?.baseFee || 0)}</strong></span>
                          {viewingStudent.concessionPercent > 0 && (
                            <span className="text-emerald-700">
                              Discount: -{formatCurrency(b?.concessionAmount || 0)}
                            </span>
                          )}
                          <span>Total Paid: <strong className="text-emerald-600">{formatCurrency(paid)}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Balance</span>
                          <span className={`font-bold text-sm ${(b?.remainingBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatCurrency(b?.remainingBalance || 0)}
                          </span>
                        </div>

                        {(b?.remainingBalance || 0) > 0 && (
                          <button
                            onClick={() => {
                              setSelectedStudentForPayment(viewingStudent.id);
                              setViewingStudent(null);
                              setActiveTab('recordPayment');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition cursor-pointer"
                          >
                            Pay Term
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Student Record?"
        message={`Are you sure you want to delete "${deleteConfirm?.name}" (${deleteConfirm?.id})? Students with existing payment history cannot be removed.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteConfirm) {
            deleteStudent(deleteConfirm.id);
            setDeleteConfirm(null);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
