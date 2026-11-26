import { Prose, ProseTable } from "@harmo-ui/react";

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

  "A table": () => (
    <Prose>
      <p>Delivery windows by area:</p>
      <ProseTable aria-label="Delivery windows">
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Days</th>
              <th>Morning</th>
              <th>Evening</th>
              <th>Order by</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>City center</td>
              <td>Every day</td>
              <td>7 AM to 11 AM</td>
              <td>5 PM to 9 PM</td>
              <td>8 PM the day before</td>
            </tr>
            <tr>
              <td>North and east</td>
              <td>Monday to Saturday</td>
              <td>8 AM to noon</td>
              <td>6 PM to 9 PM</td>
              <td>6 PM the day before</td>
            </tr>
            <tr>
              <td>The valley</td>
              <td>Tuesday and Friday</td>
              <td>9 AM to 1 PM</td>
              <td>None</td>
              <td>Noon the day before</td>
            </tr>
          </tbody>
        </table>
      </ProseTable>
    </Prose>
  ),

  Images: () => (
    <Prose>
      <p>The first harvest of the season came in on Tuesday.</p>
      <figure>
        <img src="images/forest.svg" alt="Green hills under a sky that darkens toward the top" width={400} height={400} />
        <figcaption>The hills above the orchard, a day's drive away.</figcaption>
      </figure>
      <p>Apples are in the shops from Thursday.</p>
    </Prose>
  ),
};
