import React from "react";

const LADDER = [0, 2, 4, 6, 8, 10].map((grade) => ({ grade, points: Math.pow(2, grade / 2) }));

export function HowEffortIsScored(): React.ReactElement {
  return (
    <>
      <p>
        Open any session in sendtally and the first thing you see is a number between 1 and 10. It
        is the same idea as a rate of perceived exertion: 1 is a gentle warm-up, 10 is everything
        you had. The difference is that you do not have to guess it. sendtally works it out from the
        climbs you logged, and this post walks through exactly how.
      </p>

      <h2>Every climb is worth points</h2>
      <p>
        A climb is worth more the harder it is, and the value doubles every two V grades. A V4 is
        worth twice a V2, and a V8 is worth four times a V4. That curve is steep on purpose: one
        hard problem at your limit takes more out of you than several easy ones.
      </p>
      <div className="b-figure" role="figure" aria-label="Points per V grade">
        <div className="b-ladder">
          {LADDER.map(({ grade, points }) => (
            <div key={grade} className="b-ladder-step">
              <span
                className="b-ladder-bar"
                style={{ height: (points / 32) * 120 }}
                aria-hidden="true"
              />
              <span className="b-ladder-points">{points}</span>
              <span className="b-ladder-grade">V{grade}</span>
            </div>
          ))}
        </div>
        <p className="b-caption">Points per climb, sent. Attempts count for 40% of these.</p>
      </div>
      <p>
        A send earns the full points. A climb you tried and did not finish earns 40% of them,
        because falling off a hard move still costs effort. The number of tries does not change
        either, so a flash and a tenth-go send are worth the same. Unknown grades are scored as V1,
        so a climb you forgot to grade never inflates a session.
      </p>

      <h2>Compared with your own climbing, not anyone else&apos;s</h2>
      <p>
        Points alone would say a strong climber always tries hard. So the total is compared with the
        median of your sessions from the previous eight weeks. If you have fewer than three sessions
        in that window, all of your history is used instead.
      </p>
      <p>
        A session that matches your median scores 6. The score moves with the square root of the
        ratio, so doubling your usual points lifts you to about 8.5 rather than 12, and half your
        usual lands near 4. Big days read as big without running off the end of the scale.
      </p>
      <aside className="b-callout">
        <span className="b-callout-label">Worked example</span>
        <p>
          Your median session over eight weeks is 30 points. Tonight you sent two V6s, three V4s and
          four V2s, and worked a V7 you have sent before without topping it. The pace was steady.
        </p>
        <p className="b-callout-math">
          (2 × 8) + (3 × 4) + (4 × 2)
          <br />+ (11.3 × 0.4) = 40.5 points
          <br />6 × √(40.5 ÷ 30) = 6.97
          <br />
          which rounds to 7
        </p>
      </aside>

      <h2>Two nudges for how the session felt</h2>
      <p>
        The session length and the number of climbs give it a pace. Twelve or more climbs an hour
        adds one point, because that is sustained work. Five or fewer an hour takes one away,
        because long rests are part of an easier night.
      </p>
      <p>
        If you tried anything harder than your hardest send from the same history window, the score
        goes up by one. Projecting at a new grade is effort even when it does not go.
      </p>
      <p>
        The result is rounded and kept between 1 and 10. If it does not match how you felt, set the
        effort yourself on the log form and your number replaces the calculated one.
      </p>

      <h2>The score names the session</h2>
      <p>
        A score of 1 to 3 reads as easy, 4 to 5 casual, 6 to 7 solid, 8 to 9 hard, and 10 max
        effort, followed by the climb count and top grade. A hard session built from many climbs
        well below your best is called high volume instead. If you post to Strava, that title
        becomes the activity name.
      </p>
    </>
  );
}
