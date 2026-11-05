# Test fixtures

`localhost.crt` and `localhost.key` are a self-signed certificate for `localhost`, used only by
`e2e/push.spec.ts` to run a local mock Web Push service over HTTPS. They protect nothing and are
not used by the app.
