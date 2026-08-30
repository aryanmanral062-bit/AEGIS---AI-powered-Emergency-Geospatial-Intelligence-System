import { useState, useEffect } from 'react';
import { getCurrentDateTime } from '../../utils/formatters';
import { StatusIndicator } from '../common/StatusIndicator';
import { DataSemanticBadge } from '../common/Badge';

export default function Header() {
  const [dateTime, setDateTime] = useState(getCurrentDateTime());

  useEffect(() => {
    const interval = setInterval(() => setDateTime(getCurrentDateTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="aegis-header">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-navy-800 border border-navy-700 font-extrabold text-xs tracking-wider text-white">
          A
        </div>
        <div>
          <div className="font-extrabold tracking-wider text-xs text-white leading-none flex items-center gap-1.5">
            <span>AEGIS</span>
            <span className="text-[9px] font-normal text-slate-400">| Decision Support</span>
          </div>
          <div className="text-[9.5px] font-medium text-slate-400 leading-tight">
            Kerala State Disaster Management Authority
          </div>
        </div>
      </div>

      <div className="w-px h-5 bg-navy-800 shrink-0" />

      {/* Operational Mode */}
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-navy-800 border border-navy-700 text-[10px] font-bold tracking-wider text-blue-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
        PLANNING MODE
      </div>

      <div className="w-px h-5 bg-navy-800 shrink-0" />

      {/* System Status Indicators */}
      <div className="flex items-center gap-3 text-xs">
        <StatusIndicator status="operational" label="System Operational" className="text-slate-300 text-[11px]" />
        <div className="w-px h-3.5 bg-navy-800" />
        <StatusIndicator status="stale" label="18/20 Sources Current" className="text-slate-300 text-[11px]" />
      </div>

      <div className="w-px h-5 bg-navy-800 shrink-0" />

      {/* Demo Simulation Tag */}
      <DataSemanticBadge type="DEMO_DATA" />

      {/* Right Side: Statutory Demonstration Identity */}
      <div className="ml-auto flex items-center gap-3.5 text-xs text-slate-300">
        <div className="text-right">
          <div className="font-extrabold text-white text-[11px] uppercase tracking-wide leading-tight flex items-center justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>District Collector & Magistrate</span>
          </div>
          <div className="text-[9.5px] text-slate-300 font-semibold uppercase tracking-wider">
            Wayanad DDMA (Incident Commander)
          </div>
        </div>
        <div className="w-px h-5 bg-navy-800 shrink-0" />
        <div className="font-mono-code text-[11px] text-slate-300 tracking-tight">
          {dateTime}
        </div>
      </div>
    </header>
  );
}
