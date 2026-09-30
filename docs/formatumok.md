# Fájlformátumok

## Célformátum: Zsalu Kft. rendelő program

A kimenet **mindig** a Zsalu Kft. eredeti rendelő sablonja (`public/sablonok/zsalu-rendelo.xlsx`, forrás: `ZSALU MINTA.xlsx`). A program a sablonfájlt tölti be, és csak az alkatrészsorokat írja bele, így a formázás, a legördülő listák, a rejtett oszlopok, a munkafüzet-védelem és a „Segítség” munkalap változatlan marad.

- Munkalapok: `Zsalu Kft rendelő program`, `Segítség`
- 1. sor: technikai fejléc (a Zsalu optimalizálója olvassa), 2. sor: magyar fejléc
- Alkatrészek: a 3. sortól, soronként egy tétel, legfeljebb 398 sor (3–400.)

| Oszlop | Fejléc | Tartalom |
|---|---|---|
| A | Megrendelő neve (`Aufkb`) | rendelésenként egyedi név, pl. `XY Kft 1` – minden sorba |
| B | Anyag (`Plakb`) | anyag színe vagy kódja, pl. `H1145` |
| C | Jelölés (`Teilbez`) | alkatrésznév / megjegyzés, a címkén megjelenik |
| D | Darab (`Stück`) | 1–99999 |
| E | Hossz „A” bruttó (`ZusLänge`) | szálirányú méret, egész mm, 10–2770 |
| F | Szél „B” bruttó (`ZusBreite`) | szálirányra merőleges méret, egész mm, 10–2040 |
| G | Forg? | `Igen` / `Nem` |
| H | rejtett (`Drehbar`) | képlet: `IF(G="Igen","1","0")` |
| I | Élz. elöl „A” (`Kantevkb`) | élzárás a listából |
| J, K | rejtett | `0`, `40` |
| L | Élz. hátul „A” (`Kantehkb`) | élzárás a listából |
| M, N | rejtett | `0`, `40` |
| O | Élz. bal „B” (`Kantelkb`) | élzárás a listából |
| P, Q | rejtett | `0`, `40` |
| R | Élz. jobb „B” (`Kanterkb`) | élzárás a listából |

- Élzárás-lista: `ABS 2mm`, `Más ABS 2mm`, `ABS 0,8mm`, `Más ABS 0,8mm`, `ABS 0,4mm`, `Más0,4mm`, `Élfurnér`, `Más Élfurnér`, `Élléc`, `Más Élléc`, `Falc` (üres = nincs).
- A méreteket az élzáró vastagságával **együtt** kell megadni.
- Élzárási korlátok: hosszú él (I, L) 70 mm-nél keskenyebb alkatrészen nem lehetséges; rövid él (O, R) 180 mm alatt 180 mm-ből vágják vissza, és azt számlázzák.

## Forrásformátum

Jelenleg általános, fejléc alapú beolvasás (`src/parsers/tableParser.ts`): az első munkalap, amelyen „Hossz” és „Szélesség” oszlop található. Felismert fejlécek (magyar, angol, német): anyag, jelölés/megnevezés, darab/db/mennyiség, hossz, szélesség, forgatható, élzárás elöl/hátul/bal/jobb. Már Zsalu formátumú fájl is beolvasható.

## Nyitott kérdések

- A Piper 3D export pontos szerkezete (minta szükséges) – ehhez külön parser kell.
- Élzárás-jelölések megfeleltetése, ha a forrás más kódokat használ.
