# Fájlformátumok

## Forrásformátum

A pontos mezők még nincsenek rögzítve. A parser elkészítéséhez szükséges:

- legalább egy valós forrásfájl;
- az oszlopok jelentése és mértékegysége;
- kötelező és opcionális mezők;
- egy fájl több munkájának vagy bútorelemének elkülönítési szabálya;
- hibás vagy hiányos sorok kezelésének elvárt módja.

## Zsalu Kft. Excel

- Munkalap neve: `munka`
- Egy sor egy alkatrészt jelent; külön darabszámmező nincs.
- Oszlopok:
  - `#`
  - `Szálirány`
  - `Kereszti.`
  - `Élzárás`
  - `Szál. 1`
  - `Szál. 2`
  - `Ker. 1`
  - `Ker. 2`
  - `Forg.`
  - `Munka azonosító`
  - `Bútor`
  - `Elem`
  - `Megjegyzés`

### Ismert jelölések

- Élzárás: `1` = vastag, `2` = vékony, `0` = nincs.
- `A`/`a` a száliránnyal párhuzamos, `B`/`b` a keresztirányú éleket jelöli.
- A nagybetű vastag, a kisbetű vékony élzárást jelent.
- `Forg.` értéke `X`, ha az alkatrész forgatható.

## Nyitott kérdések

- A forrásfájl pontos típusa és szerkezete.
- A forrásmezők és a Zsalu-oszlopok teljes megfeleltetése.
- Az anyag-, front- és hátfalszabályok.
- A hibajelzés és a javítható előnézet elvárt működése.
- A fájlok kizárólag böngészőben vagy szerveren is feldolgozhatók-e.

