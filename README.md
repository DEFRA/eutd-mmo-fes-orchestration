# mmo-ecc-orchestration-svc

- Api layer for https://github.com/TransformCore/mmo-ecc-fe

## Pre-requisites

- node (12) & npm
- redis server (installed locally for dev and for prod Azure redis cache will be used)
- mongodb (installed locally for dev and for prod cosmos db will be used)

For local installation please refer to your OS documentation,

- MacOS: `brew install redis mongodb` (The default config should be fine for local development)
- Windows: `??` (The default settings should work I think!)

# Things to Consider

- This repository should use GitFlow as a branching strategy.
  <img
      src="docs/images/GitFlow-branching-strategy.png"
      alt="Branching Strategy"
      title="GitFlow"
      style="display: inline-block; margin: 0 auto; max-width: 350px">
- If you won't call your branch as per agreed branching `standards`, the Azure pipeline won't start or may fail to deploy an image.

## Development

For development, the pre-requisites are

- local redis server is running on localhost port 6379 without password
- local mongo server is running on localhost port 27017 without password
- take a copy of the `.envSample` file and save it as `.env` - this will set the default env vars required for running the project.

Use the following targets,

- `npm start` will start without auth
- `npm run start-with-auth` will start with auth

### Troubleshooting

#### Error "no such file or directory: ./node_modules/pre-commit/hook" when commiting a change

This is likely due to a `husky` misconfiguration. You should be able to resolve this issue with a clean install of the packages

```bash
rm -rf ./node_modules && npm i
```

If you are still having trouble please see the [husky troubleshooting guide](https://typicode.github.io/husky/troubleshoot.html)

## Environment variables

Look up applicationConfig.ts

## To build and run

```bash
cd mmo-ecc-orchestration-svc
npm i
npm start
```

Then query http://localhost:5500/v1/vessels/search?name=SHA

If the page has to be secured, use env variable USE_BASIC_AUTH=true.

```bash
npm run start-with-watch
```

To run the tests:

```bash
npm run test
```

Coverage information can be found on `coverage/index.html`. It produces cobertura format report too which is used only in VSTS.

_Note_: if you are having issues with ARM architecture, add `MONGOMS_ARCH=arm64` to your `.env` file.

## To run in docker

Make sure you have docker installed and ready to go! See: https://docs.docker.com

Build

```bash
docker build -t mmo-ecc-orchestration-svc .
```

Run

```bash
docker run -p 5500:5500 --name mmo-ecc-orchestration-svc mmo-ecc-orchestration-svc
```
