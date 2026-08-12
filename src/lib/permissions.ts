import prisma from '@/lib/prisma'

export type Permission = {
  module: string
  action: string
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  })

  const permissions: Permission[] = []
  
  userRoles.forEach(ur => {
    ur.role.rolePermissions.forEach(rp => {
      permissions.push({
        module: rp.permission.module,
        action: rp.permission.action,
      })
    })
  })

  // Remove duplicates
  const uniquePermissions = permissions.filter(
    (perm, index, self) =>
      index === self.findIndex(p => p.module === perm.module && p.action === perm.action)
  )

  return uniquePermissions
}

export async function hasPermission(userId: string, module: string, action: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.some(p => p.module === module && p.action === action)
}

export async function hasAnyPermission(userId: string, module: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.some(p => p.module === module)
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: true,
    },
  })

  return userRoles.map(ur => ur.role.name)
}

export async function isAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.some(role => role.startsWith('ADMIN_') || role === 'ADMIN_GENERAL')
}

export async function isPsychologist(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.includes('PSICOLOGO')
}

export async function isGovernmentEntity(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.includes('ENTIDAD_GOBIERNO')
}