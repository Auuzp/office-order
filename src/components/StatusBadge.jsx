import React from 'react';
import { Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3.5 py-1.5 space-x-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  switch (status) {
    case 'PENDING':
      return (
        <span className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs ${sizeClasses[size]}`}>
          {showIcon && <Clock className={`${iconSizes[size]} text-amber-500 animate-pulse`} />}
          <span>รออนุมัติ</span>
        </span>
      );

    case 'APPROVED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${sizeClasses[size]}`}>
          {showIcon && <CheckCircle2 className={`${iconSizes[size]} text-emerald-600`} />}
          <span>อนุมัติแล้ว</span>
        </span>
      );

    case 'SHIPPING':
      return (
        <span className={`inline-flex items-center font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs ${sizeClasses[size]}`}>
          {showIcon && <Truck className={`${iconSizes[size]} text-blue-600`} />}
          <span>กำลังจัดส่ง</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs ${sizeClasses[size]}`}>
          {showIcon && <XCircle className={`${iconSizes[size]} text-rose-600`} />}
          <span>ปฏิเสธ</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}>
          <span>{status}</span>
        </span>
      );
  }
}
