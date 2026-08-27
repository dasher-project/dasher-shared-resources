# dasher-shared-resources

Shared resources consumed by every Dasher v6 frontend as a git submodule.

## Contents

| File | Purpose |
|------|---------|
| `ui-strings.json` | Canonical English UI string catalogue (RFC 0003). Frontends generate their platform-native translation files (`.po`, `values-XX/strings.xml`, `.xcstrings`, `.resx`) from this single source. |

## Consuming

Add as a submodule:

```bash
git submodule add https://github.com/dasher-project/dasher-shared-resources.git shared-resources
```

Then point your frontend's translation generation script at `shared-resources/ui-strings.json`.

## Contributing translations

Edit the canonical English in `ui-strings.json`, then run your frontend's generation script to propagate. Machine-translated locales are refreshed via the batch translate scripts in each frontend.

## Licence

MIT — same as DasherCore and all frontends.
