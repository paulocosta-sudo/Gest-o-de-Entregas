import React, { useState } from 'react';
import { Fleet, Member, MemberRole, RoleType, getRolesByType, DeliveryStop } from '../types';
import { Truck, Plus, Trash2, XCircle, AlertCircle, UserPlus, Check, X, MapPin, Upload, FileSpreadsheet, Package, GripVertical, ArrowRight } from 'lucide-react';

interface FleetManagerProps {
  fleets: Fleet[];
  members: Member[];
  unassignedStops: DeliveryStop[];
  onAddFleet: (fleet: Fleet) => void;
  onUpdateFleet: (fleet: Fleet) => void;
  onRemoveFleet: (id: string) => void;
  onAddMember: (member: Member) => void;
  onMoveStop: (stopId: string, sourceId: string, targetId: string) => void;
  onImportStops: (stops: DeliveryStop[]) => void;
}

const getDefaultRole = (type: RoleType): MemberRole => {
  switch (type) {
    case RoleType.DRIVER: return MemberRole.MOTORISTA;
    case RoleType.HELPER: return MemberRole.AUXILIAR_DISTRIBUICAO;
    case RoleType.OPERATOR: return MemberRole.OPERADOR_GRANEL;
  }
};

// --- Helper for importing Text ---
const parseImportText = (text: string): DeliveryStop[] => {
    const lines = text.trim().split(/\r?\n/);
    return lines.map(line => {
        let parts = line.split('\t');
        if (parts.length < 2) parts = line.split(';');
        if (parts.length < 2) parts = line.split(',');

        return {
            id: crypto.randomUUID(),
            clientCode: parts[0]?.trim() || '',
            clientName: parts[1]?.trim() || '',
            zipCode: parts[2]?.trim() || ''
        };
    }).filter(stop => stop.clientCode || stop.clientName);
};

