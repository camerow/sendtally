import type {
  BuiltInExerciseEntry,
  BuiltInGripEntry,
  BuiltInLibrary,
  BuiltInWorkoutEntry,
} from "@sendtally/api-client";
import type { BuiltInExerciseSpec, BuiltInWorkoutSpec } from "@sendtally/core/hang";

type Names = [de: string, fr: string, es: string];

const base = (id: string, name: string, [de, fr, es]: Names) => ({
  id,
  status: "active" as const,
  name,
  description: "",
  translations: { de: { name: de }, fr: { name: fr }, es: { name: es } },
  media: [],
  updatedAt: null,
});

const exercise = (
  id: string,
  name: string,
  names: Names,
  kind: BuiltInExerciseSpec["kind"],
  measure: BuiltInExerciseSpec["measure"],
  dose?: BuiltInExerciseSpec["dose"]
): BuiltInExerciseEntry => ({
  ...base(id, name, names),
  type: "exercise",
  spec: dose === undefined ? { kind, measure } : { kind, measure, dose },
});

const grip = (id: string, name: string, names: Names): BuiltInGripEntry => ({
  ...base(id, name, names),
  type: "grip",
});

const workout = (
  id: string,
  name: string,
  names: Names,
  description: string,
  spec: BuiltInWorkoutSpec
): BuiltInWorkoutEntry => ({ ...base(id, name, names), type: "workout", description, spec });

/**
 * A few built-ins, as seeded, for tests: the ones they name. The real library is the seed
 * migration, which the API tests read through D1.
 */
