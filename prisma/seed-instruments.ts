import { Pool } from "pg"
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "../.env") })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

async function seed() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // ==========================================
    // 1. CREAR INSTRUMENTOS
    // ==========================================

    const diva5Result = await client.query(
      `INSERT INTO tests (id, code, name, description, population, min_age, max_age, is_active, created_at, updated_at)
       VALUES (gen_random_uuid()::text, 'DIVA5', 'DIVA-5', 'Entrevista diagnóstica para el TDAH en adultos - DSM-5', 'adults', 18, NULL, true, NOW(), NOW())
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, population = EXCLUDED.population, min_age = EXCLUDED.min_age, max_age = EXCLUDED.max_age
       RETURNING id`
    )
    const diva5Id = diva5Result.rows[0].id

    const youngDiva5Result = await client.query(
      `INSERT INTO tests (id, code, name, description, population, min_age, max_age, is_active, created_at, updated_at)
       VALUES (gen_random_uuid()::text, 'YOUNG_DIVA5', 'Young DIVA-5', 'Entrevista diagnóstica para el TDAH en niños y adolescentes - DSM-5', 'children', 5, 17, true, NOW(), NOW())
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, population = EXCLUDED.population, min_age = EXCLUDED.min_age, max_age = EXCLUDED.max_age
       RETURNING id`
    )
    const youngDiva5Id = youngDiva5Result.rows[0].id

    // ==========================================
    // 2. CREAR VERSIONES
    // ==========================================

    const diva5VersionResult = await client.query(
      `INSERT INTO test_versions (id, test_id, version, description, release_date, is_current, is_active, created_at)
       VALUES (gen_random_uuid()::text, $1, '1.0', 'Versión inicial DIVA-5 DSM-5', '2024-01-01', true, true, NOW())
       ON CONFLICT (test_id, version) DO UPDATE SET is_current = EXCLUDED.is_current
       RETURNING id`,
      [diva5Id]
    )
    const diva5VersionId = diva5VersionResult.rows[0].id

    const youngDiva5VersionResult = await client.query(
      `INSERT INTO test_versions (id, test_id, version, description, release_date, is_current, is_active, created_at)
       VALUES (gen_random_uuid()::text, $1, '1.0', 'Versión inicial Young DIVA-5 DSM-5', '2024-01-01', true, true, NOW())
       ON CONFLICT (test_id, version) DO UPDATE SET is_current = EXCLUDED.is_current
       RETURNING id`,
      [youngDiva5Id]
    )
    const youngDiva5VersionId = youngDiva5VersionResult.rows[0].id

    // ==========================================
    // 3. CREAR PARTES PARA AMBOS INSTRUMENTOS
    // ==========================================

    const parts = [
      { code: "PART_A1", name: "Parte 1 - Déficit de Atención", description: "Criterios de desatención A1a-A1i", order: 1 },
      { code: "PART_A2", name: "Parte 2 - Hiperactividad/Impulsividad", description: "Criterios de hiperactividad e impulsividad A2a-A2i", order: 2 },
      { code: "PART_3", name: "Parte 3 - Información Complementaria", description: "Inicio, disfunción, criterios adicionales e información colateral", order: 3 },
    ]

    const diva5Parts: Record<string, string> = {}
    const youngDiva5Parts: Record<string, string> = {}

    for (const part of parts) {
      const dResult = await client.query(
        `INSERT INTO test_parts (id, version_id, code, name, description, "order", created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING RETURNING id`,
        [diva5VersionId, part.code, part.name, part.description, part.order]
      )
      if (dResult.rows.length > 0) diva5Parts[part.code] = dResult.rows[0].id

      const yResult = await client.query(
        `INSERT INTO test_parts (id, version_id, code, name, description, "order", created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING RETURNING id`,
        [youngDiva5VersionId, part.code, part.name, part.description, part.order]
      )
      if (yResult.rows.length > 0) youngDiva5Parts[part.code] = yResult.rows[0].id
    }

    // ==========================================
    // 4. CREAR DOMINIOS
    // ==========================================

    const inattentionDomain = { code: "INATTENTION", name: "Déficit de Atención", description: "Criterios de desatención" }
    const hyperDomain = { code: "HYPERACTIVITY_IMPULSIVITY", name: "Hiperactividad/Impulsividad", description: "Criterios de hiperactividad e impulsividad" }

    const diva5Domains: Record<string, string> = {}
    const youngDiva5Domains: Record<string, string> = {}

    // Parte 1 - Inattention
    const dResult1 = await client.query(
      `INSERT INTO test_domains (id, part_id, code, name, description, "order", created_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 1, NOW())
       ON CONFLICT DO NOTHING RETURNING id`,
      [diva5Parts["PART_A1"], inattentionDomain.code, inattentionDomain.name, inattentionDomain.description]
    )
    if (dResult1.rows.length > 0) diva5Domains["INATTENTION"] = dResult1.rows[0].id

    const yResult1 = await client.query(
      `INSERT INTO test_domains (id, part_id, code, name, description, "order", created_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 1, NOW())
       ON CONFLICT DO NOTHING RETURNING id`,
      [youngDiva5Parts["PART_A1"], inattentionDomain.code, inattentionDomain.name, inattentionDomain.description]
    )
    if (yResult1.rows.length > 0) youngDiva5Domains["INATTENTION"] = yResult1.rows[0].id

    // Parte 2 - Hyperactivity
    const dResult2 = await client.query(
      `INSERT INTO test_domains (id, part_id, code, name, description, "order", created_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 1, NOW())
       ON CONFLICT DO NOTHING RETURNING id`,
      [diva5Parts["PART_A2"], hyperDomain.code, hyperDomain.name, hyperDomain.description]
    )
    if (dResult2.rows.length > 0) diva5Domains["HYPERACTIVITY"] = dResult2.rows[0].id

    const yResult2 = await client.query(
      `INSERT INTO test_domains (id, part_id, code, name, description, "order", created_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 1, NOW())
       ON CONFLICT DO NOTHING RETURNING id`,
      [youngDiva5Parts["PART_A2"], hyperDomain.code, hyperDomain.name, hyperDomain.description]
    )
    if (yResult2.rows.length > 0) youngDiva5Domains["HYPERACTIVITY"] = yResult2.rows[0].id

    // ==========================================
    // 5. CREAR CRITERIOS A1 (Déficit de Atención)
    // ==========================================

    const criteriaA1 = [
      { code: "A1a", number: 1, name: "Descuido", text: "No presta atención a los detalles o comete errores por descuido en las actividades de trabajo, las tareas escolares o las actividades lúdicas." },
      { code: "A1b", number: 2, name: "Mantener atención", text: "Tiene dificultades para mantener la atención en las tareas o actividades lúdicas." },
      { code: "A1c", number: 3, name: "Escucha", text: "Parece no escuchar cuando se le habla directamente." },
      { code: "A1d", number: 4, name: "Instrucciones", text: "No sigue las instrucciones hasta el final y no termina los deberes, las obligaciones o los deberes del trabajo." },
      { code: "A1e", number: 5, name: "Organización", text: "Tiene dificultades para organizar las tareas y las actividades." },
      { code: "A1f", number: 6, name: "Tareas repetitivas", text: "Evita, se resiste o tiene desagrado en emprender tareas que requieren un esfuerzo mental sostenido." },
      { code: "A1g", number: 7, name: "Objetos", text: "Pierde con frecuencia los objetos necesarios para sus actividades (juguetes, deberes del colegio, lápices o libros)." },
      { code: "A1h", number: 8, name: "Olvidos", text: "Se distrae con facilidad por estímulos ajenos a la tarea." },
      { code: "A1i", number: 9, name: "Olvidos cotidianos", text: "Se olvida con frecuencia de actividades diarias (pagar cuentas, llamar por teléfono, acudir a citas)." },
    ]

    // ==========================================
    // 6. CREAR CRITERIOS A2 (Hiperactividad/Impulsividad)
    // ==========================================

    const criteriaA2 = [
      { code: "A2a", number: 10, name: "Manos/muñecas", text: "Mueve en exceso las manos o los pies, o se remueve en el asiento." },
      { code: "A2b", number: 11, name: "Levantarse", text: "Se levanta en situaciones en que se espera que permanezca sentado." },
      { code: "A2c", number: 12, name: "Inquietud", text: "Corre de un lado a otro o trepa en situaciones en que resulta inapropiado." },
      { code: "A2d", number: 13, name: "Juegos", text: "Tiene dificultades para jugar o entretenerse con actividades lúdicas de forma tranquila." },
      { code: "A2e", number: 14, name: "Actuar", text: "Actúa como si estuviera «motorizado» o como si lo empujaran constantemente." },
      { code: "A2f", number: 15, name: "Hablar", text: "Habla en exceso." },
      { code: "A2g", number: 16, name: "Respuestas", text: "Responde las preguntas de forma precipitada antes de que se hayan terminado de formular." },
      { code: "A2h", number: 17, name: "Esperar", text: "Tiene dificultades para esperar su turno (en file, en juegos, en situaciones de grupo)." },
      { code: "A2i", number: 18, name: "Interrumpir", text: "Se entromete o se inmiscuye en las actividades o conversaciones ajenas." },
    ]

    // Insertar criterios para ambos instrumentos
    const insertCriterion = async (domainId: string, c: { code: string; number: number; name: string; text: string }, order: number) => {
      await client.query(
        `INSERT INTO test_criteria (id, domain_id, code, "number", name, official_text, "order", created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [domainId, c.code, c.number, c.name, c.text, order]
      )
    }

    for (let i = 0; i < criteriaA1.length; i++) {
      if (diva5Domains["INATTENTION"]) await insertCriterion(diva5Domains["INATTENTION"], criteriaA1[i], i + 1)
      if (youngDiva5Domains["INATTENTION"]) await insertCriterion(youngDiva5Domains["INATTENTION"], criteriaA1[i], i + 1)
    }

    for (let i = 0; i < criteriaA2.length; i++) {
      if (diva5Domains["HYPERACTIVITY"]) await insertCriterion(diva5Domains["HYPERACTIVITY"], criteriaA2[i], i + 1)
      if (youngDiva5Domains["HYPERACTIVITY"]) await insertCriterion(youngDiva5Domains["HYPERACTIVITY"], criteriaA2[i], i + 1)
    }

    // ==========================================
    // 7. CREAR PREGUNTAS PARA CADA CRITERIO
    // ==========================================

    const insertQuestion = async (criterionId: string, ctx: string, text: string, code: string, order: number, allowsExamples: boolean) => {
      const result = await client.query(
        `INSERT INTO test_questions (id, criterion_id, code, context, text, question_type, required, allows_examples, allows_observation, "order", created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'CHOICE_WITH_EXAMPLES', true, $5, true, $6, NOW())
         ON CONFLICT DO NOTHING RETURNING id`,
        [criterionId, code, ctx, text, allowsExamples, order]
      )
      return result.rows[0]?.id
    }

    // Obtener todos los criterios de ambos instrumentos
    const allCriteria = await client.query(
      `SELECT tc.id, tc.code, tv.test_id
       FROM test_criteria tc
       JOIN test_domains td ON tc.domain_id = td.id
       JOIN test_parts tp ON td.part_id = tp.id
       JOIN test_versions tv ON tp.version_id = tv.id
       WHERE tv.is_current = true`
    )

    for (const criterion of allCriteria.rows) {
      const ctxCurrent = `${criterion.code}_CURRENT`
      const ctxChildhood = `${criterion.code}_CHILDHOOD`

      const questionCurrentId = await insertQuestion(
        criterion.id, "CURRENT",
        `¿Presenta actualmente el siguiente síntoma? Criterio ${criterion.code}`,
        ctxCurrent, 1, true
      )

      const questionChildhoodId = await insertQuestion(
        criterion.id, "CHILDHOOD",
        `¿Presentó el siguiente síntoma durante su infancia (antes de los 12 años)? Criterio ${criterion.code}`,
        ctxChildhood, 2, true
      )

      // Crear opciones Sí/No para cada pregunta
      if (questionCurrentId) {
        await client.query(
          `INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at)
           VALUES (gen_random_uuid()::text, $1, 'YES', 'Sí', 1, 1, 1, NOW()),
                  (gen_random_uuid()::text, $1, 'NO', 'No', 0, 0, 2, NOW())
           ON CONFLICT DO NOTHING`,
          [questionCurrentId]
        )
      }

      if (questionChildhoodId) {
        await client.query(
          `INSERT INTO test_options (id, question_id, code, text, value, score, "order", created_at)
           VALUES (gen_random_uuid()::text, $1, 'YES', 'Sí', 1, 1, 1, NOW()),
                  (gen_random_uuid()::text, $1, 'NO', 'No', 0, 0, 2, NOW())
           ON CONFLICT DO NOTHING`,
          [questionChildhoodId]
        )
      }
    }

    // ==========================================
    // 8. CREAR FUENTES DE INFORMACIÓN COLATERAL
    // ==========================================

    const collateralSources = [
      { code: "PARENT", name: "Padre/Madre/Tutor", description: "Información proporcionada por los padres o tutores" },
      { code: "TEACHER", name: "Docente", description: "Información proporcionada por profesores" },
      { code: "SIBLING", name: "Hermano/a", description: "Información proporcionada por hermanos" },
      { code: "PARTNER", name: "Pareja", description: "Información proporcionada por la pareja" },
      { code: "FRIEND", name: "Amigo/a cercano", description: "Información proporcionada por amigos cercanos" },
      { code: "SCHOOL_REPORT", name: "Informe escolar", description: "Documentos escolares oficiales" },
      { code: "OTHER", name: "Otra fuente", description: "Otras fuentes de información" },
    ]

    for (const source of collateralSources) {
      await client.query(
        `INSERT INTO collateral_sources (id, code, name, description, created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())
         ON CONFLICT (code) DO NOTHING`,
        [source.code, source.name, source.description]
      )
    }

    await client.query("COMMIT")
    console.log("Seed completado exitosamente")
    console.log(`DIVA-5 ID: ${diva5Id}`)
    console.log(`Young DIVA-5 ID: ${youngDiva5Id}`)
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error en seed:", error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed()