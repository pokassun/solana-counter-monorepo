import { web3, workspace } from '@project-serum/anchor';
import assert from 'assert';

describe('counter_test', () => {
  // Counter for the tests.
  const counter = new web3.Account();

  // Program for the tests.
  const program = workspace.Counter;

  it('Creates a counter', async () => {
    await program.rpc.create({
      accounts: {
        counter: counter.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY
      },
      signers: [counter],
      instructions: [await program.account.counter.createInstruction(counter)]
    });

    const counterAccount = await program.account.counter(counter.publicKey);

    assert.ok(counterAccount.count.toNumber() === 0);
  });

  it('Increment a counter', async () => {
    await program.rpc.increment({
      accounts: {
        counter: counter.publicKey
      }
    });

    const counterAccount = await program.account.counter(counter.publicKey);

    assert.ok(counterAccount.count.toNumber() == 1);
  });

  it('Decrement a counter', async () => {
    await program.rpc.decrement({
      accounts: {
        counter: counter.publicKey
      }
    });

    const counterAccount = await program.account.counter(counter.publicKey);

    assert.ok(counterAccount.count.toNumber() == 0);
  });

  // it('Test increment event', async () => {
  //   let listener = null;

  //   const [event, slot] = await new Promise((resolve, _reject) => {
  //     listener = program.addEventListener(
  //       'CounterChangeEvent',
  //       (event, slot) => {
  //         resolve([event, slot]);
  //       }
  //     );
  //     program.rpc.increment();
  //   });
  //   await program.removeEventListener(listener);

  //   assert.ok(slot > 0);
  //   assert.ok(event.data.toNumber() === 1);
  //   assert.ok(event.action === 'increment');
  // });
});