export const TEST_LIBRARY: BuiltInLibrary = {
  exercises: [
    exercise("fourByFours", "4x4s", ["4x4", "4x4", "4x4"], "climbing", "reps"),
    exercise(
      "limitBouldering",
      "Limit bouldering",
      ["Limit-Bouldern", "Bloc à la limite", "Bloque al límite"],
      "climbing",
      "reps",
      { sets: 1 }
    ),
    exercise("arc", "ARC", ["ARC", "ARC", "ARC"], "climbing", "seconds"),
    exercise(
      "projecting",
      "Projecting",
      ["Projektieren", "Travail de projet", "Trabajo de proyecto"],
      "climbing",
      "reps"
    ),
    exercise(
      "circuitLaps",
      "Circuit laps",
      ["Zirkelrunden", "Tours de circuit", "Vueltas de circuito"],
      "climbing",
      "laps"
    ),
    exercise(
      "backSquat",
      "Back squat",
      ["Kniebeuge", "Squat", "Sentadilla"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "benchPress",
      "Bench press",
      ["Bankdrücken", "Développé couché", "Press de banca"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "barbellRow",
      "Barbell row",
      ["Langhantelrudern", "Rowing barre", "Remo con barra"],
      "strength",
      "repsWeight"
    ),
    exercise("dips", "Dips", ["Dips", "Dips", "Fondos"], "strength", "repsWeight"),
    exercise(
      "reverseWristCurls",
      "Reverse wrist curls",
      ["Reverse Wrist Curls", "Flexions de poignet inversées", "Curl de muñeca invertido"],
      "strength",
      "repsWeight",
      { sets: 3 }
    ),
    exercise(
      "pullUps",
      "Pull-ups",
      ["Klimmzüge", "Tractions", "Dominadas"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "chinUps",
      "Chin-ups",
      ["Klimmzüge im Untergriff", "Tractions en supination", "Dominadas supinas"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "deadlift",
      "Deadlift",
      ["Kreuzheben", "Soulevé de terre", "Peso muerto"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "gobletSquat",
      "Goblet squat",
      ["Goblet-Kniebeuge", "Squat gobelet", "Sentadilla goblet"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "wristCurls",
      "Wrist curls",
      ["Wrist Curls", "Flexions de poignet", "Curl de muñeca"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "bicepsCurl",
      "Biceps curl",
      ["Bizepscurls", "Curl biceps", "Curl de bíceps"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "hammerCurl",
      "Hammer curl",
      ["Hammercurls", "Curl marteau", "Curl martillo"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "romanianDeadlift",
      "Romanian deadlift",
      ["Rumänisches Kreuzheben", "Soulevé de terre roumain", "Peso muerto rumano"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "nordicCurl",
      "Nordic hamstring curl",
      ["Nordic Curls", "Nordic curl", "Curl nórdico"],
      "strength",
      "reps"
    ),
    exercise("clean", "Clean", ["Umsetzen", "Épaulé", "Cargada"], "strength", "repsWeight"),
    exercise(
      "zercherSquat",
      "Zercher squat",
      ["Zercher-Kniebeuge", "Squat Zercher", "Sentadilla Zercher"],
      "strength",
      "repsWeight"
    ),
    exercise(
      "ninetyNinety",
      "90/90 switches",
      ["90/90-Wechsel", "Bascules 90/90", "Cambios 90/90"],
      "mobility",
      "reps"
    ),
    exercise(
      "couchStretch",
      "Couch stretch, each side",
      [
        "Couch-Stretch, je Seite",
        "Étirement du canapé, de chaque côté",
        "Estiramiento del sofá, cada lado",
      ],
      "mobility",
      "seconds"
    ),
    exercise(
      "frogStretch",
      "Frog stretch",
      ["Froschdehnung", "Posture de la grenouille", "Postura de la rana"],
      "mobility",
      "seconds"
    ),
    exercise(
      "pigeon",
      "Pigeon, each side",
      ["Taube, je Seite", "Pigeon, de chaque côté", "Paloma, cada lado"],
      "mobility",
      "seconds"
    ),
    exercise(
      "hipFlexorLunge",
      "Hip flexor lunge, each side",
      [
        "Hüftbeuger-Ausfallschritt, je Seite",
        "Fente des fléchisseurs de hanche, de chaque côté",
        "Zancada de flexores de cadera, cada lado",
      ],
      "mobility",
      "seconds"
    ),
    exercise(
      "deepSquat",
      "Deep squat hold",
      ["Tiefe Hocke halten", "Squat profond tenu", "Sentadilla profunda mantenida"],
      "mobility",
      "seconds"
    ),
    exercise("plank", "Plank", ["Unterarmstütz", "Planche", "Plancha"], "other", "seconds"),
    exercise(
      "hollowHold",
      "Hollow hold",
      ["Hollow Hold", "Hollow hold", "Hollow hold"],
      "other",
      "seconds"
    ),
    exercise(
      "kneeRaises",
      "Hanging knee raises",
      ["Knieheben im Hang", "Relevés de genoux suspendu", "Elevaciones de rodillas colgado"],
      "other",
      "reps"
    ),
    exercise(
      "frontLever",
      "Front lever hold",
      ["Front Lever", "Front lever", "Front lever"],
      "other",
      "seconds"
    ),
  ],
  grips: [
    grip("half", "Half crimp", ["Half Crimp", "Semi-arqué", "Semiarqueo"]),
    grip("full", "Full crimp", ["Full Crimp", "Arqué", "Arqueo"]),
    grip("open", "Open hand", ["Offene Hand", "Main ouverte", "Mano abierta"]),
    grip("drag", "3-finger drag", ["3-Finger-Drag", "Tendu 3 doigts", "Extendido 3 dedos"]),
    grip("sloper", "Sloper", ["Sloper", "Plat", "Romo"]),
    grip("pinch", "Pinch", ["Pinch", "Pince", "Pinza"]),
    grip("front3", "Front 3", ["Front 3", "3 doigts avant", "3 dedos delante"]),
    grip("mono", "Mono", ["Mono", "Monodoigt", "Monodedo"]),
  ],
  workouts: [
    workout(
      "rep73",
      "Repeaters 7:3",
      ["Repeaters 7:3", "Repeaters 7:3", "Repeaters 7:3"],
      "Strength-endurance classic. Six hangs a set with short rests, so the forearms never fully recover.",
      {
        kind: "hangboard",
        focus: "power_endurance",
        minutes: null,
        targetRpe: null,
        items: [{ grip: "half", doses: [{ sets: 6, reps: 6, onS: 7, offS: 3, setRestS: 180 }] }],
      }
    ),
    workout(
      "max10",
      "Max hangs",
      ["Max Hangs", "Suspensions max", "Suspensiones máximas"],
      "Near-maximal load, very little volume, long rests. The staple for raw finger strength.",
      {
        kind: "hangboard",
        focus: "strength",
        minutes: null,
        targetRpe: null,
        items: [{ grip: "half", doses: [{ sets: 5, reps: 1, onS: 10, setRestS: 180 }] }],
      }
    ),
    workout(
      "fingers-ab",
      "Fingers A/B",
      ["Finger A/B", "Doigts A/B", "Dedos A/B"],
      "Two finger sessions that take turns by session: max hangs for strength, then repeaters for the pump on long problems. Whichever you did last, the other comes up next, even after a missed day.",
      {
        kind: "hangboard",
        focus: null,
        minutes: null,
        targetRpe: 8,
        items: [
          {
            grip: "half",
            doses: [
              { sets: 6, reps: 1, onS: 10, setRestS: 180 },
              { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 180 },
            ],
          },
        ],
      }
    ),
    workout(
      "block",
      "Block pulls",
      ["Block Pulls", "Tirages au bloc", "Tirones de bloque"],
      "Lift a loaded block off the floor. Heavy pinch work without a board, and easy to load precisely.",
      {
        kind: "hangboard",
        focus: "strength",
        minutes: null,
        targetRpe: null,
        items: [{ grip: "pinch", doses: [{ sets: 5, reps: 5, setRestS: 120 }] }],
      }
    ),
    workout(
      "climb-limit",
      "Limit bouldering",
      ["Limit-Bouldern", "Bloc à la limite", "Bloque al límite"],
      "A few boulders at your limit, full rests, full effort on every go. Stop when the moves get sloppy.",
      {
        kind: "climbing",
        focus: "power",
        minutes: 90,
        targetRpe: 9,
        items: [{ exercise: "limitBouldering", doses: [{ sets: 5, setRestS: 180 }] }],
      }
    ),
    workout(
      "climb-4x4",
      "4x4s",
      ["4x4", "4x4", "4x4"],
      "Four boulders back to back, four times, with a few minutes' rest between rounds.",
      {
        kind: "climbing",
        focus: "power_endurance",
        minutes: 60,
        targetRpe: 8,
        items: [{ exercise: "fourByFours", doses: [{ sets: 4, reps: 4, setRestS: 240 }] }],
      }
    ),
    workout(
      "climb-arc",
      "ARC",
      ["ARC", "ARC", "ARC"],
      "Easy climbing without stopping for 20 to 40 minutes. A light pump, never a burn.",
      {
        kind: "climbing",
        focus: "endurance",
        minutes: 45,
        targetRpe: 4,
        items: [{ exercise: "arc", doses: [{ sets: 2, onS: 1200, setRestS: 600 }] }],
      }
    ),
    workout(
      "strength-squat",
      "Back squat, alternating",
      ["Kniebeuge im Wechsel", "Squat en alternance", "Sentadilla alterna"],
      "Alternate five sets of five with three sets of ten. Each session does the next one, so a missed day just shifts it along.",
      {
        kind: "strength",
        focus: "strength",
        minutes: 45,
        targetRpe: 8,
        items: [
          {
            exercise: "backSquat",
            doses: [
              { sets: 5, reps: 5 },
              { sets: 3, reps: 10 },
            ],
          },
        ],
      }
    ),
    workout(
      "strength-5x5",
      "5x5 strength",
      ["5x5 Kraft", "Force 5x5", "Fuerza 5x5"],
      "Three big lifts, five sets of five. Add a little weight each week while every rep stays clean.",
      {
        kind: "strength",
        focus: "strength",
        minutes: 45,
        targetRpe: 8,
        items: [
          { exercise: "backSquat", doses: [{ sets: 5, reps: 5 }] },
          { exercise: "benchPress", doses: [{ sets: 5, reps: 5 }] },
          { exercise: "barbellRow", doses: [{ sets: 5, reps: 5 }] },
        ],
      }
    ),
    workout(
      "mobility-hips",
      "Hip mobility flow",
      ["Hüftmobilität", "Mobilité des hanches", "Movilidad de cadera"],
      "Opens the hips for high steps, drop knees and heel hooks.",
      {
        kind: "mobility",
        focus: "recovery",
        minutes: 20,
        targetRpe: 3,
        items: [
          { exercise: "ninetyNinety", doses: [{ sets: 1, reps: 10 }] },
          { exercise: "couchStretch", doses: [{ sets: 1, onS: 60 }] },
          { exercise: "frogStretch", doses: [{ sets: 1, onS: 90 }] },
          { exercise: "pigeon", doses: [{ sets: 1, onS: 60 }] },
          { exercise: "hipFlexorLunge", doses: [{ sets: 1, onS: 60 }] },
          { exercise: "deepSquat", doses: [{ sets: 1, onS: 120 }] },
        ],
      }
    ),
    workout(
      "run-tempo",
      "Tempo intervals",
      ["Tempo-Intervalle", "Fractionné tempo", "Intervalos de tempo"],
      "Three minutes hard, two minutes easy, five times. Hard means you could speak a few words.",
      {
        kind: "other",
        focus: "conditioning",
        minutes: 25,
        targetRpe: 7,
        items: [
          { step: "hard", doses: [{ sets: 5, onS: 180 }] },
          { step: "easy", doses: [{ sets: 5, onS: 120 }] },
        ],
      }
    ),
    workout(
      "other-core",
      "Core circuit",
      ["Rumpfzirkel", "Circuit gainage", "Circuito de core"],
      "Three rounds for the tension that keeps feet on steep ground.",
      {
        kind: "other",
        focus: "strength",
        minutes: 15,
        targetRpe: 6,
        items: [
          { exercise: "plank", doses: [{ sets: 3, onS: 45, offS: 15 }] },
          { exercise: "hollowHold", doses: [{ sets: 3, onS: 30, offS: 15 }] },
          { exercise: "kneeRaises", doses: [{ sets: 3, reps: 10, offS: 60 }] },
        ],
      }
    ),
    workout(
      "climb-session",
      "Climbing",
      ["Klettern", "Escalade", "Escalada"],
      "Your usual climbing day. Start opens the live session to log what you climb.",
      { kind: "climbing", focus: null, minutes: null, targetRpe: null, items: [] }
    ),
  ],
};
