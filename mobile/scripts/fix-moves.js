/** Ajusta imports y hrefs tras mover las pantallas compartidas a resident/. */
const fs = require('fs')
const path = require('path')

const moved = [
  'authorizations.tsx', 'circulars.tsx', 'damage.tsx', 'deliveries.tsx',
  'mail.tsx', 'maintenance.tsx', 'pqrs.tsx', 'reservation-new.tsx',
  'vehicles.tsx', 'visits.tsx',
]

const base = path.join(__dirname, '..', 'src', 'app', 'resident')

// 1) Imports: un nivel más profundo
for (const f of moved) {
  const file = path.join(base, f)
  let c = fs.readFileSync(file, 'utf8')
  c = c.split("from '../").join("from '../../")
  fs.writeFileSync(file, c, 'utf8')
}
const detail = path.join(base, 'content', '[col]', '[id].tsx')
{
  let c = fs.readFileSync(detail, 'utf8')
  c = c.split("from '../../../").join("from '../../../../")
  fs.writeFileSync(detail, c, 'utf8')
}

// 2) hrefs absolutos que cambiaron
const hrefFixes = [
  [path.join(base, 'index.tsx'), [
    ["href: '/deliveries'", "href: '/resident/deliveries'"],
    ["href: '/visits'", "href: '/resident/visits'"],
    ["href: '/authorizations'", "href: '/resident/authorizations'"],
    ["href: '/vehicles'", "href: '/resident/vehicles'"],
    ["href: '/maintenance'", "href: '/resident/maintenance'"],
    ["href: '/circulars'", "href: '/resident/circulars'"],
    ["href: '/pqrs'", "href: '/resident/pqrs'"],
    ["href: '/damage'", "href: '/resident/damage'"],
    ["href: '/mail'", "href: '/resident/mail'"],
    ["href: '/mail'", "href: '/resident/mail'"],
  ]],
  [path.join(base, 'reservations.tsx'), [
    ["router.push('/reservation-new' as never)", "router.push('/resident/reservation-new' as never)"],
  ]],
  [path.join(base, 'news.tsx'), [
    ['router.push(`/content/news/${n.id}` as never)', 'router.push(`/resident/content/news/${n.id}` as never)'],
  ]],
  [path.join(base, 'circulars.tsx'), [
    ['router.push(`/content/circulars/${c.id}` as never)', 'router.push(`/resident/content/circulars/${c.id}` as never)'],
  ]],
]
for (const [file, pairs] of hrefFixes) {
  let c = fs.readFileSync(file, 'utf8')
  for (const [from, to] of pairs) c = c.split(from).join(to)
  fs.writeFileSync(file, c, 'utf8')
}

console.log('moves OK')
