const fs = require('fs')
const files = [
  'src/app/resident/_layout.tsx',
  'src/app/admin/_layout.tsx',
  'src/app/guard/_layout.tsx',
]
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8')
  c = c.replace(
    'tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.borderLight },',
    'tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.borderLight, height: 64, paddingTop: 6, paddingBottom: 8 },',
  )
  c = c.replace(
    "tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },",
    "tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },",
  )
  fs.writeFileSync(f, c, 'utf8')
}
console.log('tabs OK')
