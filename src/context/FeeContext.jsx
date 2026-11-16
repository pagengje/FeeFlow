// src/context/FeeContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  INITIAL_CLASSES,
  INITIAL_TERMS,
  INITIAL_FEE_STRUCTURES,
  INITIAL_LATE_FEE_RULE,
  INITIAL_STUDENTS,
  INITIAL_PAYMENTS,
} from '../data/initialData';
import { getStudentTermBreakdown, getClassTotalFee } from '../utils/calculations';

const FeeContext = createContext(null);

const STORAGE_KEYS = {
  STUDENTS: 'feeflow_students',
  CLASSES: 'feeflow_classes',
  TERMS: 'feeflow_terms',
  FEE_STRUCTURES: 'feeflow_feeStructures',
  PAYMENTS: 'feeflow_payments',
  LATE_FEE_RULE: 'feeflow_lateFeeRule',
  SCHOOL_INFO: 'feeflow_schoolInfo',
};

const DEFAULT_SCHOOL_INFO = {
  name: 'Greenwood International School',
  tagline: 'Excellence in Education & Character Building',
  affiliation: 'CBSE Affiliation No: 1930284 | School Code: 40182',
  address: 'Plot 14, Institutional Area, Knowledge Park III, New Delhi - 110001',
  phone: '+91 11 4567 8900 / +91 98760 12345',
  email: 'accounts@greenwoodacademy.edu.in',
  website: 'www.greenwoodacademy.edu.in',
  academicYear: '2026-2027',
};

