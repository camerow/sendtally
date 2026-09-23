import type { LandingCopy } from "./copy";

export const COPY_FR: LandingCopy = {
  meta: {
    title: "sendtally - enregistrez vos séances d'escalade et suivez vos tendances",
    description:
      "Enregistrez chaque séance d'escalade - cotations, croix, essais et une note d'effort - puis suivez vos tendances. Gratuit, avec publication sur Strava.",
  },

  nav: {
    sections: [
      { label: "Tendances", href: "#insights" },
      { label: "Séances", href: "#session" },
      { label: "Strava", href: "#strava" },
      { label: "Abonnement", href: "#price" },
    ],
    signIn: "Se connecter",
    createAccount: "Créer un compte",
    openApp: "App →",
  },

  hero: {
    features: [
      {
        key: "trends",
        eyebrow: "TENDANCES",
        cardTitle: "Tendances",
        cardCaption: "3 DERNIERS MOIS · 31 SÉANCES",
        chartLabel: "BLOCS PAR SEMAINE",
      },
      {
        key: "tags",
        eyebrow: "TAGS & FILTRES",
        cardTitle: "Tags",
        cardCaption: "4 TAGS · 31 SÉANCES",
        chartLabel: "SÉANCES PAR TAG",
      },
      {
        key: "effort",
        eyebrow: "NOTE D'EFFORT",
        cardTitle: "Effort",
        cardCaption: "EFFORT · 8 DERNIÈRES SEMAINES",
        chartLabel: "EFFORT PAR SÉANCE",
      },
      {
        key: "pyramid",
        eyebrow: "PYRAMIDE DES COTATIONS",
        cardTitle: "Pyramide",
        cardCaption: "3 DERNIERS MOIS · 90 CROIX",
        chartLabel: "CROIX PAR COTATION",
      },
      {
        key: "projects",
        eyebrow: "SUIVI DES PROJETS",
        cardTitle: "Projets",
        cardCaption: "3 EN COURS · 1 ENCHAÎNÉ",
      },
      {
        key: "strava",
        eyebrow: "PUBLICATION STRAVA",
        cardTitle: "Publié sur Strava",
        cardCaption: "AUJOURD'HUI À 18:42",
        chartLabel: "CROIX PAR COTATION",
      },
    ],
    faces: {
      stats: {
        climbs: "BLOCS",
        avgGrade: "COT. MOY.",
        flash: "FLASH",
        top: "MAX",
        tags: "TAGS",
        sessions: "SÉANCES",
        topTag: "TAG N°1",
        avgRpe: "EFFORT MOY.",
        hardest: "MAX",
        sends: "CROIX",
        avg: "MOY.",
        open: "EN COURS",
        attempts: "ESSAIS",
        time: "DURÉE",
        grades: "COTATIONS",
      },
      tags: ["Salle", "Pan", "Extérieur", "Force"],
      weekPrefix: "S",
      projects: ["L'Arête", "La Dalle", "Traversée du toit"],
      rpeLastSession: "EFFORT DERNIÈRE SÉANCE",
      via: "via sendtally",
      rockClimbing: "ROCK CLIMBING",
      stravaTitle: "Bonne séance d'escalade - 18 blocs, max V7",
      projectMeta: "{sessions} séances · {attempts} essais",
    },
    title: "Votre nouveau carnet d'escalade préféré",
    body: "Enregistrez vos séances vite et simplement - cotations, croix, essais. Utilisez la note d’effort pour suivre dans le temps la difficulté ressentie. Publiez sur Strava pour voir votre escalade à côté de vos autres activités. L'abonnement ajoute les tendances et l'analyse : volume, pyramide des cotations, croix la plus dure, taux de flash et cotation moyenne.",
  },

  free: {
    title: "L'essentiel de sendtally ne coûte rien.",
    features: [
      {
        eyebrow: "SÉANCES",
        title: "Enregistrez autant que vous voulez",
        body: "Date, début et fin, salle ou extérieur, et chaque voie avec sa cotation, croix ou essai, et le nombre de tentatives.",
        short: "Séances illimitées avec chaque voie, cotation et tentative",
      },
      {
        eyebrow: "EFFORT",
        title: "Une note d’effort pour chaque séance",
        body: "Chaque séance est notée de 1 à 10 par rapport à vos huit dernières semaines, pour voir votre charge d'entraînement. Fixez-le vous-même ou laissez-le en auto.",
        short: "Note d'effort, de 1 à 10, par rapport à vos huit dernières semaines",
      },
      {
        eyebrow: "TENDANCES",
        title: "Chaque séance, voie par voie",
        body: "Durée, voies, croix, flashs, essais, cotation max et cotation moyenne, plus la liste complète des voies, conservés pour chaque séance enregistrée.",
        short: "Détail de séance : durée, croix, flashs, essais, cotation max et moyenne",
      },
      {
        eyebrow: "TAGS",
        title: "Grouper et filtrer",
        body: "Taguez vos séances par salle, pan ou bloc d'entraînement et filtrez le carnet avec. Les tags se retrouvent dans les écrans de tendances pour les abonnés.",
        short: "Des tags pour grouper et filtrer le carnet",
      },
      {
        eyebrow: "STRAVA",
        title: "Publié sur Strava, jamais en double",
        body: "Une activité Rock Climbing par séance, avec durée, croix, essais et cotations déjà remplis. Optionnel, et jamais payant.",
        short: "Publication Strava, une activité par séance",
      },
      {
        eyebrow: "COTATIONS",
        title: "Échelle V ou Font, YDS ou française",
        body: "Cotez dans l'une ou l'autre échelle. Voie ou bloc.",
        short: "Échelle V ou Font",
      },
    ],
    footnote: "Gratuit · aucune carte enregistrée",
    cta: "Commencer gratuitement →",
  },

  band: {
    eyebrow: "ABONNEMENT",
    title: "Dans six mois, vous voudrez savoir ce qui a changé.",
    body: "Enregistrer vos séances dans la durée crée un historique riche d'enseignements. Abonnez-vous pour voir vos tendances d'escalade.",
    cta: "Voir ce que voient les abonnés ↓",
  },

  trends: {
    title: "Cinq écrans réservés aux abonnés.",
    blurb:
      "Construits à partir des séances que vous enregistrez déjà, sur toute période d'un mois à tout l'historique.",
    rangeLabel: "PÉRIODE",
    memberTag: "ABONNÉ",
    cards: {
      volume: {
        eyebrow: "VOLUME",
        headline: "328 blocs",
        meta: "22 SÉANCES · 12 DERNIÈRES SEMAINES",
        body: "La semaine vide de juillet, c'était un voyage, pas un creux. Le volume tient autour de trente blocs par semaine depuis mai.",
        memberLine:
          "Blocs et séances par semaine, mois ou année - et les semaines que vous avez manquées.",
      },
      pyramid: {
        eyebrow: "PYRAMIDE DES COTATIONS",
        headline: "111 croix",
        meta: "TOUT L'HISTORIQUE · PAR COTATION",
        body: "Une base en V4 avec 28 V5 derrière et deux V7 au sommet. La forme dit que c'est le volume en V6 qui nourrit la cotation suivante.",
        memberLine:
          "Chaque croix empilée par cotation, pour voir quelle cotation porte la suivante.",
      },
      hardest: {
        eyebrow: "CROIX LA PLUS DURE",
        headline: "V7",
        meta: "30 JUIL · LE CHAS DE L'AIGUILLE",
        body: "Douze semaines entre le premier V6 et le premier V7, et les deux V7 sont tombés à trois semaines d'écart.",
        memberLine: "Votre plafond par période, avec le bloc et la date qui l'ont fixé.",
      },
      flash: {
        eyebrow: "TAUX DE FLASH",
        headline: "36 %",
        meta: "CONTRE 22 % EN MARS",
        body: "Surentraînement, trop d'ambition, ou pas assez d'engagement ? Le taux de flash aide à savoir si vous grimpez dans votre zone de progression.",
        memberLine:
          "La part réussie du premier coup, suivie dans le temps - la gestuelle avant que les cotations bougent.",
      },
      avggrade: {
        eyebrow: "COTATION MOYENNE",
        headline: "V4.9 cette semaine",
        meta: "+0.7 DEPUIS MI-MAI",
        body: "La cotation moyenne des croix a gagné environ V0.7 en douze semaines - régulier, pas un pic, ce qui colle au volume derrière. Un carnet vous dit ce que vous avez grimpé mardi ; il ne peut pas vous dire ça.",
        memberLine:
          "La ligne lente à travers tout ce que vous enchaînez - le seul chiffre qu'un carnet ne montrera jamais.",
      },
    },
  },

  session: {
    title: "Chaque séance, voie par voie.",
    blurb: "Cotations, essais et résultats - conservés pour chaque voie dans le temps.",
    footnote: "6 VOIES SUR 12 AFFICHÉES · FILTREZ PAR CROIX, FLASH OU PROJET DANS L'APP",
    sample: {
      title: "Mardi soir - 30 juil",
      meta: "JEU 30 JUIL · 19:02 · SALLE · 1H 28",
      stats: {
        time: "DURÉE",
        climbs: "VOIES",
        sends: "CROIX",
        avgGrade: "COT. MOY.",
        flashes: "FLASHS",
        attempts: "ESSAIS",
        top: "MAX",
      },
      headings: ["#", "VOIE", "COTATION", "ESSAIS", "RÉSULTAT"],
      burn: " essai",
      burns: " essais",
      results: { FLASH: "FLASH", SENT: "CROIX", PROJECT: "PROJET" },
      climbs: [
        "Adhérence pure",
        "Pince à sucre",
        "Jeté contrôlé",
        "Pieds coupés",
        "Le chas de l'aiguille",
        "Plein tube",
      ],
    },
  },

  strava: {
    eyebrow: "AUSSI : STRAVA · GRATUIT",
    title: "On synchronise avec Strava, si ça vous dit.",
    body: "Chaque séance enregistrée devient une activité Rock Climbing, avec durée, croix, essais et cotations déjà remplis. C'est gratuit pour tout le monde et ça le restera - la synchronisation Strava n'est pas payante. Désactivez-la et sendtally reste à vous, rien que pour les chiffres.",
    cta: "Créer votre compte →",
    preview: { meta: "Aujourd'hui à 18:42 · Rock Climbing", chartLabel: "CROIX PAR COTATION" },
  },

  how: {
    title: "Une minute après avoir grimpé.",
    blurb:
      "Aucun compte à relier, aucun import à surveiller. Enregistrez la séance : la note d'effort et la publication Strava en découlent gratuitement ; les tendances se construisent toutes seules pour les abonnés.",
    steps: [
      {
        title: "Enregistrez votre séance",
        body: "Date, horaires, salle ou extérieur, et les voies - cotations en échelle V ou Font, croix et essais, tentatives. Une minute environ, juste après avoir grimpé.",
      },
      {
        title: "Obtenez une note d'effort",
        body: "Chaque séance est notée de 1 à 10 par rapport à vos huit dernières semaines, pour qu'une grosse soirée se lise comme une grosse soirée - pas juste une liste de cotations.",
      },
      {
        title: "Autorisez Strava",
        body: "OAuth standard, limité aux activités et rien d'autre. Nous ne voyons jamais votre mot de passe, nous n'écrivons que les séances que vous enregistrez, et vous pouvez révoquer l'accès depuis Strava à tout moment.",
      },
    ],
  },

  details: {
    title: "Détails",
    rows: [
      {
        label: "CONSERVÉ PAR VOIE",
        body: "Cotation en échelle V ou Font, croix ou essai, tentatives, et le nom de la voie si vous en donnez un",
      },
      {
        label: "EFFORT",
        body: "Chaque séance notée de 1 à 10 par rapport à vos huit dernières semaines - fixez-la vous-même ou laissez-la en auto",
      },
      {
        label: "TENDANCES",
        body: "Volume, pyramide des cotations, croix la plus dure, taux de flash et cotation moyenne, par semaine ou sur tout l'historique - la moitié réservée aux abonnés",
      },
      {
        label: "STRAVA",
        body: "Optionnel et gratuit pour tout le monde. Une activité Rock Climbing par séance, avec une empreinte unique pour ne jamais publier en double",
      },
      {
        label: "DÉPART",
        body: "Supprimez votre compte et chaque séance et jeton part avec, le jour même",
      },
    ],
  },

  price: {
    eyebrow: "ABONNEMENT",
    title: "Enregistrer est gratuit. L'abonnement vous donne les tendances.",
    lead: "Deux dollars par mois, facturés à l'année, transforment le carnet en une analyse fine de vos tendances d'escalade.",
    free: {
      name: "Gratuit",
      amount: "$0",
      suffix: " pour toujours",
      footnote: "SANS CARTE · SANS ESSAI · SANS LIMITE DE SÉANCES",
      cta: "Créer votre compte →",
    },
    member: {
      name: "Abonné",
      amount: "$2",
      suffix: "/mois facturé à l'année · ou $3 au mois",
      roadmapEyebrow: "TOUT LE GRATUIT, PLUS LA FEUILLE DE ROUTE",
      roadmapBody:
        "Les abonnés décident de ce qui se construit ensuite - ceux qui paient le serveur ont la priorité.",
      footnote: "RÉSILIABLE À TOUT MOMENT",
      cta: "Devenir abonné →",
    },
  },

  stores: {
    lead: "Enregistrez une séance depuis votre téléphone :",
    ios: "Télécharger sendtally sur l'App Store",
    android: "Obtenir sendtally sur Google Play",
    pending: "Bientôt disponible",
  },

  footer: {
    line: "sendtally · sans lien avec Strava",
    trademarks:
      "Google Play et le logo Google Play sont des marques de Google LLC. Apple et le logo Apple sont des marques d'Apple Inc.",
    links: [
      { label: "Se connecter", href: "/sign-in" },
      { label: "Confidentialité", href: "/privacy" },
      { label: "Conditions", href: "/terms" },
      { label: "Support", href: "/support" },
    ],
  },
};
