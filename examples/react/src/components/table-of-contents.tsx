import { TableOfContents, type TableOfContentsItem } from "@harmo-ui/react";

export const examples = {
  "Default": () => {
    const items: TableOfContentsItem[] = [
      { id: "overview", label: "Overview" },
      { id: "milestones", label: "Milestones" },
      { id: "risks", label: "Risks" },
      { id: "budget", label: "Budget" },
      { id: "contacts", label: "Contacts" },
    ];

    return (
      <>
        <div
          tabIndex={0}
          style={{
            display: "flex",
            gap: 26,
            blockSize: 320,
            overflowY: "auto",
            inlineSize: "100%",
          }}
        >
          <TableOfContents aria-label="On this page" items={items} />
          <div style={{ flex: 1, minInlineSize: 0 }}>
            {items.map((item) => (
              <section key={item.id} style={{ minBlockSize: 220 }}>
                <h3 id={item.id} style={{ margin: 0 }}>
                  {item.label}
                </h3>
                <p>Notes for this part of the project go here.</p>
              </section>
            ))}
          </div>
        </div>
      </>
    );
  },
  "At the end": () => {
    const items: TableOfContentsItem[] = [
      { id: "end-overview", label: "Overview" },
      { id: "end-milestones", label: "Milestones" },
      { id: "end-risks", label: "Risks" },
      { id: "end-budget", label: "Budget" },
      { id: "end-contacts", label: "Contacts" },
    ];

    return (
      <>
        <div
          tabIndex={0}
          style={{
            display: "flex",
            gap: 26,
            blockSize: 320,
            overflowY: "auto",
            inlineSize: "100%",
          }}
        >
          <TableOfContents aria-label="On this page" items={items} side="end" />
          <div style={{ flex: 1, minInlineSize: 0 }}>
            {items.map((item) => (
              <section key={item.id} style={{ minBlockSize: 220 }}>
                <h3 id={item.id} style={{ margin: 0 }}>
                  {item.label}
                </h3>
                <p>Notes for this part of the project go here.</p>
              </section>
            ))}
          </div>
        </div>
      </>
    );
  },
  "With sub-sections": () => {
    const items: TableOfContentsItem[] = [
      { id: "plan", label: "Plan" },
      { id: "plan-scope", label: "Scope", level: 2 },
      { id: "plan-dates", label: "Dates", level: 2 },
      { id: "team", label: "Team" },
      { id: "team-roles", label: "Roles", level: 2 },
      { id: "team-leads", label: "Leads", level: 3 },
    ];

    return (
      <>
        <div
          tabIndex={0}
          style={{
            display: "flex",
            gap: 26,
            blockSize: 320,
            overflowY: "auto",
            inlineSize: "100%",
          }}
        >
          <TableOfContents aria-label="On this page" items={items} />
          <div style={{ flex: 1, minInlineSize: 0 }}>
            {items.map((item) => (
              <section key={item.id} style={{ minBlockSize: 220 }}>
                <h3 id={item.id} style={{ margin: 0 }}>
                  {item.label}
                </h3>
                <p>Notes for this part of the project go here.</p>
              </section>
            ))}
          </div>
        </div>
      </>
    );
  },
  "Right to left": () => {
    const items: TableOfContentsItem[] = [
      { id: "rtl-overview", label: "نظرة عامة" },
      { id: "rtl-milestones", label: "المراحل" },
      { id: "rtl-risks", label: "المخاطر" },
      { id: "rtl-budget", label: "الميزانية" },
      { id: "rtl-contacts", label: "جهات الاتصال" },
    ];

    return (
      <div dir="rtl" lang="ar" style={{ inlineSize: "100%" }}>
        <div
          tabIndex={0}
          style={{
            display: "flex",
            gap: 26,
            blockSize: 320,
            overflowY: "auto",
            inlineSize: "100%",
          }}
        >
          <TableOfContents aria-label="في هذه الصفحة" items={items} />
          <div style={{ flex: 1, minInlineSize: 0 }}>
            {items.map((item) => (
              <section key={item.id} style={{ minBlockSize: 220 }}>
                <h3 id={item.id} style={{ margin: 0 }}>
                  {item.label}
                </h3>
                <p>تذهب ملاحظات هذا الجزء من المشروع هنا.</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
