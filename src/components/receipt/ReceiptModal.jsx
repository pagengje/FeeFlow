// src/components/receipt/ReceiptModal.jsx
import React from 'react';
import { Printer, X, CheckCircle2, Building, ShieldCheck, Download } from 'lucide-react';
import { useFee } from '../../context/FeeContext';
import { formatCurrency, formatDate, numberToWords } from '../../utils/formatters';

export default function ReceiptModal() {
  const { activeReceipt, setActiveReceipt, schoolInfo, students, classes, terms } = useFee();

  if (!activeReceipt) return null;

  // Resolve student, class, and term details
  const student =
    students.find((s) => s.id === activeReceipt.studentId) || {
      name: activeReceipt.studentName || 'Student',
      rollNumber: '-',
      parentName: '-',
      contactNumber: '-',
    };

  const classItem = classes.find((c) => c.id === activeReceipt.classId) || {
    name: activeReceipt.classId || 'Class',
  };

  const termItem = terms.find((t) => t.id === activeReceipt.termId) || {
    name: activeReceipt.termId || 'Term',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setActiveReceipt(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        {/* Modal Controls Header (Screen only) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm tracking-wide">
              Payment Receipt • {activeReceipt.receiptNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-receipt-area" className="p-8 sm:p-10 bg-white text-slate-800 font-sans">
          {/* Receipt Border Container for authentic look */}
          <div className="border-2 border-slate-700 p-6 sm:p-8 rounded-lg relative">
            {/* Header: School details */}
            <div className="border-b-2 border-slate-800 pb-5 mb-5 text-center relative">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  G
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-slate-900">
                    {schoolInfo.name}
                  </h1>
                  <p className="text-xs font-medium text-slate-600 italic">
                    {schoolInfo.tagline}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {schoolInfo.affiliation} • {schoolInfo.address}
              </p>
              <p className="text-xs text-slate-500">
                Phone: {schoolInfo.phone} | Email: {schoolInfo.email}
              </p>

              <div className="mt-3 inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded">
                Official Fee Payment Receipt
              </div>
            </div>

            {/* Receipt Meta & Date */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium">Receipt No:</span>{' '}
                <span className="font-bold text-slate-900 text-sm">{activeReceipt.receiptNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Payment Date:</span>{' '}
                <span className="font-semibold text-slate-800">{formatDate(activeReceipt.paymentDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Academic Year:</span>{' '}
                <span className="font-semibold text-slate-800">{schoolInfo.academicYear}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Academic Term:</span>{' '}
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {termItem.name}
                </span>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                Student Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Student ID</span>
                  <span className="font-semibold text-slate-800">{student.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Class & Section</span>
                  <span className="font-semibold text-slate-800">{classItem.name} {classItem.section ? `(${classItem.section})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Roll Number</span>
                  <span className="font-semibold text-slate-800">{student.rollNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Parent / Guardian</span>
                  <span className="font-semibold text-slate-800">{student.parentName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact</span>
                  <span className="font-semibold text-slate-800">{student.contactNumber || '-'}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown Table */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                Payment Details & Ledger
              </h4>
              <table className="w-full text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <th className="py-2 px-3 text-left">Description</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-3 text-slate-700">Base Class Fee ({termItem.name})</td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(activeReceipt.baseFee)}</td>
                  </tr>

                  {activeReceipt.concessionAmount > 0 && (
                    <tr className="text-emerald-700 bg-emerald-50/50">
                      <td className="py-2 px-3">
                        Less: Fee Concession ({activeReceipt.concessionPercent}%
                        {student.concessionReason ? ` - ${student.concessionReason}` : ''})
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        - {formatCurrency(activeReceipt.concessionAmount)}
                      </td>
                    </tr>
                  )}

                  {activeReceipt.lateFee > 0 && (
                    <tr className="text-rose-700 bg-rose-50/50">
                      <td className="py-2 px-3">Add: Late Fee Charges</td>
                      <td className="py-2 px-3 text-right font-medium">
                        + {formatCurrency(activeReceipt.lateFee)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-300">
                    <td className="py-2 px-3">Effective Total Fee Payable</td>
                    <td className="py-2 px-3 text-right">
                      {formatCurrency(
                        (activeReceipt.baseFee || 0) -
                          (activeReceipt.concessionAmount || 0) +
                          (activeReceipt.lateFee || 0)
                      )}
                    </td>
                  </tr>

                  {activeReceipt.previousPaid > 0 && (
                    <tr className="text-slate-600">
                      <td className="py-2 px-3">Previously Paid for this Term</td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency(activeReceipt.previousPaid)}
                      </td>
                    </tr>
                  )}

                  {/* CURRENT PAYMENT HIGHLIGHT */}
                  <tr className="bg-emerald-100/70 text-emerald-950 font-bold border-t-2 border-b-2 border-emerald-600">
                    <td className="py-2.5 px-3 text-sm">
                      AMOUNT PAID NOW (CURRENT RECEIPT)
                    </td>
                    <td className="py-2.5 px-3 text-right text-base text-emerald-700">
                      {formatCurrency(activeReceipt.amount)}
                    </td>
                  </tr>

                  {/* REMAINING BALANCE */}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="py-2 px-3 text-slate-700">Remaining Balance for this Term</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(activeReceipt.remainingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in words & Transaction Info */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-6 space-y-1.5">
              <div>
                <span className="font-semibold text-slate-700">Amount in Words: </span>
                <span className="italic text-slate-900 font-medium">
                  {numberToWords(activeReceipt.amount)}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-slate-600 pt-1 border-t border-slate-200">
                <div>
                  <span className="font-medium">Payment Mode:</span>{' '}
                  <span className="font-bold text-slate-900">{activeReceipt.paymentMode}</span>
                </div>
                {activeReceipt.referenceNumber && (
                  <div>
                    <span className="font-medium">Txn / Ref ID:</span>{' '}
                    <span className="font-mono text-slate-800">{activeReceipt.referenceNumber}</span>
                  </div>
                )}
                {activeReceipt.remarks && (
                  <div>
                    <span className="font-medium">Remarks:</span>{' '}
                    <span className="text-slate-700">{activeReceipt.remarks}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="grid grid-cols-2 pt-8 mt-4 border-t border-dashed border-slate-300 text-xs">
              <div>
                <p className="text-[11px] text-slate-400">
                  Note: Fees once paid are non-refundable. Please retain this receipt for future reference.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Computer Generated Valid Receipt
                </div>
              </div>
              <div className="flex flex-col items-end justify-end">
                <div className="w-40 border-b border-slate-800 text-center pb-1 font-medium text-slate-800">
                  Accounts Officer
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Authorized Signatory / Seal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Screen only) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Receipt is saved in system history and can be reprinted anytime.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
