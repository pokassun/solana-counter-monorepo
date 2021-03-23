import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';

import { AppContext } from './app-context';
import { SendTransactionInput } from './transaction-input';

@Resolver()
export class TransactionResolver {
  @Query(() => Int)
  async getSlot(@Ctx() ctx: AppContext) {
    const slot = await ctx.conn.getSlot();
    return slot;
  }

  @Query(() => String)
  async getRecentBlockhash(@Ctx() ctx: AppContext): Promise<string> {
    const { blockhash } = await ctx.conn.getRecentBlockhash();
    return blockhash;
  }

  @Mutation(() => Int)
  async sendTransaction(
    @Arg('data') input: SendTransactionInput,
    @Ctx() ctx: AppContext
  ): Promise<number> {
    const signature = await ctx.conn.sendRawTransaction(
      Buffer.from(input.data)
    );
    const { context } = await ctx.conn.confirmTransaction(
      signature,
      input.commitment
    );
    return context.slot;
  }
}
