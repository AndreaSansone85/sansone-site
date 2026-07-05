#!/usr/bin/env node
/**
 * build-content-index.js
 * Eseguito da Netlify ad ogni deploy (vedi netlify.toml).
 * Il CMS (Decap) salva un file .json per ogni lezione / congresso / foto
 * dentro content/<tipo>/. Questo script li aggrega in un unico indice
 * per tipo, cosi' il frontend fa una sola fetch invece di indovinare
 * i nomi dei file.
 */
const fs = require('fs');
const path = require('path');

const TYPES = ['lezioni', 'congressi', 'galleria'];
const ROOT = path.join(__dirname, '..', 'content');

for (const type of TYPES) {
  const dir = path.join(ROOT, type);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json');
  const items = files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`Attenzione: ${f} non è JSON valido, saltato.`);
      return null;
    }
  }).filter(Boolean);

  // ordina per data decrescente quando presente
  items.sort((a, b) => new Date(b.data || b.date || 0) - new Date(a.data || a.date || 0));

  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ items }, null, 2));
  console.log(`content/${type}/index.json <- ${items.length} elementi`);
}

console.log('Build content index completata.');
