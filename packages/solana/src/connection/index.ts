import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';

/**
 * Connection to the network
 */
let connection: Connection;

export async function getConnection(network = 'devnet'): Promise<Connection> {
  if (connection) {
    return connection;
  }
  const url = clusterApiUrl(<Cluster>network);
  connection = new Connection(url);
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', url, version);
  return connection;
}
