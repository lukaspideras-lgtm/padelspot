// =============================================================================
// React Query hooks for reservations, courts, availability
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as courtsService from '@/src/services/courts';
import * as reservationsService from '@/src/services/reservations';
import * as blocksService from '@/src/services/blocks';

export const courtsKeys = { all: ['courts'] as const };
export const availabilityKeys = (dateISO: string, courtId: string, duration: number) =>
  ['availability', dateISO, courtId, duration] as const;
export const myReservationsKeys = { all: ['reservations', 'mine'] as const };
export const adminReservationsKeys = (dateISO: string, search?: string | null) =>
  ['reservations', 'admin', dateISO, search ?? ''] as const;
export const adminBlocksKeys = (dateISO: string) => ['blocks', 'admin', dateISO] as const;
export const adminDailyOverviewKeys = (dateISO: string) => ['admin', 'dailyOverview', dateISO] as const;

export function useCourts() {
  return useQuery({
    queryKey: courtsKeys.all,
    queryFn: courtsService.listActive,
  });
}

export function useAvailability(dateISO: string, courtId: string, durationMinutes: 60 | 120) {
  return useQuery({
    queryKey: availabilityKeys(dateISO, courtId, durationMinutes),
    queryFn: () => reservationsService.getAvailability(dateISO, courtId, durationMinutes),
    enabled: !!dateISO && !!courtId,
  });
}

export function useMyReservations() {
  return useQuery({
    queryKey: myReservationsKeys.all,
    queryFn: reservationsService.listMine,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useAdminReservations(dateISO: string, search?: string | null) {
  return useQuery({
    queryKey: adminReservationsKeys(dateISO, search),
    queryFn: () => reservationsService.listAllForAdmin(dateISO, search),
    enabled: !!dateISO,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reservationsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: myReservationsKeys.all });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reservationsService.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myReservationsKeys.all });
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useAdminBlocks(dateISO: string) {
  return useQuery({
    queryKey: adminBlocksKeys(dateISO),
    queryFn: () => blocksService.listForAdmin(dateISO),
    enabled: !!dateISO,
  });
}

export function useAdminDailyOverview(dateISO: string) {
  return useQuery({
    queryKey: adminDailyOverviewKeys(dateISO),
    queryFn: () => blocksService.getAdminDailyOverview(dateISO),
    enabled: !!dateISO,
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: blocksService.createBlock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
}

export function useCancelBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: blocksService.cancelBlock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['blocks'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reservationsService.adminCancelReservation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminMarkNoShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reservationsService.adminMarkNoShow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useCreateBlocksBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: blocksService.createBlocksBulk,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['blocks'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useCancelBlocksBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: blocksService.cancelBlocksBulk,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['blocks'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
