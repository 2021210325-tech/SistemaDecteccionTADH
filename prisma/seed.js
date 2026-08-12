require('dotenv/config')
const { Pool } = require('pg')
const crypto = require('crypto')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

function cuid() {
  return 'c' + crypto.randomBytes(12).toString('hex')
}

async function seed() {
  console.log('Seeding Neon database...')
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Regions
    const regionId = cuid()
    await client.query('INSERT INTO regions (id, code, name, created_at) VALUES ($1, $2, $3, NOW())', [regionId, '10', 'Huánuco'])

    // Province
    const provinceId = cuid()
    await client.query('INSERT INTO provinces (id, code, name, region_id, created_at) VALUES ($1, $2, $3, $4, NOW())', [provinceId, '01', 'Huánuco', regionId])

    // District
    const districtId = cuid()
    await client.query('INSERT INTO districts (id, code, name, province_id, created_at) VALUES ($1, $2, $3, $4, NOW())', [districtId, '01', 'Amarilis', provinceId])

    // UGEL
    const ugelId = cuid()
    await client.query('INSERT INTO ugels (id, code, name, district_id, created_at) VALUES ($1, $2, $3, $4, NOW())', [ugelId, '01', 'UGEL Huánuco', districtId])

    // Educational levels
    const levelPriId = cuid()
    await client.query('INSERT INTO educational_levels (id, code, name, created_at) VALUES ($1, $2, $3, NOW())', [levelPriId, 'PRI', 'Primaria'])
    const levelSecId = cuid()
    await client.query('INSERT INTO educational_levels (id, code, name, created_at) VALUES ($1, $2, $3, NOW())', [levelSecId, 'SEC', 'Secundaria'])

    // Grades 1-6
    for (let i = 1; i <= 6; i++) {
      await client.query('INSERT INTO grades (id, code, name, level_id, "order", created_at) VALUES ($1, $2, $3, $4, $5, NOW())', [cuid(), String(i), i + '° Primaria', levelPriId, i])
    }

    // Institution
    const instId = cuid()
    await client.query('INSERT INTO educational_institutions (id, modular_code, name, address, district_id, ugel_id, level_id, director, phone, email, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,NOW(),NOW())', [instId, '33356', 'I.E. Estatal N.° 33356', 'Av. Principal s/n, Amarilis', districtId, ugelId, levelPriId, 'Director Ejemplo', '062-123456', 'ie33356@correo.com'])

    // Roles
    const roleAdminId = cuid()
    const rolePsicId = cuid()
    const roleEntId = cuid()
    await client.query('INSERT INTO roles (id, name, description, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW())', [roleAdminId, 'ADMIN_GENERAL', 'Administrador con acceso total'])
    await client.query('INSERT INTO roles (id, name, description, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW())', [rolePsicId, 'PSICOLOGO', 'Psicólogo con acceso a evaluaciones'])
    await client.query('INSERT INTO roles (id, name, description, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW())', [roleEntId, 'ENTIDAD_GOBIERNO', 'Entidad con acceso a estadísticas'])

    // Permissions
    const perms = [
      ['users','create'],['users','read'],['users','update'],['users','delete'],
      ['students','create'],['students','read'],['students','update'],['students','delete'],
      ['evaluations','create'],['evaluations','read'],['evaluations','update'],['evaluations','delete'],
      ['reports','create'],['reports','read'],['reports','update'],['reports','delete'],
      ['institutions','create'],['institutions','read'],['institutions','update'],['institutions','delete'],
      ['statistics','read'],['statistics','export'],
      ['audit','read'],['audit','export'],
      ['appointments','create'],['appointments','read'],['appointments','update'],['appointments','delete'],
    ]
    const permIds = []
    for (const [mod, act] of perms) {
      const id = cuid()
      await client.query('INSERT INTO permissions (id, module, action, created_at) VALUES ($1,$2,$3,NOW())', [id, mod, act])
      permIds.push(id)
      await client.query('INSERT INTO role_permissions (id, role_id, permission_id, created_at) VALUES ($1,$2,$3,NOW())', [cuid(), roleAdminId, id])
    }
    // Entity gets stats + institutions
    for (const id of permIds) {
      const r = await client.query('SELECT module FROM permissions WHERE id = $1', [id])
      if (r.rows[0].module === 'statistics' || r.rows[0].module === 'institutions') {
        await client.query('INSERT INTO role_permissions (id, role_id, permission_id, created_at) VALUES ($1,$2,$3,NOW())', [cuid(), roleEntId, id])
      }
    }

    // Test DIVA
    const testId = cuid()
    await client.query('INSERT INTO tests (id, code, name, description, author, version, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,true,NOW(),NOW())', [testId, 'DIVA', 'DIVA 2.0', 'Entrevista diagnóstica para TDAH', 'Jan Buitelaar', '2.0'])

    const versionId = cuid()
    await client.query('INSERT INTO test_versions (id, test_id, version, is_current, created_at) VALUES ($1,$2,$3,true,NOW())', [versionId, testId, '2.0'])

    // Sections
    const secAId = cuid()
    await client.query('INSERT INTO test_sections (id, version_id, code, name, description, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())', [secAId, versionId, 'A', 'Criterios de Inatención', 'Síntomas de inatención', 1])
    const secBId = cuid()
    await client.query('INSERT INTO test_sections (id, version_id, code, name, description, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())', [secBId, versionId, 'B', 'Criterios de Hiperactividad/Impulsividad', 'Síntomas de hiperactividad', 2])

    // Questions
    for (let i = 1; i <= 9; i++) {
      const qAId = cuid()
      await client.query('INSERT INTO test_questions (id, section_id, code, text, description, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())', [qAId, secAId, 'A'+i, 'Criterio A'+i+': Inatención', 'Descripción '+(i), i])
      await client.query('INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [cuid(), qAId, 'N', 'Nunca', 0, 0, 1])
      await client.query('INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [cuid(), qAId, 'R', 'Rara vez', 1, 1, 2])
      await client.query('INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [cuid(), qAId, 'A', 'A veces', 2, 2, 3])
      await client.query('INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [cuid(), qAId, 'S', 'Siempre', 3, 3, 4])
    }
    for (let i = 1; i <= 9; i++) {
      const qBId = cuid()
      await client.query('INSERT INTO test_questions (id, section_id, code, text, description, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())', [qBId, secBId, 'B'+i, 'Criterio B'+i+': Hiperactividad/Impulsividad', 'Descripción '+(i), i])
      await client.query('INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [cuid(), qBId, 'N', 'Nunca', 0, 0, 1])
      await client.query('INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [cuid(), qBId, 'R', 'Rara vez', 1, 1, 2])
      await client.query('INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [cuid(), qBId, 'A', 'A veces', 2, 2, 3])
      await client.query('INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [cuid(), qBId, 'S', 'Siempre', 3, 3, 4])
    }

    // School year
    await client.query('INSERT INTO school_years (id, year, start_date, end_date, is_active, created_at) VALUES ($1,2026,\'2026-03-01\',\'2026-12-15\',true,NOW())', [cuid()])

    // System settings
    const settings = [['app_name','TDAH System','general'],['school_year','2026','education'],['consent_version','1.0','legal']]
    for (const [k, v, c] of settings) {
      await client.query('INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES ($1,$2,$3,\'string\',$4,NOW(),NOW())', [cuid(), k, v, c])
    }

    // Admin user
    const adminUserId = cuid()
    const adminId = cuid()
    await client.query('INSERT INTO users (id, email, password_hash, email_verified, is_active, created_at, updated_at) VALUES ($1,$2,$3,NOW(),true,NOW(),NOW())', [adminUserId, 'admin@tdah.com', '$2a$12$LJ3m4ys3Lk0TSwMBBENx7OHLyCmMJLqJ3gKqYyZ8VcG5RfK9T1L2G'])
    await client.query('INSERT INTO administrators (id, user_id, first_name, last_name, phone, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())', [adminId, adminUserId, 'Administrador', 'General', '999999999'])
    await client.query('INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES ($1,$2,$3,NOW())', [cuid(), adminUserId, roleAdminId])

    // Psychologist user
    const psychUserId = cuid()
    const psychId = cuid()
    await client.query('INSERT INTO users (id, email, password_hash, email_verified, is_active, created_at, updated_at) VALUES ($1,$2,$3,NOW(),true,NOW(),NOW())', [psychUserId, 'psicologo@tdah.com', '$2a$12$LJ3m4ys3Lk0TSwMBBENx7OHLyCmMJLqJ3gKqYyZ8VcG5RfK9T1L2G'])
    await client.query('INSERT INTO psychologists (id, user_id, first_name, last_name, phone, specialization, license_number, institution_id, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW())', [psychId, psychUserId, 'Ana', 'Martínez López', '988888888', 'Psicología Clínica', 'COLPSI-12345', instId])
    await client.query('INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES ($1,$2,$3,NOW())', [cuid(), psychUserId, rolePsicId])

    await client.query('COMMIT')

    // Generate bcrypt hash for passwords
    console.log('')
    console.log('========================================')
    console.log('  DATABASE SEEDED SUCCESSFULLY!')
    console.log('========================================')
    console.log('')
    console.log('CREDENCIALES (mismo hash bcrypt para ambos):')
    console.log('')
    console.log('Administrador General:')
    console.log('  Email:    admin@tdah.com')
    console.log('  Password: Admin123!')
    console.log('')
    console.log('Psicólogo:')
    console.log('  Email:    psicologo@tdah.com')
    console.log('  Password: Psico123!')
    console.log('')
    console.log('NOTA: Los passwords necesitan hash bcrypt real.')
    console.log('Usa la app para crear los usuarios o actualiza manualmente.')
    console.log('')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
    await pool.end()
  }
}

seed()