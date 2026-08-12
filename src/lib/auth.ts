"use client"

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" })
  window.location.href = "/login"
}

export async function getUser() {
  try {
    const res = await fetch("/api/auth/me")
    if (!res.ok) return null
    const data = await res.json()
    return data.user
  } catch {
    return null
  }
}