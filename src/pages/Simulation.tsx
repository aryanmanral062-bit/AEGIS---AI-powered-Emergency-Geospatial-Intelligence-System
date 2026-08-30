import { useState } from 'react';
import { DataSemanticBadge } from '../components/common/Badge';

export default function Simulation() {
  const [rainfall, setRainfall] = useState(20);
  const [roadBlocked, setRoadBlocked] = useState(true);
  const [populationChange, setPopulationChange] = useState(15);
  const [generated, setGenerated] = useState(false);

  const baseHighRisk = 12;
  const baseGap = 1240;
  const baseRoutes = 3;

  const additionalRisk = Math.round(rainfall / 8) + (roadBlocked ? 1 : 0);
  const additionalGap = Math.round(rainfall * 15) + (roadBlocked ? 120 : 0);
  const routeReduction = roadBlocked ? 1 : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-title-lg">Multi-Hazard Scenario Modeling</h1>
          <p className="text-body-regular text-slate-600">
            Model hypothetical scenario parameters to assess carrying capacity thresholds and route resilience.
          </p>
        </div>
        <DataSemanticBadge type="DEMO_DATA" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="bg-white border border-slate-300 rounded shadow-xs p-4 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Scenario Parameter Injections</h2>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-700 font-bold">
                <span>Rainfall Surge Factor</span>
                <span className="font-mono-code text-navy-900">+{rainfall}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={rainfall}
                onChange={(e) => { setRainfall(Number(e.target.value)); setGenerated(false); }}
                className="w-full accent-navy-900"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-700 font-bold">
                <span>Population Exposure Delta</span>
                <span className="font-mono-code text-navy-900">+{populationChange}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={populationChange}
                onChange={(e) => { setPopulationChange(Number(e.target.value)); setGenerated(false); }}
                className="w-full accent-navy-900"
              />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">Route R104 Infrastructure Status</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setRoadBlocked(true); setGenerated(false); }}
                  className={`py-1.5 rounded text-xs font-bold transition-colors ${
                    roadBlocked
                      ? 'bg-red-800 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  BLOCKED (KM 4.2)
                </button>
                <button
                  type="button"
                  onClick={() => { setRoadBlocked(false); setGenerated(false); }}
                  className={`py-1.5 rounded text-xs font-bold transition-colors ${
                    !roadBlocked
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  CLEAR
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGenerated(true)}
              className="w-full py-2 bg-navy-900 text-white font-extrabold rounded uppercase tracking-wider text-xs hover:bg-navy-800 shadow-xs"
            >
              RUN SCENARIO SIMULATION
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Projected System Impact</h2>
              {generated && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Simulated
                </span>
              )}
            </div>

            {!generated ? (
              <div className="flex items-center justify-center min-h-[160px] text-xs text-slate-500 italic text-center">
                Configure scenario parameter injections and click "Run Scenario Simulation" to evaluate impact.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Critical Habitations</span>
                  <div className="text-lg font-black text-slate-900">{baseHighRisk + additionalRisk}</div>
                  <div className="text-[10px] text-red-700 font-bold">+{additionalRisk} from baseline</div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Sector Capacity Gap</span>
                  <div className="text-lg font-black text-amber-950">{(baseGap + additionalGap).toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-amber-800 font-bold">+{additionalGap} beds deficit</div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Passable Routes</span>
                  <div className="text-lg font-black text-slate-900">{baseRoutes - routeReduction}</div>
                  <div className="text-[10px] text-slate-600">
                    {routeReduction > 0 ? 'R104 offline' : 'All clear'}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Advisory Urgency</span>
                  <div className="text-lg font-black text-red-800">
                    {rainfall > 30 || roadBlocked ? 'CRITICAL' : rainfall > 10 ? 'HIGH' : 'NORMAL'}
                  </div>
                  <div className="text-[10px] text-red-700 font-bold">Re-planning required</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
