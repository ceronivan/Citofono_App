import { Redirect } from 'expo-router'
import React from 'react'
import { DASHBOARD, useAuth, useRole } from '../stores/auth'

/** Entrada: redirige según sesión y rol. */
export default function Index() {
  const user = useAuth((s) => s.user)
  const role = useRole()

  if (!user) return <Redirect href="/login" />
  if (!role) return <Redirect href="/setup-building" />
  return <Redirect href={DASHBOARD[role] as never} />
}
