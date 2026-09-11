# Store listing

Copy for App Store Connect and Google Play Console, taken from the Sendtally Marketing Kit design canvas.
Character limits are in brackets.
Regenerate the images with `pnpm --filter @sendtally/mobile store:render`; they land in `store/out/`.

Metadata here is written for search, not just for reading.
Apple combines words across the app name, subtitle, and keyword field automatically, so no word appears in more than one of those three.
Google indexes the short and full descriptions instead, so the description carries the search terms in prose.

## Names and short copy

**App name** [30]

```
Sendtally: Climbing log
```

**Subtitle, iOS** [30]

```
Bouldering tracker & trends
```

**Title, Play** [30]

```
Sendtally: Climbing log
```

**Short description, Play** [80]

```
Log bouldering & climbing sessions: effort score, grade trends, Strava sync.
```

**Promotional text, iOS** [170]

```
Every session scored 1 to 10 against your own last eight weeks. One Strava activity per session, never doubled. Logging is free; membership adds the trends.
```

**Keywords, iOS** [100, comma separated]

```
boulder,gym,send,crag,route,grade,tracker,journal,workout,rpe,kilter,tension,moonboard,strava,belay
```

No spaces after the commas, and no word repeated from the app name or subtitle: Apple builds the phrases itself, so "climbing" in the name already pairs with "log", "gym", and "tracker" here.

`strava`, `kilter`, `tension`, and `moonboard` are other people's trademarks.
Apple sometimes rejects a keyword field carrying them, which costs a metadata resubmission rather than a binary one.
Submit the first release without those four, then add them in the following update once the app is approved.

**Category**

Primary: Health & Fitness.
Secondary: Sports.

## Description, both stores

```
sendtally is a session log for climbing and bouldering.

Log a bouldering session at the gym or a day at the crag in about a minute: date, times, grades in V-scale or Font, sends and attempts, tries, and a name for the climb if you want one. Every session gets an effort score from 1 to 10, measured against your own last eight weeks rather than a fixed scale, so a big night reads as a big night.

Turn on Strava and each session posts as one Rock Climbing activity with the climb log and effort score in the description. Sessions are fingerprinted, so a re-sync never posts twice.

This is a training journal, not a workout generator. sendtally records what you actually climbed, whether you boulder, climb ropes, or split the week between both, and shows you the shape of it over months.

Free, for everyone:
· Unlimited session logging, indoor and outdoor
· Bouldering and rope climbing, V-scale, Font, YDS or French
· Effort score on every session
· Strava sync
· Session history by month

Membership adds the trends:
· Climbing volume over time
· Grade pyramid
· Hardest send
· Flash rate
· Average grade

We never store your Strava password. Standard OAuth with activity-write scope only, revocable from Strava at any time. Delete your account and every session and token goes with it the same day.

Membership is an auto-renewing subscription, monthly or yearly. Join in the app or on sendtally.com; either one unlocks the trends everywhere.
```

## What's new, first release

```
First release. Log sessions, get an effort score, sync to Strava.
```

Play takes this; the App Store refuses it on a first version.
Setting `whatsNew` there returns `409 STATE_ERROR`, "Attribute 'whatsNew' cannot be edited at this time", because release notes describe a change from a previous version and there is none.
It becomes editable from the second version onward.

## Assets

Screenshot order puts Strava second: only the first two are visible without swiping, and Strava is the strongest hook for a climber who already has the app.

| Asset                          | Size                | File                                                |
| ------------------------------ | ------------------- | --------------------------------------------------- |
| iOS screenshots, 6.9" and 6.7" | 1290x2796           | `out/ios/1-sessions.png` through `5-trends.png`     |
| Play phone screenshots         | 1080x1920           | `out/android/1-sessions.png` through `5-trends.png` |
| Play feature graphic           | 1024x500            | `out/feature-graphic.png`                           |
| Play icon                      | 512x512             | `out/play-icon-512.png`                             |
| iOS icon                       | 1024x1024, no alpha | `../assets/icon.png`, shipped in the build          |

Screenshot captions, in order: "Every session, in about a minute.", "Your climbing on Strava", "Log it right after you climb.", "See the whole night, climb by climb.", "Watch six months add up."

iPad screenshots are not needed: `supportsTablet` is false.
Nor is a 6.5" set: App Store Connect accepts the 1290x2796 images as the one required iPhone size and scales them down for smaller devices.

## Localizations

German, French and Spanish, written to the same rules the translation brief carries: grade scales and terms of art stay untranslated, and every field is rewritten to fit its cap rather than translated and truncated.

