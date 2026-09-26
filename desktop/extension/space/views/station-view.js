// Station view: the primary location for communications management/network
// visibility (docs/design/desktop-interface-inheritance.md, "Station").
// Deep Station management remains the Station's own web-management surface
// (docs/design/client-user-experience.md, "Station management
// integration"); this view renders the frequently-used OceanMail status
// check. Reached via its own native Thunderbird Spaces-toolbar button
// (docs/decisions/0007-native-thunderbird-shell.md); the fuller Dashboard
// (models/dashboard-model.js) is rendered directly below it on the same
// page by space.js, not behind a separate click-through.

import { Implemented } from "../../station/station-client.js";

export function mountStationView(container) {
  container.innerHTML = `
    <h1>Station</h1>
    <p class="placeholder-copy">
      This panel calls a real <code>oceanmail-station</code> instance when
      one is available at the configured loopback address
      (<code>extension/station/station-client.js</code>) — it is not
      mocked. If Station is not reachable, that is reported honestly below
      rather than assumed running. A fuller operational summary follows.
    </p>
    <div class="station-check">
      <label>
        Station base URL
        <input id="station-base-url" type="text" value="http://127.0.0.1:8080" />
      </label>
      <button id="station-check-btn" class="btn btn-primary" type="button">Check Station connection</button>
    </div>
    <pre id="station-result" class="station-result">Not checked yet.</pre>
  `;

  const checkBtn = container.querySelector("#station-check-btn");
  const resultEl = container.querySelector("#station-result");
  const baseUrlInput = container.querySelector("#station-base-url");

  checkBtn.addEventListener("click", async () => {
    const baseUrl = baseUrlInput.value.trim().replace(/\/$/, "");
    resultEl.textContent = "Checking...";
    try {
      const [health, station] = await Promise.all([
        Implemented.health(baseUrl),
        Implemented.station(baseUrl)
      ]);
      resultEl.textContent = JSON.stringify({ health, station }, null, 2);
    } catch (err) {
      resultEl.textContent = `Failed: ${err.message}\n\nIs oceanmail-station running and bound to loopback at this address?`;
    }
  });
}
