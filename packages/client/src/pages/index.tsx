import { gql, useQuery, useSubscription } from '@apollo/client';
import { CounterProgram } from '@counter/programs';
import { getConnection } from '@counter/solana';
import { SolletWallet } from '@counter/wallets';
import { Provider } from '@project-serum/anchor';
import React, { useEffect, useMemo, useState } from 'react';

import { Button, ButtonRadius, Container, Footer, Header } from '../components';

const GET_COUNT = gql`
  query {
    GetCurrentCount
  }
`;

const SUBSCRIBE_COUNT = gql`
  subscription {
    CounterCountChanges {
      count
      date
    }
  }
`;

const Main: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const wallet: SolletWallet = useMemo(
    () => new SolletWallet('https://www.sollet.io', 'devnet'),
    []
  );

  const [connectedWallet, setConnectedWallet] = useState<
    SolletWallet | undefined
  >(undefined);
  const [isConnected, setConnected] = useState(false);
  const [counterValue, setCounterValue] = useState<number>();

  useQuery<{ GetCurrentCount: number }>(GET_COUNT, {
    onCompleted: ({ GetCurrentCount }) => {
      setCounterValue(GetCurrentCount);
      addLog('Initial count: ' + GetCurrentCount);
    },
    onError: error => {
      addLog('Error get initial count: ' + error.message);
    }
  });

  useSubscription<{
    CounterCountChanges: { count: number };
  }>(SUBSCRIBE_COUNT, {
    onSubscriptionData: ({ subscriptionData }) => {
      const count = subscriptionData?.data?.CounterCountChanges.count;
      setCounterValue(count);
      addLog('Current counts: ' + count);
    }
  });

  useEffect(() => {
    if (connectedWallet) {
      connectedWallet.once('connect', () => {
        setConnected(true);
        addLog('Connected to wallet ' + connectedWallet?.publicKey?.toBase58());
      });
      connectedWallet.once('disconnect', () => {
        setConnected(false);
        setConnectedWallet(undefined);
        addLog('Disconnected from wallet');
      });
      connectedWallet.connect().catch(error => {
        addLog('Connection to wallet failed ' + error.toString());
      });
      return () => {
        connectedWallet.disconnect();
      };
    }
  }, [connectedWallet]);

  const addLog = (log: string) => {
    setLogs(logs => [...logs, log]);
  };

  const handleConnect = () => {
    // Trigger connection
    setConnectedWallet(wallet);
  };

  const handleDisconnect = async () => {
    await connectedWallet?.disconnect();
    setConnectedWallet(undefined);
  };

  const handleIncrement = async () => {
    if (!connectedWallet) {
      return;
    }
    try {
      const connection = await getConnection('devnet');
      const counterProgram = new CounterProgram(
        new Provider(connection, connectedWallet, {})
      );
      await counterProgram.increment();
    } catch (e) {
      addLog('Error: ' + e.toString());
    }
  };

  const handleDecrement = async () => {
    if (!connectedWallet) {
      return;
    }
    try {
      const connection = await getConnection('devnet');
      const counterProgram = new CounterProgram(
        new Provider(connection, connectedWallet, {})
      );
      await counterProgram.decrement();
    } catch (e) {
      addLog('Error: ' + e.toString());
    }
  };

  return (
    <div className="flex-1">
      <div className="text-center font-light py-5 bg-gray-700">
        <div className="container mx-auto my-4">
          <h1 className="text-white text-5xl mb-2">Solana Counter</h1>
        </div>
      </div>
      <div className="container mx-auto flex flex-col items-center py-8">
        <div className="flex flex-row space-x-12 py-6 items-center justify-center">
          <ButtonRadius
            type="button"
            onClick={handleIncrement}
            disabled={!isConnected}
          >
            +
          </ButtonRadius>
          <p className="text-8xl">
            {counterValue != undefined ? counterValue : '~'}
          </p>
          <ButtonRadius
            type="button"
            onClick={handleDecrement}
            disabled={!isConnected}
          >
            -
          </ButtonRadius>
        </div>
        <div className="flex flex-row space-x-2 my-4">
          {!isConnected && (
            <Button type="button" onClick={handleConnect}>
              Connect
            </Button>
          )}
          {isConnected && (
            <Button type="button" warning onClick={handleDisconnect}>
              Disconnect
            </Button>
          )}
        </div>
        <div className="my-4 space-y-2 border p-4 sm:p-6 max-w-full overflow-hidden">
          <div>
            Status:{' '}
            <span className={isConnected ? 'text-green-500' : 'text-gray-600'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {wallet?.publicAddress && (
            <div className="truncate">
              Address:{' '}
              <span className="text-gray-600">{wallet.publicAddress}</span>
            </div>
          )}
          {!isConnected && (
            <p className="italic text-gray-500">
              Connect your wallet to increment or decrement the counter
            </p>
          )}
        </div>
        <div className="w-full overflow-hidden">
          <h2 className="mt-4 mb-2 text-2xl px-4 sm:px-0">Logs</h2>
          <div className="border bg-gray-100 p-4">
            {logs.map((log, i) => (
              <div key={i}>
                <span className="h-2 w-2 rounded-full bg-gray-500" /> {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const IndexPage: React.FC = () => {
  return (
    <Container>
      <Header />
      <Main />
      <Footer />
    </Container>
  );
};

export default IndexPage;
