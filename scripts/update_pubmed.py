#!/usr/bin/env python3
"""
update_pubmed.py

Interroga le E-utilities di NCBI/PubMed usando l'ORCID dell'autore,
recupera i metadati essenziali di ogni pubblicazione e scrive
content/pubblicazioni/pubblicazioni.json.

Le voci aggiunte a mano o da escludere vivono in
content/pubblicazioni/overrides.json e vengono gestite dal
pannello CMS (/admin) — questo script le rispetta sempre:
  - "exclude_pmids": PMID da non mostrare mai (omonimie, refusi)
  - "manual_entries": pubblicazioni aggiunte a mano (no PMID, es. capitoli di libro)

Uso:
  ORCID=0000-0000-0000-0000 python scripts/update_pubmed.py
Variabili d'ambiente opzionali:
  NCBI_API_KEY   -> aumenta il rate limit (consigliato, gratuito su NCBI)
  EXTRA_QUERY    -> filtro aggiuntivo, es. 'AND "Tor Vergata"[Affiliation]'
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
ORCID = os.environ.get("ORCID", "").strip()
API_KEY = os.environ.get("NCBI_API_KEY", "").strip()
EXTRA_QUERY = os.environ.get("EXTRA_QUERY", "").strip()

OUT_PATH = os.path.join("content", "pubblicazioni", "pubblicazioni.json")
OVERRIDES_PATH = os.path.join("content", "pubblicazioni", "overrides.json")


def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "personal-site-pubmed-sync/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def esearch_pmids():
    if not ORCID:
        print("ERRORE: variabile ORCID non impostata.", file=sys.stderr)
        sys.exit(1)
    term = f'{ORCID}[Author - Identifier]'
    if EXTRA_QUERY:
        term += f' {EXTRA_QUERY}'
    params = {
        "db": "pubmed",
        "term": term,
        "retmode": "json",
        "retmax": "500",
    }
    if API_KEY:
        params["api_key"] = API_KEY
    url = f"{EUTILS}/esearch.fcgi?{urllib.parse.urlencode(params)}"
    data = json.loads(http_get(url))
    return data.get("esearchresult", {}).get("idlist", [])


def efetch_details(pmids):
    if not pmids:
        return []
    items = []
    chunk_size = 100
    for i in range(0, len(pmids), chunk_size):
        chunk = pmids[i:i + chunk_size]
        params = {"db": "pubmed", "id": ",".join(chunk), "retmode": "xml"}
        if API_KEY:
            params["api_key"] = API_KEY
        url = f"{EUTILS}/efetch.fcgi?{urllib.parse.urlencode(params)}"
        xml_bytes = http_get(url)
        root = ET.fromstring(xml_bytes)
        for article in root.findall(".//PubmedArticle"):
            items.append(parse_article(article))
        time.sleep(0.35 if not API_KEY else 0.12)
    return items


def parse_article(article):
    pmid = article.findtext(".//PMID", default="")
    title = (article.findtext(".//ArticleTitle") or "").strip()
    journal = (article.findtext(".//Journal/Title") or article.findtext(".//Journal/ISOAbbreviation") or "").strip()

    year = None
    for path in (".//JournalIssue/PubDate/Year", ".//JournalIssue/PubDate/MedlineDate", ".//ArticleDate/Year"):
        val = article.findtext(path)
        if val:
            year = val[:4]
            break

    authors = []
    for author in article.findall(".//AuthorList/Author"):
        last = author.findtext("LastName")
        initials = author.findtext("Initials")
        collective = author.findtext("CollectiveName")
        if last and initials:
            authors.append(f"{last} {initials}")
        elif collective:
            authors.append(collective)
    authors_str = ", ".join(authors)

    doi = ""
    for eid in article.findall(".//ELocationID"):
        if eid.get("EIdType") == "doi":
            doi = eid.text or ""
    if not doi:
        for aid in article.findall(".//ArticleIdList/ArticleId"):
            if aid.get("IdType") == "doi":
                doi = aid.text or ""

    return {
        "pmid": pmid,
        "title": title,
        "authors": authors_str,
        "journal": journal,
        "year": int(year) if year and year.isdigit() else None,
        "doi": doi,
        "source": "pubmed",
    }


def load_overrides():
    if not os.path.exists(OVERRIDES_PATH):
        return {"exclude_pmids": [], "manual_entries": []}
    with open(OVERRIDES_PATH, encoding="utf-8") as f:
        return json.load(f)


def main():
    pmids = esearch_pmids()
    print(f"Trovati {len(pmids)} PMID per ORCID {ORCID}")
    pubmed_items = efetch_details(pmids)

    overrides = load_overrides()
    exclude = set(str(x) for x in overrides.get("exclude_pmids", []))
    manual = overrides.get("manual_entries", [])

    pubmed_items = [p for p in pubmed_items if p["pmid"] not in exclude and p["year"]]

    combined = pubmed_items + manual
    combined.sort(key=lambda p: (p.get("year") or 0), reverse=True)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "orcid": ORCID,
                "count": len(combined),
                "items": combined,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
    print(f"Scritte {len(combined)} pubblicazioni in {OUT_PATH}")


if __name__ == "__main__":
    main()
