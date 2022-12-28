# 1dchess

If you think 5D chess is complicated, wait till you try 1D chess.

## Dev Setup

I use asdf -- the node version I used is stored in `.tool-versions`.
You will need `yarn 2`:

```
$ corepack enable
$ corepack prepare yarn@stable --activate
```

Then install and run:

```
$ yarn
$ yarn dev
```

## Build

Built with vite:

```
$ yarn vite build
```

This will generate static assets in the `dist/` subdir.

## Deploy

I am using firebase real-time DB and firebase hosting.
Remember to `vite build` before deploying!

```
$ yarn firebase deploy
```
