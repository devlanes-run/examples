# Example title, the same as in catalog.json

One or two sentences: the app this example runs and what a reader learns from it. Leave the list of config keys to `catalog.json`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (only what this example needs, with the minimum version)

## Run it

```sh
cd category-example-name
devlanes start
```

Open https://example-name.localhost (the project is `example-` plus the folder name without its category). One sentence on what the page shows.

## During a start

A numbered list in start order, one line per step, with only the steps this example adds: containers, setup entries, tasks, services, `after: services` tasks.

## A feature that needs more than a step

Optional. A section of its own, titled with what the feature does, for the part of the example a numbered step cannot explain.

## Try next

Each item is one command or edit and the result the reader should see.

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/category-example-name && devlanes start`. The page there shows lane 1 at `example-name1.localhost`.
- One or two experiments that show a feature of this example, such as `devlanes stop api` and reloading the page, or editing `devlanes.yaml` and running `devlanes reload`.

## Files

- [`devlanes.yaml`](devlanes.yaml): one line on what it declares.
- [`src/`](src): one line per folder or file a reader would open first, five entries at most, each linked to the file.

## Docs

- [Guide name](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md)
