import { describe, expect, test } from "bun:test";
import { Accordion, AccordionItem } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/accordion.md says about groups: an exclusive
// Accordion's items share a name, and an item inside one of them isn't in
// that group; a nested Accordion makes its own.
const names = (markup: string) =>
  [...markup.matchAll(/<details[^>]*>/g)].map((tag) => / name="([^"]*)"/.exec(tag[0])?.[1] ?? null);

describe("Accordion", () => {
  test("an exclusive Accordion's items share one name", () => {
    const [first, second] = names(
      renderToStaticMarkup(
        <Accordion exclusive>
          <AccordionItem label="One" />
          <AccordionItem label="Two" />
        </Accordion>,
      ),
    );
    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  test("an item inside an item isn't in its group; a nested Accordion makes its own", () => {
    const [outer, inner, nestedOne, nestedTwo] = names(
      renderToStaticMarkup(
        <Accordion exclusive>
          <AccordionItem label="Billing">
            <AccordionItem label="Invoices" />
            <Accordion exclusive>
              <AccordionItem label="Refunds" />
              <AccordionItem label="Taxes" />
            </Accordion>
          </AccordionItem>
        </Accordion>,
      ),
    );
    expect(outer).toBeTruthy();
    expect(inner).toBeNull();
    expect(nestedOne).toBeTruthy();
    expect(nestedOne).not.toBe(outer);
    expect(nestedTwo).toBe(nestedOne);
  });
});