`store/play-listing.csv` carries these three plus English for Play Console's translation upload: one row per language, columns `Language`, `App name`, `Short description`, `Full description`.
Release notes are deliberately not in it - they belong to a release, not to a store listing.
Only filled rows are included; a row naming a language with empty fields risks being read as an instruction to blank that listing.
Regenerate the file if any of the English copy changes here.

Google does not publish the importer's expected headers.
If an upload reports "Language import skipped", check the column names against whatever template or example the console offers at the upload step and correct them here.

### German (`de-DE`)

"Begehung" is the German climbing word for a send, and "Flash-Quote" keeps flash as the loanword climbers actually use.
Grade scales stay as proper names: V-Skala, Fontainebleau, YDS, Franzoesisch.

**App name** [30, using 26]

```
Sendtally: Kletter-Logbuch
```

**Subtitle, iOS** [30, using 27]

```
Bouldern, Trainingstagebuch
```

**Short description, Play** [80, using 70]

```
Boulder- und Klettersessions loggen: Anstrengung, Grad-Trends, Strava.
```

**Keywords, iOS** [100, using 100]

```
boulder,halle,fels,grad,tour,route,tracker,training,rpe,strava,kilter,tension,moonboard,seil,sichern
```

**Description** [4000, using 1719]

```
Sendtally ist ein Session-Logbuch fürs Klettern und Bouldern.

Eine Hallensession oder einen Tag am Fels in etwa einer Minute eintragen: Datum, Zeiten, Grade in V-Skala, Fontainebleau, YDS oder Französisch, Begehungen und Versuche, Anzahl der Versuche und auf Wunsch ein Name für die Route. Jede Session bekommt einen Anstrengungswert von 1 bis 10, gemessen an deinen eigenen letzten acht Wochen statt an einer festen Skala. So liest sich ein harter Abend auch wie ein harter Abend.

Mit aktiviertem Strava wird jede Session als eine einzige Rock Climbing-Aktivität gepostet, mit dem Kletterprotokoll und dem Anstrengungswert in der Beschreibung. Sessions tragen einen Fingerabdruck, ein erneuter Sync postet also nie doppelt.

Das hier ist ein Trainingstagebuch, kein Trainingsplan-Generator. Sendtally hält fest, was du tatsächlich geklettert bist, ob du boulderst, im Seil kletterst oder beides über die Woche verteilst, und zeigt dir die Entwicklung über Monate.

Kostenlos, für alle:
· Unbegrenzt Sessions loggen, drinnen und draußen
· Bouldern und Seilklettern, V-Skala, Fontainebleau, YDS oder Französisch
· Anstrengungswert für jede Session
· Strava-Sync
· Sessionverlauf nach Monat

Die Mitgliedschaft bringt die Trends:
· Klettervolumen über die Zeit
· Gradpyramide
· Härteste Begehung
· Flash-Quote
· Durchschnittsgrad

Wir speichern niemals dein Strava-Passwort. Standard-OAuth, nur mit activity-write-Scope, jederzeit über Strava widerrufbar. Wenn du dein Konto löschst, verschwinden noch am selben Tag alle Sessions und Tokens mit.

Die Mitgliedschaft ist ein automatisch verlängertes Abo, monatlich oder jährlich. Schließ sie in der App oder auf sendtally.com ab; beides schaltet die Trends überall frei.
```

**What's new** [500, using 86]

```
Erste Version. Sessions loggen, Anstrengungswert bekommen, mit Strava synchronisieren.
```

### French (`fr-FR`)

"Croix" is what French climbers call a send, "cotation" a grade, and "bloc" is bouldering.
Note the French spacing before the colon in the title.

**App name** [30, using 29]

```
Sendtally : carnet d'escalade
```

**Subtitle, iOS** [30, using 28]

```
Bloc, cotations et tendances
```

**Short description, Play** [80, using 74]

```
Enregistrez vos séances de bloc et d'escalade : effort, cotations, Strava.
```

**Keywords, iOS** [100, using 100]

```
salle,voie,falaise,cotation,journal,seance,entrainement,rpe,strava,kilter,tension,moonboard,assurage
```

**Description** [4000, using 1749]

