// src/components/common/StatCard.jsx
import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  badge,
  onClick,
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      accent: 'bg-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      accent: 'bg-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      accent: 'bg-amber-600',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      accent: 'bg-rose-600',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      accent: 'bg-indigo-600',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition duration-200 relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              {badge && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${scheme.bg} ${scheme.text}`}>
                  {badge}
                </span>
              )}
              <span>{subtitle}</span>
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-1 ${scheme.accent} opacity-80`} />
    </div>
  );
}
