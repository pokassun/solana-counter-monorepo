#![feature(proc_macro_hygiene)]

use anchor_lang::prelude::*;

// Define the program's instruction handlers.

#[program]
mod counter {
    use super::*;

    pub fn create(ctx: Context<Create>) -> ProgramResult {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> ProgramResult {
        let counter = &mut ctx.accounts.counter;
        counter.count += 1;
        msg!("increment");
        emit!(CounterChangeEvent {
            data: counter.count,
            action: "increment".to_string(),
        });
        Ok(())
    }

    pub fn decrement(ctx: Context<Increment>) -> ProgramResult {
        let counter = &mut ctx.accounts.counter;
        if counter.count == 0 {
            return Err(CounterError::CountBelowZero.into());
        }
        msg!("decrement");
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
    #[account(mut)]
    pub counter: ProgramAccount<'info, Counter>,
}

#[derive(Accounts)]
pub struct Decrement<'info> {
    #[account(mut)]
    pub counter: ProgramAccount<'info, Counter>,
}

// Define the program owned accounts.

#[account]
pub struct Counter {
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
    CountBelowZero,
}
