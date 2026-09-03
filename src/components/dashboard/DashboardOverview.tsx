import React from 'react';
import { ActiveModule, LogisticsNode, Vehicle, Driver, DeliveryOrder } from '../../types';
import { 
  Compass, 
  Truck, 
  Share2, 
  BrainCircuit, 
  TrendingUp, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Activity,
  Layers,
  Database,
  ShieldCheck,
  Sparkles,
  TrendingDown
} from 'lucide-react';

interface DashboardOverviewProps {
  onSelectModule: (module: ActiveModule) => void;
  nodes: LogisticsNode[];
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: DeliveryOrder[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectModule,
  nodes,
  vehicles,
  drivers,
  orders
}) => {
  const warehouses = nodes.filter(n => n.type === 'warehouse' || n.type === 'port');
  const hubs = nodes.filter(n => n.type === 'retail_hub' || n.type === 'distribution_center');
  const availableFleet = vehicles.filter(v => v.status === 'available');
  const activeDrivers = drivers.filter(d => d.status === 'available');
  const totalValue = orders.reduce((sum, o) => sum + o.itemValue, 0);

  const modules = [
    {
      id: 'route' as ActiveModule,
      title: 'Dynamic Route Optimization',
      capabilities: ['Express Direct Routing', 'Cost-Optimal Dispatch', 'Congestion Avoidance', 'Multi-Leg Transit'],
      engineTypes: ['High-Performance Dispatch Engine', 'Multi-Criteria Cost Evaluation'],
      desc: 'Calculates optimal point-to-point delivery corridors across distribution hubs, minimizing transit delays, fuel burn, and road tolls.',
      icon: Compass,
      color: 'from-blue-600 to-cyan-600',
      badge: 'Routing Engine'
    },
    {
      id: 'allocation' as ActiveModule,
      title: 'Fleet Resource Allocation',
      capabilities: ['Maximum Cargo Value Packing', 'Driver Shift Pairing', 'Multi-Capacity Balancing'],
      engineTypes: ['Combinatorial Capacity Solver', 'Dynamic Load Distribution'],
      desc: 'Optimizes vehicle payload loading and certified driver dispatching to maximize delivered cargo revenue within strict weight limits.',
      icon: Truck,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Fleet Optimizer'
    },
    {
      id: 'network' as ActiveModule,
      title: 'Network Topology & Resilience',
      capabilities: ['Bottleneck Hub Detection', 'Critical Transit Links', 'Supply Chain Vulnerability'],
      engineTypes: ['Structural Graph Analytics', 'Connectivity Resilience Scanner'],
      desc: 'Analyzes transportation infrastructure connectivity, identifying critical hub bottlenecks and single points of failure.',
      icon: Share2,
      color: 'from-purple-600 to-indigo-600',
      badge: 'Network Intelligence'
    },
    {
      id: 'decision' as ActiveModule,
      title: 'Order Triage & Decision Engine',
      capabilities: ['Customer SLA Prioritization', 'Automated Urgency Classification', 'Explainable Safety Rules'],
      engineTypes: ['Multi-Criteria Decision System', 'Intelligent Priority Classifier'],
      desc: 'Automates consignment prioritization based on deadline urgency, customer tier, cargo value, and transport compliance.',
      icon: BrainCircuit,
      color: 'from-amber-600 to-orange-600',
      badge: 'Decision Engine'
    },
    {
      id: 'optimization' as ActiveModule,
      title: 'Multi-Stop Tour & Route Planner',
      capabilities: ['Dynamic Multi-Stop Scheduling', 'Metropolis Re-Sequencing', 'Fleet Route Convergence'],
      engineTypes: ['Multi-Destination Scheduler', 'Adaptive Route Balancer'],
      desc: 'Solves complex multi-destination vehicle routing schedules, eliminating redundant mileage and balancing delivery windows.',
      icon: TrendingUp,
      color: 'from-rose-600 to-pink-600',
      badge: 'Tour Scheduler'
    },
    {
      id: 'evaluation' as ActiveModule,
      title: 'Performance & Operations Analytics',
      capabilities: ['Sub-Millisecond Execution', 'Scalability Stress Testing', 'SLA Throughput Benchmarks'],
      engineTypes: ['Scalability Monitoring', 'Enterprise Performance Metrics'],
      desc: 'Real-time performance telemetry, sub-millisecond execution verification, and throughput scaling analysis across logistics network sizes.',
      icon: BarChart3,
      color: 'from-slate-700 to-slate-900',
      badge: 'Operations Analytics'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5" /> Enterprise Operations Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Smart Logistics & Delivery Intelligent Decision Support System
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            An enterprise decision support platform engineered to automate multi-hub dispatch routing, vehicle payload balancing, supply chain network resilience, and multi-stop delivery scheduling in real time.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" /> Active Network Hubs
            </div>
            <div className="text-xl font-bold text-white mt-1">{nodes.length} Locations</div>
            <div className="text-[11px] text-slate-400">{warehouses.length} Warehouses, {hubs.length} Hubs</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" /> Ready Fleet
            </div>
            <div className="text-xl font-bold text-white mt-1">{availableFleet.length} Vehicles</div>
            <div className="text-[11px] text-emerald-400">{activeDrivers.length} Certified Drivers</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Active Consignments
            </div>
            <div className="text-xl font-bold text-white mt-1">{orders.length} Orders</div>
            <div className="text-[11px] text-slate-400">Rs. {(totalValue / 1000).toFixed(1)}k Total Cargo Value</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Operational Status
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">100% Online</div>
            <div className="text-[11px] text-slate-400">All Decision Engines Active</div>
          </div>
        </div>
      </div>

      {/* Core Decision Support Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Integrated Decision Support Modules</h2>
            <p className="text-xs text-slate-500">Select a specialized engine below to inspect real-time logistics optimization and dispatch recommendations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                id={`card-module-${mod.id}`}
                onClick={() => onSelectModule(mod.id)}
                className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {mod.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-700">Capabilities: </span>
                      <span className="text-slate-600">{mod.capabilities.join(' • ')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Launch Operations Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enterprise Operational Value Grid */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Operational Value & Fleet Efficiency Metrics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
              Cost & Transit Time Minimization
            </div>
            <p className="text-slate-600 leading-relaxed">
              Automated multi-factor corridor analysis avoids severe congestion, reducing transit delays and eliminating deadhead mileage across distribution corridors.
            </p>
            <div className="text-[11px] text-blue-700 font-medium pt-1">
              Impact: ~18-24% reduction in fleet fuel and toll expenditure
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">2</span>
              Optimal Cargo & Vehicle Packing
            </div>
            <p className="text-slate-600 leading-relaxed">
              Automated payload optimization balances consignment value against multi-dimensional weight and volume limits, maximizing delivered revenue per vehicle.
            </p>
            <div className="text-[11px] text-emerald-700 font-medium pt-1">
              Impact: ~92% average fleet payload capacity utilization
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">3</span>
              Supply Chain Network Resilience
            </div>
            <p className="text-slate-600 leading-relaxed">
              Automated topological scanning identifies single-point-of-failure bridge routes and heavy transit hub bottlenecks before service disruptions occur.
            </p>
            <div className="text-[11px] text-purple-700 font-medium pt-1">
              Impact: Proactive rerouting around critical transit bottlenecks
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
