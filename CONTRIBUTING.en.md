[日本語](CONTRIBUTING.md)

# Contributing

## Environment setup

`make build` / `make deploy` etc. run fully inside a Docker container; the host only needs Docker and `jq`.

Paths that differ per contributor, such as the local FreeLens extensions directory, go in a `.env` file at the repo root (gitignored).

```sh
# Deploy target for `make deploy` (the FreeLens extensions directory).
# Without this, `make deploy` stops with an error.
# Example (operating a native Windows FreeLens from WSL):
#   /mnt/c/Users/<user>/.freelens/extensions
FREELENS_EXT_DIR=
```

Values can also be overridden per invocation with `make <target> VAR=value`.

## Build & deploy

```sh
make build    # install dependencies + build
make deploy   # build + deploy to FREELENS_EXT_DIR
make lint     # Biome lint
make fmt      # Biome format (--write)
make pack     # pack into a .tgz
make clean    # remove node_modules/out/*.tgz/.pnpm-store
```

### First-time deploy caveat

The **first** `make deploy` of a newly added extension must be run while FreeLens is running.

FreeLens's extension discovery watches `~/.freelens/extensions/` with a file watcher (chokidar, `ignoreInitial: true`) and doesn't detect directories that already existed before the watcher started. The startup scan doesn't trigger link creation either, so a later restart won't fix it — this is FreeLens's own design, independent of OS.

Without detection, no link is created at `node_modules/freelens-cluster-sidebar` (a symlink via `pnpm install`; a Junction on Windows when Developer Mode is off). Enabling the extension then just logs `Cannot find module ...\out\renderer\index.js` and fails to load — FreeLens itself still starts fine.

This direct-placement flow isn't the officially documented install path (the official one is dropping a `.tgz` onto the Extensions screen). It's an unofficial shortcut that lets `make deploy` drive the whole build-and-deploy loop from one command, and this caveat is a side effect of that.

Subsequent updates (which only replace the contents of `out/`) are unaffected, since the link already exists.

(When deploying from WSL2 to a Windows-side FreeLens, writes to `.freelens/extensions/` cross the WSL↔Windows filesystem boundary, and whether the file watcher event reliably arrives even while FreeLens is running hasn't been verified. If a deploy doesn't show up, try restarting FreeLens to narrow it down.)

## Release process

1. Bump `version` in `package.json` to the value you want to release, and commit it
2. Run `make tag`.
   It creates and pushes the tag `vX.Y.Z` from the version in `package.json` (it refuses to run if that tag already exists)
3. GitLab CI picks up the tag and runs the following.
   - Builds and packs the extension into a `.tgz` (`make pack`) inside Docker
   - Uploads the `.tgz` and its `.sha256` to the GitLab Generic Package Registry
   - Creates a GitLab Release with those files attached
   - Mirrors the repository to GitHub
   - Creates a GitHub Release with the `.tgz` and `.sha256` attached

The GitHub mirror step only runs when the CI variables `GH_APP_ID` / `GH_APP_PRIVATE_KEY` are configured on the project.
When they are, every push to `master` and every tag is mirrored to GitHub automatically; without them, GitLab remains the sole source and the GitHub-facing jobs are skipped.
