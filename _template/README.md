# Example title in sentence case

One or two sentences: the app this example runs and the devlanes features it shows. Name the features with their config keys, such as `infra.per_lane` or `preset: vite`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 and pnpm 10 (list only what this example needs, with versions)

## Run it

```sh
cd category-example-name
devlanes start
```

Open https://example-name.localhost (the project name is the folder name without its category). The page shows lane 0 of `example-name` and the values devlanes gave the service.

## During a start

A short paragraph or a numbered list of what happens, in start order: containers, setup entries, tasks, services, `after: services` tasks. Say which hostname serves what and where each value on the lane page comes from.

## Try next

Each item is one command or edit and the result the reader should see.

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/category-example-name && devlanes start`. The page there shows lane 1 at `example-name1.localhost`.
- One or two experiments that show a feature of this example, such as `devlanes stop api` and reloading the page, or editing `devlanes.yaml` and running `devlanes reload`.

## Files

- `devlanes.yaml`: one line on what it declares.
- `server.mjs`: one line per file a reader would open.

## Docs

- [Guide name](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md)
