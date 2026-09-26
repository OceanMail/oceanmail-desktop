// Emergency view.
//
// oceanmail-station has no accepted Emergency submission API yet (see
// docs/STATION_API_CONTRACT_GAPS.md). Project-lead correction (PR #7
// review): opening a send-capable native compose window labeled EMERGENCY
// while the send itself is only ordinary SMTP is a dangerous product-
// semantic mismatch — the user could press Send and produce an ordinary
// message that visually claims Emergency handling it does not have. This
// view is therefore a non-transmitting local alpha design surface: it
// builds a draft preview in the page (read-only, copyable) and does NOT
// open a compose window under the Emergency label.
//
// An explicit, separately labeled "ordinary email" fallback is offered so a
// real situation still has a path to send something — but it opens plain
// compose with a subject/body that says outright it is ordinary mail, not
// Emergency OMail, per the review's requirement that any such fallback be
// unmistakably distinguished.
//
// Wording for position/time deliberately avoids implying Desktop knows
// anything about the Station's actual sources ("no Station position source
// connected" was rejected in review as an unsupported claim) — it says only
// that Desktop itself has no such data available.

const TEMPLATES = [
  { id: "medical", label: "Medical emergency" },
  { id: "fire", label: "Fire / explosion" },
  { id: "flooding", label: "Flooding / taking on water" },
  { id: "collision", label: "Collision" },
  { id: "grounding", label: "Grounding" },
  { id: "disabled", label: "Disabled / adrift" },
  { id: "overboard", label: "Person overboard" },
  { id: "abandon", label: "Abandoning vessel" },
  { id: "weather", label: "Severe weather / immediate danger" },
  { id: "security", label: "Security / piracy / violence" },
  { id: "other", label: "Other / free-form" }
];

function draftBody(template) {
  return (
    `EMERGENCY OMAIL (LOCAL DRAFT — NOT SENT) — ${template.label.toUpperCase()}\n\n` +
    "Describe the situation:\n\n\n" +
    "POSITION: unavailable to OceanMail Desktop\n" +
    "TIME: trusted time unavailable from current Station API\n\n" +
    "This is OceanMail Emergency OMail. It does not replace DSC, GMDSS, " +
    "EPIRB, or VHF/MF/HF distress procedures. If in immediate danger, use " +
    "official distress equipment."
  );
}

function ordinaryFallbackBody(template) {
  return (
    "THIS IS ORDINARY EMAIL. It is NOT OceanMail Emergency OMail and carries " +
    "no priority, queue, or delivery guarantees beyond normal SMTP.\n\n" +
    `Situation: ${template.label}\n\n` +
    "Describe the situation:\n\n\n" +
    "Position: unavailable to OceanMail Desktop\n" +
    "Time: trusted time unavailable from current Station API\n\n" +
    "If you are in immediate danger, use your vessel's official distress " +
    "equipment, not this message."
  );
}

export function mountEmergencyView(container) {
  let selectedTemplate = null;

  render();

  function render() {
    container.innerHTML = `
      <h1>Emergency</h1>
      <div class="emergency-banner">
        OceanMail Emergency OMail does <strong>not</strong> replace DSC, GMDSS,
        EPIRB, VHF/MF/HF distress procedures, satellite distress systems, or
        other regulated maritime safety services. If you are in immediate
        danger, use your vessel's official distress equipment now.
      </div>

      <p class="placeholder-copy">
        This is a <strong>non-transmitting alpha design surface</strong>.
        oceanmail-station does not yet have an accepted Emergency submission
        API (<code>docs/STATION_API_CONTRACT_GAPS.md</code>), so OceanMail
        does not send anything from this screen. Choosing a situation below
        only builds a local draft preview you can read and copy — it does not
        open a send-capable compose window under the Emergency label, because
        the actual send path today would be ordinary SMTP with no real
        Emergency priority/queue evidence behind it.
      </p>

      <h2>1. Choose a situation</h2>
      <div class="emergency-templates" id="emergency-templates"></div>

      <h2>2. Local draft preview</h2>
      <p class="placeholder-copy" id="emergency-draft-hint">Choose a situation above to see a local draft preview.</p>
      <textarea id="emergency-draft-text" class="station-result" style="width:100%;min-height:10em;" readonly hidden></textarea>
      <button id="emergency-select-btn" class="btn btn-sm" type="button" hidden>Select all text to copy</button>

      <h2>3. Ordinary email fallback (not Emergency OMail)</h2>
      <p class="placeholder-copy">
        If you need to send something now and accept it will be handled as
        ordinary mail with no Emergency handling, you may open a normal
        native compose window pre-filled with a subject and body that say so
        explicitly. This is not styled or labeled as Emergency OMail.
      </p>
      <button id="emergency-ordinary-btn" class="btn" type="button" disabled>
        Open ordinary email (not Emergency OMail)
      </button>
      <pre id="emergency-ordinary-result" class="station-result">Not opened yet.</pre>
    `;

    const templatesEl = container.querySelector("#emergency-templates");
    for (const template of TEMPLATES) {
      const btn = document.createElement("button");
      btn.className = "emergency-template-btn";
      btn.type = "button";
      btn.textContent = template.label;
      btn.setAttribute("aria-pressed", String(selectedTemplate === template.id));
      btn.addEventListener("click", () => {
        selectedTemplate = template.id;
        render();
      });
      templatesEl.appendChild(btn);
    }

    const hint = container.querySelector("#emergency-draft-hint");
    const draftText = container.querySelector("#emergency-draft-text");
    const selectBtn = container.querySelector("#emergency-select-btn");
    const ordinaryBtn = container.querySelector("#emergency-ordinary-btn");

    if (selectedTemplate) {
      const template = TEMPLATES.find((t) => t.id === selectedTemplate);
      hint.textContent = `Selected: ${template.label}. This draft is local only — nothing is sent until you choose the ordinary-email fallback below.`;
      draftText.value = draftBody(template);
      draftText.hidden = false;
      selectBtn.hidden = false;
      ordinaryBtn.disabled = false;
    }

    selectBtn.addEventListener("click", () => {
      draftText.select();
    });

    ordinaryBtn.addEventListener("click", async () => {
      const template = TEMPLATES.find((t) => t.id === selectedTemplate);
      const resultEl = container.querySelector("#emergency-ordinary-result");
      resultEl.textContent = "Opening native compose (ordinary mail)…";
      try {
        const tab = await browser.compose.beginNew(undefined, {
          subject: `(Ordinary mail — not Emergency OMail) ${template.label}`,
          plainTextBody: ordinaryFallbackBody(template)
        });
        resultEl.textContent = `Opened native compose tab: ${JSON.stringify(tab, null, 2)}`;
      } catch (err) {
        resultEl.textContent = `Failed: ${err.message}`;
      }
    });
  }
}
