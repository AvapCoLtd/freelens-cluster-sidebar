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

### First-time deploy caveat (Windows/WSL)

The **first** `make deploy` of a newly added extension must be run while FreeLens is running.
If FreeLens is not running while a new extension directory is added under `.freelens/extensions/`, the file watcher does not pick up the change, no Junction is created for `AppData\Roaming\Freelens\node_modules\freelens-cluster-sidebar`, and `lens-extensions.json` ends up with `enabled: true` but no working module — FreeLens then fails to start it with `Cannot find module ...\out\renderer\index.js`.
Subsequent updates (which only replace the contents of `out/`) are unaffected, since the Junction already exists.

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