// --- Draggable Stop Item ---
const DraggableStopItem: React.FC<{
    stop: DeliveryStop;
    sourceId: string; // 'unassigned' or fleetId
    onDragStart: (e: React.DragEvent, stopId: string, sourceId: string) => void;
    fleets: Fleet[];
    onMoveTo: (targetId: string) => void;
    onRemove?: () => void;
}> = ({ stop, sourceId, onDragStart, fleets, onMoveTo, onRemove }) => {
    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, stop.id, sourceId)}
            className="group flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing mb-1.5"
        >
            <div className="flex items-center gap-2 overflow-hidden">
                <GripVertical size={14} className="text-slate-300 flex-shrink-0" />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 rounded">{stop.clientCode}</span>
                        <span className="text-xs font-semibold text-slate-800 truncate">{stop.clientName}</span>
                    </div>
                    {stop.zipCode && <div className="text-[10px] text-slate-400">{stop.zipCode}</div>}
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {/* Quick Assign Dropdown */}
                <div className="relative group/dropdown">
                    <button className="p-1 text-slate-400 hover:text-blue-600 rounded">
                        <ArrowRight size={14} />
                    </button>
                    <div className="absolute right-0 top-full z-10 hidden group-hover/dropdown:block bg-white border border-slate-200 shadow-xl rounded-lg w-40 py-1">
                        <div className="px-2 py-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                            Mover para...
                        </div>
                        {sourceId !== 'unassigned' && (
                             <button onClick={() => onMoveTo('unassigned')} className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 hover:text-orange-700 text-orange-600 font-medium">
                                Devolver p/ Pendentes
                            </button>
                        )}
                        {fleets.filter(f => f.id !== sourceId).map(f => (
                            <button 
                                key={f.id}
                                onClick={() => onMoveTo(f.id)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 truncate"
                            >
                                {f.number}
                            </button>
                        ))}
                    </div>
                </div>

                {onRemove && (
                    <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-500 rounded">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Delivery Backlog (Unassigned) Component ---
const DeliveryBacklog: React.FC<{
    stops: DeliveryStop[];
    fleets: Fleet[];
    onMoveStop: (stopId: string, sourceId: string, targetId: string) => void;
    onImport: (stops: DeliveryStop[]) => void;
}> = ({ stops, fleets, onMoveStop, onImport }) => {
    const [isImporting, setIsImporting] = useState(false);
    const [importText, setImportText] = useState('');

    const handleImport = () => {
        if (!importText) return;
        const newStops = parseImportText(importText);
        onImport(newStops);
        setImportText('');
        setIsImporting(false);
    };

    const handleDragStart = (e: React.DragEvent, stopId: string, sourceId: string) => {
        e.dataTransfer.setData('stopId', stopId);
        e.dataTransfer.setData('sourceId', sourceId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const stopId = e.dataTransfer.getData('stopId');
        const sourceId = e.dataTransfer.getData('sourceId');
        
        if (stopId && sourceId && sourceId !== 'unassigned') {
            onMoveStop(stopId, sourceId, 'unassigned');
        }
    };

    return (
        <div 
            className="bg-white rounded-xl shadow-sm border border-orange-200 mb-6 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-orange-800 flex items-center gap-2">
                        <Package className="text-orange-600" size={20} />
                        Central de Entregas
                    </h3>
                    <p className="text-xs text-orange-600 mt-1">
                        {stops.length} entregas aguardando roteirização
                    </p>
                </div>
                <button 
                    onClick={() => setIsImporting(!isImporting)}
                    className="flex items-center gap-2 bg-white text-orange-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm border border-orange-200 hover:bg-orange-100 transition-colors"
                >
                    <Upload size={14} />
                    Importar Excel
                </button>
            </div>

            {isImporting && (
                <div className="p-4 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-2">
                    <p className="text-xs text-slate-600 mb-2">Cole os dados (Código | Cliente | CEP):</p>
                    <textarea 
                        className="w-full h-24 p-2 text-xs border rounded-md font-mono focus:ring-2 focus:ring-orange-500 outline-none"
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder={`101\tMercado A\t00000-000\n102\tMercado B\t00000-000`}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsImporting(false)} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1">Cancelar</button>
                        <button onClick={handleImport} className="bg-orange-600 text-white text-xs px-3 py-1.5 rounded hover:bg-orange-700">Adicionar à Lista</button>
                    </div>
                </div>
            )}

            <div className="p-4 max-h-[300px] overflow-y-auto bg-slate-50/50">
                {stops.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                        Arraste entregas de uma frota para cá ou importe novos dados.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {stops.map(stop => (
                            <DraggableStopItem 
                                key={stop.id}
                                stop={stop}
                                sourceId="unassigned"
                                onDragStart={handleDragStart}
                                fleets={fleets}
                                onMoveTo={(targetId) => onMoveStop(stop.id, 'unassigned', targetId)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Updated Fleet Card ---
const FleetCard: React.FC<{
  fleet: Fleet;
  members: Member[];
  fleets: Fleet[];
  onUpdateFleet: (fleet: Fleet) => void;
  onRemoveFleet: (id: string) => void;
  onAddMember: (member: Member) => void;
  onMoveStop: (stopId: string, sourceId: string, targetId: string) => void;
}> = ({ fleet, members, fleets, onUpdateFleet, onRemoveFleet, onAddMember, onMoveStop }) => {
  
  const [addingMemberFor, setAddingMemberFor] = useState<{field: keyof Fleet, type: RoleType} | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>(MemberRole.MOTORISTA);
  const [isDragOver, setIsDragOver] = useState(false);

  // ... (Keep existing member adding logic unchanged)
  const startAddingMember = (field: keyof Fleet, type: RoleType) => {
    setAddingMemberFor({ field, type });
    setNewMemberName('');
    setNewMemberRole(getDefaultRole(type));
  };
  const cancelAddingMember = () => { setAddingMemberFor(null); setNewMemberName(''); };
  const confirmAddingMember = () => {
    if (!newMemberName.trim() || !addingMemberFor) return;
    const newMember: Member = { id: crypto.randomUUID(), name: newMemberName, role: newMemberRole };
    onAddMember(newMember);
    onUpdateFleet({ ...fleet, [addingMemberFor.field]: newMember.id });
    setAddingMemberFor(null);
  };
  const getMemberStatus = (member: Member, roleType: RoleType, currentFleetId: string, currentSlotValue?: string) => {
    if (member.id === currentSlotValue) return { available: true, label: '' };
    const assignedFleet = fleets.find(f => f.id !== currentFleetId && (f.driverId === member.id || f.helperId === member.id || f.operatorId === member.id));
    if (assignedFleet) return { available: false, label: `(Em ${assignedFleet.number})` };
    const currentFleet = fleets.find(f => f.id === currentFleetId);
    if (currentFleet) {
        if (currentFleet.driverId === member.id && roleType !== RoleType.DRIVER) return { available: false, label: '(Motorista desta frota)' };
        if (currentFleet.helperId === member.id && roleType !== RoleType.HELPER) return { available: false, label: '(Auxiliar desta frota)' };
        if (currentFleet.operatorId === member.id && roleType !== RoleType.OPERATOR) return { available: false, label: '(Operador desta frota)' };
    }
    return { available: true, label: '' };
  };

  const renderSlot = (label: string, roleType: RoleType, value: string | undefined, field: keyof Fleet) => {
    const isAdding = addingMemberFor?.field === field;
    const candidateMembers = members.filter(m => getRolesByType(roleType).includes(m.role));
    return (
      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-center">
          {label}
          {!isAdding && !value && (
             <button onClick={() => startAddingMember(field, roleType)} className="text-blue-600 hover:text-blue-800 text-[10px] bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"><Plus size={10} /> Novo</button>
          )}
        </label>
        {isAdding ? (
          <div className="flex flex-col gap-2 bg-slate-50 p-2 rounded-lg border border-blue-200 animate-in fade-in zoom-in-95 duration-200">
             <input type="text" autoFocus placeholder="Nome do integrante" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full p-2 text-sm border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none" onKeyDown={(e) => { if(e.key === 'Enter') confirmAddingMember(); if(e.key === 'Escape') cancelAddingMember(); }} />
             <div className="flex gap-2">
                <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value as MemberRole)} className="flex-1 text-xs p-1.5 border rounded bg-white"> {getRolesByType(roleType).map(r => ( <option key={r} value={r}>{r}</option> ))} </select>
                <button onClick={confirmAddingMember} className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700"><Check size={16} /></button>
                 <button onClick={cancelAddingMember} className="bg-slate-200 text-slate-600 p-1.5 rounded hover:bg-slate-300"><X size={16} /></button>
             </div>
          </div>
        ) : (
          <div className="flex gap-2">
             <div className="relative flex-1">
                <select className={`w-full p-2 rounded-lg border bg-slate-50 focus:bg-white transition-all text-sm appearance-none pr-8 ${value ? 'border-blue-200 bg-blue-50/30 font-medium text-slate-800' : 'border-slate-200 text-slate-500'} focus:ring-2 focus:ring-blue-500 focus:outline-none`} value={value || ''} onChange={(e) => onUpdateFleet({ ...fleet, [field]: e.target.value || undefined })}>
                    <option value="">Selecione...</option>
                    {candidateMembers.map(m => { const status = getMemberStatus(m, roleType, fleet.id, value); return ( <option key={m.id} value={m.id} disabled={!status.available} className={!status.available ? 'text-slate-400' : ''}> {m.name} {status.label} </option> ); })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
             </div>
             {!value && ( <button onClick={() => startAddingMember(field, roleType)} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all" title="Cadastrar novo integrante agora"><UserPlus size={18} /></button> )}
          </div>
        )}
      </div>
    );
  };

  // DnD Handlers for Fleet Card
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const stopId = e.dataTransfer.getData('stopId');
    const sourceId = e.dataTransfer.getData('sourceId');
    
    if (stopId && sourceId) {
        onMoveStop(stopId, sourceId, fleet.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, stopId: string, sourceId: string) => {
      e.dataTransfer.setData('stopId', stopId);
      e.dataTransfer.setData('sourceId', sourceId);
  }

  return (
    <div className="flex flex-col h-full">
        <div 
            className={`bg-white rounded-xl shadow-sm border p-5 relative group transition-all duration-200 flex flex-col h-full
                ${isDragOver ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50 scale-[1.02]' : 'border-slate-200 hover:shadow-md'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <button onClick={() => onRemoveFleet(fleet.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors" title="Remover frota"><XCircle size={20} /></button>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className={`w-2 h-6 rounded-full ${fleet.driverId ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                {fleet.number}
            </h3>

            <div className="space-y-1 mb-4">
                {renderSlot("Motorista", RoleType.DRIVER, fleet.driverId, 'driverId')}
                {renderSlot("Auxiliar de Distribuição", RoleType.HELPER, fleet.helperId, 'helperId')}
                {renderSlot("Operador Granel", RoleType.OPERATOR, fleet.operatorId, 'operatorId')}
            </div>

            <div className="pt-2 flex-grow">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <MapPin size={14} className="text-slate-400" /> Observações
                </label>
                <textarea className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[60px]" placeholder="Obs. sobre a rota..." value={fleet.routeDetails || ''} onChange={(e) => onUpdateFleet({ ...fleet, routeDetails: e.target.value })} />
            </div>

            {/* Delivery Stops List in Fleet */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-2"><Package size={14} className="text-blue-500" /> Roteiro ({fleet.stops?.length || 0})</span>
                </label>
                
                <div className="min-h-[60px] max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                    {(!fleet.stops || fleet.stops.length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-300 text-xs italic py-4 border border-dashed border-slate-100 rounded">
                            <span>Arraste entregas para cá</span>
                        </div>
                    ) : (
                        fleet.stops.map(stop => (
                            <DraggableStopItem 
                                key={stop.id}
                                stop={stop}
                                sourceId={fleet.id}
                                onDragStart={handleDragStart}
                                fleets={fleets}
                                onMoveTo={(targetId) => onMoveStop(stop.id, fleet.id, targetId)}
                                onRemove={() => onMoveStop(stop.id, fleet.id, 'unassigned')}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Main FleetManager Component ---
const FleetManager: React.FC<FleetManagerProps> = ({ fleets, members, unassignedStops, onAddFleet, onUpdateFleet, onRemoveFleet, onAddMember, onMoveStop, onImportStops }) => {
  const [newFleetNumber, setNewFleetNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddFleet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFleetNumber.trim()) return;
    const formattedNumber = newFleetNumber.toLowerCase().startsWith('frota') ? newFleetNumber : `Frota - ${newFleetNumber}`;
    if (fleets.some(f => f.number.toLowerCase() === formattedNumber.toLowerCase())) { setError('Já existe uma frota com este número.'); return; }
    onAddFleet({ id: crypto.randomUUID(), number: formattedNumber, routeDetails: '', stops: [] });
    setNewFleetNumber(''); setError(null);
  };

  const sortedFleets = [...fleets].sort((a, b) => {
    const numA = parseInt(a.number.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.number.replace(/\D/g, '')) || 0;
    return numB - numA;
  });

  return (
    <div className="space-y-6">
       
       {/* Delivery Backlog Area */}
       <DeliveryBacklog 
         stops={unassignedStops} 
         fleets={fleets}
         onMoveStop={onMoveStop}
         onImport={onImportStops}
       />

       <hr className="border-slate-200" />

       {/* Add Fleet Form */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-6">
        <form onSubmit={handleAddFleet} className="flex gap-3 items-center">
             <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600 flex items-center justify-center"><Truck size={24} /></div>
            <div className="flex-1">
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nova Rota / Frota</label>
                 <div className="flex gap-2">
                    <input type="text" placeholder="Ex: 113" value={newFleetNumber} onChange={(e) => { setError(null); setNewFleetNumber(e.target.value); }} className={`flex-1 rounded-lg border p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                    <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2 whitespace-nowrap shadow-sm active:transform active:scale-95 transition-all"><Plus size={18} /> Criar</button>
                 </div>
            </div>
        </form>
        {error && ( <div className="flex items-center gap-2 text-red-600 text-sm mt-2 ml-14 animate-in fade-in slide-in-from-top-1"><AlertCircle size={14} />{error}</div> )}
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sortedFleets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>Nenhuma frota cadastrada. Adicione uma frota acima para começar.</p>
            </div>
        ) : (
            sortedFleets.map(fleet => (
                <FleetCard 
                    key={fleet.id} 
                    fleet={fleet} 
                    members={members} 
                    fleets={fleets}
                    onUpdateFleet={onUpdateFleet}
                    onRemoveFleet={onRemoveFleet}
                    onAddMember={onAddMember}
                    onMoveStop={onMoveStop}
                />
            ))
        )}
      </div>
    </div>
  );
};

export default FleetManager;