use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::program::invoke_signed;
use solana_program::system_instruction;
use std::convert::TryInto;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
use anchor_lang::solana_program::hash::{hash, Hash};

declare_id!("FG5wYaAZqRjuY2QyPNVX2vCwzYjjCVNxfCHEi6ard8Jh");

#[program]
pub mod stake_onchain {
    use super::*;

    // Constants
    const HOUSE_EDGE_PERCENT: u64 = 25; // 2.5% house edge
    const HOUSE_EDGE_DENOMINATOR: u64 = 1000;
    const MIN_BET: u64 = LAMPORTS_PER_SOL / 1000; // 0.001 SOL
    const MAX_BET: u64 = LAMPORTS_PER_SOL * 5; // 5 SOL

    // Initialize the game program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        game_state.authority = ctx.accounts.authority.key();
        game_state.total_games = 0;
        game_state.total_volume = 0;
        game_state.house_balance = 0;
        Ok(())
    }

    // Play coin flip game
    pub fn play_coin_flip(ctx: Context<PlayGame>, is_heads: bool, bet_amount: u64) -> Result<()> {
        // Validate bet amount
        require!(bet_amount >= MIN_BET, CustomError::BetTooSmall);
        require!(bet_amount <= MAX_BET, CustomError::BetTooLarge);

        // Generate randomness (in a real implementation, we'd use VRF)
        let recent_blockhash = ctx.accounts.recent_blockhashes.to_account_info().data.borrow();
        let random_slice = &recent_blockhash[0..8];
        let random_value = u64::from_le_bytes(random_slice.try_into().unwrap());
        
        // Determine outcome (0 = tails, 1 = heads)
        let outcome = random_value % 2;
        let player_choice = if is_heads { 1 } else { 0 };
        let won = outcome == player_choice;

        // Transfer bet amount from player to program
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.game_state.key(),
            bet_amount,
        );
        
        invoke_signed(
            &transfer_instruction,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.game_state.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Update game state
        let game_state = &mut ctx.accounts.game_state;
        game_state.total_games += 1;
        game_state.total_volume += bet_amount;

        // Calculate payout with house edge
        let mut payout = 0;
        if won {
            payout = (bet_amount * (2 * HOUSE_EDGE_DENOMINATOR - HOUSE_EDGE_PERCENT)) / HOUSE_EDGE_DENOMINATOR;
            
            // Transfer winnings to player
            let payout_ix = system_instruction::transfer(
                &ctx.accounts.game_state.key(),
                &ctx.accounts.player.key(),
                payout,
            );
            
            invoke_signed(
                &payout_ix,
                &[
                    ctx.accounts.game_state.to_account_info(),
                    ctx.accounts.player.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[&[
                    b"game_state",
                    &[ctx.bumps.game_state],
                ]],
            )?;
            
            game_state.house_balance = game_state.house_balance.checked_add(bet_amount).unwrap()
                .checked_sub(payout).unwrap();
        } else {
            game_state.house_balance = game_state.house_balance.checked_add(bet_amount).unwrap();
        }

        // Create game result account
        let game_result = &mut ctx.accounts.game_result;
        game_result.player = ctx.accounts.player.key();
        game_result.game_type = GameType::CoinFlip;
        game_result.stake = bet_amount;
        game_result.player_choice = player_choice as u8;
        game_result.outcome = outcome as u8;
        game_result.payout = payout;
        game_result.won = won;
        game_result.timestamp = Clock::get()?.unix_timestamp;

        // Emit event
        emit!(GameResultEvent {
            player: ctx.accounts.player.key(),
            game_type: GameType::CoinFlip,
            stake: bet_amount,
            player_choice: player_choice as u8,
            outcome: outcome as u8,
            payout,
            won,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Play dice roll game
    pub fn play_dice_roll(ctx: Context<PlayGame>, prediction: u8, bet_amount: u64) -> Result<()> {
        // Validate bet amount and prediction
        require!(bet_amount >= MIN_BET, CustomError::BetTooSmall);
        require!(bet_amount <= MAX_BET, CustomError::BetTooLarge);
        require!(prediction >= 1 && prediction <= 6, CustomError::InvalidPrediction);

        // Generate randomness (in a real implementation, we'd use VRF)
        let recent_blockhash = ctx.accounts.recent_blockhashes.to_account_info().data.borrow();
        let random_slice = &recent_blockhash[0..8];
        let random_value = u64::from_le_bytes(random_slice.try_into().unwrap());
        
        // Determine outcome (1-6)
        let outcome = (random_value % 6) + 1;
        let won = outcome == prediction as u64;

        // Transfer bet amount from player to program
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.game_state.key(),
            bet_amount,
        );
        
        invoke_signed(
            &transfer_instruction,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.game_state.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Update game state
        let game_state = &mut ctx.accounts.game_state;
        game_state.total_games += 1;
        game_state.total_volume += bet_amount;

        // Calculate payout with house edge
        let mut payout = 0;
        if won {
            // 6x multiplier minus house edge
            payout = (bet_amount * 6 * HOUSE_EDGE_DENOMINATOR - bet_amount * 6 * HOUSE_EDGE_PERCENT) / HOUSE_EDGE_DENOMINATOR;
            
            // Transfer winnings to player
            let payout_ix = system_instruction::transfer(
                &ctx.accounts.game_state.key(),
                &ctx.accounts.player.key(),
                payout,
            );
            
            invoke_signed(
                &payout_ix,
                &[
                    ctx.accounts.game_state.to_account_info(),
                    ctx.accounts.player.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[&[
                    b"game_state",
                    &[ctx.bumps.game_state],
                ]],
            )?;
            
            game_state.house_balance = game_state.house_balance.checked_add(bet_amount).unwrap()
                .checked_sub(payout).unwrap();
        } else {
            game_state.house_balance = game_state.house_balance.checked_add(bet_amount).unwrap();
        }

        // Create game result account
        let game_result = &mut ctx.accounts.game_result;
        game_result.player = ctx.accounts.player.key();
        game_result.game_type = GameType::DiceRoll;
        game_result.stake = bet_amount;
        game_result.player_choice = prediction;
        game_result.outcome = outcome as u8;
        game_result.payout = payout;
        game_result.won = won;
        game_result.timestamp = Clock::get()?.unix_timestamp;

        // Emit event
        emit!(GameResultEvent {
            player: ctx.accounts.player.key(),
            game_type: GameType::DiceRoll,
            stake: bet_amount,
            player_choice: prediction,
            outcome: outcome as u8,
            payout,
            won,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// Game type enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameType {
    CoinFlip,
    DiceRoll,
}

// Custom errors
#[error_code]
pub enum CustomError {
    #[msg("Bet amount is below minimum")]
    BetTooSmall,
    #[msg("Bet amount is above maximum")]
    BetTooLarge,
    #[msg("Invalid prediction for dice roll")]
    InvalidPrediction,
}

// Game state account
#[account]
pub struct GameState {
    pub authority: Pubkey,
    pub total_games: u64,
    pub total_volume: u64,
    pub house_balance: u64,
}

// Game result account
#[account]
pub struct GameResult {
    pub player: Pubkey,
    pub game_type: GameType,
    pub stake: u64,
    pub player_choice: u8,
    pub outcome: u8,
    pub payout: u64,
    pub won: bool,
    pub timestamp: i64,
}

// Game result event
#[event]
pub struct GameResultEvent {
    pub player: Pubkey,
    pub game_type: GameType,
    pub stake: u64,
    pub player_choice: u8,
    pub outcome: u8,
    pub payout: u64,
    pub won: bool,
    pub timestamp: i64,
}

// Context for initializing the program
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8,
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    
    pub system_program: Program<'info, System>,
}

// Context for playing a game
#[derive(Accounts)]
#[instruction(game_type: u8, prediction: u8, bet_amount: u64)]
pub struct PlayGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"game_state"],
        bump
    )]
    pub game_state: Account<'info, GameState>,
    
    #[account(
        init,
        payer = player,
        space = 8 + 32 + 1 + 8 + 1 + 1 + 8 + 1 + 8,
        seeds = [b"game_result", player.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub game_result: Account<'info, GameResult>,
    
    /// CHECK: Recent blockhashes account for randomness
    pub recent_blockhashes: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
} 