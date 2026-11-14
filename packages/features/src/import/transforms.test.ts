import { describe, expect, it } from "vitest";
import { planImport } from "@sendtally/core/import";
import { planStats, sessionNames, withAddedTags } from "./transforms";

const sendtally = `date,session,location,gym,start_time,end_time,rpe,tags,session_notes,climb,grade,kind,style,tries,climb_notes
2022-11-22,Moe's Valley,outdoor,,,,8,trip; utah,"Last day, sent!",Lindners Roof,V9,send,redpoint,30,"Foot swap at the crux"
,,,,,,,,,Indolence,v7,y,,7,
,,,,,,,,,Pterodactyl,V1,send,flash,1,
2022-11-20,Moe's Valley,outdoor,,,,,,,Linders Roof,V9,attempt,,10,
2022-11-11,Chuckawalla,outdoor,,,,,,,Still Waiting,5.12a,send,onsight,1,
2022-07-22,Squamish,outdoor,,,,,,,Newsroom,VB,send,,1,
2022-07-22,Squamish,outdoor,,,,,,,Sunny Side,V?,send,,1,
2023-01-05,,,Boulder Barn,18:00,19:30,,,,,6A+,send,flash,1,
`;

describe("review helpers", () => {
  it("sums the plan for the review step", () => {
    expect(planStats(planImport(sendtally, "UTC").sessions)).toEqual({
      sessions: 5,
      climbs: 7,
      topGrade: "V9",
    });
  });

  it("adds tags chosen at review to the file's own tags", () => {
    const { sessions } = planImport(sendtally, "UTC");
    expect(sessionNames(sessions)).toEqual([
      { name: "Boulder Barn", sessions: 1 },
      { name: "Chuckawalla", sessions: 1 },
      { name: "Moe's Valley", sessions: 2 },
      { name: "Squamish", sessions: 1 },
    ]);
    const tagged = withAddedTags(sessions, [
      ["Trip"],
      undefined,
      ["UTAH", " "],
      ["UTAH", "Projecting"],
    ]);
    expect(tagged.map((s) => s.tags)).toEqual([
      ["Trip"],
      undefined,
      ["UTAH"],
      ["trip", "utah", "Projecting"],
      undefined,
    ]);
  });
});
