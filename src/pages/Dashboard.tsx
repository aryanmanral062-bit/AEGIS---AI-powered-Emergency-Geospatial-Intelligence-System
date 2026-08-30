import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import KPIStrip from '../components/kpi/KPIStrip';
import SimulationController from '../components/simulation/SimulationController';
import GISMap from '../components/map/GISMap';
import RelocationPanel from '../components/planning/RelocationPanel';
import InsightsPanel from '../components/insights/InsightsPanel';
import DataFreshness from '../components/data-status/DataFreshness';
import ResizableSplitter from '../components/layout/ResizableSplitter';
import {
  SIMULATION_STATES,
  planV1SimulationData,
  planV2SimulationData,
  mockDecisionContextV1,
  mockDecisionContextV2,
} from '../data/simulationData';
import { mockKPIs, mockInsights, mockDataSources } from '../data/mockData';
import type { SimulationStepId, RelocationPlan, KPIData } from '../types';

type CommandCenterTab = 'decision' | 'situation' | 'evidence';

const DEFAULT_TIMELINE_HEIGHT = 100;
const DEFAULT_MAP_WIDTH_PERCENT = 55;

const getInitialTimelineHeight = (): number => {
  try {
    const saved = localStorage.getItem('aegis.timelineHeight');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 60 && parsed <= 180) {
        return parsed;
      }
    }
  } catch {
    // Fallback if localStorage unavailable
  }
  return DEFAULT_TIMELINE_HEIGHT;
};

const getInitialMapWidthPercent = (): number => {
  try {
    const saved = localStorage.getItem('aegis.mapWidthPercent');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 40 && parsed <= 75) {
        return parsed;
      }
    }
  } catch {
    // Fallback if localStorage unavailable
  }
  return DEFAULT_MAP_WIDTH_PERCENT;
};

const getInitialUpperPanelCollapsed = (): boolean => {
  try {
    return localStorage.getItem('aegis.upperPanel.collapsed') === 'true';
  } catch {
    return false;
  }
};

