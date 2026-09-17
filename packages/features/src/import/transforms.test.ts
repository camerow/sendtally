import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";
import { gradeFromText, planImport, planStats, sessionNames, withAddedTags } from "./transforms";

const kaya = `date,stiffness,rating,ascent_type,attempts,grade,color,climb_name,gym,location,country
Fri Nov 05 2021 03:49:59 GMT+0000 (GMT+00:00),0,,Flash,1,5.10c,,Scrum Felcher,,Sun City,United States
Fri Nov 05 2021 03:52:00 GMT+0000 (GMT+00:00),0,,Onsight,1,5.12a,,Still Waiting,,Chuckawalla,United States
Fri Nov 05 2021 03:55:00 GMT+0000 (GMT+00:00),0,,Redpoint,6,v6,,Fin Arete,,Chuckawalla,United States
Fri Dec 03 2021 08:00:00 GMT+0000 (GMT+00:00),0,,Redpoint,,v3,,,Vital Murrieta,,
Fri Dec 03 2021 08:00:00 GMT+0000 (GMT+00:00),0,,Repeat,4,v4,,,Vital Murrieta,,
`;

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

describe("planImport", () => {
  it("turns a Kaya export into sessions on the local date", () => {
    const plan = planImport(kaya, "America/Los_Angeles");
    expect(plan.format).toBe("kaya");
    expect(plan.issues).toEqual([]);
    expect(plan.sessions.map((s) => [s.date, s.name, s.location, s.gym])).toEqual([
      ["2021-11-04", undefined, "outdoor", undefined],
      ["2021-12-03", "Vital Murrieta", "indoor", "Vital Murrieta"],
    ]);
    const [crag, gym] = plan.sessions;
    expect(crag?.climbs).toEqual([
      {
        name: "Scrum Felcher",
        grade: { scale: "yds", value: "5.10c" },
        kind: "send",
        style: "flash",
        tries: 1,
      },
      {
        name: "Still Waiting",
        grade: { scale: "yds", value: "5.12a" },
        kind: "send",
        style: "onsight",
        tries: 1,
      },
      {
        name: "Fin Arete",
        grade: { scale: "v", value: 6 },
        kind: "send",
        style: "redpoint",
        tries: 6,
      },
    ]);
    expect(gym?.climbs).toEqual([
      { name: "", grade: { scale: "v", value: 3 }, kind: "send", style: "redpoint", tries: 1 },
      { name: "", grade: { scale: "v", value: 4 }, kind: "send", tries: 1 },
    ]);
  });

  it("groups Sendtally rows by date and session, filling the session down", () => {
    const plan = planImport(sendtally, "UTC");
    expect(plan.format).toBe("sendtally");
    expect(plan.sessions.map((s) => [s.date, s.name, s.climbs.length])).toEqual([
      ["2022-07-22", "Squamish", 1],
      ["2022-11-11", "Chuckawalla", 1],
      ["2022-11-20", "Moe's Valley", 1],
      ["2022-11-22", "Moe's Valley", 3],
      ["2023-01-05", undefined, 1],
    ]);
    const moes = plan.sessions[3]!;
    expect(moes).toMatchObject({
      rpe: 8,
      tags: ["trip", "utah"],
      notes: "Last day, sent!",
      rows: [2, 3, 4],
    });
    expect(moes.climbs[0]).toEqual({
      name: "Lindners Roof",
      grade: { scale: "v", value: 9 },
      kind: "send",
      style: "redpoint",
      tries: 30,
      note: "Foot swap at the crux",
    });
    expect(moes.climbs[1]).toMatchObject({ name: "Indolence", kind: "send", tries: 7 });
    expect(plan.sessions[0]?.climbs[0]).toEqual({
      name: "Newsroom",
      grade: { scale: "v", value: 0 },
      kind: "send",
      tries: 1,
    });
    expect(plan.sessions[2]?.climbs[0]).toEqual({
      name: "Linders Roof",
      grade: { scale: "v", value: 9 },
      kind: "attempt",
      tries: 10,
    });
    expect(plan.sessions[4]).toMatchObject({
      location: "indoor",
      gym: "Boulder Barn",
      startTime: "18:00",
      endTime: "19:30",
      climbs: [{ grade: { scale: "font", value: "6A+" }, style: "flash" }],
    });
    expect(plan.issues).toEqual([
      { row: 8, code: "unknownGrade", value: "V?", climb: "Sunny Side" },
    ]);
    expect(planStats(plan.sessions)).toEqual({ sessions: 5, climbs: 7, topGrade: "V9" });
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

  it("reports a file it cannot read", () => {
    expect(planImport("Name,Sent\nFoo,y\n", "UTC").issues).toEqual([{ row: 1, code: "noHeader" }]);
    expect(planImport("Date,Name,Grade\n11/22/2022,Roof,v9\n", "UTC").issues).toEqual([
      { row: 1, code: "noHeader" },
    ]);
  });

  it("reads the scale from how the grade is written", () => {
    expect(gradeFromText("V4")).toEqual({ scale: "v", value: 4 });
    expect(gradeFromText("6A+")).toEqual({ scale: "font", value: "6A+" });
    expect(gradeFromText("7a")).toEqual({ scale: "french", value: "7a" });
    expect(gradeFromText("5.11b")).toEqual({ scale: "yds", value: "5.11b" });
    expect(gradeFromText("v0-")).toEqual({ scale: "v", value: 0 });
    expect(gradeFromText("V4+")).toEqual({ scale: "v", value: 4 });
    expect(gradeFromText("5.11b-")).toEqual({ scale: "yds", value: "5.11b" });
    expect(gradeFromText("6A-")).toEqual({ scale: "font", value: "6A" });
    expect(gradeFromText("7A+")).toEqual({ scale: "font", value: "7A+" });
    expect(gradeFromText("6a+")).toEqual({ scale: "french", value: "6a+" });
    expect(gradeFromText("VB")).toEqual({ scale: "v", value: 0 });
    expect(gradeFromText("vb")).toEqual({ scale: "v", value: 0 });
    expect(gradeFromText("V")).toBeUndefined();
    expect(gradeFromText("+")).toBeUndefined();
  });
});

describe("csv", () => {
  it("round-trips quotes, commas and newlines", () => {
    const rows = [
      ["a", 'say "hi"', "x,y"],
      ["line\nbreak", "", "1"],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
    expect(parseCsv("﻿a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});
