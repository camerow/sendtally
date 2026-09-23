import type { LandingCopy } from "./copy";

export const COPY_ES: LandingCopy = {
  meta: {
    title: "sendtally - registra tus sesiones de escalada y mira tus tendencias",
    description:
      "Registra cada sesión de escalada - grados, encadenes, intentos y una puntuación de esfuerzo - y sigue tus tendencias. Gratis, con publicación en Strava.",
  },

  nav: {
    sections: [
      { label: "Tendencias", href: "#insights" },
      { label: "Sesiones", href: "#session" },
      { label: "Strava", href: "#strava" },
      { label: "Suscripción", href: "#price" },
    ],
    signIn: "Iniciar sesión",
    createAccount: "Crear cuenta",
    openApp: "App →",
  },

  hero: {
    features: [
      {
        key: "trends",
        eyebrow: "TENDENCIAS",
        cardTitle: "Tendencias",
        cardCaption: "ÚLTIMOS 3 MESES · 31 SESIONES",
        chartLabel: "BLOQUES POR SEMANA",
      },
      {
        key: "tags",
        eyebrow: "ETIQUETAS Y FILTROS",
        cardTitle: "Etiquetas",
        cardCaption: "4 ETIQUETAS · 31 SESIONES",
        chartLabel: "SESIONES POR ETIQUETA",
      },
      {
        key: "effort",
        eyebrow: "PUNTUACIÓN DE ESFUERZO",
        cardTitle: "Esfuerzo",
        cardCaption: "ESFUERZO · ÚLTIMAS 8 SEMANAS",
        chartLabel: "ESFUERZO POR SESIÓN",
      },
      {
        key: "pyramid",
        eyebrow: "PIRÁMIDE DE GRADOS",
        cardTitle: "Pirámide",
        cardCaption: "ÚLTIMOS 3 MESES · 90 ENCADENES",
        chartLabel: "ENCADENES POR GRADO",
      },
      {
        key: "projects",
        eyebrow: "SEGUIMIENTO DE PROYECTOS",
        cardTitle: "Proyectos",
        cardCaption: "3 ABIERTOS · 1 ENCADENADO",
      },
      {
        key: "strava",
        eyebrow: "PUBLICACIÓN EN STRAVA",
        cardTitle: "Publicado en Strava",
        cardCaption: "HOY A LAS 18:42",
        chartLabel: "ENCADENES POR GRADO",
      },
    ],
    faces: {
      stats: {
        climbs: "BLOQUES",
        avgGrade: "GRADO MEDIO",
        flash: "FLASH",
        top: "MÁX",
        tags: "ETIQUETAS",
        sessions: "SESIONES",
        topTag: "ETIQUETA TOP",
        avgRpe: "ESFUERZO MEDIO",
        hardest: "MÁS DURO",
        sends: "ENCADENES",
        avg: "MEDIA",
        open: "ABIERTOS",
        attempts: "PEGUES",
        time: "TIEMPO",
        grades: "GRADOS",
      },
      tags: ["Rocódromo", "Muro", "Roca", "Fuerza"],
      weekPrefix: "S",
      projects: ["La Arista", "El Placón", "Travesía del techo"],
      rpeLastSession: "ESFUERZO ÚLTIMA SESIÓN",
      via: "via sendtally",
      rockClimbing: "ROCK CLIMBING",
      stravaTitle: "Buena sesión de escalada - 18 bloques, máx V7",
      projectMeta: "{sessions} sesiones · {attempts} pegues",
    },
    title: "Tu nuevo diario de escalada favorito",
    body: "Registra tus sesiones rápido y fácil - grados, encadenes, intentos. Usa la nota de esfuerzo para seguir lo duro que se siente tu escalada con el tiempo. Publica en Strava y ve tu escalada junto a tus otras actividades. La suscripción añade tendencias y análisis: volumen, pirámide de grados, encadene más duro, porcentaje de flash y grado medio.",
  },

  free: {
    title: "La mayor parte de sendtally no cuesta nada.",
    features: [
      {
        eyebrow: "SESIONES",
        title: "Registra todo lo que quieras",
        body: "Fecha, inicio y fin, rocódromo o roca, y cada vía con su grado, encadene o intento, y número de pegues.",
        short: "Sesiones ilimitadas con cada vía, grado y pegue",
      },
      {
        eyebrow: "ESFUERZO",
        title: "Una nota de esfuerzo en cada sesión",
        body: "Cada sesión se puntúa del 1 al 10 contra tus propias últimas ocho semanas, para que veas tu carga de entrenamiento. Ponla tú o déjala en automático.",
        short: "Puntuación de esfuerzo, del 1 al 10, contra tus últimas ocho semanas",
      },
      {
        eyebrow: "TENDENCIAS",
        title: "Cada sesión, vía a vía",
        body: "Tiempo, vías, encadenes, flashes, intentos, grado máximo y grado medio, más la lista completa de vías, guardados en cada sesión que registras.",
        short: "Desglose de sesión: tiempo, encadenes, flashes, intentos, grado máximo y medio",
      },
      {
        eyebrow: "ETIQUETAS",
        title: "Agrupa y filtra",
        body: "Etiqueta sesiones por rocódromo, muro o bloque de entrenamiento y filtra el diario con ellas. Las etiquetas pasan a las pantallas de tendencias para los suscriptores.",
        short: "Etiquetas para agrupar y filtrar el diario",
      },
      {
        eyebrow: "STRAVA",
        title: "Publicado en Strava, nunca duplicado",
        body: "Una actividad Rock Climbing por sesión con duración, encadenes, intentos y grados ya rellenados. Opcional, y nunca de pago.",
        short: "Publicación en Strava, una actividad por sesión",
      },
      {
        eyebrow: "GRADOS",
        title: "Escala V o Font, YDS o francesa",
        body: "Gradúa en cualquiera de las escalas. Escalada deportiva o búlder.",
        short: "Escala V o Font",
      },
    ],
    footnote: "Registro gratis · sin tarjeta",
    cta: "Empieza a registrar gratis →",
  },

  band: {
    eyebrow: "SUSCRIPCIÓN",
    title: "Dentro de seis meses querrás saber qué ha cambiado.",
    body: "Registrar tus sesiones a lo largo del tiempo crea un historial lleno de información. Suscríbete para ver tus tendencias de escalada.",
    cta: "Mira lo que ven los suscriptores ↓",
  },

  trends: {
    title: "Cinco pantallas que solo ven los suscriptores.",
    blurb:
      "Construidas con las sesiones que ya registras, en cualquier rango de un mes a todo el historial.",
    rangeLabel: "RANGO",
    memberTag: "SUSCRIPTOR",
    cards: {
      volume: {
        eyebrow: "VOLUMEN",
        headline: "328 bloques",
        meta: "22 SESIONES · ÚLTIMAS 12 SEMANAS",
        body: "La semana vacía de julio fue un viaje, no un bajón. El volumen se mantiene cerca de treinta bloques por semana desde mayo.",
        memberLine: "Bloques y sesiones por semana, mes o año - y las semanas que te saltaste.",
      },
      pyramid: {
        eyebrow: "PIRÁMIDE DE GRADOS",
        headline: "111 encadenes",
        meta: "HISTÓRICO · POR GRADO",
        body: "Una base de V4 con 28 V5 detrás y dos V7 arriba. La forma dice que el volumen en V6 es lo que alimenta el siguiente grado.",
        memberLine: "Cada encadene apilado por grado, para ver qué grado sostiene al siguiente.",
      },
      hardest: {
        eyebrow: "ENCADENE MÁS DURO",
        headline: "V7",
        meta: "30 JUL · EL OJO DE LA AGUJA",
        body: "Doce semanas del primer V6 al primer V7, y los dos V7 cayeron con tres semanas de diferencia.",
        memberLine: "Tu techo por periodo, con el bloque y la fecha que lo marcaron.",
      },
      flash: {
        eyebrow: "PORCENTAJE DE FLASH",
        headline: "36 %",
        meta: "DESDE EL 22 % DE MARZO",
        body: "¿Sobreentrenas, te pasas de ambición o no aprietas lo suficiente? El porcentaje de flash te ayuda a saber si estás en tu zona de progresión.",
        memberLine:
          "La parte que sacas al primer pegue, seguida en el tiempo - la técnica antes de que se muevan los grados.",
      },
      avggrade: {
        eyebrow: "GRADO MEDIO",
        headline: "V4.9 esta semana",
        meta: "+0.7 DESDE MEDIADOS DE MAYO",
        body: "El grado medio de encadene ha subido cerca de V0.7 en doce semanas - constante, no un pico, lo que cuadra con el volumen detrás. Un diario te dice qué escalaste el martes; esto no te lo puede decir.",
        memberLine:
          "La línea lenta a través de todo lo que encadenas - el único número que un diario nunca te enseña.",
      },
    },
  },

  session: {
    title: "Cada sesión, vía a vía.",
    blurb: "Grados, pegues y resultados - guardados para cada vía a lo largo del tiempo.",
    footnote: "6 DE 12 VÍAS MOSTRADAS · FILTRA POR ENCADENADO, FLASH O PROYECTO EN LA APP",
    sample: {
      title: "Martes por la noche - 30 jul",
      meta: "JUE 30 JUL · 19:02 · ROCÓDROMO · 1H 28M",
      stats: {
        time: "TIEMPO",
        climbs: "VÍAS",
        sends: "ENCADENES",
        avgGrade: "GRADO MEDIO",
        flashes: "FLASHES",
        attempts: "PEGUES",
        top: "MÁX",
      },
      headings: ["#", "VÍA", "GRADO", "PEGUES", "RESULTADO"],
      burn: " pegue",
      burns: " pegues",
      results: { FLASH: "FLASH", SENT: "ENCADENADO", PROJECT: "PROYECTO" },
      climbs: [
        "Adherencia pura",
        "Punto de pinza",
        "Lance a muerte",
        "Pies fuera",
        "El ojo de la aguja",
        "A tope",
      ],
    },
  },

  strava: {
    eyebrow: "ADEMÁS: STRAVA · GRATIS",
    title: "Sincronizamos con Strava, si te va eso.",
    body: "Cada sesión registrada se convierte en una actividad Rock Climbing, con duración, encadenes, intentos y grados ya rellenados. Es gratis para todo el mundo y siempre lo será - no cobramos por la sincronización con Strava. Desactívala y sendtally sigue siendo tuyo, solo por los números.",
    cta: "Crea tu cuenta →",
    preview: { meta: "Hoy a las 18:42 · Rock Climbing", chartLabel: "ENCADENES POR GRADO" },
  },

  how: {
    title: "Un minuto después de escalar.",
    blurb:
      "Sin cuentas que enlazar ni importadores que vigilar. Registra la sesión y la puntuación de esfuerzo y la publicación en Strava salen de ahí gratis; las tendencias se construyen solas para los suscriptores.",
    steps: [
      {
        title: "Registra tu sesión",
        body: "Fecha, horas, rocódromo o roca, y las vías - grados en escala V o Font, encadenes e intentos, pegues. Un minuto más o menos, justo después de escalar.",
      },
      {
        title: "Recibe una puntuación de esfuerzo",
        body: "Cada sesión se puntúa del 1 al 10 contra tus propias últimas ocho semanas, para que una noche dura se lea como una noche dura - no solo como una lista de grados.",
      },
      {
        title: "Autoriza Strava",
        body: "OAuth estándar, limitado a actividades y nada más. Nunca vemos tu contraseña, solo escribimos las sesiones que registras, y puedes revocar el acceso desde Strava en cualquier momento.",
      },
    ],
  },

  details: {
    title: "Detalles",
    rows: [
      {
        label: "GUARDADO POR VÍA",
        body: "Grado en escala V o Font, encadene o intento, pegues, y el nombre de la vía si se lo pones",
      },
      {
        label: "ESFUERZO",
        body: "Cada sesión puntuada del 1 al 10 contra tus propias últimas ocho semanas - ponla tú o déjala en automático",
      },
      {
        label: "TENDENCIAS",
        body: "Volumen, pirámide de grados, encadene más duro, porcentaje de flash y grado medio, por semana o histórico - la mitad de la suscripción",
      },
      {
        label: "STRAVA",
        body: "Opcional y gratis para todo el mundo. Una actividad Rock Climbing por sesión, con huella única para que nunca se duplique",
      },
      {
        label: "AL IRTE",
        body: "Borra tu cuenta y todas las sesiones y tokens se van con ella el mismo día",
      },
    ],
  },

  price: {
    eyebrow: "SUSCRIPCIÓN",
    title: "Registrar es gratis. La suscripción te da las tendencias.",
    lead: "Dos dólares al mes, facturados al año, convierten el diario en un análisis profundo de tus tendencias de escalada.",
    free: {
      name: "Gratis",
      amount: "$0",
      suffix: " para siempre",
      footnote: "SIN TARJETA · SIN PRUEBA · SIN LÍMITE DE SESIONES",
      cta: "Crea tu cuenta →",
    },
    member: {
      name: "Suscriptor",
      amount: "$2",
      suffix: "/mes facturado al año · o $3 mes a mes",
      roadmapEyebrow: "TODO LO GRATIS, MÁS LA HOJA DE RUTA",
      roadmapBody:
        "Los suscriptores deciden qué se construye después - quien paga el servidor tiene la primera palabra.",
      footnote: "CANCELA CUANDO QUIERAS",
      cta: "Hazte suscriptor →",
    },
  },

  stores: {
    lead: "Registra una sesión desde el móvil:",
    ios: "Descarga sendtally en el App Store",
    android: "Consigue sendtally en Google Play",
    pending: "Próximamente",
  },

  footer: {
    line: "sendtally · sin relación con Strava",
    trademarks:
      "Google Play y el logotipo de Google Play son marcas de Google LLC. Apple y el logotipo de Apple son marcas de Apple Inc.",
    links: [
      { label: "Iniciar sesión", href: "/sign-in" },
      { label: "Privacidad", href: "/privacy" },
      { label: "Condiciones", href: "/terms" },
      { label: "Soporte", href: "/support" },
    ],
  },
};