const getInitialCommandPanelCollapsed = (): boolean => {
  try {
    return localStorage.getItem('aegis.commandPanel.collapsed') === 'true';
  } catch {
    return false;
  }
};

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState<SimulationStepId>(4); // Defaults to Plan V1 Formulated
  const [activePlan, setActivePlan] = useState<RelocationPlan>(planV1SimulationData);
  const [activeTab, setActiveTab] = useState<CommandCenterTab>('decision');

  // Independent presentation layout states with local storage persistence
  const [timelineHeight, setTimelineHeight] = useState<number>(getInitialTimelineHeight);
  const [mapWidthPercent, setMapWidthPercent] = useState<number>(getInitialMapWidthPercent);
  const [isUpperPanelCollapsed, setIsUpperPanelCollapsed] = useState<boolean>(getInitialUpperPanelCollapsed);
  const [isCommandPanelCollapsed, setIsCommandPanelCollapsed] = useState<boolean>(getInitialCommandPanelCollapsed);

  const stateMeta = SIMULATION_STATES[currentStep];

  const handleTimelineHeightChange = (newHeight: number) => {
    setTimelineHeight(newHeight);
    try {
      localStorage.setItem('aegis.timelineHeight', newHeight.toString());
    } catch {
      // Ignore localStorage write errors
    }
  };

  const handleMapWidthChange = (newWidth: number) => {
    setMapWidthPercent(newWidth);
    try {
      localStorage.setItem('aegis.mapWidthPercent', newWidth.toString());
    } catch {
      // Ignore localStorage write errors
    }
  };

  const toggleUpperPanel = () => {
    setIsUpperPanelCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aegis.upperPanel.collapsed', String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  const toggleCommandPanel = () => {
    setIsCommandPanelCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aegis.commandPanel.collapsed', String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  // Keyboard shortcut: Ctrl + Shift + B toggles the upper dashboard panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        toggleUpperPanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamically compute KPIs matching simulation state
  const dynamicKPIs: KPIData[] = mockKPIs.map((kpi) => {
    if (kpi.id === 'pending') {
      const isPending = currentStep === 4 || currentStep === 9;
      return {
        ...kpi,
        value: isPending ? 1 : 0,
        status: isPending ? 'warning' : 'safe',
        subtext: isPending ? 'Statutory Review Required' : 'Promulgated / Authorized',
      };
    }
    if (kpi.id === 'high-risk') {
      return {
        ...kpi,
        value: currentStep >= 2 ? 12 : 8,
        status: currentStep >= 2 ? 'critical' : 'warning',
      };
    }
    return kpi;
  });

  // Dynamically update Insights matching simulation state
  const dynamicInsights = mockInsights.map((insight) => {
    if (insight.id === 'ins-3') {
      const isBlocked = currentStep >= 6;
      return {
        ...insight,
        title: isBlocked ? 'CRITICAL: Route R104 BLOCKED (Bridge KM 4.2)' : insight.title,
        priority: isBlocked ? 'critical' : insight.priority,
        whatHappened: isBlocked
          ? 'Culvert failure at KM 4.2 reported by Field Squad at 14:20 IST. Road impassable for motor vehicles.'
          : insight.whatHappened,
        whyItMatters: isBlocked
          ? '150 evacuees assigned to Meppadi HSS severed. Reassignment to Kalpetta Hall required.'
          : insight.whyItMatters,
        freshness: isBlocked ? 'Verified 4 min ago (On-Scene)' : insight.freshness,
      };
    }
    return insight;
  });

  const handleStepChange = (newStep: SimulationStepId) => {
    setCurrentStep(newStep);
    if (newStep <= 5) {
      setActivePlan(
        newStep === 5
          ? { ...planV1SimulationData, status: 'approved', approvedBy: 'District Collector & Chairperson, DDMA Wayanad' }
          : planV1SimulationData
      );
    } else if (newStep >= 9) {
      setActivePlan(
        newStep === 10
          ? { ...planV2SimulationData, status: 'approved', approvedBy: 'District Collector & Chairperson, DDMA Wayanad' }
          : planV2SimulationData
      );
    } else {
      setActivePlan({
        ...planV1SimulationData,
        status: 'invalidated',
        affectedAssignmentsCount: 150,
      });
    }
  };

  const handleReset = () => {
    handleStepChange(1);
    setActiveTab('decision');
  };

  const handleApprovePlan = (approvedPlan: RelocationPlan) => {
    setActivePlan(approvedPlan);
    if (currentStep === 4) {
      handleStepChange(5);
    } else if (currentStep === 9) {
      handleStepChange(10);
    }
  };

  const handleModifyPlan = () => {
    alert('Plan modification requested. Re-adjusting shelter capacity weights.');
  };

  const handleRejectPlan = () => {
    setActivePlan({
      ...activePlan,
      status: 'rejected',
    });
  };

  const handleAdvanceFromPanel = () => {
    if (currentStep < 10) {
      handleStepChange((currentStep + 1) as SimulationStepId);
    }
  };

  const activeDecisionContext = currentStep >= 9 ? mockDecisionContextV2 : mockDecisionContextV1;

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* ============================================================ */}
      {/* 1. UPPER DASHBOARD CONTROL AREA (EXPANDED STATE)             */}
      {/* ============================================================ */}
      {!isUpperPanelCollapsed && (
        <div className="flex flex-col shrink-0">
          {/* 1A. Top KPI Summary Strip */}
          <KPIStrip kpis={dynamicKPIs} />

          {/* 1B. Resizable Simulation Timeline Region */}
          <div
            style={{ height: `${timelineHeight}px` }}
            className="shrink-0 overflow-y-auto bg-white transition-[height] duration-75 ease-out"
          >
            <SimulationController
              currentStep={currentStep}
              onStepChange={handleStepChange}
              onReset={handleReset}
            />
          </div>

          {/* 1C. Resizer #1: Horizontal Splitter with Centered Collapse Handle */}
          <div className="relative">
            <ResizableSplitter
              orientation="horizontal"
              value={timelineHeight}
              min={60}
              max={180}
              onChange={handleTimelineHeightChange}
              ariaLabel="Resize simulation timeline"
            />
            {/* Centered Collapse Handle */}
            <div className="absolute inset-x-0 -top-3 flex items-center justify-center pointer-events-none z-20">
              <button
                type="button"
                onClick={toggleUpperPanel}
                className="pointer-events-auto px-3 py-0.5 rounded-full bg-white border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs flex items-center gap-1.5 transition-all"
                title="Collapse Dashboard Controls (Ctrl+Shift+B)"
              >
                <span className="text-blue-900 text-[9px]">▲</span>
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-700">
                  Collapse Controls
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1D. EXPAND HANDLE BAR (COLLAPSED STATE)                      */}
      {/* ============================================================ */}
      {isUpperPanelCollapsed && (
        <div className="bg-slate-200/95 border-b border-slate-300 py-1 px-3 flex items-center justify-between shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-code font-black uppercase text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300 tracking-wider">
              STATE {currentStep}/10 ({stateMeta.code})
            </span>
            <span className="text-[10px] font-bold text-slate-700 truncate max-w-xs md:max-w-md">
              ⏱ {stateMeta.simulatedTime} · {stateMeta.title}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleUpperPanel}
            className="px-3.5 py-0.5 rounded-full bg-white border border-slate-300 text-[10px] font-bold text-slate-800 hover:bg-slate-100 hover:text-slate-900 shadow-xs flex items-center gap-1.5 transition-all"
            title="Expand Dashboard Controls (Ctrl+Shift+B)"
          >
            <span className="text-blue-900 text-[9px]">▼</span>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-800">
              Expand Dashboard Controls
            </span>
          </button>

          <div className="text-[9.5px] text-slate-500 font-mono-code hidden sm:block">
            Ctrl+Shift+B
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MAIN EXECUTIVE DECISION & GIS WORKSPACE                   */}
      {/* ============================================================ */}
      <div className="flex-1 p-2 flex flex-row overflow-hidden min-h-0 gap-0">
        {/* 2A. Left: GIS Spatial Evidence Canvas */}
        <div
          style={{
            width: isCommandPanelCollapsed ? 'calc(100% - 32px)' : `${mapWidthPercent}%`,
          }}
          className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden flex flex-col shrink-0 transition-[width] duration-100 ease-out"
        >
          <GISMap
            routeR104Status={stateMeta.routeR104Status}
            activeVectorType={stateMeta.activeVectorType}
          />
        </div>

        {/* 2B. Resizer #2: Vertical Splitter (Only visible when Command Panel is OPEN) */}
        {!isCommandPanelCollapsed && (
          <ResizableSplitter
            orientation="vertical"
            value={mapWidthPercent}
            min={45}
            max={65}
            onChange={handleMapWidthChange}
            ariaLabel="Resize map and decision panel"
          />
        )}

        {/* 2C. Right: Primary Command Center (OPEN State) */}
        {!isCommandPanelCollapsed && (
          <div
            style={{ width: `calc(${100 - mapWidthPercent}% - 10px)` }}
            className="flex flex-col gap-2 overflow-y-auto pl-1.5 pr-0.5 shrink-0 min-w-[320px]"
          >
            {/* Header with Segmented Togglebar and Collapse Handle */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Segmented Togglebar */}
              <div className="bg-white border border-slate-300 rounded shadow-xs p-1 flex items-center gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('decision')}
                  className={`flex-1 py-1.5 px-3 text-xs font-black uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'decision'
                      ? 'bg-blue-100/90 text-navy-950 border border-blue-600 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="text-blue-900">⚖</span>
                  <span className={activeTab === 'decision' ? 'text-navy-950' : 'text-slate-700'}>DECISION</span>
                  {currentStep === 4 || currentStep === 9 ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-1 ring-amber-600"></span>
                  ) : currentStep === 5 || currentStep === 10 ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 ring-1 ring-emerald-700"></span>
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('situation')}
                  className={`flex-1 py-1.5 px-3 text-xs font-black uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'situation'
                      ? currentStep >= 6 && currentStep <= 7
                        ? 'bg-red-100 text-red-950 border border-red-600 ring-1 ring-red-500 shadow-xs'
                        : 'bg-blue-100/90 text-navy-950 border border-blue-600 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={currentStep >= 6 && currentStep <= 7 ? 'text-red-700' : 'text-amber-700'}>⚡</span>
                  <span className={activeTab === 'situation' ? (currentStep >= 6 && currentStep <= 7 ? 'text-red-950' : 'text-navy-950') : 'text-slate-700'}>SITUATION</span>
                  {currentStep >= 6 && currentStep <= 7 ? (
                    <span className="text-[9px] font-extrabold px-1 rounded bg-red-700 text-white">1 CRIT</span>
                  ) : (
                    <span className={`text-[9px] font-bold px-1 rounded ${activeTab === 'situation' ? 'bg-blue-200 text-blue-950 font-black' : 'bg-slate-200 text-slate-700'}`}>
                      3
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('evidence')}
                  className={`flex-1 py-1.5 px-3 text-xs font-black uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'evidence'
                      ? 'bg-blue-100/90 text-navy-950 border border-blue-600 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="text-indigo-900">📊</span>
                  <span className={activeTab === 'evidence' ? 'text-navy-950' : 'text-slate-700'}>EVIDENCE</span>
                  <span className={`text-[9px] font-bold px-1 rounded ${activeTab === 'evidence' ? 'bg-blue-200 text-blue-950 font-black' : 'bg-slate-200 text-slate-700'}`}>
                    18/20
                  </span>
                </button>
              </div>

              {/* Collapse Right Command Panel Button */}
              <button
                type="button"
                onClick={toggleCommandPanel}
                className="p-2 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold shadow-xs shrink-0 flex items-center justify-center"
                title="Collapse Command Center Panel"
              >
                ▶
              </button>
            </div>

            {/* TAB 1: DECISION */}
            {activeTab === 'decision' && (
              <div className="flex flex-col gap-2">
                <RelocationPanel
                  currentStep={currentStep}
                  plan={activePlan}
                  onApprovePlan={handleApprovePlan}
                  onModifyPlan={handleModifyPlan}
                  onRejectPlan={handleRejectPlan}
                  onAdvanceSimulation={handleAdvanceFromPanel}
                />
              </div>
            )}

            {/* TAB 2: SITUATION */}
            {activeTab === 'situation' && (
              <div className="flex flex-col gap-2.5">
                <div className="bg-white border border-slate-300 rounded p-3 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                      Active Situation Posture
                    </span>
                    <span className="text-[10px] font-mono-code font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {stateMeta.simulatedTime}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 leading-snug">
                    {stateMeta.operationalDetail}
                  </div>
                  <div className="text-[10px] text-slate-600 flex items-center gap-3 pt-1 border-t border-slate-100">
                    <span>Critical Incidents: <strong className={currentStep >= 6 ? 'text-red-700' : 'text-slate-800'}>{currentStep >= 6 ? '1' : '0'}</strong></span>
                    <span>High Alerts: <strong>2</strong></span>
                    <span>Vulnerable Habitations: <strong>12</strong></span>
                  </div>
                </div>
                <InsightsPanel insights={dynamicInsights} />
              </div>
            )}

            {/* TAB 3: EVIDENCE */}
            {activeTab === 'evidence' && (
              <div className="flex flex-col gap-2.5">
                <div className="bg-white border border-slate-300 rounded p-3 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-600">
                      Active Decision Context Telemetry
                    </span>
                    <span className="text-[9.5px] font-mono-code font-bold text-slate-500">
                      Plan V{activeDecisionContext.planVersion} Evidence Base
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {activeDecisionContext.evidence.map((ev) => (
                      <div key={ev.id} className="p-2 bg-slate-50 border border-slate-200 rounded space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <strong className="text-slate-900">{ev.sourceAgency}</strong>
                          <span className="font-mono-code">{ev.timestamp}</span>
                        </div>
                        <div className="text-[11.5px] text-slate-800 leading-snug font-medium">
                          {ev.observation}
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-mono-code flex items-center justify-between pt-0.5">
                          <span>Confidence: <strong className="uppercase text-slate-800">{ev.confidence}</strong></span>
                          <span className="text-emerald-800 font-bold">{ev.classification}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded p-3 shadow-xs space-y-1.5 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400">
                        IMMUTABLE AUDIT TRAIL
                      </span>
                    </div>
                    <span className="text-[9px] font-mono-code font-bold bg-navy-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                      SHA-256 LINKED
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    ✓ Chain Verified · 10 Canonical Events · Genesis → Tip Hash Match
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800 font-mono-code">
                    <span>Last Event: S{currentStep} ({stateMeta.code})</span>
                    <Link
                      to="/system/audit-log"
                      className="text-blue-300 font-bold hover:text-white underline text-[10.5px]"
                    >
                      VIEW AUDIT TRAIL ▶
                    </Link>
                  </div>
                </div>

                <DataFreshness sources={mockDataSources} />
              </div>
            )}
          </div>
        )}

        {/* 2D. Right: Expand Handle Strip (COLLAPSED State) */}
        {isCommandPanelCollapsed && (
          <div className="w-8 shrink-0 bg-white border-l border-slate-300 flex flex-col items-center py-2 gap-3 shadow-xs z-10">
            <button
              type="button"
              onClick={toggleCommandPanel}
              className="p-1.5 rounded bg-blue-100 border border-blue-600 text-navy-950 hover:bg-blue-200 text-xs font-black shadow-xs flex items-center justify-center"
              title="Expand Command Center Panel"
            >
              ◀
            </button>
            <div className="rotate-90 origin-center whitespace-nowrap text-[9.5px] font-mono-code font-black uppercase text-slate-700 tracking-wider mt-16">
              COMMAND CENTER
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
