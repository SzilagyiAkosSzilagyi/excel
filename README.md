# EXO

Webalkalmazás bútoripari exportfájlok beolvasására, ellenőrzésére és más formátumba alakítására. Az első célformátum a Zsalu Kft. szabászati Excel-sablonja.

## Tervezett folyamat

1. A felhasználó feltölti a forrásfájlt.
2. Az alkalmazás beolvassa és ellenőrzi az adatokat.
3. A transzformációs réteg egységes belső adatszerkezetet készít.
4. Az exportáló modul létrehozza a kiválasztott célformátumot.

## Fejlesztés indítása

```bash
npm install
npm run dev
```

Az alkalmazás alapértelmezés szerint a Vite által kiírt helyi címen érhető el.

## Parancsok

```bash
npm run dev       # fejlesztői szerver
npm run build     # típusellenőrzés és kiadásra szánt build
npm run preview   # az elkészült build helyi előnézete
npm run test      # tesztek futtatása
```

## Mappaszerkezet

```text
EXO/
├── docs/                   # formátum- és döntési dokumentáció
├── public/                 # változtatás nélkül kiszolgált fájlok
├── src/
│   ├── components/         # felületi elemek
│   ├── converters/         # célformátumok előállítása
│   ├── parsers/            # forrásfájlok beolvasása
│   ├── types/              # közös TypeScript-típusok
│   ├── App.tsx             # alkalmazásfelület
│   └── main.tsx            # belépési pont
└── .github/workflows/      # automatikus ellenőrzés GitHubon
```

## Jelenlegi állapot

Az első reszponzív frontend elkészült. A kezdőképernyőn két műveleti kártya található: Excel-fájl feltöltése és az átalakított fájl letöltése. A felület már fogad XLSX, XLS és CSV fájlt, megjeleníti a kiválasztott fájl állapotát, és előkészíti a letöltési lépést.

A tényleges konvertálás és letöltés még demonstrációs állapotú. A következő fejlesztési szakasz a Supabase-alapú bejelentkezés, adattárolás és backend bekötése, valamint a parser és a konverter implementálása valós mintaállományok alapján.

## Supabase

A frontend az `EXCEL PROJECT` Supabase projekthez csatlakozik a `@supabase/supabase-js` klienssel. A helyi beállítások a Git által figyelmen kívül hagyott `.env.local` fájlban vannak.

Új fejlesztői környezetben másold le a `.env.example` fájlt `.env.local` néven, majd add meg:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Frontendbe kizárólag publishable kulcs kerülhet. Secret vagy service-role kulcsot tilos `VITE_` előtagú változóban tárolni.

## Első célformátum: Zsalu Kft.

A `munka` munkalap ismert oszlopai:

`# | Szálirány | Kereszti. | Élzárás | Szál. 1 | Szál. 2 | Ker. 1 | Ker. 2 | Forg. | Munka azonosító | Bútor | Elem | Megjegyzés`

A részletes, még tisztázandó mezőket a [docs/formatumok.md](docs/formatumok.md) fájl tartalmazza.
