import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Deliverable {
  id: number;
  nom: string;
  description: string;
  date_echeance: string;
  types_fichiers: string[];
  phase_id: number;
  status?: 'submitted' | 'pending' | 'approved' | 'rejected';
  size?: string;
}

interface UseDeliverablesFetchOptions {
  phaseId: number;
  pageSize?: number;
  retryCount?: number;
  retryDelay?: number;
  cacheTime?: number;
}

interface DeliverablesResponse {
  data: Deliverable[];
  total: number;
  page: number;
  hasMore: boolean;
}

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // 1 second
const PAGE_SIZE = 10;

export const useDeliverablesFetch = ({
  phaseId,
  pageSize = PAGE_SIZE,
  retryCount = RETRY_COUNT,
  retryDelay = RETRY_DELAY,
  cacheTime = CACHE_TIME,
}: UseDeliverablesFetchOptions) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliverables = useCallback(async ({ pageParam = 1 }) => {
    try {
      const response = await fetch(`/api/liverable/get/${phaseId}?page=${pageParam}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: data.deliverables,
        total: data.total,
        page: pageParam,
        hasMore: data.hasMore,
      } as DeliverablesResponse;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  }, [phaseId, pageSize]);

  const {
    data,
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useQuery<DeliverablesResponse, Error>({
    queryKey: ['deliverables', phaseId, page],
    queryFn: () => fetchDeliverables({ pageParam: page }),
    retry: retryCount,
    retryDelay: retryDelay,
    gcTime: cacheTime,
    staleTime: cacheTime,
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    },
  });

  const loadMore = useCallback(() => {
    if (data?.hasMore) {
      setPage(prev => prev + 1);
    }
  }, [data?.hasMore]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['deliverables', phaseId] });
    setPage(1);
  }, [queryClient, phaseId]);

  // Préchargement de la page suivante
  useEffect(() => {
    if (data?.hasMore) {
      queryClient.prefetchQuery({
        queryKey: ['deliverables', phaseId, page + 1],
        queryFn: () => fetchDeliverables({ pageParam: page + 1 }),
      });
    }
  }, [data?.hasMore, page, phaseId, queryClient, fetchDeliverables]);

  return {
    deliverables: data?.data || [],
    isLoading,
    isError,
    error: error || queryError,
    hasMore: data?.hasMore || false,
    total: data?.total || 0,
    currentPage: page,
    loadMore,
    refresh,
    refetch,
  };
}; 