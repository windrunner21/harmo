import { Banner, Button } from "@harmo-ui/react";
import { useState } from "react";
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from "../app-icons.tsx";

export const examples = {
  Statuses: () => (
    <>
      <Banner icon={<InfoIcon />}>
        Translation settings apply to new conversations only.
      </Banner>
      <Banner status="success" icon={<SuccessIcon />}>
        Your WhatsApp number is connected and ready to send.
      </Banner>
      <Banner status="warning" icon={<WarningIcon />}>
        Your message quality is low. Fewer people will receive your campaigns.
      </Banner>
      <Banner status="error" icon={<ErrorIcon />}>
        We couldn't reach WhatsApp. Check the connection in your business
        settings.
      </Banner>
    </>
  ),

  "With an action": () => (
    <Banner
      status="warning"
      icon={<WarningIcon />}
      action={
        <Button variant="secondary" size="small">
          Send template
        </Button>
      }
    >
      The 24-hour reply window has closed. Send a template to reply.
    </Banner>
  ),

  "Added after the page loads": () => {
    const [failed, setFailed] = useState(false);
    const send = () => {
      setFailed(false);
      setTimeout(() => setFailed(true), 100);
    };

    return (
      <>
        <div>
          <Button variant="secondary" onClick={send}>
            Send message
          </Button>
        </div>
        <Banner
          status="error"
          icon={<ErrorIcon />}
          role="alert"
          id="send-error"
          hidden={!failed}
        >
          The message wasn't sent. Check your connection and try again.
        </Banner>
      </>
    );
  },

  "Long message": () => (
    <Banner
      status="warning"
      icon={<WarningIcon />}
      action={
        <Button variant="secondary" size="small">
          Send template
        </Button>
      }
    >
      The 24-hour reply window has closed. Send a template to reply.
    </Banner>
  ),
};
