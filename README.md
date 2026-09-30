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

Az induló React + TypeScript projektváz elkészült. A felület már fogad egy fájlt, de tényleges konvertálást még nem végez. A parser és a konverter implementálásához szükség van legalább egy valós forrásfájlra és egy elvárt kimeneti mintára.

## Első célformátum: Zsalu Kft.

A `munka` munkalap ismert oszlopai:

`# | Szálirány | Kereszti. | Élzárás | Szál. 1 | Szál. 2 | Ker. 1 | Ker. 2 | Forg. | Munka azonosító | Bútor | Elem | Megjegyzés`

A részletes, még tisztázandó mezőket a [docs/formatumok.md](docs/formatumok.md) fájl tartalmazza.