export function FeeProvider({ children }) {
  // Load or fallback helper
  const loadStorage = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return fallback;
    }
  };

  const [students, setStudents] = useState(() => loadStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS));
  const [classes, setClasses] = useState(() => loadStorage(STORAGE_KEYS.CLASSES, INITIAL_CLASSES));
  const [terms, setTerms] = useState(() => loadStorage(STORAGE_KEYS.TERMS, INITIAL_TERMS));
  const [feeStructures, setFeeStructures] = useState(() => loadStorage(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES));
  const [payments, setPayments] = useState(() => loadStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS));
  const [lateFeeRule, setLateFeeRule] = useState(() => loadStorage(STORAGE_KEYS.LATE_FEE_RULE, INITIAL_LATE_FEE_RULE));
  const [schoolInfo, setSchoolInfo] = useState(() => loadStorage(STORAGE_KEYS.SCHOOL_INFO, DEFAULT_SCHOOL_INFO));

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(terms));
  }, [terms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FEE_STRUCTURES, JSON.stringify(feeStructures));
  }, [feeStructures]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LATE_FEE_RULE, JSON.stringify(lateFeeRule));
  }, [lateFeeRule]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_INFO, JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  // Toast notifications helper
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Generate unique sequential receipt number: FEE-2026-0001, FEE-2026-0002...
  const generateReceiptNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const prefix = `FEE-${year}-`;
    
    // Find all numbers with this prefix
    let maxNum = 0;
    payments.forEach((p) => {
      if (p.receiptNumber && p.receiptNumber.startsWith(prefix)) {
        const numPart = parseInt(p.receiptNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }, [payments]);

  // Student CRUD operations
  const addStudent = useCallback((studentData) => {
    // Validation: Check ID uniqueness
    if (!studentData.id || !studentData.id.trim()) {
      addToast('Student ID is required', 'error');
      return { success: false, error: 'Student ID is required' };
    }
    const cleanId = studentData.id.trim().toUpperCase();
    const existing = students.find((s) => s.id.toUpperCase() === cleanId);
    if (existing) {
      addToast(`Student ID "${cleanId}" already exists!`, 'error');
      return { success: false, error: 'Student ID must be unique' };
    }

    if (!studentData.name || !studentData.name.trim()) {
      addToast('Student name is required', 'error');
      return { success: false, error: 'Student name is required' };
    }

    if (!studentData.classId) {
      addToast('Please select a class for the student', 'error');
      return { success: false, error: 'Class is required' };
    }

    const newStudent = {
      ...studentData,
      id: cleanId,
      name: studentData.name.trim(),
      rollNumber: studentData.rollNumber?.trim() || '',
      contactNumber: studentData.contactNumber?.trim() || '',
      parentName: studentData.parentName?.trim() || '',
      concessionPercent: Math.max(0, Math.min(100, Number(studentData.concessionPercent) || 0)),
      concessionReason: studentData.concessionReason?.trim() || '',
    };

    setStudents((prev) => [newStudent, ...prev]);
    addToast(`Student "${newStudent.name}" (${newStudent.id}) added successfully!`, 'success');
    return { success: true, student: newStudent };
  }, [students, addToast]);

  const updateStudent = useCallback((studentData) => {
    if (!studentData.id) return { success: false, error: 'Student ID required' };
    
    setStudents((prev) =>
      prev.map((s) => (s.id === studentData.id ? { ...s, ...studentData } : s))
    );
    addToast(`Student "${studentData.name}" details updated successfully!`, 'success');
    return { success: true };
  }, [addToast]);

  const deleteStudent = useCallback((studentId) => {
    const student = students.find((s) => s.id === studentId);
    const studentPayments = payments.filter((p) => p.studentId === studentId);
    
    if (studentPayments.length > 0) {
      addToast(`Cannot delete student ${student?.name || studentId} because they have ${studentPayments.length} recorded payments.`, 'error');
      return { success: false, error: 'Has payment records' };
    }

    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    addToast(`Student ${student?.name || studentId} removed successfully.`, 'info');
    return { success: true };
  }, [students, payments, addToast]);

  // Fee Structure operations
  const addFeeComponent = useCallback((classId, component) => {
    if (!component.name || !component.name.trim()) {
      addToast('Component name cannot be empty', 'error');
      return { success: false };
    }
    const amount = Number(component.amount);
    if (isNaN(amount) || amount < 0) {
      addToast('Component amount must be a valid non-negative number', 'error');
      return { success: false };
    }

    const newComponent = {
      id: `comp-${Date.now()}`,
      name: component.name.trim(),
      amount: Math.round(amount),
      mandatory: component.mandatory !== false,
    };

    setFeeStructures((prev) => ({
      ...prev,
      [classId]: [...(prev[classId] || []), newComponent],
    }));

    addToast(`Added fee component "${newComponent.name}" (₹${newComponent.amount})`, 'success');
    return { success: true };
  }, [addToast]);

  const updateFeeComponent = useCallback((classId, updatedComponent) => {
    setFeeStructures((prev) => {
      const list = prev[classId] || [];
      return {
        ...prev,
        [classId]: list.map((item) => (item.id === updatedComponent.id ? updatedComponent : item)),
      };
    });
    addToast(`Fee component "${updatedComponent.name}" updated`, 'success');
    return { success: true };
  }, [addToast]);

  const deleteFeeComponent = useCallback((classId, componentId) => {
    setFeeStructures((prev) => {
      const list = prev[classId] || [];
      if (list.length <= 1) {
        addToast('At least one fee component must remain in the class structure', 'warning');
        return prev;
      }
      return {
        ...prev,
        [classId]: list.filter((item) => item.id !== componentId),
      };
    });
    addToast('Fee component removed successfully', 'info');
    return { success: true };
  }, [addToast]);

  // Late Fee Rule operations
  const updateLateFeeRule = useCallback((rule) => {
    setLateFeeRule(rule);
    addToast('Late fee rule configuration updated', 'success');
  }, [addToast]);

  // Record Payment
  const recordPayment = useCallback((paymentData) => {
    const {
      studentId,
      termId,
      amount,
      paymentMode,
      paymentDate,
      referenceNumber,
      remarks,
      applyLateFeeManually,
    } = paymentData;

    // Validation 1: Student and Term presence
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      addToast('Invalid student selected', 'error');
      return { success: false, error: 'Invalid student' };
    }
    const term = terms.find((t) => t.id === termId);
    if (!term) {
      addToast('Invalid term selected', 'error');
      return { success: false, error: 'Invalid term' };
    }

    // Validation 2: Payment amount
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      addToast('Payment amount must be a positive number greater than 0', 'error');
      return { success: false, error: 'Payment amount must be positive' };
    }

    // Calculate current status and remaining balance
    const breakdown = getStudentTermBreakdown(
      student,
      term,
      feeStructures,
      payments,
      lateFeeRule,
      paymentDate
    );

    // If manual late fee toggle or overdue calculation
    let lateFeeToAssess = 0;
    if (applyLateFeeManually && breakdown.previouslyAssessedLateFees === 0) {
      lateFeeToAssess = breakdown.lateFee;
    } else if (breakdown.previouslyAssessedLateFees > 0) {
      lateFeeToAssess = 0; // already assessed
    } else if (breakdown.isOverdue && lateFeeRule.enabled) {
      lateFeeToAssess = breakdown.lateFee;
    }

    // Total effective amount due
    const totalRemainingPayable = breakdown.remainingBalance + (applyLateFeeManually && breakdown.previouslyAssessedLateFees === 0 ? lateFeeToAssess : 0);

    // Validation 3: Payment cannot exceed outstanding amount
    if (paymentAmount > totalRemainingPayable) {
      addToast(
        `Payment (₹${paymentAmount}) cannot exceed the outstanding balance of ₹${totalRemainingPayable}`,
        'error'
      );
      return {
        success: false,
        error: `Payment exceeds outstanding balance of ₹${totalRemainingPayable}`,
      };
    }

    // Generate unique receipt number
    const receiptNumber = generateReceiptNumber();
    const newRemainingBalance = Math.max(0, totalRemainingPayable - paymentAmount);

    const newPayment = {
      id: `PAY-${Date.now()}`,
      receiptNumber,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      termId: term.id,
      amount: paymentAmount,
      baseFee: breakdown.baseFee,
      concessionPercent: breakdown.concessionPercent,
      concessionAmount: breakdown.concessionAmount,
      lateFee: lateFeeToAssess,
      previousPaid: breakdown.totalPaid,
      remainingBalance: newRemainingBalance,
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
      paymentMode: paymentMode || 'UPI',
      referenceNumber: referenceNumber || '',
      remarks: remarks || '',
      timestamp: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);

    addToast(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully! Receipt: ${receiptNumber}`, 'success');

    // Auto open receipt modal
    setActiveReceipt(newPayment);

    return { success: true, payment: newPayment };
  }, [students, terms, feeStructures, payments, lateFeeRule, generateReceiptNumber, addToast]);

  // Reset Demo Data
  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.TERMS);
    localStorage.removeItem(STORAGE_KEYS.FEE_STRUCTURES);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.LATE_FEE_RULE);
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_INFO);

    setStudents(INITIAL_STUDENTS);
    setClasses(INITIAL_CLASSES);
    setTerms(INITIAL_TERMS);
    setFeeStructures(INITIAL_FEE_STRUCTURES);
    setPayments(INITIAL_PAYMENTS);
    setLateFeeRule(INITIAL_LATE_FEE_RULE);
    setSchoolInfo(DEFAULT_SCHOOL_INFO);

    addToast('Demo data restored to initial state!', 'info');
  }, [addToast]);

  // Context value
  const value = useMemo(
    () => ({
      students,
      classes,
      terms,
      feeStructures,
      payments,
      lateFeeRule,
      schoolInfo,
      activeTab,
      setActiveTab,
      toasts,
      addToast,
      removeToast,
      activeReceipt,
      setActiveReceipt,
      selectedStudentForPayment,
      setSelectedStudentForPayment,
      addStudent,
      updateStudent,
      deleteStudent,
      addFeeComponent,
      updateFeeComponent,
      deleteFeeComponent,
      updateLateFeeRule,
      recordPayment,
      resetDemoData,
      generateReceiptNumber,
    }),
    [
      students,
      classes,
      terms,
      feeStructures,
      payments,
      lateFeeRule,
      schoolInfo,
      activeTab,
      toasts,
      addToast,
      removeToast,
      activeReceipt,
      selectedStudentForPayment,
      addStudent,
      updateStudent,
      deleteStudent,
      addFeeComponent,
      updateFeeComponent,
      deleteFeeComponent,
      updateLateFeeRule,
      recordPayment,
      resetDemoData,
      generateReceiptNumber,
    ]
  );

  return <FeeContext.Provider value={value}>{children}</FeeContext.Provider>;
}

export function useFee() {
  const context = useContext(FeeContext);
  if (!context) {
    throw new Error('useFee must be used within a FeeProvider');
  }
  return context;
}
