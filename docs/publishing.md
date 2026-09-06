# Publishing Kiso

The repository has two public npm workspaces:

| Workspace | Package | Contents |
| --- | --- | --- |
| `packages/kiso` | `@momoi-labs/kiso` | Generated tokens, CSS, and contracts |
| `packages/kiso-react` | `@momoi-labs/kiso-react` | React components, declarations, and CSS entry point |

The root is private. Kiso's sources remain in `kiso/` and `tokens/`; its build
copies publishable files into its workspace and excludes `kiso/blocks/`.
Do not edit those generated copies. The private console and gallery consume
the React workspace and never ship inside either npm package.

## First React release

1. Merge the implementation PR. Changesets then opens `chore: release kiso`.
2. Check that the release PR sets `packages/kiso-react/package.json` to `0.1.0`,
   updates its changelog and the root lockfile, and passes CI. Merge it.
3. In a clean checkout of that release on `main`, run:

   ```sh
   git pull --ff-only
   npm ci
   npm run check
   npm run check:react
   npm login
   npm publish --workspace=@momoi-labs/kiso-react --access public --provenance=false
   ```

   Use an npm account with publishing rights in the `momoi-labs` organization.
   Complete the browser login and 2FA prompts. This first publish creates the
   package on npm; no separate package-registration form is needed. Local
   publication disables provenance because it has no GitHub Actions identity.
   Do not publish the initial development version `0.0.0`.
4. Verify the result, then create the first Git tag and GitHub release from
   the same commit you published:

   ```sh
   npm view @momoi-labs/kiso-react@0.1.0 version
   git tag -a '@momoi-labs/kiso-react@0.1.0' -m 'Release @momoi-labs/kiso-react 0.1.0'
   git push origin '@momoi-labs/kiso-react@0.1.0'
   gh release create '@momoi-labs/kiso-react@0.1.0' --verify-tag --title '@momoi-labs/kiso-react 0.1.0' --notes-file packages/kiso-react/CHANGELOG.md
   ```

   Run these tag commands only after npm confirms publication. If publication
   succeeded but a later command failed, resume at that command; npm will not
   accept a second publication of the same version.
5. In the npm package's **Settings > Trusted publishing**, add GitHub Actions:

   | Field | Value |
   | --- | --- |
   | Organization or user | `momoi-labs` |
   | Repository | `blueprint` |
   | Workflow filename | `release.yml` |
   | Environment name | `npm` |
   | Allowed actions | Allow direct publication with `npm publish` |

   This setting belongs to each npm package. Keep the existing publisher for
   `@momoi-labs/kiso`; configure the new one for `@momoi-labs/kiso-react`.
   Subsequent workflow publications use OIDC and generate provenance. No npm
   token needs to be added to GitHub. See npm's
   [trusted publisher configuration](https://docs.npmjs.com/trusted-publishers/).

## Subsequent releases

1. Include `npm run changeset` with changes to either public package. Select the
   affected packages, their SemVer increments, and a short description.
2. After the feature PR merges, review and merge the Changesets release PR.
   Versions are independent; a React-only change does not bump Kiso.
3. Open GitHub **Actions > Release > Run workflow**, select `main`, and enter
   `publish-kiso`. Approve the `npm` environment if GitHub requests it.
4. The workflow validates both packages and the demo, publishes versions that
   are absent from npm, pushes their Git tags, and creates GitHub releases.

Equivalent dispatch from the CLI:

```sh
gh workflow run release.yml --ref main -f confirm_publish=publish-kiso
```

The confirmation publishes all prepared packages, so both npm publishers must
be configured before running it. Merging a PR or pushing a tag does not publish.
The dispatch is restricted to `main`.

npm's `latest` dist-tag selects the default installation version. Git tags
identify the source of each release and now include the package name, for
example `@momoi-labs/kiso-react@0.1.1` and `@momoi-labs/kiso@0.4.1`.
Older single-package `v...` tags remain unchanged. Changesets creates the tags
on later publications; do not create them in advance. See the
[Changesets action](https://github.com/changesets/action) for tag and release handling.
