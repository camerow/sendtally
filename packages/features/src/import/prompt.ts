// The header and the assistant prompt are read by tools, not people, so they
// stay English like the Strava description.
export const TEMPLATE_CSV = `date,session,location,gym,start_time,end_time,rpe,tags,session_notes,climb,grade,kind,style,tries,climb_notes
2022-11-22,Moe's Valley,outdoor,,,,8,trip,"Last day of the trip",Lindners Roof,V9,send,redpoint,30,"Stuck the start move consistently"
,,,,,,,,,Indolence,V7,send,,7,
,,,,,,,,,Pterodactyl,V1,send,flash,1,
2022-11-20,Moe's Valley,outdoor,,,,,,,Linders Roof,V9,attempt,,10,"Made it to the redpoint crux"
2023-01-05,,,Boulder Barn,18:00,19:30,,,,,6A+,send,flash,1,
`;

export const CONVERSION_PROMPT = `Convert the attached climbing log into a CSV that Sendtally can import. Output a CSV file.

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
- Skip rows with no grade and no climb name. Do not invent values.`;
