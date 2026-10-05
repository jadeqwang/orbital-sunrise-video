# Orbital Sunrise in Russian

Three singable Russian versions of the lyric, for a Russian-language cover in Suno with the 4:12 extended mix
(`release/extended/Orbital_Sunrise_extended.mp3`).

**Judge them here:** [Orbital Sunrise in Russian](https://claude.ai/artifact/DLZ1TAVuqyMC2yP9Z7zHAj) (private until shared from its
Share menu). The page has each section side by side, with back-translations, stress marks and syllable counts. ▶ plays that line of
the song, so you can sing the Russian over it. Each person picks a version per section and leaves notes, and the
"My mix" sheet at the bottom is ready to paste into Suno. Picks are shared between people who can edit the page. Anyone with
view-only access keeps their picks in their own browser and can copy them out as text.

| File | What it is |
|---|---|
| [`A_close.txt`](A_close.txt) | **A · Близко к тексту** (close to the English), ready to paste into Suno |
| [`B_leonov.txt`](B_leonov.txt) | **B · Голос Леонова** (Leonov's voice), ready to paste into Suno |
| [`C_song.txt`](C_song.txt) | **C · Песня** (Russian song first), ready to paste into Suno |
| [`SIDE_BY_SIDE.md`](SIDE_BY_SIDE.md) | Every line in all versions, with stress marks, back-translations, syllable counts and notes |
| [`lines.json`](lines.json) | Source for all of the above; `python3 tools/ru_lyrics.py` rebuilds the rest |
| [`compare.html`](compare.html) | The judging page (published as the link above) |

## The three versions

* **A · Близко к тексту.** Same images, same rhyme scheme, line by line. Its hook keeps «Орбитальный восход», the red
  Cyrillic already on screen in the film. That word is hard to sing on the melody, so hook candidate D is the singer's alternative.
* **B · Голос Леонова.** Built from the record and from Leonov's own words. It includes:
  * the 5-metre tether (фал);
  * the pressure he dropped without telling the ground («ни слова Земле»);
  * sweat up to his knees and the head-first entry;
  * steering by eye and the extra orbit;
  * Leonov holding Belyayev («Держись… держу… держись…»);
  * two nights in the taiga.

  Its hook plays on «Восход» being both "sunrise" and the ship's name. It also uses the real overshoot ("hundreds of versts")
  instead of the song's fifteen hundred.
* **C · Песня.** Written to sound like a Russian song rather than a translation. The stressed syllables land where the English
  stresses do: «Ви́жу восхо́д» sits on "Ór-bi-tal sun-ríse". The hook also echoes Gagarin's «Вижу Землю».
* **Hook candidates D (Первый восход) and E (Солнце встаёт).** Hook-only alternatives that can go with any version.

Sections are interchangeable. Each one (intro, hook, pre-chorus, breakdown, art, build, drop 2, strings, ending) rhymes within
itself, so a mix such as "C's hook, B's verses" is still a whole song.

## How the lines were fitted to the melody

The vocal was separated from the 4:12 mix (Kim_Vocal_2) and pitch-tracked line by line against the word timings in
`video/data/timing.json`. That showed where the long notes are:

* on "-rise" of "sunrise";
* on "me" and "home" (a short note, then a high held one);
* at the end of almost every line.

So the Russian lines mostly end on a stressed syllable, which puts a stressed open vowel on each held note. «Верни́ домо́й»
matches "bring me home" note for note: «-ни́» falls on the long "me" and «-мо́й» on the held "home". Russian lines run about 10%
longer than the English (202–205 syllables per version against 184), which is normal for singable Russian. The fit check is
`python3 tools/ru_lyrics.py --check`.

## In Suno

1. Use Cover on the 4:12 extended mix, with your voice persona.
2. Paste one of the `.txt` files (or the page's "My mix") as the lyrics. The bracketed tags are the same as the English sheet.
3. Add `Russian vocals` to the style prompt.
4. The `.txt` files have no stress marks, because accent marks don't help Suno. If Suno stresses a word wrongly, capitalise
   that word's stressed vowel (e.g. `добралИсь`) and generate again. Change only the words it gets wrong.

## Questions for the native speaker

The page shows these in red under the lines they belong to:

* A: does «Орбитальный» feel too long or too technical for the hook?
* A: «посадка в снегу» or «посадка в снег»? The rhyme with «смогу» needs «снегу».
* A: is «тыщи вёрст» charming or odd for 1965?
* B: does «Восход, Восход» sound like a radio call to the ship?
* B: does «пальцам — пустота одна» read as fingers lost inside ballooned gloves?
* C: does «Вижу восход» call Gagarin's «Вижу Землю» to mind?
* C: does the irony of «мимо чуть-чуть» land?
* C: добрали́сь or добра́лись?

All three versions have had a strict review pass for grammar, stress and unwanted associations. Several lines were
rewritten as a result:

* «Прими его» echoed a funeral prayer.
* «Автомат» first means a rifle.
* «Слов нет, но…» next to «Держись» echoed a political meme.

A native speaker's ear is still the test.

## Facts

Details come from [`docs/FACTS.md`](../../docs/FACTS.md) and Leonov's own accounts:

* «тишина такая, что звенит в ушах»
* «я слышал, как работает моё сердце»
* «в скафандре воды было по колено»
* «карандаш, хорошая бумага»

"Fifteen hundred klicks" is the song's own figure; the real overshoot was a few hundred kilometres. A and C keep the song's
number («полторы тыщи вёрст»), and B uses the real one («сотни вёрст»). The head-first entry follows Leonov's memoir. His 1965
report says feet first.
