# Materia - User management Addon

Manage your user in your Materia application in few clicks

## Features

* Simple session or token based authentication
* Email / password or username / password authentication
* Custom data support
* Secure

## Installation

In your Materia application, run `yarn add @materia/users`

## Installation from local files

Clone this repository:

```
git clone https://github.com/materiahq/materia-users.git
cd materia-users
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
npm link @materia/users
```

then add "@materia/users" in your the `links` array in materia.json - it will let Materia knows of the existance of the linked addon.
