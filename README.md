# Blog

Statisk blog i ren HTML + CSS med vanilla JS som progressive enhancement.
Ingen build-steps, ingen frameworks, ingen eksterne afhængigheder på kørselstidspunktet.
Designet til at blive deployet direkte på GitHub Pages fra repo-roden.

## Lokal kørsel

Sitet kræver ingen build. Start en statisk server fra repo-roden:

```
python -m http.server 8000
```

Åbn derefter <http://localhost:8000> i browseren.
(`python3` på Mac/Linux. Enhver anden statisk server kan også bruges.)

En server er nødvendig for søgningen (den henter `assets/data/artikler.json`
via `fetch`, hvilket ikke virker fra `file://`). Alt andet - indhold,
navigation, dark mode - virker også, hvis du bare åbner HTML-filerne direkte.

## Struktur

```
index.html                  Forside (fremhævet artikel + serie, vertikalt centreret)
artikler/<slug>.html        Én fil pr. artikel
artikler/index.html         Arkiv: alle artikler, filtrérbart på emne
artikler/_skabelon.html     Artikelskabelon (kopieres ved ny artikel)
om.html                     Om-side
assets/css/style.css        Alt design (palette og typografi ligger i toppen)
assets/js/search.js         Søgning, emnefilter og tema-toggle (progressive enhancement)
assets/data/artikler.json   Artikel-manifestet - den centrale sandhed for metadata
assets/img/                 Figur-PNG'er (1200x630) og profilfoto
assets/fonts/               Self-hostede skrifter (Newsreader, variabel font)
feed.xml                    RSS-feed (håndvedligeholdt)
docs/kladder/<slug>.md      Artikel-kilder (se konventionen nedenfor)
tools/eksport/<navn>.html   Figurernes kilder (én wrapper pr. figur)
tools/export-figurer.ps1    SVG -> PNG-eksport (1200x630) via headless Edge
```

## Kilde-reglen: artikel-kladder

Hver artikels kilde ligger i `docs/kladder/<slug>.md`. **Mappen er
gitignored - kilder og kladder committes aldrig** og når derfor hverken
GitHub eller det publicerede site. Ved publicering genereres
`artikler/<slug>.html` fra md-filen. Rettelser sker altid i md-filen,
hvorefter HTML'en regenereres; artikeltekst redigeres aldrig direkte i HTML.

Kladden angiver selv sine visuelle elementer som HTML-kommentarer inline i
teksten (`FIGUR 1`, `MANDAGSTESTEN` osv.) - kommentaren beskriver både
koncept og præcis placering. **Kladdens kommentarer er autoritative** og
vinder over andre beskrivelser. Kommentarerne må aldrig ende i den
publicerede HTML, og figurer og pull quotes findes kun i HTML-versionen -
md-kilden forbliver ren tekst.

Artikelteksten sættes **ordret** - ret intet, heller ikke stavning eller
tegnsætning.

## Ny artikel - trin for trin (ca. 5 minutter)

1. **Kopiér skabelonen:** `artikler/_skabelon.html` -> `artikler/<slug>.html`.
   Følg de nummererede `RET`-kommentarer i filen: titel, beskrivelse,
   Open Graph, seriemærke, metadata, brødtekst (ordret fra kladden i
   `docs/kladder/<slug>.md`), pull quotes, figurer, serie-navigation og
   relaterede artikler.
2. **Tilføj entry i `assets/data/artikler.json`:** Kopiér det eksisterende
   artikel-objekt og ret felterne. Det driver søgning og emnefilter.
3. **Forside (`index.html`):** Er artiklen en seriedel: Gør titlen i
   serie-sektionen til et link og erstat "Kommer" med datoen. Skal artiklen
   fremhæves: Opdatér også den fremhævede blok (se næste afsnit).
4. **Arkiv (`artikler/index.html`):** Kopiér `<li>`-blokken markeret med
   `NY ARTIKEL` i den rette serie-sektion, og fjern den tilsvarende
   "Kommer"-linje. Opdatér "Senest udgivet"-linjen øverst, så den peger på
   den nye artikel. Artikler uden serie: se kommentaren om "Øvrige artikler".
