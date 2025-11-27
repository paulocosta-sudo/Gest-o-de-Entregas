export enum RoleType {
  DRIVER = 'DRIVER',
  HELPER = 'HELPER',
  OPERATOR = 'OPERATOR'
}

export enum MemberRole {
  MOTORISTA = 'Motorista',
  MOTORISTA_I = 'Motorista I',
  MOTORISTA_GRANEL = 'Motorista Granel',
  AUXILIAR_DISTRIBUICAO = 'Auxiliar de Distribuição',
  OPERADOR_GRANEL = 'Operador Granel'
}

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
}

export interface DeliveryStop {
  id: string;
  clientCode: string;
  clientName: string;
  zipCode: string;
}

export interface Fleet {
  id: string;
  number: string; // "Frota - 113"
  driverId?: string;
  helperId?: string;
  operatorId?: string;
  routeDetails?: string; // General route notes
  stops?: DeliveryStop[]; // Structured delivery data
}

export const ROLE_CATEGORIES: Record<MemberRole, RoleType> = {
  [MemberRole.MOTORISTA]: RoleType.DRIVER,
  [MemberRole.MOTORISTA_I]: RoleType.DRIVER,
  [MemberRole.MOTORISTA_GRANEL]: RoleType.DRIVER,
  [MemberRole.AUXILIAR_DISTRIBUICAO]: RoleType.HELPER,
  [MemberRole.OPERADOR_GRANEL]: RoleType.OPERATOR,
};

// Helper to get roles by category
export const getRolesByType = (type: RoleType): MemberRole[] => {
  return Object.entries(ROLE_CATEGORIES)
    .filter(([_, cat]) => cat === type)
    .map(([role]) => role as MemberRole);
};