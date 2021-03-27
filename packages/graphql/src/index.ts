import 'reflect-metadata';

import { getConnection } from '@counter/solana';
import { ApolloServer, PubSub } from 'apollo-server';
import path from 'path';
import { buildSchema, emitSchemaDefinitionFile } from 'type-graphql';

import { CounterResolver } from './types/counter-resolver';

async function bootstrap() {
  // Build the TypeGraphQL schema
  const schema = await buildSchema({
    resolvers: [CounterResolver]
  });

  await emitSchemaDefinitionFile(
    path.resolve(__dirname, './', 'schema', 'schema.gql'),
    schema
  );

  const conn = await getConnection('devnet');

  const pubSub = new PubSub();

  // Create GraphQL server
  const server = new ApolloServer({
    schema,
    playground: true,
    introspection: true,
    context: {
      conn,
      pubSub
    },
    // endpoint path for subscriptions
    subscriptions: '/subscriptions'
  });

  // Start the server
  const { url } = await server.listen(4000, '0.0.0.0');
  console.log(`Server is running, GraphQL Playground available at ${url}`);
}

bootstrap();
