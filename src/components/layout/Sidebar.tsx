import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  isChild?: boolean;
}

function SidebarNavItem({ to, label, badge, badgeColor, isChild = false }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-4 py-1.5 text-[12.5px] font-medium transition-colors border-l-2 ${
          isChild ? 'pl-7 py-1 text-[12px]' : ''
        } ${
          isActive
            ? 'bg-blue-50/80 text-blue-900 border-blue-800 font-semibold'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-transparent'
        }`
      }
    >
      <span className="truncate">{label}</span>
      {badge && (
        <span
          className={`text-[9.5px] font-mono-code font-bold px-1.5 py-0.2 rounded ${
            badgeColor || 'bg-slate-200 text-slate-700'
          }`}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <nav className="aegis-sidebar">
      {/* Overview */}
      <div className="mb-2">
        <SidebarNavItem to="/" label="◎ SDMA Overview" />
      </div>

      {/* Planning Section */}
      <div className="mb-2.5">
        <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Planning
        </div>
        <SidebarNavItem to="/planning/hazards" label="Hazards" isChild badge="12" />
        <SidebarNavItem to="/planning/vulnerability" label="Vulnerability" isChild />
        <SidebarNavItem to="/planning/shelters" label="Shelters" isChild badge="1,760" />
        <SidebarNavItem to="/planning/routes" label="Routes" isChild badge="R104" badgeColor="bg-red-100 text-red-800" />
        <SidebarNavItem to="/planning/relocation" label="Relocation" isChild badge="V1/V2" badgeColor="bg-blue-100 text-blue-900" />
      </div>

      {/* Analysis Section */}
      <div className="mb-2.5">
        <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Analysis
        </div>
        <SidebarNavItem to="/analysis/simulation" label="Scenario Simulation" isChild />
        <SidebarNavItem to="/analysis/compare" label="Compare Plans" isChild />
      </div>

      {/* Operations Section */}
      <div className="mb-2.5">
        <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Operations
        </div>
        <SidebarNavItem to="/operations/incidents" label="Active Incidents" isChild badge="1" badgeColor="bg-red-700 text-white font-extrabold" />
        <SidebarNavItem to="/operations/resources" label="Resources" isChild />
      </div>

      {/* System Section */}
      <div className="mt-auto pt-2 border-t border-slate-200">
        <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          System
        </div>
        <SidebarNavItem to="/system/data-status" label="Data Status" isChild badge="18/20" />
        <SidebarNavItem to="/system/audit-log" label="Audit Trail" isChild badge="SHA-256" badgeColor="bg-navy-900 text-white" />
      </div>
    </nav>
  );
}
