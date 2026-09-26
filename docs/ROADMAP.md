# OceanMail 0.2 Roadmap

This roadmap records implementation sequence and product priority. It does not override accepted decisions, scope, or architecture.

## Current critical path

1. Prove reproducible HERMES/Mercury communications in `oceanmail-station`.
2. Prove real two-station store-forward behavior and interruption/retry evidence.
3. Prove standards-based text email over that path.
4. Define and implement the narrow authenticated Station API.
5. Build the OceanMail Desktop Thunderbird shell against the Station's standard SMTP/IMAP boundary and Station API.
6. Prove physical-radio operation.
7. Connect Station/gateway behavior to OceanMail Server and conventional Internet email.

The first proof must retain truthful evidence separating local transmission from remote durable receipt/delivery.

## Client foundation tranche

Decisions 0005 and 0006 make the Thunderbird-based, cross-platform Desktop architecture the current client implementation path.

Initial OceanMail Desktop work should:

1. establish a pinned Thunderbird development baseline and dedicated OceanMail profile;
2. create the mandatory OceanMail extension and top-level OceanMail Space/application surface;
3. suppress general-purpose account setup and unnecessary Thunderbird UI in the OceanMail test build;
4. bootstrap OceanMail accounts against the Station's SMTP/IMAP interfaces;
5. connect the extension to the authenticated Station API;
6. implement the accepted 0.1-derived OceanMail shell and Mail information architecture using `design/desktop-interface-inheritance.md` as the translation guide;
7. implement OceanMail-aware compose controls for Important metadata, attachment representations, estimates, budgets, and Emergency around Thunderbird's native compose machinery;
8. implement the persistent communications status surface and Dashboard;
9. define the custom OceanMail installer/branding/policy/update model; and
10. continuously validate the shared extension/application layer on Windows, macOS, and Linux Thunderbird foundations without allowing one development host to become product architecture.

Do not continue the old clean-sheet desktop mail-client implementation merely because prototype code exists. Preserve useful prototype requirements and UX decisions, then implement them on the Thunderbird foundation.

Do not begin Android/iOS implementation during current Desktop tranches. Mobile becomes a separate later program after the Desktop experience is mature enough to be the reference design.

## Product foundation following the proof path

- autonomous headless Station installation;
- multiple simultaneous clients on a vessel LAN;
- Station Owner/Captain, delegated Admin, Operator, and User permissions;
- Station web management using the same API/capability model as the client;
- durable queue/background operation after clients disconnect;
- deferred supported account/server-setting synchronization through the Station;
- device pairing/revocation and user-role authorization separation;
- stable user/vessel/Station identity model;
- truthful OMail lifecycle/receipt state;
- secure backup/recovery foundation appropriate to the component; and
- clear trusted-time/policy/conflict state while disconnected.

## Early product work

### OMail usability

- familiar Thunderbird-backed plain-text OMail compose/read/reply/forward workflow;
- Outbox and evidence-based delivery lifecycle;
- Available OMail/selective constrained-link retrieval;
- retrieval Manifest with explicit ordering/hold controls;
- recipient retrieval ordering and conventional Important metadata;
- byte/airtime/time estimates and budget controls;
- deferred attachments and image/representation choices;
- deduplication so already-held messages are not fetched again;
- prominent Emergency workflow and safeguards; and
- background Internet synchronization when cheap connectivity appears.

### OceanMail Desktop application shell

- OceanMail-owned top-level Space/views rather than generic Thunderbird navigation as the primary product experience;
- use the accepted 0.1 prototype and owner-approved refinements as the UX reference while current 0.2 decisions override obsolete behavior;
- persistent far-left collapsible OceanMail navigation, context-only actions, and a separate compact/watch presentation;
- dedicated OceanMail profile and managed configuration;
- no normal Gmail/Outlook/Mailcow/arbitrary IMAP account setup in 0.x;
- persistent Station/Grid/link/budget/queue status and clickable Dashboard;
- theme, dark/night mode, accessibility baseline, and OceanMail branding;
- custom installer/package containing the pinned Thunderbird base and mandatory OceanMail components;
- supported-extension-first implementation, with privileged Experiment APIs kept narrow and only a narrow downstream Thunderbird patch set if a material requirement cannot otherwise be met;
- deliberate Thunderbird-base update/compatibility testing; and
- shared Desktop behavior that remains portable across Windows, macOS, and Linux.

