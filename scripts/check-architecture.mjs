import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const targets = [join(root, 'components'), join(root, 'app', '(app)')]

const allowClientPathFragments = [`${join('app', '(auth)')}`]

const fileExtensions = new Set(['.ts', '.tsx'])

function walk(dir, files = []) {
  let entries = []
  try {
    entries = readdirSync(dir)
  } catch {
    return files
  }

  for (const entry of entries) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, files)
      continue
    }

    const dot = entry.lastIndexOf('.')
    const ext = dot >= 0 ? entry.slice(dot) : ''
    if (!fileExtensions.has(ext)) continue
    files.push(full)
  }

  return files
}

const forbidden = [
  {
    pattern: /from\s+['\"]@\/lib\/supabase\/(server|browser)['\"]/,
    message: 'Do not import Supabase clients in UI layer.',
  },
  {
    pattern: /from\s+['\"]@supabase\/supabase-js['\"]/,
    message: 'Do not instantiate Supabase SDK directly in UI layer.',
  },
  {
    pattern: /\bsupabaseServer\s*\(/,
    message: 'Do not call supabaseServer() in UI layer.',
  },
  {
    pattern: /\bsupabaseBrowser\s*\(/,
    message: 'Do not call supabaseBrowser() in UI layer.',
  },
  {
    pattern: /\.from\s*\(/,
    message: 'Do not run direct DB queries in UI layer.',
  },
]

function isGuardedFile(filePath, content) {
  const rel = filePath.replace(`${root}/`, '')
  if (rel.startsWith('components/')) return true

  if (!rel.startsWith('app/(app)/')) return false

  if (allowClientPathFragments.some((part) => rel.includes(part))) {
    return false
  }

  // Guard client entry files and local client components under app/(app)
  if (/\/client\.(ts|tsx)$/.test(rel)) return true
  if (/^app\/\(app\)\/.*\.tsx$/.test(rel) && content.includes("'use client'")) {
    return true
  }

  return false
}

const files = targets.flatMap((dir) => walk(dir))
const findings = []

for (const file of files) {
  const content = readFileSync(file, 'utf8')
  if (!isGuardedFile(file, content)) continue

  const lines = content.split('\n')
  lines.forEach((line, index) => {
    forbidden.forEach((rule) => {
      if (rule.pattern.test(line)) {
        findings.push({
          file: file.replace(`${root}/`, ''),
          line: index + 1,
          message: rule.message,
          snippet: line.trim(),
        })
      }
    })
  })
}

if (findings.length > 0) {
  console.error(
    'Architecture guard failed: UI layer contains direct Supabase/DB usage.\n'
  )
  findings.forEach((f) => {
    console.error(`- ${f.file}:${f.line} ${f.message}`)
    console.error(`  ${f.snippet}`)
  })
  process.exit(1)
}

console.log('Architecture guard passed.')
