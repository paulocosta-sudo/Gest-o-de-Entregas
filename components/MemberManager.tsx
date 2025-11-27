import React, { useState } from 'react';
import { Member, MemberRole } from '../types';
import { UserPlus, Trash2, Users } from 'lucide-react';

interface MemberManagerProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onRemoveMember: (id: string) => void;
}

const MemberManager: React.FC<MemberManagerProps> = ({ members, onAddMember, onRemoveMember }) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>(MemberRole.MOTORISTA);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: Member = {
      id: crypto.randomUUID(),
      name: newName,
      role: newRole,
    };

    onAddMember(newMember);
    setNewName('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
         <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Equipes
         </h2>
         <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
            {members.length} Integrantes
         </span>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: José da Silva"
              className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
            />
          </div>
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as MemberRole)}
              className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-white"
            >
              {Object.values(MemberRole).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm active:transform active:scale-95"
            >
              <UserPlus size={18} />
              <span className="md:hidden lg:inline">Adicionar</span>
            </button>
          </div>
        </form>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {members.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                Nenhum integrante cadastrado.
            </div>
          ) : (
            members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                        ${member.role.includes('Motorista') ? 'bg-indigo-100 text-indigo-700' : 
                          member.role.includes('Auxiliar') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                    `}>
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                </div>
                <button
                    onClick={() => onRemoveMember(member.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Remover integrante"
                >
                    <Trash2 size={18} />
                </button>
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberManager;