import { useMemo } from 'react'
import * as db from '../data/db'
import { useDataVersion } from '../data/version'
import { useComplexId } from '../stores/auth'

/**
 * Lee una colección del edificio activo de forma reactiva: cualquier escritura
 * en la base demo re-renderiza a los consumidores.
 */
export function useCollection<T extends { id: string }>(
  name: string,
  filter?: (item: T) => boolean,
  sort?: (a: T, b: T) => number,
): T[] {
  const version = useDataVersion((s) => s.version)
  const complexId = useComplexId()
  return useMemo(() => {
    if (!complexId) return []
    let items = db.list<T>(db.col(complexId, name))
    if (filter) items = items.filter(filter)
    if (sort) items = [...items].sort(sort)
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, complexId, name])
}

/** Colecciones globales (users, invites, complexes). */
export function useGlobalCollection<T extends { id: string }>(
  name: string,
  filter?: (item: T) => boolean,
): T[] {
  const version = useDataVersion((s) => s.version)
  return useMemo(() => {
    let items = db.list<T>(name)
    if (filter) items = items.filter(filter)
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, name])
}

export const byCreatedDesc = <T extends { createdAt?: number }>(a: T, b: T) =>
  (b.createdAt ?? 0) - (a.createdAt ?? 0)