```
Sendtally est un carnet de séances pour l'escalade et le bloc.

Enregistrez une séance en salle ou une journée en falaise en une minute environ : date, horaires, cotations en échelle V, Fontainebleau, YDS ou française, réussites et essais, nombre de tentatives, et le nom de la voie si vous le voulez. Chaque séance reçoit une note d'effort de 1 à 10, mesurée par rapport à vos huit dernières semaines plutôt qu'à une échelle fixe : une grosse soirée se lit donc comme une grosse soirée.

Activez Strava et chaque séance est publiée comme une seule activité Rock Climbing, avec le détail des voies et la note d'effort dans la description. Les séances portent une empreinte unique, une resynchronisation ne publie donc jamais deux fois.

C'est un carnet d'entraînement, pas un générateur de séances. Sendtally note ce que vous avez réellement grimpé, que vous fassiez du bloc, de la voie, ou les deux dans la semaine, et vous montre l'évolution sur plusieurs mois.

Gratuit, pour tout le monde :
· Séances illimitées, en salle et en extérieur
· Bloc et escalade en tête, échelle V, Fontainebleau, YDS ou française
· Note d'effort sur chaque séance
· Synchronisation Strava
· Historique par mois

L'abonnement ajoute les tendances :
· Volume grimpé dans le temps
· Pyramide des cotations
· Croix la plus dure
· Taux de flash
· Cotation moyenne

Nous ne stockons jamais votre mot de passe Strava. OAuth standard, avec la seule autorisation activity-write, révocable depuis Strava à tout moment. Supprimez votre compte et toutes vos séances et vos jetons partent avec, le jour même.

L'abonnement est à renouvellement automatique, mensuel ou annuel. Souscrivez dans l'application ou sur sendtally.com : l'un comme l'autre débloque les tendances partout.
```

**What's new** [500, using 95]

```
Première version. Enregistrez vos séances, obtenez une note d'effort, synchronisez avec Strava.
```

### Spanish (`es-ES`)

"Encadenar" is to send and "pegues" are attempts, both standard in Spanish climbing.
"Rocodromo" is the climbing gym and carries real search volume.

**App name** [30, using 29]

```
Sendtally: diario de escalada
```

**Subtitle, iOS** [30, using 27]

```
Búlder, grados y tendencias
```

**Short description, Play** [80, using 69]

```
Registra tus sesiones de búlder y escalada: esfuerzo, grados, Strava.
```

**Keywords, iOS** [100, using 98]

```
boulder,rocodromo,via,roca,grado,sesion,entrenamiento,registro,rpe,strava,kilter,tension,moonboard
```

**Description** [4000, using 1734]

```
Sendtally es un diario de sesiones para escalada y búlder.

Registra una sesión en el rocódromo o un día en roca en aproximadamente un minuto: fecha, horas, grados en escala V, Fontainebleau, YDS o francesa, encadenes e intentos, número de pegues y el nombre de la vía si quieres. Cada sesión recibe una puntuación de esfuerzo del 1 al 10, medida contra tus propias últimas ocho semanas en lugar de contra una escala fija, así que una noche dura se lee como una noche dura.

Activa Strava y cada sesión se publica como una única actividad Rock Climbing, con el registro de vías y la puntuación de esfuerzo en la descripción. Las sesiones llevan una huella única, así que volver a sincronizar nunca publica dos veces.

Esto es un diario de entrenamiento, no un generador de rutinas. Sendtally registra lo que realmente has escalado, ya escales búlder, de cuerda, o repartas la semana entre ambos, y te muestra la evolución a lo largo de los meses.

Gratis, para todo el mundo:
· Sesiones ilimitadas, en interior y exterior
· Búlder y escalada de cuerda, escala V, Fontainebleau, YDS o francesa
· Puntuación de esfuerzo en cada sesión
· Sincronización con Strava
· Historial de sesiones por mes

La suscripción añade las tendencias:
· Volumen de escalada a lo largo del tiempo
· Pirámide de grados
· Encadene más duro
· Porcentaje de flash
· Grado medio

Nunca guardamos tu contraseña de Strava. OAuth estándar, solo con el permiso activity-write, revocable desde Strava en cualquier momento. Borra tu cuenta y todas las sesiones y tokens se van con ella el mismo día.

La suscripción es de renovación automática, mensual o anual. Suscríbete en la app o en sendtally.com; cualquiera de las dos desbloquea las tendencias en todas partes.
```

**What's new** [500, using 92]

```
Primera versión. Registra sesiones, obtén una puntuación de esfuerzo, sincroniza con Strava.
```

### Spanish (Latin America) (`es-419`)

Adapted from the Castilian copy, not copied.
"Rocodromo" and "pegues" are Spain-only, and "boulder" is the usual word outside Spain; "encadenar" travels and stays.

**App name** [30, using 29]

