import type { ActionableInsight } from '../../types';
import { RiskBadge, DataSemanticBadge } from '../common/Badge';

interface InsightCardProps {
  data: ActionableInsight;
  onAction?: (actionId: string) => void;
}

function InsightCard({ data, onAction }: InsightCardProps) {
  const handleClick = () => {
    if (onAction) {
      onAction(data.id);
    }
  };

  return (
    <div className={`p-2 rounded border bg-white flex flex-col justify-between ${
      data.priority === 'critical'
        ? 'border-l-4 border-l-red-700 border-red-200'
        : data.priority === 'high'
        ? 'border-l-4 border-l-orange-600 border-orange-200'
        : 'border-l-4 border-l-amber-600 border-amber-200'
    }`}>
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <RiskBadge level={data.priority} className="text-[8.5px] px-1.5 py-0.2">
            {data.priority.toUpperCase()}
          </RiskBadge>
          <span className="text-[9px] text-slate-500 font-mono-code">{data.freshness}</span>
        </div>

        <div className="text-[11.5px] font-extrabold text-slate-900 mb-0.5 leading-snug">
          {data.title}
        </div>
        
        <div className="text-[10.5px] text-slate-700 leading-snug space-y-0.5 mb-1.5">
          <div><strong className="text-slate-900 font-semibold">Incident:</strong> {data.whatHappened}</div>
          <div><strong className="text-slate-900 font-semibold">Operational Impact:</strong> {data.whyItMatters}</div>
        </div>
      </div>

      <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[9px] text-slate-500 font-mono-code truncate max-w-[170px]" title={data.source}>
          Src: {data.source}
        </span>
        <button
          type="button"
          onClick={handleClick}
          className="aegis-btn aegis-btn-secondary aegis-btn-sm text-[9px] px-2 py-0.5 font-bold"
        >
          {data.actionLabel}
        </button>
      </div>
    </div>
  );
}

interface InsightsPanelProps {
  insights: ActionableInsight[];
  onAction?: (actionId: string) => void;
}

export default function InsightsPanel({ insights, onAction }: InsightsPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded p-2.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <span>OPERATIONAL SITUATION ALERTS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
        </div>
        <DataSemanticBadge type="DERIVED_DATA" className="text-[7.5px] px-1 py-0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {insights.map((insight) => (
          <InsightCard key={insight.id} data={insight} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
