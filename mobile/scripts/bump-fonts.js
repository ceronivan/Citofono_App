/**
 * Escala tipográfica accesible: sube todas las fuentes pequeñas a un piso de 12px.
 * Orden descendente para evitar reemplazos encadenados. UTF-8 explícito.
 * Uso: node scripts/bump-fonts.js
 */
const fs = require('fs')
const path = require('path')

const MAP = [
  ['fontSize: 13.5', 'fontSize: 14.5'],
  ['fontSize: 13,', 'fontSize: 14,'],
  ['fontSize: 13 ', 'fontSize: 14 '],
  ['fontSize: 12.5', 'fontSize: 13.5'],
  ['fontSize: 12,', 'fontSize: 13,'],
  ['fontSize: 12 ', 'fontSize: 13 '],
  ['fontSize: 11.5', 'fontSize: 12.5'],
  ['fontSize: 11,', 'fontSize: 12,'],
  ['fontSize: 10.5', 'fontSize: 12,'],
  ['fontSize: 10,', 'fontSize: 12,'],
]

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full)
  }
  return out
}

let changed = 0
for (const file of walk(path.join(__dirname, '..', 'src'))) {
  const orig = fs.readFileSync(file, 'utf8')
  let next = orig
  for (const [from, to] of MAP) next = next.split(from).join(to)
  if (next !== orig) {
    fs.writeFileSync(file, next, 'utf8')
    changed++
  }
}
console.log(`Archivos actualizados: ${changed}`)
