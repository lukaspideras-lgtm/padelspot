// =============================================================================
// Fiksni tereni - mock podaci
// TODO: Zameniti sa API pozivom: fetch courts from backend
// =============================================================================

export const COURTS = [
  { id: 'zeleni', name: 'Zeleni teren', color: '#22c55e' },
  { id: 'plavi', name: 'Plavi teren', color: '#3b82f6' },
  { id: 'narandzasti', name: 'Narandžasti teren', color: '#f97316' },
] as const;

export type CourtId = (typeof COURTS)[number]['id'];
