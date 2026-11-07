import { Accordion, AccordionItem, Button, Field, Input, Switch } from "@harmo-ui/react";

export const examples = {
  Default: () => (
    <Accordion exclusive>
      <AccordionItem label="How am I billed?">
        <p>
          Each month, for the conversations your team handled that month. Your plan's
          conversations come first, and any beyond them are billed at your plan's rate.
        </p>
      </AccordionItem>
      <AccordionItem label="Can I change my plan later?">
        <p>
          Yes, at any time, in Settings under Plans. A bigger plan starts at once; a smaller
          one starts with your next month.
        </p>
      </AccordionItem>
      <AccordionItem label="What happens when my trial ends?">
        <p>
          Your workspace stays as it is, but you can't send messages until you choose a plan.
          Nothing is deleted.
        </p>
      </AccordionItem>
    </Accordion>
  ),

  "Several open at once": () => (
    <Accordion>
      <AccordionItem label="Customer" defaultOpen>
        <p>Ana Lopez, ana@example.com. A customer since March, on the Growth plan.</p>
      </AccordionItem>
      <AccordionItem label="Previous tickets">
        <p>Refund for order #1042, solved on May 2. Card declined at checkout, solved on April 18.</p>
      </AccordionItem>
      <AccordionItem label="Notes">
        <p>Prefers email to calls. Asked about an annual plan.</p>
      </AccordionItem>
    </Accordion>
  ),

  Small: () => (
    <Accordion size="small">
      <AccordionItem label="Shortcuts">
        <p>Press Enter to send, and Shift and Enter for a new line.</p>
      </AccordionItem>
      <AccordionItem label="Formatting">
        <p>Wrap text in asterisks for bold, and in underscores for italics.</p>
      </AccordionItem>
      <AccordionItem label="Attachments">
        <p>Files up to 25 MB, such as images, PDFs, and spreadsheets.</p>
      </AccordionItem>
    </Accordion>
  ),

  "On its own": () => (
    <>
      <Field label="Endpoint URL">
        <Input name="webhook-url" type="url" placeholder="https://example.com/webhooks" />
      </Field>
      <AccordionItem label="Advanced options">
        <Field orientation="horizontal" label="Retry failed webhooks">
          <Switch defaultChecked />
        </Field>
      </AccordionItem>
      <Button>Save webhook</Button>
    </>
  ),
};
