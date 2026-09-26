"use strict";

// Narrowly-scoped Thunderbird Experiment API: the only supported way to
// create a native IMAP/SMTP account (the MailExtension `accounts` API can
// read accounts but cannot create them — see desktop/docs/THUNDERBIRD_BASELINE.md
// and the Tranche 2 brief). This calls the exact same backend function the
// built-in Account Hub setup wizard uses
// (resource:///modules/accountcreation/CreateInBackend.sys.mjs), rather than
// re-deriving nsIMsgAccount/nsIMsgIncomingServer/nsIMsgOutgoingServer wiring
// ourselves, confirmed by reading that module in the pinned 140.14.0esr
// build. Deliberately exposes exactly one operation (ensureAccount) — do not
// grow this into a general account-control surface.

var oceanmailAccounts = class extends ExtensionAPI {
  getAPI(context) {
    return {
      oceanmailAccounts: {
        async ensureAccount(config) {
          const { MailServices } = ChromeUtils.importESModule(
            "resource:///modules/MailServices.sys.mjs"
          );
          const { AccountConfig } = ChromeUtils.importESModule(
            "resource:///modules/accountcreation/AccountConfig.sys.mjs"
          );
          const { CreateInBackend } = ChromeUtils.importESModule(
            "resource:///modules/accountcreation/CreateInBackend.sys.mjs"
          );

          const accountConfig = new AccountConfig();

          accountConfig.incoming.type = "imap";
          accountConfig.incoming.hostname = config.incomingHostname;
          accountConfig.incoming.port = config.incomingPort;
          accountConfig.incoming.username = config.incomingUsername;
          accountConfig.incoming.password = config.incomingPassword;
          accountConfig.incoming.auth = Ci.nsMsgAuthMethod.passwordCleartext;
          accountConfig.incoming.socketType = Ci.nsMsgSocketType.plain;
          accountConfig.incoming.loginAtStartup = true;

          accountConfig.outgoing.type = "smtp";
          accountConfig.outgoing.hostname = config.outgoingHostname;
          accountConfig.outgoing.port = config.outgoingPort;
          accountConfig.outgoing.socketType = Ci.nsMsgSocketType.plain;
          if (config.outgoingRequiresAuth) {
            accountConfig.outgoing.auth = Ci.nsMsgAuthMethod.passwordCleartext;
            accountConfig.outgoing.username = config.outgoingUsername;
            accountConfig.outgoing.password = config.outgoingPassword;
          } else {
            // Matches the current lab/Station SMTP boundary: loopback-trusted
            // submission with no authentication (see
            // docs/STATION_API_CONTRACT_GAPS.md — this is a lab fact, not a
            // production security decision).
            accountConfig.outgoing.auth = Ci.nsMsgAuthMethod.none;
          }

          accountConfig.identity.realname = config.realName;
          accountConfig.identity.emailAddress = config.emailAddress;
          accountConfig.displayName = config.displayName;

          // Idempotent detection: reuse Thunderbird's own existence checks
          // (the same ones the Account Hub uses to avoid duplicate servers)
          // rather than re-deriving incoming-server matching logic ourselves.
          const existingIncoming =
            CreateInBackend.checkIncomingServerAlreadyExists(accountConfig);

          if (existingIncoming) {
            const account = MailServices.accounts.accounts.find(
              (a) =>
                a.incomingServer &&
                a.incomingServer.key === existingIncoming.key
            );
            if (account) {
              // An incoming-server match alone is not enough to declare the
              // OceanMail-managed account healthy. Validate the identity and
              // SMTP side as well so a persistent profile cannot silently keep
              // stale routing/security settings after configuration changes.
              // Do not mutate an existing account piecemeal here: creation is
              // intentionally delegated to Thunderbird's Account Hub backend,
              // and future production migration/reconfiguration should likewise
              // be explicit rather than partially reimplementing that backend.
              const identity = account.defaultIdentity;
              if (!identity) {
                throw new Error(
                  "Existing OceanMail account has no default identity; refusing to use a partial account"
                );
              }

              // nsIMsgOutgoingServer's base interface exposes port/socketType/
              // authMethod/username generically, but NOT hostname — that is
              // declared on nsISmtpServer specifically, so an explicit
              // QueryInterface is required or .hostname reads back as
              // undefined (confirmed by testing against a live account: the
              // comparison below would then always report a mismatch and
              // this validation would always throw).
              const outgoingServer = identity.smtpServerKey
                ? MailServices.outgoingServer.getServerByKey(identity.smtpServerKey)
                : null;
              const outgoing = outgoingServer
                ? outgoingServer.QueryInterface(Ci.nsISmtpServer)
                : null;
              if (!outgoing) {
                throw new Error(
                  "Existing OceanMail account has no bound SMTP server; refusing to use a partial account"
                );
              }

              const expectedOutgoingAuth = config.outgoingRequiresAuth
                ? Ci.nsMsgAuthMethod.passwordCleartext
                : Ci.nsMsgAuthMethod.none;
              const mismatches = [];

              if (identity.email !== config.emailAddress) {
                mismatches.push("identity.email");
              }
              if (identity.fullName !== config.realName) {
                mismatches.push("identity.fullName");
              }
              if (outgoing.hostname !== config.outgoingHostname) {
                mismatches.push("smtp.hostname");
              }
              if (outgoing.port !== config.outgoingPort) {
                mismatches.push("smtp.port");
              }
              if (outgoing.socketType !== Ci.nsMsgSocketType.plain) {
                mismatches.push("smtp.socketType");
              }
              if (outgoing.authMethod !== expectedOutgoingAuth) {
                mismatches.push("smtp.authMethod");
              }
              if (
                config.outgoingRequiresAuth &&
                outgoing.username !== config.outgoingUsername
              ) {
                mismatches.push("smtp.username");
              }

              if (mismatches.length > 0) {
                throw new Error(
                  `Existing OceanMail account configuration is stale or inconsistent (${mismatches.join(
                    ", "
                  )}); refusing to silently reuse it`
                );
              }

              if (
                config.makeDefault &&
                account.incomingServer.canBeDefaultServer &&
                MailServices.accounts.defaultAccount !== account
              ) {
                MailServices.accounts.defaultAccount = account;
              }
              return { created: false, accountId: account.key };
            }
          }

          const account =
            await CreateInBackend.createAccountInBackend(accountConfig);
          return { created: true, accountId: account.key };
        },
      },
    };
  }
};
