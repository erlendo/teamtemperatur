import { readFileSync } from 'node:fs'

const files = process.argv.slice(2).filter((f) => f.endsWith('.sql'))

if (files.length === 0) {
  console.log('No migration files provided. Skipping migration guard.')
  process.exit(0)
}

const violations = []

for (const file of files) {
  let content = ''
  try {
    content = readFileSync(file, 'utf8')
  } catch (error) {
    violations.push({ file, message: `Unable to read file: ${String(error)}` })
    continue
  }

  const lower = content.toLowerCase()

  if (/\bselect\s+\*/i.test(content)) {
    violations.push({
      file,
      message: 'Avoid SELECT * in migrations; use explicit columns.',
    })
  }

  if (/alter\s+table\s+.+\s+disable\s+row\s+level\s+security/i.test(content)) {
    violations.push({ file, message: 'Disabling RLS is not allowed.' })
  }

  const createsTable = /create\s+table/i.test(content)
  if (createsTable) {
    const hasRlsEnable =
      /alter\s+table\s+.+\s+enable\s+row\s+level\s+security/i.test(content)
    const hasPolicy = /create\s+policy/i.test(content)

    if (!hasRlsEnable) {
      violations.push({
        file,
        message: 'Table creation migration must enable RLS.',
      })
    }

    if (!hasPolicy) {
      violations.push({
        file,
        message: 'Table creation migration should define at least one policy.',
      })
    }
  }

  // Team Temperature domain safety: team-scoped tables should reference team_id
  const mentionsTeamTable = /create\s+table\s+.*team|ai_weekly_summaries/i.test(
    content
  )
  if (mentionsTeamTable && !lower.includes('team_id')) {
    violations.push({
      file,
      message: 'Team-scoped migrations should include team_id scoping.',
    })
  }
}

if (violations.length > 0) {
  console.error('Migration guard failed:\n')
  for (const v of violations) {
    console.error(`- ${v.file}: ${v.message}`)
  }
  process.exit(1)
}

console.log('Migration guard passed.')
