# Security

## Trust boundaries

- All offline fixtures are synthetic and schema-validated.
- The local replay path requires no credentials or outbound integration.
- The plugin network allowlist contains only the documented speech provider and localhost development endpoints.
- Collaboration payloads use `example.invalid` links and a synthetic channel identifier.
- Live enterprise integrations are outside this public reference.

Never commit real meeting audio, transcripts, attendees, CRM exports, access tokens, organization metadata, screenshots, or deployment configuration.

## Reporting

Use GitHub private vulnerability reporting. Do not place a credential, private transcript, or personal data in a public issue.

