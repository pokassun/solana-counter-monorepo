import programConfig from '@counter/program/dist/config.json';
import { PublicKey } from '@solana/web3.js';
import BufferLayout from 'buffer-layout';
import { Ctx, Int, Query, Resolver, Root, Subscription } from 'type-graphql';

import { AppContext } from './app-context';
import { CounterCount } from './counter-type';

@Resolver()
export class CounterResolver {
  static subscriptions = new Map<string, number>();

  static decodeData(data: Buffer): number {
    const dataLayout = BufferLayout.struct([BufferLayout.u32('count')]);
    const result = dataLayout.decode(Buffer.from(data));
    return result.count;
  }

  @Query(() => Int)
  async GetCurrentCount(@Ctx() ctx: AppContext): Promise<number> {
    const publicKey = new PublicKey(programConfig.programData);
    const account = await ctx.conn.getAccountInfo(publicKey);
    if (account) {
      return CounterResolver.decodeData(account.data);
    }
    return 0;
  }

  @Subscription(() => CounterCount, {
    subscribe: (_, __, { pubSub, conn }: AppContext) => {
      const publicKey = new PublicKey(programConfig.programData);
      if (!CounterResolver.subscriptions.has('COUNTER_COUNT_CHANGED')) {
        const id = conn.onAccountChange(publicKey, account => {
          const count = CounterResolver.decodeData(account.data);
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
