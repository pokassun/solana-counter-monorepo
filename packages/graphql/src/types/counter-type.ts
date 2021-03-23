import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType({ description: 'Object representing the Counter data' })
export class CounterCount {
  @Field(() => Int)
  count: number;

  @Field(() => Date)
  date: Date;
}
