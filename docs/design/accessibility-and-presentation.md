# Accessibility, Text, and Presentation

- **Status:** Accepted 0.2 design direction

## Accessibility is a product requirement

OceanMail should be usable by people with color-vision deficiencies, low vision or blindness, dyslexia, motor limitations, hearing limitations, and other accessibility needs.

A useful accessibility baseline is enabled by default. More specialized accommodations may be user-selectable.

## Default baseline

Core interfaces should provide:

- meaningful visible labels and accessible names;
- critical state conveyed by text/icon/shape/position rather than color alone;
- scalable text without clipping or loss of core function;
- reasonable contrast;
- visible keyboard focus;
- keyboard-operable core desktop workflows;
- semantic structure for screen readers;
- visual equivalents for audible alerts and appropriate audible equivalents for important visual state; and
- platform-appropriate touch targets on touch devices.

## Screen-reader requirement

A blind user should be able to perform core workflows including:

- read and compose OMail;
- navigate accounts/mailboxes;
- understand queue/progress and delivery states;
- use OChat;
- review high-level Station/Grid status;
- receive emergency notices;
- use contacts/calendar where supported; and
- authenticate/lock/unlock an account.

Status lights and progress bars must expose equivalent textual/numeric state.

## Keyboard and non-drag alternatives

Every essential drag-and-drop/reorder function must have a non-drag alternative such as:

- Move earlier/later;
- Move up/down;
- menu actions; or
- keyboard shortcuts.

Collapsed navigation and compact/watch presentation must preserve keyboard and assistive-technology access.

## Optional accessibility preferences

Potential settings include:

- high contrast;
- larger text/UI scaling;
- color-vision profiles;
- reduced motion/no animation;
- increased line/text spacing;
- dyslexia-friendly local presentation choices;
- enhanced keyboard shortcuts;
- audible notification customization;
- visual notification customization; and
- platform-native accessibility integrations.

There is no assumption that one universal “colorblind mode” works for every user.

## Unicode-native text

OceanMail is Unicode-native. User-visible semantic text should support UTF-8 end-to-end and should not require ASCII transliteration merely to fit radio assumptions.

Examples include:

- user/contact names;
- vessel/Station display names;
- subjects and message bodies;
- OChat names/messages;
- calendar/contact text; and
- localized UI strings.

Visible names are not protocol/security identities. Stable internal identities remain distinct from changeable Unicode display names.

## Normalization

Where OceanMail needs deterministic text identity/comparison, the owning domain must define an explicit Unicode-normalization boundary rather than normalizing arbitrary binary/security data.

NFC is the preferred baseline for native OMail semantic text unless a later implementation/specification decision establishes a better domain-specific rule.

Opaque IDs, hashes, signatures, keys, binary attachments, and encoded transport bytes must never be modified by Unicode normalization.

## Byte accounting

Constrained-link estimates and limits must use the actual encoded/transfer cost, not Unicode character count.

Multilingual test corpora should be included in performance/size testing. English/ASCII efficiency must not be mistaken for universal text behavior.

## Semantic text, local presentation

Native OMail/OChat transmit semantic text, not sender-selected typography.

Font family, font size, text color, bold/italic styling, and similar presentation preferences remain local unless a future separate content type explicitly requires them.

This permits each recipient to use their own accessible presentation without spending radio bandwidth reproducing the sender's UI choices.

## OMail formatting

Native OMail bodies remain plain text. This does not prevent the local client from presenting quoted replies, signatures, headers, links, or accessibility features cleanly; it means rich HTML/style payload is not required to preserve sender formatting.

## Search and comparison

Search/autocomplete should be Unicode-aware and must not assume every language uses English casing, word boundaries, or left-to-right text.

## Localization and RTL

The application should be localizable. Right-to-left scripts/layout must be supported appropriately rather than forcing every locale into left-to-right presentation.

Machine translation is not required for initial operation. If translation is added later, the original received text remains authoritative; local/offline translation is preferable where practical for intermittent operation.

## Status semantics

Examples of state that must not rely on color alone include:

- outgoing/incoming/receiving direction;
- queued/transmitting/transmitted/delivered state;
- Station/Internet/radio availability;
- warnings/failures;
- consensual-location states; and
- trusted-time confidence.

## Ownership

- **Client:** primary accessibility/localization/presentation implementation.
- **Station web UI:** equivalent accessible management behavior appropriate to browser-based administration.
- **Station/Server APIs:** expose textual/structured state sufficient for accessible clients; do not require color/visual interpretation to understand machine state.
