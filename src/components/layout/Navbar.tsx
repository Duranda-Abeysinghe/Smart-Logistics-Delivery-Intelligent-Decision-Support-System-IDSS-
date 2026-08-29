import React from 'react';
import { ActiveModule } from '../../types';
import { 
  Compass, 
  Truck, 
  Share2, 
  BrainCircuit, 
  TrendingUp, 
  BarChart3, 
  LayoutDashboard,
  Layers
} from 'lucide-react';

interface NavbarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  datasetSize: 'default' | 'medium' | 'large';
  onChangeDatasetSize: (size: 'default' | 'medium' | 'large') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  datasetSize,
  onChangeDatasetSize
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveModule, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'route' as ActiveModule, label: 'Route Optimizer', icon: Compass },
    { id: 'allocation' as ActiveModule, label: 'Fleet Allocation', icon: Truck },
    { id: 'network' as ActiveModule, label: 'Network Analytics', icon: Share2 },
    { id: 'decision' as ActiveModule, label: 'Decision & Priority', icon: BrainCircuit },
    { id: 'optimization' as ActiveModule, label: 'Schedule Planner', icon: TrendingUp },
    { id: 'evaluation' as ActiveModule, label: 'Performance Analytics', icon: BarChart3 },
  ];

  return (
    <header id="app-navbar" className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">SmartLogistics IDSS</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Intelligent Decision Support System • ASP.NET Core API & MySQL Architecture
              </p>
            </div>
          </div>

          {/* Dataset Switcher */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 px-2 font-medium">Logistics Network:</span>
            {(['default', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                id={`btn-dataset-${size}`}
                onClick={() => onChangeDatasetSize(size)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                  datasetSize === size
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {size === 'default' ? 'Small (12 Hubs)' : size === 'medium' ? 'Medium (50 Hubs)' : 'Large (150 Hubs)'}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectModule(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
