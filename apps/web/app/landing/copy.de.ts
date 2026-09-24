import type { LandingCopy } from "./copy";

export const COPY_DE: LandingCopy = {
  meta: {
    title: "sendtally - Klettersessions loggen und deine Klettertrends sehen",
    description:
      "Logge jede Klettersession - Grade, Begehungen, Versuche und ein Anstrengungswert - und sieh deine Trends. Kostenlos, mit Strava-Posting.",
  },

  nav: {
    sections: [
      { label: "Trends", href: "#insights" },
      { label: "Sessions", href: "#session" },
      { label: "Strava", href: "#strava" },
      { label: "Mitgliedschaft", href: "#price" },
    ],
    signIn: "Anmelden",
    createAccount: "Konto erstellen",
    openApp: "App →",
    blog: "Blog",
  },

  hero: {
    features: [
      {
        key: "trends",
        eyebrow: "TREND-INSIGHTS",
        cardTitle: "Trends",
        cardCaption: "LETZTE 3 MONATE · 31 SESSIONS",
        chartLabel: "BOULDER PRO WOCHE",
      },
      {
        key: "tags",
        eyebrow: "TAGS & FILTER",
        cardTitle: "Tags",
        cardCaption: "4 TAGS · 31 SESSIONS",
        chartLabel: "SESSIONS PRO TAG",
      },
      {
        key: "effort",
        eyebrow: "ANSTRENGUNGSWERT",
        cardTitle: "Anstrengung",
        cardCaption: "ANSTRENGUNG · LETZTE 8 WOCHEN",
        chartLabel: "ANSTRENGUNG PRO SESSION",
      },
      {
        key: "pyramid",
        eyebrow: "GRADPYRAMIDE",
        cardTitle: "Pyramide",
        cardCaption: "LETZTE 3 MONATE · 90 BEGEHUNGEN",
        chartLabel: "BEGEHUNGEN NACH GRAD",
      },
      {
        key: "projects",
        eyebrow: "PROJEKT-TRACKING",
        cardTitle: "Projekte",
        cardCaption: "3 OFFEN · 1 GESCHAFFT",
      },
      {
        key: "strava",
        eyebrow: "STRAVA-POSTING",
        cardTitle: "Auf Strava gepostet",
        cardCaption: "HEUTE UM 18:42",
        chartLabel: "BEGEHUNGEN NACH GRAD",
      },
    ],
    faces: {
      stats: {
        climbs: "BOULDER",
        avgGrade: "Ø GRAD",
        flash: "FLASH",
        top: "TOP",
        tags: "TAGS",
        sessions: "SESSIONS",
        topTag: "TOP-TAG",
        avgRpe: "Ø ANSTRENGUNG",
        hardest: "HÄRTESTE",
        sends: "BEGEHUNGEN",
        avg: "Ø",
        open: "OFFEN",
        attempts: "VERSUCHE",
        time: "ZEIT",
        grades: "GRADE",
      },
      tags: ["Halle", "Board", "Fels", "Kraft"],
      weekPrefix: "W",
      projects: ["Die Kante", "Plattenboulder", "Dachquergang"],
      rpeLastSession: "ANSTRENGUNG LETZTE SESSION",
      via: "via sendtally",
      rockClimbing: "ROCK CLIMBING",
      stravaTitle: "Solide Klettersession - 18 Boulder, Top V7",
      projectMeta: "{sessions} Sessions · {attempts} Versuche",
    },
    title: "Dein neues Lieblings-Klettertagebuch",
    body: "Trag deine Sessions schnell und einfach ein - Grade, Begehungen, Versuche. Nutze die Anstrengungswertung, um über die Zeit zu verfolgen, wie hart sich dein Klettern anfühlt. Poste auf Strava und sieh dein Klettern neben deinen anderen Aktivitäten. Die Mitgliedschaft bringt Trends und Insights: Volumen, Gradpyramide, härteste Begehung, Flash-Quote und Durchschnittsgrad.",
  },

  free: {
    title: "Das meiste an sendtally kostet nichts.",
    features: [
      {
        eyebrow: "SESSIONS",
        title: "Logge so viel du willst",
        body: "Datum, Start und Ende, drinnen oder draußen, und jede Route mit Grad, Begehung oder Versuch und Anzahl der Versuche.",
        short: "Unbegrenzt Sessions mit jeder Route, jedem Grad und jedem Versuch",
      },
      {
        eyebrow: "ANSTRENGUNG",
        title: "Eine Anstrengungswertung für jede Session",
        body: "Jede Session wird von 1 bis 10 bewertet, gemessen an deinen eigenen letzten acht Wochen, damit du deine Trainingsbelastung siehst. Setz den Wert selbst oder lass ihn auf Auto.",
        short: "Anstrengungswert, 1-10, gemessen an deinen letzten acht Wochen",
      },
      {
        eyebrow: "TRENDS",
        title: "Jede Session, Route für Route",
        body: "Zeit, Routen, Begehungen, Flashes, Versuche, höchster Grad und Durchschnittsgrad, plus die komplette Routenliste, für jede geloggte Session gespeichert.",
        short:
          "Session-Aufschlüsselung: Zeit, Begehungen, Flashes, Versuche, höchster Grad und Durchschnitt",
      },
      {
        eyebrow: "TAGS",
        title: "Gruppieren und filtern",
        body: "Tagge Sessions nach Halle, Board oder Trainingsblock und filtere das Logbuch danach. Für Mitglieder wirken Tags auch in den Trend-Ansichten.",
        short: "Tags zum Gruppieren und Filtern des Logbuchs",
      },
      {
        eyebrow: "STRAVA",
        title: "Auf Strava gepostet, nie doppelt",
        body: "Eine Rock Climbing-Aktivität pro Session, mit Dauer, Begehungen, Versuchen und Graden schon ausgefüllt. Optional und nie hinter einer Paywall.",
        short: "Strava-Posting, eine Aktivität pro Session",
      },
      {
        eyebrow: "GRADE",
        title: "V-Skala oder Font, YDS oder Französisch",
        body: "Bewerte in beiden Skalen. Sportklettern oder Bouldern.",
        short: "V-Skala oder Font",
      },
    ],
    footnote: "Kostenlos loggen · keine Karte hinterlegt",
    cta: "Kostenlos loslegen →",
  },

  band: {
    eyebrow: "MITGLIEDSCHAFT",
    title: "In sechs Monaten willst du wissen, was sich verändert hat.",
    body: "Wer seine Sessions über längere Zeit loggt, baut eine Historie voller Erkenntnisse auf. Werde Mitglied und sieh deine Klettertrends.",
    cta: "Sieh, was Mitglieder sehen ↓",
  },

  trends: {
    title: "Fünf Ansichten, die nur Mitglieder sehen.",
    blurb:
      "Aufgebaut aus den Sessions, die du ohnehin loggst, über jeden Zeitraum von einem Monat bis allzeit.",
    rangeLabel: "ZEITRAUM",
    memberTag: "MITGLIED",
    cards: {
      volume: {
        eyebrow: "VOLUMEN",
        headline: "328 Boulder",
        meta: "22 SESSIONS · LETZTE 12 WOCHEN",
        body: "Die leere Woche im Juli war Urlaub, kein Einbruch. Das Volumen liegt seit Mai stabil bei rund dreißig Bouldern pro Woche.",
        memberLine:
          "Boulder und Sessions pro Woche, Monat oder Jahr - und die Wochen, die du ausgelassen hast.",
      },
      pyramid: {
        eyebrow: "GRADPYRAMIDE",
        headline: "111 Begehungen",
        meta: "ALLZEIT · NACH GRAD",
        body: "Eine V4-Basis mit 28 V5ern dahinter und zwei V7ern obendrauf. Die Form sagt: V6-Volumen ist es, was den nächsten Grad nährt.",
        memberLine:
          "Jede Begehung nach Grad gestapelt, damit du siehst, welcher Grad den nächsten trägt.",
      },
      hardest: {
        eyebrow: "HÄRTESTE BEGEHUNG",
        headline: "V7",
        meta: "30. JUL · NADELÖHR",
        body: "Zwölf Wochen von der ersten V6 zur ersten V7, und beide V7er kamen innerhalb von drei Wochen.",
        memberLine: "Dein Limit pro Zeitraum, mit der Route und dem Datum, die es gesetzt haben.",
      },
      flash: {
        eyebrow: "FLASH-QUOTE",
        headline: "36 %",
        meta: "HOCH VON 22 % IM MÄRZ",
        body: "Übertrainierst du, übernimmst du dich, oder gibst du nicht genug? Die Flash-Quote hilft dir herauszufinden, ob du in deiner Entwicklungszone kletterst.",
        memberLine:
          "Der Anteil, den du im ersten Versuch schaffst, über die Zeit verfolgt - Bewegungsgefühl, bevor sich die Grade bewegen.",
      },
      avggrade: {
        eyebrow: "DURCHSCHNITTSGRAD",
        headline: "V4.9 diese Woche",
        meta: "+0.7 SEIT MITTE MAI",
        body: "Der durchschnittliche Begehungsgrad ist über zwölf Wochen um etwa V0.7 gestiegen - stetig, kein Ausreißer, was zum Volumen dahinter passt. Ein Logbuch sagt dir, was du am Dienstag geklettert bist; das hier kann es dir nicht sagen.",
        memberLine:
          "Die langsame Linie durch alles, was du begehst - die eine Zahl, die dir ein Logbuch nie zeigen kann.",
      },
    },
  },

  session: {
    title: "Jede Session, Route für Route.",
    blurb: "Grade, Versuche und Ergebnisse - für jede Route über die Zeit gespeichert.",
    footnote: "6 VON 12 ROUTEN GEZEIGT · IN DER APP NACH BEGANGEN, GEFLASHT ODER PROJEKT FILTERN",
    sample: {
      title: "Dienstagabend - 30. Jul",
      meta: "DO 30. JUL · 19:02 · HALLE · 1H 28M",
      stats: {
        time: "ZEIT",
        climbs: "ROUTEN",
        sends: "BEGEHUNGEN",
        avgGrade: "Ø GRAD",
        flashes: "FLASHES",
        attempts: "VERSUCHE",
        top: "TOP",
      },
      headings: ["#", "ROUTE", "GRAD", "VERSUCHE", "ERGEBNIS"],
      burn: " Versuch",
      burns: " Versuche",
      results: { FLASH: "FLASH", SENT: "BEGANGEN", PROJECT: "PROJEKT" },
      climbs: [
        "Reibungskönig",
        "Zangengriff",
        "Deadpoint-Drill",
        "Fußfrei",
        "Nadelöhr",
        "Volle Kanne",
      ],
    },
  },

  strava: {
    eyebrow: "AUSSERDEM: STRAVA · KOSTENLOS",
    title: "Wir syncen mit Strava, wenn du magst.",
    body: "Jede geloggte Session wird eine Rock Climbing-Aktivität, mit Dauer, Begehungen, Versuchen und Graden schon ausgefüllt. Das ist für alle kostenlos und bleibt es auch - für den Strava-Sync verlangen wir nichts. Schalt es aus, und sendtally gehört dir trotzdem, allein für die Zahlen.",
    cta: "Konto erstellen →",
    preview: { meta: "Heute um 18:42 · Rock Climbing", chartLabel: "BEGEHUNGEN NACH GRAD" },
  },

  how: {
    title: "Eine Minute nach dem Klettern.",
    blurb:
      "Keine Konten zu verknüpfen, keine Importer zu babysitten. Logge die Session, und Anstrengungswert und Strava-Post folgen kostenlos daraus; die Trends bauen sich für Mitglieder von selbst.",
    steps: [
      {
        title: "Session loggen",
        body: "Datum, Zeiten, drinnen oder draußen, und die Routen - Grade in V-Skala oder Font, Begehungen und Versuche, Anzahl der Versuche. Etwa eine Minute, direkt nach dem Klettern.",
      },
      {
        title: "Anstrengungswert bekommen",
        body: "Jede Session wird von 1 bis 10 bewertet, gemessen an deinen eigenen letzten acht Wochen, damit sich ein harter Abend auch wie ein harter Abend liest - nicht nur wie eine Liste von Graden.",
      },
      {
        title: "Strava autorisieren",
        body: "Standard-OAuth, nur für Aktivitäten und sonst nichts. Wir sehen nie dein Passwort, wir schreiben nur die Sessions, die du loggst, und du kannst den Zugriff jederzeit bei Strava widerrufen.",
      },
    ],
  },

  details: {
    title: "Details",
    rows: [
      {
        label: "PRO ROUTE GESPEICHERT",
        body: "Grad in V-Skala oder Font, Begehung oder Versuch, Anzahl der Versuche und der Name der Route, wenn du einen vergibst",
      },
      {
        label: "ANSTRENGUNG",
        body: "Jede Session von 1 bis 10 bewertet, gemessen an deinen eigenen letzten acht Wochen - selbst setzen oder auf Auto lassen",
      },
      {
        label: "TRENDS",
        body: "Volumen, Gradpyramide, härteste Begehung, Flash-Quote und Durchschnittsgrad, wöchentlich oder allzeit - die Mitglieder-Hälfte",
      },
      {
        label: "STRAVA",
        body: "Optional und für alle kostenlos. Eine Rock Climbing-Aktivität pro Session, mit Fingerabdruck, damit nie etwas doppelt gepostet wird",
      },
      {
        label: "ABSCHIED",
        body: "Lösch dein Konto, und noch am selben Tag verschwinden alle Sessions und Tokens mit",
      },
    ],
  },

  price: {
    eyebrow: "MITGLIEDSCHAFT",
    title: "Loggen ist kostenlos. Die Mitgliedschaft bringt die Trends.",
    lead: "Zwei Dollar im Monat, jährlich abgerechnet, machen aus dem Logbuch tiefe Einblicke in deine Klettertrends.",
    free: {
      name: "Kostenlos",
      amount: "$0",
      suffix: " für immer",
      footnote: "KEINE KARTE · KEIN TESTZEITRAUM · KEIN SESSION-LIMIT",
      cta: "Konto erstellen →",
    },
    member: {
      name: "Mitglied",
      amount: "$2",
      suffix: "/Monat, jährlich abgerechnet · oder $3 monatlich",
      roadmapEyebrow: "ALLES AUS KOSTENLOS, PLUS DIE ROADMAP",
      roadmapBody:
        "Mitglieder bestimmen, was als Nächstes gebaut wird - wer den Server bezahlt, hat das erste Wort.",
      footnote: "JEDERZEIT KÜNDBAR",
      cta: "Mitglied werden →",
    },
  },

  stores: {
    lead: "Logge eine Session vom Handy:",
    ios: "sendtally im App Store laden",
    android: "sendtally bei Google Play holen",
    pending: "Bald verfügbar",
  },

  footer: {
    line: "sendtally · steht in keiner Verbindung zu Strava",
    trademarks:
      "Google Play und das Google Play-Logo sind Marken von Google LLC. Apple und das Apple-Logo sind Marken von Apple Inc.",
    links: [
      { label: "Anmelden", href: "/sign-in" },
      { label: "Blog", href: "/blog" },
      { label: "Datenschutz", href: "/privacy" },
      { label: "Nutzungsbedingungen", href: "/terms" },
      { label: "Support", href: "/support" },
    ],
  },
};
