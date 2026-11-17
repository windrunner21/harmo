import { Prose } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <Prose>
      <p>
        Your weekly report is ready. <strong>3 of 5 checks passed</strong>:
      </p>
      <ul>
        <li>Replies took 4 minutes on average, down from 6.</li>
        <li>92% of customers rated their conversation good.</li>
      </ul>
      <p>
        Read the <a href="https://example.com/reports/42">full report</a>, or run <code>export --week</code> to download it:
      </p>
      <pre>
        <code>npx reports export --week 2026-46</code>
      </pre>
    </Prose>
  ),

  "Headings and quotes": () => (
    <Prose>
      <h3>Returns</h3>
      <p>You can return anything within 30 days, for free.</p>
      <blockquote>Keep the box until you're sure: we take items back in it.</blockquote>
      <ol>
        <li>Print the label from your order's page.</li>
        <li>Drop the parcel at any post office.</li>
      </ol>
      <hr />
      <h4>Refunds</h4>
      <p>They reach your card within five working days of our getting the parcel.</p>
    </Prose>
  ),

  "From text": () => (
    <Prose
      text={
        "Your report is ready. **3 of 5 checks passed**:\n\n- Response time: 4 minutes, down from 6.\n- Satisfaction: 92%, up from 88%.\n\nRead the [full report](https://example.com/reports/42), or run `export --week` to download it."
      }
    />
  ),
};
