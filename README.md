# dsh-dt-ui

English | [中文](README.zh.md)

dsh-dt-ui is a "Taozhe"-themed DSH Web GUI project: a standalone Vite + React
preview workspace (`src/`), a set of own cordis plugins (`plugins/`), skins
(`skins/`), desktop pets (`pets/`), and skills (`.dsh/skills/`). Naming and
package shape follow the official dsh-web-ui conventions, but keep this
project's own `dsh-dt-*` / `@masked-knight02` system. See
[AGENTS.md](AGENTS.md) for the naming and skeleton rules.

## Layout

```text
src/                         standalone Vite + React preview workspace
plugins/dsh-dt-<feature>/    cordis plugins (host + client halves)
skins/<skin-id>/             skin packages (skin.json + client apply)
pets/<pet-id>/               pet manifests (pet.json + animation frames)
.dsh/skills/<name>/          skills
public/                      static assets for the preview app
```

## Quick start

Preview app (no DSH required):

```sh
npm install
npm run dev            # http://localhost:5173
```

Plugins (real DSH ability), one per directory:

```sh
cd plugins/dsh-dt-pet && pnpm install && pnpm run build && cd ../..
```

Then register into a dsh profile:

```sh
dsh plugin --profile web add link:$(pwd)/plugins/dsh-dt-pet
dsh --profile web
```

## Plugins

| Directory | Package | Role |
| --- | --- | --- |
| dsh-dt-status | @masked-knight02/dsh-client-ui-dt-status | workspace / session status |
| dsh-dt-pet | @masked-knight02/dsh-client-ui-dt-pet | pet status linkage |
| dsh-dt-git | @masked-knight02/dsh-client-ui-dt-git | git graph |
| dsh-dt-run | @masked-knight02/dsh-client-ui-dt-run | task execution |
| dsh-dt-ssh | @masked-knight02/dsh-client-ui-dt-ssh | SSH operations |
| dsh-dt-board | @masked-knight02/dsh-client-ui-dt-board | task board |
| dsh-dt-stats | @masked-knight02/dsh-client-ui-dt-stats | live stats |
| dsh-dt-remote | @masked-knight02/dsh-client-ui-dt-remote | mobile remote |
| dsh-dt-panel | @masked-knight02/dsh-client-ui-dt-panel | files / changes / preview panel |
| dsh-dt-skins | @masked-knight02/dsh-client-ui-dt-skins | skin center |
| dsh-dt-all | @masked-knight02/dsh-client-ui-dt-all | aggregate (install all) |

## Skins and pets

- Skins: one skin is `skins/<id>/` with a `skin.json`; the skin center
  (`plugins/dsh-dt-skins/`) auto-discovers `skins/*/skin.json`. Currently ships
  `dt-light`, `dt-dark`, and `dt-light-deep`. Add a skin by following the `skin-developer` skill.
- Pets: one pet is `pets/<id>/pet.json` plus `public/pet/<id>/<mode>/` frames.
  Currently ships `taozhe`. Add a pet by following the `pet-developer` skill.

## Conventions

UTF-8 + LF, no BOM/CRLF, no emoji, kebab-case file names, bilingual README
triples (`README.md` + `README.zh.md` + `README.i18n.yaml`). Full rules in
[AGENTS.md](AGENTS.md).
