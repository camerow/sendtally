import React from "react";

const SCALES = [
  { scale: "V", discipline: "Boulder", example: "V5" },
  { scale: "Font", discipline: "Boulder", example: "6C+" },
  { scale: "YDS", discipline: "Route", example: "5.11c" },
  { scale: "French", discipline: "Route", example: "6c+" },
];

export function RoutesAndBoulders(): React.ReactElement {
  return (
    <>
      <p>
        Most climbers do not stick to one kind of climbing. A Tuesday in the bouldering cave, a
        Saturday on ropes, a trip where the local guidebook uses a scale you have never logged
        before. sendtally keeps all of it in one log, and it does that without asking you to think
        in someone else&apos;s grades.
      </p>

      <h2>Four scales, logged as you read them</h2>
      <p>
        When you add a climb you pick the scale it was graded in. Two scales are for boulders and
        two are for routes.
      </p>
      <div className="b-table-wrap">
        <table className="b-table">
          <thead>
            <tr>
              <th scope="col">Scale</th>
              <th scope="col">Used for</th>
              <th scope="col">Looks like</th>
            </tr>
          </thead>
          <tbody>
            {SCALES.map((row) => (
              <tr key={row.scale}>
                <td>{row.scale}</td>
                <td>{row.discipline}</td>
                <td className="b-mono">{row.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The grade you pick is the grade you see from then on. A 6c+ stays a 6c+ in your session list
        and on the session page. It never quietly becomes 5.11c because someone else reads YDS.
      </p>

      <h2>One shared yardstick for effort</h2>
      <p>
        Effort still needs a common unit, or a route day could never be compared with a boulder day.
        Behind the scenes every grade is mapped to a V-equivalent, and that is what the effort score
        is calculated from. Font boulders map straight across. Route grades first land on a shared
        route ladder, so 5.11c and 6c+ sit on the same rung, and that rung carries a V-equivalent.
      </p>
      <p>
        You never see the V-equivalent of a route. It only exists so that a long pitch and a short
        boulder problem can both count towards the same number out of ten.
      </p>

      <h2>Sessions that mix both</h2>
      <p>
        If one session holds routes and boulders, its stats describe whichever you did more of. Six
        boulders and two routes reads as a boulder session, with its top grade in the boulder scale
        you used. The effort score still includes every climb, because the two routes were still
        work.
      </p>

      <aside className="b-callout">
        <span className="b-callout-label">In short</span>
        <p>
          Log each climb in the grade on the wall. sendtally scores all of them together and shows
          every one of them the way you climbed it.
        </p>
      </aside>
    </>
  );
}
