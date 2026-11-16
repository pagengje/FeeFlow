// src/pages/FeeStructure.jsx
import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  ShieldCheck,
  Settings,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { useFee } from '../context/FeeContext';
import { formatCurrency } from '../utils/formatters';
import { getClassTotalFee } from '../utils/calculations';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function FeeStructure() {
  const {
    classes,
    feeStructures,
    lateFeeRule,
    addFeeComponent,
    updateFeeComponent,
    deleteFeeComponent,
    updateLateFeeRule,
  } = useFee();

  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'class-9');

  // Add/Edit component modal state
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingComponent, setEditingComponent] = useState(null);
  const [formData, setFormData] = useState({ name: '', amount: '', mandatory: true });

  // Delete confirm dialog
  const [deleteConfirm, setDeleteConfirm] = useState(null); // component to delete

  // Late Fee Rule configuration state
  const [lateFeeConfig, setLateFeeConfig] = useState({
    enabled: lateFeeRule.enabled,
    type: lateFeeRule.type || 'flat',
    amount: lateFeeRule.amount || 500,
    gracePeriodDays: lateFeeRule.gracePeriodDays || 5,
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const currentComponents = feeStructures[selectedClassId] || [];
  const termTotal = getClassTotalFee(selectedClassId, feeStructures);
  const annualTotal = termTotal * 3;

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData({ name: '', amount: '', mandatory: true });
    setModalMode('add');
  };

  // Open Edit modal
  const handleOpenEdit = (comp) => {
    setEditingComponent(comp);
    setFormData({ name: comp.name, amount: comp.amount, mandatory: comp.mandatory });
    setModalMode('edit');
  };

  // Save Add/Edit
  const handleSaveComponent = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const res = addFeeComponent(selectedClassId, {
        name: formData.name,
        amount: Number(formData.amount),
        mandatory: formData.mandatory,
      });
      if (res.success) setModalMode(null);
    } else if (modalMode === 'edit' && editingComponent) {
      const res = updateFeeComponent(selectedClassId, {
        ...editingComponent,
        name: formData.name,
        amount: Number(formData.amount),
        mandatory: formData.mandatory,
      });
      if (res.success) setModalMode(null);
    }
  };

  // Save Late Fee Rule
  const handleSaveLateFeeRule = (e) => {
    e.preventDefault();
    updateLateFeeRule({
      ...lateFeeConfig,
      amount: Number(lateFeeConfig.amount),
      gracePeriodDays: Number(lateFeeConfig.gracePeriodDays),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Structure Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure term-wise fee components per class and manage school late fee policies.
          </p>
        </div>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {classes.map((cls) => {
          const isActive = cls.id === selectedClassId;
          const classTermFee = getClassTotalFee(cls.id, feeStructures);

          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`flex items-center gap-2.5 px-5 py-3 border-b-2 font-medium text-sm transition cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{cls.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                {formatCurrency(classTermFee)}/term
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Fee Structure Table + Summary & Late Fee */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Fee Components Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {selectedClass.name} Fee Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Applied per term (Term 1, Term 2, Term 3)
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Component
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Fee Component</th>
                  <th className="py-3 px-5">Classification</th>
                  <th className="py-3 px-5 text-right">Amount (₹) / Term</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentComponents.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {comp.name}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          comp.mandatory
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {comp.mandatory ? 'Mandatory' : 'Optional / Facility'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                      {formatCurrency(comp.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(comp)}
                          title="Edit Component"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(comp)}
                          title="Delete Component"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td className="py-3.5 px-5" colSpan={2}>
                    Total Fee Per Term ({selectedClass.name})
                  </td>
                  <td className="py-3.5 px-5 text-right text-base text-blue-700">
                    {formatCurrency(termTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Col: Class Totals Card & Bonus A: Late Fee Rule Card */}
        <div className="space-y-6">
          {/* Fee Totals Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-base mb-1">{selectedClass.name} Summary</h3>
            <p className="text-xs text-slate-300 mb-4">Cumulative academic fee calculation</p>

            <div className="space-y-3 bg-white/10 p-3.5 rounded-xl backdrop-blur-xs text-sm border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Components Count</span>
                <span className="font-bold">{currentComponents.length} items</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Fee Per Term (3 Terms)</span>
                <span className="font-bold text-emerald-400">{formatCurrency(termTotal)}</span>
              </div>
              <div className="pt-2 border-t border-white/15 flex justify-between items-center text-base">
                <span className="font-semibold text-indigo-200">Annual Total Fee</span>
                <span className="font-extrabold text-white">{formatCurrency(annualTotal)}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 italic">
              Note: Students with concessions (scholarships/discounts) will have deductions applied automatically during payment recording.
            </p>
          </div>

          {/* Bonus Feature A: Late Fee Rule Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Late Fee Rule (Bonus A)</h3>
                <p className="text-xs text-slate-500">Policy for overdue term fee payments</p>
              </div>
            </div>

            <form onSubmit={handleSaveLateFeeRule} className="space-y-4 text-xs">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700">Apply Late Fee Rule</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lateFeeConfig.enabled}
                    onChange={(e) => setLateFeeConfig({ ...lateFeeConfig, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Late Fee Type */}
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fee Calculation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLateFeeConfig({ ...lateFeeConfig, type: 'flat' })}
                    className={`py-2 px-3 text-center rounded-lg border font-semibold transition cursor-pointer ${
                      lateFeeConfig.type === 'flat'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Flat Amount (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLateFeeConfig({ ...lateFeeConfig, type: 'percentage' })}
                    className={`py-2 px-3 text-center rounded-lg border font-semibold transition cursor-pointer ${
                      lateFeeConfig.type === 'percentage'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>
              </div>

              {/* Value Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    {lateFeeConfig.type === 'flat' ? 'Amount (₹)' : 'Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lateFeeConfig.amount}
                    onChange={(e) => setLateFeeConfig({ ...lateFeeConfig, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={lateFeeConfig.gracePeriodDays}
                    onChange={(e) => setLateFeeConfig({ ...lateFeeConfig, gracePeriodDays: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="5"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                Update Late Fee Rule
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Add / Edit Fee Component Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'add' ? `Add Fee Component to ${selectedClass.name}` : 'Edit Fee Component'}
      >
        <form onSubmit={handleSaveComponent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Component Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Laboratory Fee, Sports Fee"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Amount (₹ per term) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="100"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 2500"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mandatoryComp"
              checked={formData.mandatory}
              onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="mandatoryComp" className="text-sm text-slate-700 font-medium">
              Mandatory component for all students in this class
            </label>
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
              {modalMode === 'add' ? 'Add Component' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Fee Component?"
        message={`Are you sure you want to remove "${deleteConfirm?.name}" (₹${deleteConfirm?.amount}) from ${selectedClass.name}? Future calculations for this class will not include this component.`}
        confirmText="Yes, Delete"
        cancelText="Keep Component"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteConfirm) {
            deleteFeeComponent(selectedClassId, deleteConfirm.id);
            setDeleteConfirm(null);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
