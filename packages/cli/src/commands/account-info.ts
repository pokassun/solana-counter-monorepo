import { Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

export default async function main(
  address: string,
  network: Cluster = 'devnet'
) {
  if (!address) {
    console.log('No account supplied');
    process.exit(1);
  }

  console.log('Lets look at account:', address);

  const pk = new PublicKey(address);

  const url = clusterApiUrl(network);
  const connection = new Connection(url);

  const account = await connection.getAccountInfo(pk);

  if (!account) {
    console.log('Account not found on chain');
    process.exit(1);
  }

  console.log('Owner PubKey (ProgramId):', account.owner.toBase58());
}
