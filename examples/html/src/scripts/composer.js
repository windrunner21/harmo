// Example only: what the React Composer does. Send can be pressed once
// something's written or attached; Enter sends, Shift+Enter starts a new
// line, and neither does while a list, such as a Mentions', is open, or an
// input method is composing text. Sending puts focus back in the field. With
// both icons, Send turns into Stop while a reply comes, data-stopping and
// type="button", its Tooltip saying data-example-stop-label; without, it
// can't be pressed then. The paperclip opens the file picker; what's picked
// or pasted is handed to your app, here as an example-files-add event, which
// file-list.js lists, and the list shows once it has a file.
//
// The rest is your app's, as the React Composer's props are: what's sent
// goes to the Conversation beside it as an example-message-add event, which
// conversation.js adds, the files moving into the message; with
// data-example-reply, a reply comes 1.5 seconds later. With
// data-example-editable, ↑ in the empty field edits your last message, from
// the data-example-editing template: a bar above the field, which Escape or
// its button closes; sending puts the new words in the message.
{
  let editingCount = 0;

  // A Chat's composers are chat.js's.
  for (const composer of document.querySelectorAll(".hcomposer:not([data-example-chat] .hcomposer)")) {
    const box = composer.querySelector(".hcomposer-box");
    const field = box.querySelector(".htextarea");
    const send = box.querySelector(":scope > .htooltip-trigger:last-child > .hbutton");
    const sendTip = send.parentElement.querySelector(".htooltip");
    const { exampleSendLabel, exampleStopLabel } = send.dataset;
    const stoppable = send.querySelector(".hcomposer-send-icons") !== null;
    const files = box.querySelector(":scope > .hfile-list");
    const picker = composer.querySelector(':scope > input[type="file"]');
    const attach = box.querySelector(":scope > .hcomposer-attach .hbutton");
    const conversation = composer.parentElement.querySelector(".hconversation");
    const editingTemplate = composer.parentElement.querySelector("template[data-example-editing]");
    let replying = false;
    let timer;
    let editing = null;

    const rows = () => (files ? [...files.children].filter((row) => !row.hasAttribute("data-leaving")) : []);
    const written = () => field.value.trim() !== "" || rows().length > 0;
    const update = () => {
      send.disabled = replying ? !stoppable : !written();
      if (stoppable) {
        send.toggleAttribute("data-stopping", replying);
        send.type = replying ? "button" : "submit";
        sendTip.textContent = replying ? exampleStopLabel : exampleSendLabel;
      }
      if (files) files.hidden = rows().length === 0;
    };

    const status = (text) => {
      const region = conversation?.querySelector(".hconversation-status");
      if (region) region.textContent = text;
    };

    const add = (from, text, moved) =>
      conversation?.dispatchEvent(new CustomEvent("example-message-add", { detail: { from, text, files: moved } }));

    const reply = (text, attached) => {
      if (!composer.hasAttribute("data-example-reply")) return;
      replying = true;
      update();
      timer = setTimeout(() => {
        const words = attached > 0 ? `Thanks, I've got ${attached === 1 ? "the file" : "the files"}.` : `On it: "${text}".`;
        add("assistant", words);
        status(words);
        replying = false;
        update();
      }, 1500);
    };

    const stopEditing = () => {
      box.querySelector(":scope > .hcomposer-editing")?.remove();
      field.removeAttribute("aria-describedby");
      editing = null;
      field.value = "";
      update();
    };

    const startEditing = () => {
      const last = [...(conversation?.querySelectorAll('.hmessage[data-from="user"]') ?? [])].at(-1);
      if (!last || !editingTemplate || replying) return false;
      editing = last;
      const bar = editingTemplate.content.firstElementChild.cloneNode(true);
      const text = last.querySelector(".hmessage-text")?.textContent ?? "";
      const id = `composer-editing-${++editingCount}`;
      bar.querySelector(".hcomposer-editing-quote").textContent = text;
      bar.querySelector(".hcomposer-editing-text").id = id;
      bar.querySelector(".hbutton").addEventListener("click", () => {
        stopEditing();
        field.focus();
      });
      box.prepend(bar);
      field.setAttribute("aria-describedby", id);
      field.value = text;
      field.setSelectionRange(text.length, text.length);
      update();
      return true;
    };

    const submit = () => {
      if (replying || !written()) return;
      const text = field.value.trim();
      if (editing) {
        editing.querySelector(".hmessage-text").textContent = text;
        stopEditing();
        return;
      }
      const moved = rows();
      add("user", text, moved);
      field.value = "";
      update();
      reply(text, moved.length);
    };

    conversation?.addEventListener("example-jump", () => field.focus());
    // Focus goes back to the field, as Send can't be pressed once it's empty.
    composer.addEventListener("submit", (event) => {
      event.preventDefault();
      submit();
      field.focus();
    });
    send.addEventListener("click", () => {
      if (!replying || !stoppable) return;
      clearTimeout(timer);
      replying = false;
      status("Stopped");
      update();
      field.focus();
    });
    field.addEventListener("input", update);
    // Not while an input method composes text: Safari's Enter that ends it
    // says so only with keyCode 229.
    field.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      if (composer.querySelector(".hpopup:popover-open")) return;
      if (event.key === "ArrowUp" && !field.value && composer.hasAttribute("data-example-editable")) {
        if (startEditing()) event.preventDefault();
        return;
      }
      if (event.key === "Escape" && editing) {
        event.preventDefault();
        stopEditing();
        return;
      }
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      submit();
    });

    if (files) {
      new MutationObserver(update).observe(files, { childList: true, subtree: true, attributeFilter: ["data-leaving"] });
      const hand = (picked) => {
        if (picked.length > 0) files.dispatchEvent(new CustomEvent("example-files-add", { detail: picked }));
      };
      attach?.addEventListener("click", () => picker.click());
      picker?.addEventListener("change", () => {
        hand([...picker.files]);
        picker.value = "";
        field.focus();
      });
      field.addEventListener("paste", (event) => {
        const pasted = [...event.clipboardData.files];
        if (pasted.length === 0) return;
        event.preventDefault();
        hand(pasted);
      });
    }
  }
}