### Desktop platform independence

- treat Thunderbird as the desktop platform-independence layer;
- prefer shared MailExtension APIs, Spaces, HTML/CSS/JavaScript, native Thunderbird mail APIs, and shared assets;
- isolate OS-specific code primarily to packaging, launcher, signing/notarization, updater, and OS-integration work;
- keep the OceanMail extension installable/testable on compatible stock Thunderbird across Windows/macOS/Linux where practical even though the released product is the separately packaged OceanMail Desktop application;
- never use machine-wide settings or packaging shortcuts that interfere with stock Thunderbird; and
- require project-lead review before accepting a material single-platform product limitation.

### Multi-user/vessel operation

- private locked user accounts on shared Stations;
- vessel account distinct from Station administration;
- client use from Windows/macOS/Linux as implementations mature;
- server-account changes queued safely while offline; and
- map/dashboard representation of vessel/Station rather than separate vessel-like dots for each crew account.

### Safety/security/accessibility

- Emergency OMail product behavior and clear non-replacement boundary with regulated distress systems;
- best-known position/time source/freshness for emergency use;
- signed/reconcilable security/regulatory policy state where implemented;
- accessibility baseline, keyboard/screen-reader operation, scalable text, dark/night mode, and non-color-only state;
- Unicode-native semantic text/localization foundation.

### Interoperability/adoption

- Winlink interoperability where lawful, current interfaces support it, and implementation is validated;
- pursue authorized/documented SailMail interoperability;
- conventional Internet email bridge through OceanMail Server/Gateway; and
- clear service/path semantics rather than pretending external services are native OMail.

### Station visibility/operations

- web dashboard;
- map/known Station/gateway observations;
- queue and synchronization status;
- useful link/session diagnostics/history;
- software/update/recovery/operations story; and
- measured performance evidence available for later propagation/network decisions.

## Later product work

- OChat after OMail and essential interoperability are stable;
- richer/progressive attachment representations;
- broader Station tracking and propagation analytics;
- optional long-term vessel-heading/peer/band link-quality correlation;
- opportunistic/dynamic gateway selection beyond a single configured direct gateway;
- gateway contribution controls/accounting;
- server-managed OMail delivery groups/shared mailboxes;
- redundant/multiple Stations on one vessel;
- generic third-party Internet mail accounts inside OceanMail Desktop only if a later accepted product decision finds sufficient value;
- richer calendar/contact functionality beyond the local-first synchronization foundation; and
- separate iOS and Android client projects only after OceanMail Desktop is mature and well-liked enough to serve as their product reference. Their technology foundations will be selected later rather than inherited automatically from Desktop.

## Evidence-gated future networking

Multi-hop maritime relay is not assumed.

Reconsider it after:

1. direct Station-to-gateway email works;
2. dynamic/opportunistic direct gateway selection works; and
3. field measurements demonstrate material benefit from vessel-to-vessel forwarding.

Before promotion, require evidence that a candidate approach improves real delivery enough to justify added control traffic, storage, security/identity complexity, and operational burden.

At that point compare viable DTN/network approaches rather than automatically restoring the old M4P architecture.

Preserved future requirements are in `research/maritime-networking-requirements.md`.

## Lower-layer research

`oceanmail-station` owns detailed RF/rendezvous/modem/link experiments.

Do not start a new modem/network protocol merely to complete old 0.1 plans. Existing/upstream technology is the baseline; replacement work requires measured unmet need.

## Scope control

Items not required by the current phase belong in `WISHLIST.md` or `research/` until explicitly promoted by an accepted decision or roadmap update.
