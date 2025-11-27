import React, { useState } from 'react';
import { Member, Fleet, MemberRole, DeliveryStop } from './types';
import MemberManager from './components/MemberManager';
import FleetManager from './components/FleetManager';
import LiveAssistant from './components/LiveAssistant';
import RouteSummary from './components/RouteSummary';
import { LayoutDashboard, Package, Sparkles, Map, FileText, Users, Truck } from 'lucide-react';

// Initial Mock Data
const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'Jose de Arimateia', role: MemberRole.MOTORISTA },
  { id: '2', name: 'Elison Souza', role: MemberRole.AUXILIAR_DISTRIBUICAO },
  { id: '3', name: 'José Avelino', role: MemberRole.MOTORISTA_GRANEL },
  { id: '4', name: 'José Estancely', role: MemberRole.OPERADOR_GRANEL },
  { id: '5', name: 'Carlos Santos', role: MemberRole.MOTORISTA_I },
  { id: '6', name: 'Maria Oliveira', role: MemberRole.AUXILIAR_DISTRIBUICAO },
];

const INITIAL_FLEETS: Fleet[] = [
  { 
    id: 'f1', 
    number: 'Frota - 113', 
    driverId: '1', 
    helperId: '2',
    routeDetails: 'Zona Sul - Rota prioritária',
    stops: [
      { id: 's1', clientCode: '0451', clientName: 'Supermercado Silva', zipCode: '01310-100' },
      { id: 's2', clientCode: '8821', clientName: 'Padaria Estrela', zipCode: '01311-200' }
    ]
  },
  { 
    id: 'f2', 
    number: 'Frota - 173', 
    driverId: '3', 
    operatorId: '4',
    routeDetails: 'Carga Granel',
    stops: []
  }
];

const INITIAL_UNASSIGNED: DeliveryStop[] = [
    { id: 'u1', clientCode: '9901', clientName: 'Mercado do João', zipCode: '04550-000' },
    { id: 'u2', clientCode: '9902', clientName: 'Empório Central', zipCode: '04551-000' }
];

type ViewMode = 'team' | 'routing' | 'reports';

