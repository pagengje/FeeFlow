// src/components/common/Sidebar.jsx
import React from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  CreditCard,
  Receipt,
  AlertCircle,
  BarChart3,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useFee } from '../../context/FeeContext';

export default function Sidebar({ isOpen, onClose }) {
  const { activeTab, setActiveTab, payments, students, terms, feeStructures, lateFeeRule } = useFee();

  // Navigation items
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      badge: students.length,
    },
    {
      id: 'feeStructure',
      label: 'Fee Structure',
      icon: Layers,
      badge: null,
    },
    {
      id: 'recordPayment',
      label: 'Record Payment',
      icon: CreditCard,
      highlight: true,
    },
    {
      id: 'paymentHistory',
      label: 'Payment History',
      icon: Receipt,
      badge: payments.length,
    },
    {
      id: 'pendingFees',
      label: 'Pending Fees',
      icon: AlertCircle,
      badgeVariant: 'warning',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      badge: null,
    },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden no-print"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Navigation
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : item.highlight
                      ? 'text-indigo-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-blue-400 group-hover:text-blue-300'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>System Status</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              LocalStorage Active • INR (₹)
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
