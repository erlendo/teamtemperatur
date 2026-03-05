import { execSync } from 'node:child_process'

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' })
}

function getChangedSqlMigrations() {
  // Prefer comparing against origin/main; fallback to last commit range.
  const commands = [
    'git diff --name-only --diff-filter=ACMRT origin/main...HEAD',
    'git diff --name-only --diff-filter=ACMRT HEAD~1...HEAD',
  ]

  for (const cmd of commands) {
    try {
      const output = execSync(cmd, { encoding: 'utf8' })
      return output
        .split('\n')
        .map((s) => s.trim())
        .filter(
          (p) => p.startsWith('supabase/migrations/') && p.endsWith('.sql')
        )
    } catch {
      // Try next strategy.
    }
  }

  return []
}

console.log('Running pre-push checks...')
run('npm run ci:verify')

const migrationFiles = getChangedSqlMigrations()
if (migrationFiles.length > 0) {
  console.log('Detected migration changes. Running migration guard...')
  run(`npm run check:migrations -- ${migrationFiles.join(' ')}`)
}

console.log('Pre-push checks passed.')