```
Sendtally: diario de escalada
```

**Subtitle, iOS** [30, using 28]

```
Boulder, grados y tendencias
```

**Short description, Play** [80, using 70]

```
Registra tus sesiones de boulder y escalada: esfuerzo, grados, Strava.
```

**Keywords, iOS** [100, using 98]

```
muro,via,roca,grado,sesion,entrenamiento,registro,rpe,strava,kilter,tension,moonboard,cuerda,presa
```

**Description** [4000, using 1742]

```
Sendtally es un diario de sesiones para escalada y boulder.

Registra una sesión en el muro o un día en roca en aproximadamente un minuto: fecha, horas, grados en escala V, Fontainebleau, YDS o francesa, si lo encadenaste o no, cuántos intentos te tomó y el nombre de la vía si quieres. Cada sesión recibe una puntuación de esfuerzo del 1 al 10, medida contra tus propias últimas ocho semanas en lugar de contra una escala fija, así que una noche dura se lee como una noche dura.

Activa Strava y cada sesión se publica como una única actividad Rock Climbing, con el registro de vías y la puntuación de esfuerzo en la descripción. Las sesiones llevan una huella única, así que volver a sincronizar nunca publica dos veces.

Esto es un diario de entrenamiento, no un generador de rutinas. Sendtally registra lo que realmente has escalado, ya escales boulder, de cuerda, o repartas la semana entre ambos, y te muestra la evolución a lo largo de los meses.

Gratis, para todo el mundo:
· Sesiones ilimitadas, en interior y exterior
· Boulder y escalada de cuerda, escala V, Fontainebleau, YDS o francesa
· Puntuación de esfuerzo en cada sesión
· Sincronización con Strava
· Historial de sesiones por mes

La suscripción añade las tendencias:
· Volumen de escalada a lo largo del tiempo
· Pirámide de grados
· Encadene más duro
· Porcentaje de flash
· Grado medio

Nunca guardamos tu contraseña de Strava. OAuth estándar, solo con el permiso activity-write, revocable desde Strava en cualquier momento. Borra tu cuenta y todas las sesiones y tokens se van con ella el mismo día.

La suscripción es de renovación automática, mensual o anual. Suscríbete en la app o en sendtally.com; cualquiera de las dos desbloquea las tendencias en todas partes.
```

**What's new** [500, using 92]

```
Primera versión. Registra sesiones, obtén una puntuación de esfuerzo, sincroniza con Strava.
```

## Console setup beyond the copy

These are store-side and cost nothing, but none of them live in this repo.

- **Extra localizations.** Each one gets its own separately indexed keyword field. Add `en-GB` and `en-AU` on iOS first: same copy, and the second keyword field takes the terms that did not fit above (`training`, `climbing gym`, `logbook`, `hangboard`, `spray wall`). German, French, and Spanish next; climbing is large in all three.
- **Custom Product Pages, iOS.** 35 of them, each with its own URL, its own screenshots, and its own conversion analytics. Give every influencer partnership its own page so the installs are attributable. Play's equivalent is Custom Store Listings plus an install referrer.
- **In-App Events, iOS.** Indexed by App Store search, so they are another keyword surface as well as a merchandising one.
- **Ratings.** The app asks for a review after the fifth logged session (`apps/mobile/lib/review.ts`). Rating count and average move ranking harder than any copy change here.

## URLs

- Privacy policy: `https://sendtally.com/privacy`
- Support: `https://sendtally.com/support`
- Marketing: `https://sendtally.com`

## Play data safety

- Email address, collected for the account, tied to the user, not shared, deletable in app.
- App activity (logged sessions), tied to the user, not shared, deletable in app.
- Purchase history (Financial info), collected by the RevenueCat SDK to validate membership, tied to the user, not shared, deleted with the account.
- No advertising SDK.
- Data in transit is encrypted; account deletion is available in the app under Settings.

## App Review notes

Membership is an auto-renewing subscription sold in the app through the store's billing (a monthly product and a yearly one, in a single subscription group), and also on sendtally.com.
The trends screens are gated on it; the paywall on the Trends tab carries both plans, the price and renewal terms, restore purchases, and the terms and privacy links.
The yearly card headlines the per-month equivalent and states the billed-yearly total underneath it, which is what the store returns for the annual package.
Reviewers need the demo account so the trends screens in the screenshots are reachable without buying.
The demo account signs in with a password; every other account signs in with an emailed one-time code, which is why the form gets a username and password plus that one sentence under "Any other information required to access your app".
