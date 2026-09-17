# Importing and exporting climbing history as CSV

Sendtally imports a climbing history from a CSV file and exports everything a user has logged as one.
The importer accepts two formats: a Kaya export as Kaya produces it, and the Sendtally CSV format below.
The export is written in the Sendtally format, so an export re-imports as is.

Import lives at `/app/import` on the web and export is a download from Settings.
Both go through the API: `POST /v1/sessions/import` and `GET /v1/export.csv`.

## The Sendtally CSV format

One row per climb.
Rows with the same date and session name become one session, so the session's columns only need filling on the first row of that session.
A blank date continues the session above.
Columns can be in any order, and unknown columns are ignored.

| Column          | Required | Values                                                                                                              |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `date`          | yes      | `YYYY-MM-DD`. Blank repeats the row above.                                                                          |
| `session`       | no       | Any name, up to 120 characters. It becomes the session title and groups rows on the same date.                      |
| `location`      | no       | `indoor` or `outdoor`. Defaults to `indoor` when `gym` is filled, else `outdoor`.                                   |
| `gym`           | no       | A gym name. Matched case-insensitively against the user's gyms; an unmatched name becomes the session name instead. |
| `start_time`    | no       | `HH:MM`, 24 hour. Defaults to 12:00.                                                                                |
| `end_time`      | no       | `HH:MM`. Defaults to 90 minutes after the start. A session is at most 12 hours.                                     |
| `rpe`           | no       | 1 to 10. Leave blank and Sendtally scores the session from its climbs and the user's history.                       |
| `tags`          | no       | Tag names separated by `;`.                                                                                         |
| `session_notes` | no       | Free text about the day, up to 2000 characters.                                                                     |
| `climb`         | no       | The climb's name, up to 200 characters.                                                                             |
| `grade`         | yes      | `V0` to `V17`, Font `3` to `9C+`, YDS `5.5` to `5.15d`, or French `4a` to `9c`. See scale detection below.          |
| `kind`          | no       | `send` or `attempt`. `y`/`n` and `yes`/`no` are accepted. Defaults to `send`.                                       |
| `style`         | no       | `flash`, `onsight` or `redpoint`. Sends only. Onsight is for routes; on a boulder it reads as flash.                |
| `tries`         | no       | A whole number from 1 to 99. Defaults to 1. A flash or onsight with more than one try imports as a redpoint.        |
| `wall`          | no       | Wall or area within a gym, up to 40 characters.                                                                     |
| `climb_notes`   | no       | Free text about that climb, up to 2000 characters.                                                                  |

Scale detection reads the grade as written.
`V4` is a V grade, `6A+` (upper-case letter) is Font, `5.11b` is YDS, and `7a` (lower-case letter) is French.
`VB` reads as `V0`.
A trailing `+` or `-` that is not part of a known grade is dropped, so `V4+` reads as `V4` and `5.11b-` as `5.11b`.
Font and French keep theirs, because `7A+` and `7A` are different grades there.
A grade that matches none of these is reported as an error for that row; the row is skipped and the rest of the file imports.
A file where no row is usable is reported as unrecognised, and the review step offers the conversion prompt instead of a row-by-row list.

### Sample

```csv
date,session,location,gym,start_time,end_time,rpe,tags,session_notes,climb,grade,kind,style,tries,climb_notes
2022-11-22,Moe's Valley,outdoor,,,,8,trip,"Last day of the trip",Lindners Roof,V9,send,redpoint,30,"Stuck the start move consistently"
,,,,,,,,,Indolence,V7,send,,7,
,,,,,,,,,Pterodactyl,V1,send,flash,1,
2022-11-20,Moe's Valley,outdoor,,,,,,,Linders Roof,V9,attempt,,10,"Made it to the redpoint crux"
2023-01-05,,,Boulder Barn,18:00,19:30,,,,,6A+,send,flash,1,
```

## Kaya exports

A Kaya export has the columns `date, stiffness, rating, ascent_type, attempts, grade, color, climb_name, gym, location, country` and is recognised by its header.
It lists ascents only, one per row, with a UTC timestamp, so:

- The session date is the local date of the timestamp in the browser's time zone.
- Ascents on the same local date form one session. A gym ascent names the session after the gym; outdoor sessions stay unnamed, because Kaya's `location` column holds the boulder or formation rather than the crag.
- `Flash` and `Onsight` import as that style with one try. `Redpoint` imports with `attempts` tries. `Repeat` imports as a send with one try and no style.
- A row with no `attempts` imports as one try.
- `stiffness`, `rating`, `color`, `location` and `country` are not imported.

## What happens on import

The browser parses the file, groups rows into sessions, and validates every row with the same rules as the log-session form.
Nothing is sent until the user confirms on the review step.
The Worker then scores each session in date order against the user's history, so a session with no RPE gets the effort score it would have got had it been logged at the time.

Each imported session's fingerprint is derived from its rows (`import-<hash>`), so importing the same file twice skips the sessions that are already there rather than duplicating them.
Imported sessions are never posted to Strava.

## The export

`GET /v1/export.csv` returns one row per climb, oldest session first, with the importer's columns in the importer's order followed by `circuit`, `title`, `source` and `session_id`.
`rpe` holds the session's persisted score, whether the user gave it or Sendtally computed it.
Sessions from the discontinued board integration (`source = board`) are included.

## Converting another spreadsheet

Users with their own spreadsheet can paste the prompt below into an AI assistant together with the spreadsheet exported as CSV.
The same prompt is offered on the import page with a copy button.

```text
Convert the attached climbing log into a CSV that Sendtally can import. Output only the CSV.

Format: one row per climb, header row exactly:
date,session,location,gym,start_time,end_time,rpe,tags,session_notes,climb,grade,kind,style,tries,climb_notes

Rules:
- date is YYYY-MM-DD. Every row carries its date; if the source only writes the date on the first climb of a day, fill it down.
- Climbs on the same date belong to one session. Put the crag, area or gym name in session (fill it down too). location is "outdoor" for crags and "indoor" for gyms; gym is the gym name for indoor sessions.
- grade is written as logged: V4, 6A+, 5.11b, 7a. Do not convert between scales. If the source has separate boulder and route grade columns, use whichever is filled. A YDS grade written without the "5." prefix, like "11b", is "5.11b".
- kind is "send" when the climb was topped and "attempt" when it was not (a "y/n" sent column, "project", "fell", "no send"). Default to send.
- style is "flash" when sent first try with prior knowledge, "onsight" (routes only) when sent first try with none, "redpoint" for any other send. Leave it blank if the source does not say. A repeat is a send with tries 1.
- tries is the number of attempts that day, a whole number. Blank means 1.
- rpe is only filled when the source records effort on a 1-10 scale. Otherwise leave it blank.
- session_notes holds anything written about the day; climb_notes anything written about that climb. Quote fields that contain commas or line breaks.
- Skip rows with no grade and no climb name. Do not invent values.
```