5. **RSS (`feed.xml`):** Kopiér `<item>`-blokken, indsæt den øverst i
   `<channel>`, ret titel/link/guid/pubDate/description, og opdatér
   `<lastBuildDate>`.
6. **Figurer:** Lav en wrapper pr. figur i `tools/eksport/` (kopiér en
   eksisterende), indsæt SVG'en inline i artiklen, og kør PNG-eksporten
   (se nedenfor). Artiklens `og:image` skal pege på signaturfigurens PNG.

## Fremhæv en anden artikel på forsiden

1. Flyt `"featured": true` til den ønskede artikel i `assets/data/artikler.json`
   (kun én ad gangen).
2. Udskift indholdet i `<article class="fremhaevet">`-blokken i `index.html`:
   seriemærke, titel/link, resumé, meta-linje og figur (SVG'en kopieres fra
   artiklens wrapper i `tools/eksport/`).

## Figurer: SVG -> PNG-eksport (1200x630)

Hver figur findes både som inline-SVG i artiklen (følger lys/mørk tilstand
via CSS-variabler) og som PNG i lys version til `og:image` og LinkedIn-upload.

Figurens kilde er dens wrapper i `tools/eksport/<navn>.html`. Eksporten
bruger headless Microsoft Edge (følger med Windows - intet at installere):

```
powershell -ExecutionPolicy Bypass -File tools\export-figurer.ps1
```

Scriptet renderer alle wrappere i `tools/eksport/` og skriver
`assets/img/<navn>.png` (1200x630). Kør det igen, når en figur ændres eller
en ny kommer til. Ved figur-ændringer: Ret SVG'en i wrapperen først, og
kopiér den derefter ind i de sider, der viser den inline.

## Domæne

Sitet bruger relative stier overalt og kan køre lokalt og på GitHub Pages
uden ændringer. De eneste absolutte URL'er er Open Graph `og:image` og RSS,
der begge peger på **`https://reetz-engell.dk`**. Skifter domænet, så søg og
erstat `reetz-engell.dk` i alle `.html`-filer og `feed.xml`.

Bemærk: Indtil DNS peger på GitHub Pages, virker `og:image`-previews på
LinkedIn ikke (de kræver, at billederne kan hentes på det absolutte domæne).
Selve siden fungerer fint via GitHub Pages-URL'en i mellemtiden.

## Analytics

Alle sider indlæser Google Analytics 4 via `gtag.js` med measurement-id
`G-5WRZSXJRXX` (Firebase-projektet reetz-engelldk). Det er den ene bevidste
undtagelse fra reglen om ingen eksterne scripts; sitet fungerer fuldt ud,
hvis scriptet blokeres. Besøgstal ses i Firebase-konsollen under Analytics
eller i GA4; sidevisninger pr. artikel ligger under Rapporter -> Engagement
-> Sider og skærme. Skabelonen har snippet med, så nye artikler tælles
automatisk.

## Profilfoto

Fotoet ligger i `assets/img/profil.jpg` (webooptimeret) og bruges på
om-siden. En valgfri variant med en lille rund udgave i sidehovedet ligger
klar som markeret kommentar i `index.html` (`VARIANT MED FOTO I HEADER`).
Aktivér den ved at indsætte den kommenterede `<img>`-linje, og kopiér den
til de øvrige sider, så udtrykket er ens overalt.

## Deploy til GitHub Pages

1. `git init` + commit + push til et GitHub-repo.
2. På GitHub: **Settings -> Pages -> Deploy from a branch**, vælg `main` og
   `/ (root)`.
3. Sitet ligger derefter på `https://<brugernavn>.github.io/<repo>/`.
   Når DNS for `reetz-engell.dk` peger på GitHub Pages, tilføjes domænet
   under **Settings -> Pages -> Custom domain** (det opretter en `CNAME`-fil
   i repoet).

`.nojekyll` i roden sørger for, at GitHub Pages serverer filerne, som de er
(uden Jekyll-processering).
