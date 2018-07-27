# Materia - Addon Boilerplate

Starter kit to create a Materia Addon.

## Features

- Minimal server
- Default addon view (Angular 6 + Angular Material)
- **Custom setup dialog**
- Build system (@angular/cli + ng-packagr + TypeScript + Sass)

## Installation from NPM

In your Materia application, run `yarn add @materia/addon-boilerplate`

Restart Materia Designer

## Installation from local files

Clone this repository:

```
git clone git@github.com:thyb/materia-addon-boilerplate.git
cd materia-addon-boilerplate
```

Then install dependencies and build:

```
yarn
yarn build
```

To test your addon locally before publishing it to NPM, use `npm link`:

```
cd dist && npm link
```

and in your materia application

```
npm link @materia/addon-boilerplate
```

then add `"@materia/addon-boilerplate": "^1.0.0"` in the dependencies of the package.json - it will let Materia knows of the existance of the addon.
