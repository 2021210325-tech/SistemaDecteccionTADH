import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { hash } from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Geographic data
  const region = await prisma.region.create({ data: { code: '10', name: 'Huánuco' } })
  const province = await prisma.province.create({ data: { code: '01', name: 'Huánuco', regionId: region.id } })
  const district = await prisma.district.create({ data: { code: '01', name: 'Amarilis', provinceId: province.id } })
  const ugel = await prisma.ugel.create({ data: { code: '01', name: 'UGEL Huánuco', districtId: district.id } })

  // Educational data
  const levelPrimaria = await prisma.educationalLevel.create({ data: { code: 'PRI', name: 'Primaria' } })
  await prisma.educationalLevel.create({ data: { code: 'SEC', name: 'Secundaria' } })

  await Promise.all([1, 2, 3, 4, 5, 6].map((n) =>
    prisma.grade.create({ data: { code: String(n), name: n + '° Primaria', levelId: levelPrimaria.id, order: n } })
  ))

  const institution = await prisma.educationalInstitution.create({
    data: {
      modularCode: '33356', name: 'I.E. Estatal N.° 33356',
      address: 'Av. Principal s/n, Amarilis',
      districtId: district.id, ugelId: ugel.id, levelId: levelPrimaria.id,
      director: 'Director Ejemplo', phone: '062-123456', email: 'ie33356@correo.com',
    },
  })

  // Roles and permissions
  const roles = await Promise.all([
    prisma.role.create({ data: { name: 'ADMIN_GENERAL', description: 'Administrador con acceso total' } }),
    prisma.role.create({ data: { name: 'PSICOLOGO', description: 'Psicólogo con acceso a evaluaciones' } }),
    prisma.role.create({ data: { name: 'ENTIDAD_GOBIERNO', description: 'Entidad con acceso a estadísticas' } }),
  ])

  const permissionData = [
    { module: 'users', action: 'create' }, { module: 'users', action: 'read' },
    { module: 'users', action: 'update' }, { module: 'users', action: 'delete' },
    { module: 'students', action: 'create' }, { module: 'students', action: 'read' },
    { module: 'students', action: 'update' }, { module: 'students', action: 'delete' },
    { module: 'evaluations', action: 'create' }, { module: 'evaluations', action: 'read' },
    { module: 'evaluations', action: 'update' }, { module: 'evaluations', action: 'delete' },
    { module: 'reports', action: 'create' }, { module: 'reports', action: 'read' },
    { module: 'reports', action: 'update' }, { module: 'reports', action: 'delete' },
    { module: 'institutions', action: 'create' }, { module: 'institutions', action: 'read' },
    { module: 'institutions', action: 'update' }, { module: 'institutions', action: 'delete' },
    { module: 'statistics', action: 'read' }, { module: 'statistics', action: 'export' },
    { module: 'audit', action: 'read' }, { module: 'audit', action: 'export' },
    { module: 'appointments', action: 'create' }, { module: 'appointments', action: 'read' },
    { module: 'appointments', action: 'update' }, { module: 'appointments', action: 'delete' },
  ]

  const permissions = await Promise.all(permissionData.map((p) => prisma.permission.create({ data: p })))

  for (const perm of permissions) {
    await prisma.rolePermission.create({ data: { roleId: roles[0].id, permissionId: perm.id } })
  }
  for (const perm of permissions.filter((p) => p.module === 'statistics' || p.module === 'institutions')) {
    await prisma.rolePermission.create({ data: { roleId: roles[2].id, permissionId: perm.id } })
  }

  // Test DIVA
  const test = await prisma.test.create({
    data: { code: 'DIVA', name: 'DIVA 2.0', description: 'Entrevista diagnóstica para TDAH', author: 'Jan Buitelaar' },
  })
  const testVersion = await prisma.testVersion.create({ data: { testId: test.id, version: '2.0', isCurrent: true } })

  const sectionA = await prisma.testSection.create({
    data: { versionId: testVersion.id, code: 'A', name: 'Criterios de Inatención', description: 'Síntomas de inatención', order: 1 },
  })
  const sectionB = await prisma.testSection.create({
    data: { versionId: testVersion.id, code: 'B', name: 'Criterios de Hiperactividad/Impulsividad', description: 'Síntomas de hiperactividad', order: 2 },
  })

  const questionsA = await Promise.all(Array.from({ length: 9 }, (_, i) =>
    prisma.testQuestion.create({ data: { sectionId: sectionA.id, code: 'A' + (i + 1), text: 'Criterio A' + (i + 1), description: 'Inatención ' + (i + 1), order: i + 1 } })
  ))
  const questionsB = await Promise.all(Array.from({ length: 9 }, (_, i) =>
    prisma.testQuestion.create({ data: { sectionId: sectionB.id, code: 'B' + (i + 1), text: 'Criterio B' + (i + 1), description: 'Hiperactividad ' + (i + 1), order: i + 1 } })
  ))

  for (const q of [...questionsA, ...questionsB]) {
    await prisma.testOption.createMany({
      data: [
        { questionId: q.id, code: 'N', text: 'Nunca', value: 0, score: 0, order: 1 },
        { questionId: q.id, code: 'R', text: 'Rara vez', value: 1, score: 1, order: 2 },
        { questionId: q.id, code: 'A', text: 'A veces', value: 2, score: 2, order: 3 },
        { questionId: q.id, code: 'S', text: 'Siempre', value: 3, score: 3, order: 4 },
      ],
    })
  }

  // School year and settings
  await prisma.schoolYear.create({ data: { year: 2026, startDate: new Date('2026-03-01'), endDate: new Date('2026-12-15'), isActive: true } })
  await prisma.systemSetting.createMany({
    data: [
      { key: 'app_name', value: 'TDAH System', category: 'general' },
      { key: 'school_year', value: '2026', category: 'education' },
      { key: 'consent_version', value: '1.0', category: 'legal' },
    ],
  })

  // Admin user
  const adminHash = await hash('Admin123!', 12)
  await prisma.user.create({
    data: {
      email: 'admin@tdah.com', passwordHash: adminHash, emailVerified: new Date(),
      administrator: { create: { firstName: 'Administrador', lastName: 'General', phone: '999999999' } },
      roles: { create: { role: { connect: { name: 'ADMIN_GENERAL' } } } },
    },
  })

  // Psychologist user
  const psychHash = await hash('Psico123!', 12)
  await prisma.user.create({
    data: {
      email: 'psicologo@tdah.com', passwordHash: psychHash, emailVerified: new Date(),
      psychologist: {
        create: { firstName: 'Ana', lastName: 'Martínez López', phone: '988888888', specialization: 'Psicología Clínica', licenseNumber: 'COLPSI-12345', institutionId: institution.id },
      },
      roles: { create: { role: { connect: { name: 'PSICOLOGO' } } } },
    },
  })

  console.log('Database seeded successfully!')
  console.log('')
  console.log('=== CREDENCIALES DE ACCESO ===')
  console.log('Administrador: admin@tdah.com / Admin123!')
  console.log('Psicólogo: psicologo@tdah.com / Psico123!')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
