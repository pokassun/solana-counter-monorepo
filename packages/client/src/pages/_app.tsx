import '../styles/global.css';
import 'tailwindcss/tailwind.css';

import {
  ApolloClient,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
  split
} from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getOperationDefinition } from '@apollo/client/utilities';
import { AppProps } from 'next/app';
import React, { useMemo } from 'react';

const graphQLHost = process.env.NEXT_PUBLIC_GRAPHQL_HOST;

const httpLink = createHttpLink({
  uri: `http://${graphQLHost}`
});

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  const wsLink = useMemo(
    () =>
      typeof window !== 'undefined'
        ? new WebSocketLink({
            uri: `ws://${graphQLHost}/subscriptions`,
            options: {
              reconnect: true
            }
          })
        : undefined,
    []
  );

  const apolloClient = useMemo(
    () =>
      new ApolloClient({
        link: split(
          ({ query }) => {
            const meta = getOperationDefinition(query);
            return (
              meta?.kind === 'OperationDefinition' &&
              meta?.operation === 'subscription'
            );
          },
          wsLink || httpLink,
          httpLink
        ),
        cache: new InMemoryCache()
      }),
    []
  );

  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}

export default MyApp;
