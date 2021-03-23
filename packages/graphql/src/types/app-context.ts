import { Connection } from '@solana/web3.js';
import { PubSub } from 'apollo-server';

export type AppContext = {
  pubSub: PubSub;
  conn: Connection;
};
