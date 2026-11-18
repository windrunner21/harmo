import { Footer, FooterGroup } from "@harmo-ui/react";
import type { CSSProperties } from "react";

// Example only: a frame standing in for the foot of your page, and the
// logo's mark, laid out with inline styles.
const frame: CSSProperties = {
  overflow: "hidden",
  border: "1px solid var(--harmo-color-border)",
  borderRadius: "var(--harmo-border-radius)",
};
const phone: CSSProperties = { ...frame, inlineSize: "100%", maxInlineSize: "24rem", marginInline: "auto" };
const mark: CSSProperties = {
  inlineSize: "1.25rem",
  blockSize: "1.25rem",
  background: "var(--harmo-color-primary-fill)",
  borderRadius: "0.375rem",
};

export const examples = {
  Default: () => (
    <div style={frame}>
      <Footer
        aria-label="Footer"
        brand={
          <>
            <a href="#top">
              <span style={mark} aria-hidden="true" />
              Speedwagon
            </a>
            <p>Fresh produce from farms within a day's drive, delivered the morning after it's picked.</p>
          </>
        }
        bottom={
          <>
            <p>© 2026 Speedwagon Ltd.</p>
            <ul className="hfooter-bottom-links">
              <li>
                <a className="hfooter-link" href="#privacy">
                  Privacy
                </a>
              </li>
              <li>
                <a className="hfooter-link" href="#terms">
                  Terms
                </a>
              </li>
            </ul>
          </>
        }
      >
        <FooterGroup
          label="Shop"
          links={[
            { label: "This week's offers", href: "#offers" },
            { label: "Delivery", href: "#delivery" },
            { label: "Gift cards", href: "#gift-cards" },
          ]}
        />
        <FooterGroup
          label="Company"
          links={[
            { label: "About", href: "#about" },
            { label: "Careers", href: "#careers" },
            { label: "Press", href: "#press" },
          ]}
        />
        <FooterGroup
          label="Help"
          links={[
            { label: "Contact us", href: "#contact" },
            { label: "Returns", href: "#returns" },
            { label: "Stores", href: "#stores" },
          ]}
        />
      </Footer>
    </div>
  ),

  "On a phone": () => (
    <div style={phone}>
      <Footer
        aria-label="Footer"
        brand={
          <a href="#top">
            <span style={mark} aria-hidden="true" />
            Speedwagon
          </a>
        }
        bottom={<p>© 2026 Speedwagon Ltd.</p>}
      >
        <FooterGroup
          label="Shop"
          links={[
            { label: "This week's offers", href: "#offers" },
            { label: "Delivery", href: "#delivery" },
            { label: "Gift cards", href: "#gift-cards" },
          ]}
        />
        <FooterGroup
          label="Company"
          links={[
            { label: "About", href: "#about" },
            { label: "Careers", href: "#careers" },
            { label: "Press", href: "#press" },
          ]}
        />
        <FooterGroup
          label="Help"
          links={[
            { label: "Contact us", href: "#contact" },
            { label: "Returns", href: "#returns" },
            { label: "Stores", href: "#stores" },
          ]}
        />
      </Footer>
    </div>
  ),

  "Bottom row only": () => (
    <div style={frame}>
      <Footer
        bottom={
          <>
            <p>© 2026 Speedwagon Ltd.</p>
            <ul className="hfooter-bottom-links">
              <li>
                <a className="hfooter-link" href="#privacy">
                  Privacy
                </a>
              </li>
              <li>
                <a className="hfooter-link" href="#terms">
                  Terms
                </a>
              </li>
              <li>
                <a className="hfooter-link" href="#help">
                  Help
                </a>
              </li>
            </ul>
          </>
        }
      />
    </div>
  ),
};
