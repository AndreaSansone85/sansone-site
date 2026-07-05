# Sito personale — Andrea Sansone

Sito statico (HTML/CSS/JS puri, nessun framework) con:
- contenuti bilingue IT/EN (toggle in alto a destra)
- pannello di gestione contenuti **Decap CMS** su `/admin`
- lista pubblicazioni aggiornata **automaticamente da PubMed** tramite ORCID
- congressi/relazioni, lezioni (PDF + artifact Claude), galleria fotografica: gestiti dal pannello CMS

## 1. Pubblica il repository su GitHub

```bash
cd sansone-site
git init
git add .
git commit -m "Sito iniziale"
gh repo create <tuo-utente>/sansone-site --private --source=. --push
# oppure, senza gh cli: crea il repo su github.com e poi
# git remote add origin git@github.com:<tuo-utente>/sansone-site.git
# git push -u origin main
```

## 2. Collega il repository a Netlify

1. Netlify → **Add new site → Import an existing project** → scegli il repo appena creato.
2. Build command: `npm run build` (già impostato in `netlify.toml`)
3. Publish directory: `.` (già impostato in `netlify.toml`)
4. Deploy.

## 3. Attiva Netlify Identity + Git Gateway (necessario per il CMS)

1. Nel sito su Netlify: **Site configuration → Identity → Enable Identity**
2. In **Registration preferences** scegli "Invite only" (così solo tu potrai accedere al CMS)
3. **Identity → Services → Git Gateway → Enable Git Gateway**
4. **Identity → Invite users** → invita la tua email → dalla mail ricevuta imposta la password
5. Vai su `https://<tuo-sito>.netlify.app/admin` e accedi: da lì potrai gestire tutti i contenuti.

## 4. Imposta l'aggiornamento automatico da PubMed

Nel repository GitHub → **Settings → Secrets and variables → Actions → New repository secret**:

- `PUBMED_ORCID` → il tuo ORCID (es. `0000-0000-0000-0000`)
- `NCBI_API_KEY` → opzionale ma consigliata: la ottieni gratis dal tuo account su ncbi.nlm.nih.gov (Account settings → API Key Management). Senza questa chiave le richieste sono comunque possibili ma più lente/limitate.

Il workflow `.github/workflows/update-pubmed.yml` gira automaticamente ogni lunedì e può essere lanciato anche a mano da GitHub → tab **Actions → Aggiorna pubblicazioni da PubMed → Run workflow**.

Per aggiungere pubblicazioni senza PMID (capitoli di libro, ecc.) o nascondere un PMID sbagliato (omonimie), usa il pannello `/admin` → sezione "Pubblicazioni — eccezioni manuali".

## 5. Carica i loghi istituzionali

Metti i file in `assets/logos/` con questi nomi esatti (SVG o PNG trasparente):
- `torvergata.svg` (o `.png`)
- `endosex.svg`
- `siams.svg`

Se il formato non è SVG, aggiorna l'estensione nei tag `<img>` di `index.html`.

## 6. Sviluppo locale

Nessuna installazione di dipendenze necessaria per vedere il sito (è HTML statico):

```bash
npx serve .
```

Per rigenerare gli indici dei contenuti dopo una modifica manuale ai file JSON in `content/`:

```bash
npm run build
```

## Struttura dei contenuti

```
content/
  pagine/chi-sono.json       ← testo pagina "Chi sono"
  pagine/clinica.json        ← testo + link prenotazioni
  congressi/*.json           ← una voce per congresso/relazione (gestiti da CMS)
  lezioni/*.json             ← una voce per lezione, con PDF e/o artifact (gestiti da CMS)
  galleria/*.json            ← una voce per immagine (gestiti da CMS)
  pubblicazioni/
    pubblicazioni.json       ← generato automaticamente, NON modificare a mano
    overrides.json           ← eccezioni manuali (gestito da CMS)
```

## Note e limiti da tenere presenti

- **PDF pesanti**: Netlify accetta singoli file fino a 100MB circa; per dispense molto pesanti valutare compressione o hosting esterno con link diretto.
- **Artifact Claude incorporati**: funzionano se pubblicati con link di condivisione pubblica; alcuni artifact con librerie esterne o storage potrebbero comportarsi diversamente in iframe — verificare caso per caso.
- **Nome dominio**: il sito parte su `<nome-scelto>.netlify.app`; un dominio personalizzato si collega in un secondo momento da Netlify → Domain settings.
