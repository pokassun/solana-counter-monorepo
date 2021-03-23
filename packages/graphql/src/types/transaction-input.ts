import { Field, InputType, Int, registerEnumType } from 'type-graphql';

enum Commitment {
  Processed = 'processed',
  Confirmed = 'confirmed',
  Finalized = 'finalized'
}

registerEnumType(Commitment, {
  name: 'Commitment',
  description: 'Desired commitment level'
});

@InputType()
export class SendTransactionInput {
  @Field(() => [Int])
  data: number[];

  @Field(() => Commitment)
  commitment: Commitment;
}
