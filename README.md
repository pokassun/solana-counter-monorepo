# solana-counter-monorepo

Simple counter app on Solana blockchain

This monorepo is divided in

- **cli**: a simple cli built with [commander.js](https://github.com/tj/commander.js/) to deploy the program
- **client**: the web app application built with [NextJs](https://nextjs.org/)
- **graphql**: the graphql server to query the counter data using [TypeGraphQL](https://typegraphql.com/)
- **program**: the rust counter program 
- **solana**: some common functions like Wallet, get connection, etc


## Getting Started

### Setup anchor

Dependencies

```sh
npm install -g typescript ts-mocha  @project-serum/anchor
```

You also need NODE_PATH 

```sh
# on mac
export NODE_PATH=~/.npm-global/lib/node_modules/ 
```

Run test

```sh
anchor test
```

if get connection error, kill `solana-test-validator


### Step 1 - Build Program

We need to build the counter program:

```bash
    yarn program:build
```

This command will create a compiled `spl_counter.so` inside the `packages/program/dist` folder.

### Step 2 - Deploy Program

To deploy the compiled program we will run:

```bash
    yarn program:deploy
    # short for 
    yarn cli deploy program/dist/spl_counter.so 4 devnet

```

This command will deploy on the `spl_counter.so` to the devnet and create a `config.json` file inside the `packages/program/dist` folder, containing the current deployed program information such as ProgramId.

> NOTE: The config.json information are used in the Web and GraphQL app.


### Step 3 - Start GraphQL server

You need to start the graphQL server, you can do it by:

```bash
    yarn graphql:start
```

The graphql will run at `http://localhost:4000/`


> NOTE: If you change the graphQL host or port, remember to update the `NEXT_PUBLIC_GRAPHQL_HOST` in the root `.env` file.

### Step 4 - Start WebApp

The web app is built on top of the NextJS server and can be started in development mode with:

```bash
    yarn client:dev
```

It will run at `http://localhost:3000/`

> NOTE: for production you can first build the app `yarn client:build` then start serving it with `yarn client:start`.

## License

MIT