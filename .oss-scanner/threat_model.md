# Threat model — restana

## What this project does and where untrusted input enters
- restana is a minimal Node.js HTTP framework for REST APIs, built on the `0http` router.
- All HTTP request data is untrusted: method, URL/path, query string, headers (including `x-forwarded-*`), and body streams.
- Application code (route handlers, middlewares, error handlers, config passed to `restana()`) is trusted.

## Components that matter most / least
- In scope, highest priority: `index.js` (service setup, default error handler, router wiring), `libs/request-router.js`, `libs/response-extensions.js` (`res.send`, error serialization, status code handling), `libs/security-headers.js`, `libs/utils.js`.
- In scope, lower priority: `libs/elastic-apm.js`, `libs/newrelic-apm.js`, `libs/apm-base.js` (APM integrations).
- Out of scope: `demos/`, `performance/`, `docs/`, `specs/`, and vulnerabilities only reachable through devDependencies.
- The production dependency `0http` is maintained by us and enrolled separately; report issues found through it, but note the root cause.

## How to exercise it
- `npm test` runs the mocha suite in `specs/` (includes `specs/security.test.js` and `specs/security-review-2026.test.js`).
- Minimal server: `const service = require('./index')(); service.get('/', (req, res) => res.send('ok')); service.start(3000)`.

## How you rate severity
- Critical: remote code execution, or bypass of routing/middleware that lets an unauthenticated request reach a handler it should not.
- High: a single request that crashes the process (uncaught exception, unhandled rejection), header/response splitting, prototype pollution reachable from request data.
- Medium: resource exhaustion needing sustained traffic (CPU/regex/memory), information disclosure in production mode (`NODE_ENV=production`), security-header misconfiguration.
- Low: information disclosure only when `NODE_ENV !== 'production'` (documented behavior), hardening suggestions.

## Anything to leave alone
- Known, documented items in `sec-findings.md` already marked "By design" or "Fixed".
- Advisories that only affect devDependencies.
