import React from 'react';
import { Fleet, Member } from '../types';
import { Truck, MapPin, Users, Printer, PackageCheck, Calendar } from 'lucide-react';

interface RouteSummaryProps {
  fleets: Fleet[];
  members: Member[];
}

const RouteSummary: React.FC<RouteSummaryProps> = ({ fleets, members }) => {
  const getMemberName = (id?: string) => {
    if (!id) return null;
    return members.find(m => m.id === id)?.name || 'Não identificado';
  };

  const handlePrint = () => {
    // Small delay to ensure any pending renders are complete
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const activeFleets = fleets.filter(f => 
    f.driverId || f.helperId || f.operatorId || (f.stops && f.stops.length > 0)
  );

  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:animate-none">
      {/* Header / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:hidden">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <PackageCheck className="text-green-600" />
                Relatório de Rotas
            </h2>
            <p className="text-slate-500">Visão consolidada para expedição e motoristas.</p>
        </div>
        <button 
            onClick={handlePrint}
            title="Gera um PDF para impressão ou salvamento"
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors shadow-sm font-medium active:scale-95 transform"
        >
            <Printer size={18} />
            Gerar PDF / Imprimir
        </button>
      </div>

      {/* Printable Area Header */}
      <div className="hidden print:block mb-8 border-b border-black pb-4">
        <h1 className="text-2xl font-bold">Relatório Diário de Rotas - Gestão de Entregas</h1>
        <p className="text-sm text-gray-600 capitalize">{currentDate}</p>
      </div>

      {/* Grid of Routes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-8 print:block">
        {activeFleets.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-200 print:border-gray-300">
                <p className="text-slate-400 text-lg">Nenhuma rota ativa configurada.</p>
            </div>
        ) : (
            activeFleets.map((fleet) => (
                <div key={fleet.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid page-break-inside-avoid print:shadow-none print:border-gray-900 print:mb-6">
                    {/* Card Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between print:bg-gray-100 print:border-gray-900">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white p-2 rounded-lg print:bg-black print:text-white">
                                <Truck size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{fleet.number}</h3>
                                {fleet.routeDetails && (
                                    <p className="text-sm text-slate-500 flex items-center gap-1 print:text-black">
                                        <MapPin size={12} />
                                        {fleet.routeDetails}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Team Section */}
                        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 print:border-gray-300 print:bg-transparent">
                            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-1 print:text-black">
                                <Users size={14} /> Equipe
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <span className="text-[10px] uppercase text-slate-400 font-semibold block print:text-gray-500">Motorista</span>
                                    <span className="font-medium text-slate-800 block">
                                        {getMemberName(fleet.driverId) || <span className="text-slate-300 italic">-</span>}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-slate-400 font-semibold block print:text-gray-500">Auxiliar</span>
                                    <span className="font-medium text-slate-800 block">
                                        {getMemberName(fleet.helperId) || <span className="text-slate-300 italic">-</span>}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-slate-400 font-semibold block print:text-gray-500">Operador</span>
                                    <span className="font-medium text-slate-800 block">
                                        {getMemberName(fleet.operatorId) || <span className="text-slate-300 italic">-</span>}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stops Section */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1 border-b border-slate-100 pb-2 print:text-black print:border-black">
                                <Calendar size={14} /> Roteiro de Entregas ({fleet.stops?.length || 0})
                            </h4>
                            
                            {!fleet.stops || fleet.stops.length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-2">Nenhuma entrega atribuída.</p>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-xs text-slate-500 border-b border-slate-100 print:text-black print:border-black">
                                            <th className="font-medium py-2 w-16">Seq.</th>
                                            <th className="font-medium py-2 w-20">Cód.</th>
                                            <th className="font-medium py-2">Cliente</th>
                                            <th className="font-medium py-2 text-right">CEP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 print:divide-gray-300">
                                        {fleet.stops.map((stop, index) => (
                                            <tr key={stop.id} className="group">
                                                <td className="py-2.5 text-slate-400 font-mono text-xs group-hover:text-blue-600 print:text-black">
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </td>
                                                <td className="py-2.5 font-mono text-slate-600 text-xs print:text-black">
                                                    {stop.clientCode}
                                                </td>
                                                <td className="py-2.5 font-medium text-slate-800">
                                                    {stop.clientName}
                                                </td>
                                                <td className="py-2.5 text-right text-slate-500 text-xs font-mono print:text-black">
                                                    {stop.zipCode}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                    
                    {/* Print Footer per card */}
                    <div className="hidden print:block bg-gray-50 p-2 text-center border-t border-gray-900 mt-2">
                         <div className="flex justify-around pt-8 pb-2">
                            <div className="border-t border-black w-1/3 pt-1 text-xs">Assinatura Motorista</div>
                            <div className="border-t border-black w-1/3 pt-1 text-xs">Assinatura Conferente</div>
                         </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RouteSummary;