export default function App() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [fleets, setFleets] = useState<Fleet[]>(INITIAL_FLEETS);
  const [unassignedStops, setUnassignedStops] = useState<DeliveryStop[]>(INITIAL_UNASSIGNED);
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('routing');

  // Handlers
  const handleAddMember = (member: Member) => {
    setMembers(prev => [...prev, member]);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    // Also remove from any fleet assignments
    setFleets(prev => prev.map(f => ({
      ...f,
      driverId: f.driverId === id ? undefined : f.driverId,
      helperId: f.helperId === id ? undefined : f.helperId,
      operatorId: f.operatorId === id ? undefined : f.operatorId,
    })));
  };

  const handleAddFleet = (fleet: Fleet) => {
    setFleets(prev => [...prev, fleet]);
  };

  const handleUpdateFleet = (updatedFleet: Fleet) => {
    setFleets(prev => prev.map(f => f.id === updatedFleet.id ? updatedFleet : f));
  };

  const handleRemoveFleet = (id: string) => {
    setFleets(prev => prev.filter(f => f.id !== id));
    // Any stops in the deleted fleet should probably go back to unassigned?
    // For now, let's just assume they are deleted or we move them manually first.
    // Ideally:
    const fleetToRemove = fleets.find(f => f.id === id);
    if (fleetToRemove && fleetToRemove.stops) {
        setUnassignedStops(prev => [...prev, ...fleetToRemove.stops!]);
    }
  };

  const handleImportUnassigned = (stops: DeliveryStop[]) => {
    setUnassignedStops(prev => [...prev, ...stops]);
  };

  const handleMoveStop = (stopId: string, sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    let stopToMove: DeliveryStop | undefined;

    // 1. Find and Remove from Source
    if (sourceId === 'unassigned') {
        stopToMove = unassignedStops.find(s => s.id === stopId);
        if (!stopToMove) return;
        setUnassignedStops(prev => prev.filter(s => s.id !== stopId));
    } else {
        // Source is a fleet
        const sourceFleet = fleets.find(f => f.id === sourceId);
        if (!sourceFleet || !sourceFleet.stops) return;
        stopToMove = sourceFleet.stops.find(s => s.id === stopId);
        if (!stopToMove) return;

        setFleets(prev => prev.map(f => {
            if (f.id === sourceId) {
                return { ...f, stops: f.stops?.filter(s => s.id !== stopId) || [] };
            }
            return f;
        }));
    }

    // 2. Add to Target
    if (targetId === 'unassigned') {
        setUnassignedStops(prev => [...prev, stopToMove!]);
    } else {
        setFleets(prev => prev.map(f => {
            if (f.id === targetId) {
                return { ...f, stops: [...(f.stops || []), stopToMove!] };
            }
            return f;
        }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
                <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30">
                    <Package size={24} />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 hidden sm:block">
                    Gestão de Entregas
                </h1>
            </div>

            {/* View Switcher */}
            <nav className="flex items-center p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-[600px]">
                <button 
                    onClick={() => setCurrentView('team')}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${currentView === 'team' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={16} />
                    Equipes
                </button>
                <button 
                    onClick={() => setCurrentView('routing')}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${currentView === 'routing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Map size={16} />
                    Roteirização
                </button>
                <button 
                    onClick={() => setCurrentView('reports')}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${currentView === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileText size={16} />
                    Relatórios
                </button>
            </nav>
            
            <button 
                onClick={() => setIsLiveAssistantOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-full hover:shadow-lg transition-all active:scale-95 group shrink-0"
            >
                <Sparkles size={16} className="group-hover:animate-pulse" />
                <span className="font-medium text-sm hidden md:inline">Assistente IA</span>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 print:max-w-none print:w-full print:p-0">
        
        {currentView === 'team' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Equipes</h2>
                    <p className="text-slate-500">Cadastre motoristas, auxiliares e operadores para as frotas.</p>
                </div>
                <MemberManager 
                    members={members} 
                    onAddMember={handleAddMember} 
                    onRemoveMember={handleRemoveMember}
                />
            </div>
        )}

        {currentView === 'routing' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Header Summary for Routing */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                         <div>
                            <p className="text-sm font-medium text-slate-500">Frotas Ativas</p>
                            <h3 className="text-2xl font-bold text-slate-800">{fleets.length}</h3>
                         </div>
                         <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                            <Truck size={24} />
                         </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                         <div>
                            <p className="text-sm font-medium text-slate-500">Entregas Pendentes</p>
                            <h3 className="text-2xl font-bold text-orange-600">{unassignedStops.length}</h3>
                         </div>
                         <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
                            <Package size={24} />
                         </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                         <div>
                            <p className="text-sm font-medium text-slate-500">Equipe Total</p>
                            <h3 className="text-2xl font-bold text-slate-800">{members.length}</h3>
                         </div>
                         <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full">
                            <Users size={24} />
                         </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Painel de Roteirização</h2>
                    <p className="text-slate-500">Gerencie frotas e distribua as entregas pendentes.</p>
                </div>
                
                <FleetManager 
                    fleets={fleets}
                    members={members}
                    unassignedStops={unassignedStops}
                    onAddFleet={handleAddFleet}
                    onUpdateFleet={handleUpdateFleet}
                    onRemoveFleet={handleRemoveFleet}
                    onAddMember={handleAddMember}
                    onMoveStop={handleMoveStop}
                    onImportStops={handleImportUnassigned}
                />
            </div>
        )}

        {currentView === 'reports' && (
            <RouteSummary fleets={fleets} members={members} />
        )}

      </main>

      {/* Voice Assistant Modal */}
      {isLiveAssistantOpen && (
          <LiveAssistant onClose={() => setIsLiveAssistantOpen(false)} />
      )}
    </div>
  );
}