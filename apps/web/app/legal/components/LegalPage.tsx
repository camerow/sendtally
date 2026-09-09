import React from "react";
import { Footer } from "../../landing/components/Footer";
import { Nav } from "../../landing/components/Nav";
import { slugify } from "../slug";
import type { LegalDocument, LegalSection } from "../types";

function Section({ section, index }: { section: LegalSection; index: number }): React.ReactElement {
  return (
    <section id={slugify(section.heading)} className="legal-section">
      <span className="legal-section-index">{String(index).padStart(2, "0")}</span>
      <h2 className="legal-section-heading">{section.heading}</h2>
      <div className="legal-section-body">
        {section.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        {section.bullets !== undefined && (
          <ul>
            {section.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function LegalPage({ doc }: { doc: LegalDocument }): React.ReactElement {
  return (
    <div>
      <Nav />
      <main className="legal">
        <div className="legal-head">
          <span className="legal-effective">Effective {doc.effective}</span>
          <h1 className="legal-title">{doc.title}</h1>
          <p className="legal-lede">{doc.lede}</p>
        </div>
        <nav className="legal-toc" aria-label="Sections">
          {doc.sections.map((section, i) => (
            <a key={section.heading} href={`#${slugify(section.heading)}`}>
              {String(i + 1).padStart(2, "0")} {section.heading}
            </a>
          ))}
        </nav>
        {doc.sections.map((section, i) => (
          <Section key={section.heading} section={section} index={i + 1} />
        ))}
      </main>
      <Footer />
    </div>
  );
}
