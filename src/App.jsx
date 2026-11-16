// src/App.jsx
import React, { useState } from 'react';
import { FeeProvider, useFee } from './context/FeeContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import ReceiptModal from './components/receipt/ReceiptModal';
import NotificationToast from './components/common/NotificationToast';

// Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import FeeStructure from './pages/FeeStructure';
import RecordPayment from './pages/RecordPayment';
import PaymentHistory from './pages/PaymentHistory';
import PendingFees from './pages/PendingFees';
import Reports from './pages/Reports';

function AppContent() {
  const { activeTab } = useFee();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Render the current page
  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students />;
      case 'feeStructure':
        return <FeeStructure />;
      case 'recordPayment':
        return <RecordPayment />;
      case 'paymentHistory':
        return <PaymentHistory />;
      case 'pendingFees':
        return <PendingFees />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Receipt Modal */}
      <ReceiptModal />

      {/* Global Toast Notifications */}
      <NotificationToast />
    </div>
  );
}

export default function App() {
  return (
    <FeeProvider>
      <AppContent />
    </FeeProvider>
  );
}
