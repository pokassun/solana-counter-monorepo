import { CounterProgram } from '@counter/programs';
import { Provider, web3 } from '@project-serum/anchor';
import { Ctx, Int, Query, Resolver, Root, Subscription } from 'type-graphql';

import { AppContext } from './app-context';
import { CounterCount } from './counter-type';

@Resolver()
export class CounterResolver {
  static subscriptions = new Map<string, number>();

  @Query(() => Int)
  async GetCurrentCount(@Ctx() { conn }: AppContext): Promise<number> {
    const provider = Provider.local(web3.clusterApiUrl('devnet'));
    const program = new CounterProgram(provider);
    const count = program.getCount();
    return count;
  }

  @Subscription(() => CounterCount, {
    subscribe: (_, __, { pubSub, conn }: AppContext) => {
      const provider = Provider.local(web3.clusterApiUrl('devnet'));
      const program = new CounterProgram(provider);
      if (!CounterResolver.subscriptions.has('COUNTER_COUNT_CHANGED')) {
        // TODO: we can try also with the events
        // program.program.addEventListener('CounterChangeEvent', (data, slot) => {
        //   console.log('CounterChangeEvent', data);
        // });
        const id = conn.onAccountChange(program.programData, account => {
          const count = program.decodeAccountData(account.data);
          pubSub.publish('COUNTER_COUNT_CHANGED', count);
        });
        CounterResolver.subscriptions.set('COUNTER_COUNT_CHANGED', id);
      }
      return pubSub.asyncIterator('COUNTER_COUNT_CHANGED');
    }
  })
  async CounterCountChanges(@Root() count: number): Promise<CounterCount> {
    const result: CounterCount = {
      count,
      date: new Date()
    };
    return result;
  }
}
