#![feature(proc_macro_hygiene)]

use anchor_lang::prelude::*;

// Define the program's instruction handlers.

#[program]
mod counter {
    use super::*;

    pub fn create(ctx: Context<Create>, authority: Pubkey) -> ProgramResult {
        let counter = &mut ctx.accounts.counter;
        counter.authority = authority;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> ProgramResult {
        let counter = &mut ctx.accounts.counter;
        counter.count += 1;
        emit!(CounterChangeEvent {
            data: counter.count,
            action: "increment".to_string(),
        });
        Ok(())
    }

    pub fn decrement(ctx: Context<Increment>) -> ProgramResult {
        let counter = &mut ctx.accounts.counter;
        // if counter.count == 0 {
        //     Err(CounterError::CountReachMinimum.into();
        // }
        counter.count -= 1;
        emit!(CounterChangeEvent {
            data: counter.count,
            action: "decrement".to_string(),
        });
        Ok(())
    }
}

// Define the validated accounts for each handler.

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init)]
    pub counter: ProgramAccount<'info, Counter>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: ProgramAccount<'info, Counter>,
    #[account(signer)]
    pub authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Decrement<'info> {
    #[account(mut, has_one = authority)]
    pub counter: ProgramAccount<'info, Counter>,
    #[account(signer)]
    pub authority: AccountInfo<'info>,
}

// Define the program owned accounts.

#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}

// Define events

#[event]
pub struct CounterChangeEvent {
    pub data: u64,
    #[index]
    pub action: String,
}

// Define errors

#[error]
pub enum CounterError {
    #[msg("Counter can't go below zero")]
    CountReachMinimum,
}
