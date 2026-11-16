// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import {
  School,
  RotateCcw,
  PlusCircle,
  Menu,
  X,
  CreditCard,
  Calendar,
  Building2,
} from 'lucide-react';
import { useFee } from '../../context/FeeContext';
import ConfirmDialog from './ConfirmDialog';

export default function Navbar({ onToggleSidebar, isMobileOpen }) {
  const { schoolInfo, setActiveTab, resetDemoData } = useFee();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleConfirmReset = () => {
    resetDemoData();
    setShowResetConfirm(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md no-print">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg focus:outline-none"
              aria-label="Toggle navigation"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center shadow-md">
                <School className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white">FeeFlow</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    School Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
                  {schoolInfo.name}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Academic year badge, quick payment button, reset demo data */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>AY: <strong className="text-white">{schoolInfo.academicYear}</strong></span>
            </div>

            <button
              onClick={() => setActiveTab('recordPayment')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden xs:inline">Record Payment</span>
              <span className="xs:hidden">Pay</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset all data back to original sample data"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Reset confirmation dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Demo Data to Initial State?"
        message="This will reset all student records, fee components, late fee settings, and payment histories to the default demo data (2 classes, 20 students, and sample transactions). Any newly entered records will be replaced."
        confirmText="Yes, Reset Data"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
}
