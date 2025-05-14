use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::program::invoke_signed;
use solana_program::system_instruction;
use std::convert::TryInto;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

declare_id!("PredMrkt111111111111111111111111111111111111");

#[program]
pub mod prediction_markets {
    use super::*;

    // Constants
    const PLATFORM_FEE_PERCENT: u64 = 10; // 1% platform fee
    const FEE_DENOMINATOR: u64 = 1000;
    const MIN_BET: u64 = LAMPORTS_PER_SOL / 100; // 0.01 SOL

    // Initialize the prediction market platform
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.authority = ctx.accounts.authority.key();
        platform_state.total_markets = 0;
        platform_state.total_volume = 0;
        platform_state.platform_fees = 0;
        Ok(())
    }

    // Create a new prediction market
    pub fn create_market(
        ctx: Context<CreateMarket>,
        title: String,
        description: String,
        end_time: i64,
        tags: Vec<String>
    ) -> Result<()> {
        require!(end_time > Clock::get()?.unix_timestamp, CustomError::InvalidEndTime);
        require!(title.len() <= 100, CustomError::TitleTooLong);
        require!(description.len() <= 500, CustomError::DescriptionTooLong);
        require!(tags.len() <= 5, CustomError::TooManyTags);
        
        let market = &mut ctx.accounts.market;
        market.creator = ctx.accounts.creator.key();
        market.title = title;
        market.description = description;
        market.end_time = end_time;
        market.resolved = false;
        market.result = None;
        market.total_yes_bets = 0;
        market.total_no_bets = 0;
        market.created_at = Clock::get()?.unix_timestamp;
        
        // Store tags
        let mut market_tags = Vec::new();
        for tag in tags.iter() {
            market_tags.push(tag.clone());
        }
        market.tags = market_tags;
        
        // Update platform state
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.total_markets += 1;
        
        // Emit event
        emit!(MarketCreatedEvent {
            market_id: ctx.accounts.market.key(),
            creator: ctx.accounts.creator.key(),
            title: market.title.clone(),
            end_time,
            created_at: market.created_at,
        });
        
        Ok(())
    }

    // Place a bet on a market
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        prediction: bool,
        amount: u64
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let now = Clock::get()?.unix_timestamp;
        
        // Validate bet
        require!(!market.resolved, CustomError::MarketAlreadyResolved);
        require!(now < market.end_time, CustomError::MarketClosed);
        require!(amount >= MIN_BET, CustomError::BetTooSmall);
        
        // Calculate fee
        let fee = (amount * PLATFORM_FEE_PERCENT) / FEE_DENOMINATOR;
        let bet_amount = amount - fee;
        
        // Transfer bet amount from bettor to market account
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.bettor.key(),
            &ctx.accounts.market.key(),
            amount,
        );
        
        invoke_signed(
            &transfer_instruction,
            &[
                ctx.accounts.bettor.to_account_info(),
                ctx.accounts.market.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;
        
        // Transfer fee to platform
        let fee_ix = system_instruction::transfer(
            &ctx.accounts.market.key(),
            &ctx.accounts.platform_state.key(),
            fee,
        );
        
        invoke_signed(
            &fee_ix,
            &[
                ctx.accounts.market.to_account_info(),
                ctx.accounts.platform_state.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[
                b"market",
                market.creator.as_ref(),
                market.created_at.to_le_bytes().as_ref(),
                &[ctx.bumps.market],
            ]],
        )?;
        
        // Update market state
        if prediction {
            market.total_yes_bets += bet_amount;
        } else {
            market.total_no_bets += bet_amount;
        }
        
        // Update platform state
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.total_volume += amount;
        platform_state.platform_fees += fee;
        
        // Create bet account
        let bet = &mut ctx.accounts.bet;
        bet.bettor = ctx.accounts.bettor.key();
        bet.market = ctx.accounts.market.key();
        bet.amount = bet_amount;
        bet.prediction = prediction;
        bet.timestamp = now;
        bet.claimed = false;
        
        // Emit event
        emit!(BetPlacedEvent {
            bettor: ctx.accounts.bettor.key(),
            market: ctx.accounts.market.key(),
            amount: bet_amount,
            prediction,
            timestamp: now,
        });
        
        Ok(())
    }

    // Resolve a market
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        result: bool
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let now = Clock::get()?.unix_timestamp;
        
        // Validate resolution
        require!(!market.resolved, CustomError::MarketAlreadyResolved);
        require!(now >= market.end_time, CustomError::MarketNotClosed);
        require!(ctx.accounts.creator.key() == market.creator, CustomError::NotMarketCreator);
        
        // Update market state
        market.resolved = true;
        market.result = Some(result);
        
        // Emit event
        emit!(MarketResolvedEvent {
            market: ctx.accounts.market.key(),
            result,
            resolved_at: now,
        });
        
        Ok(())
    }

    // Claim winnings from a resolved market
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;
        
        // Validate claim
        require!(market.resolved, CustomError::MarketNotResolved);
        require!(!bet.claimed, CustomError::AlreadyClaimed);
        require!(bet.bettor == ctx.accounts.bettor.key(), CustomError::NotBettor);
        
        // Check if bet won
        let won = market.result.unwrap() == bet.prediction;
        if !won {
            bet.claimed = true;
            return Ok(());
        }
        
        // Calculate winnings
        let total_bets = market.total_yes_bets + market.total_no_bets;
        let winning_pool = if bet.prediction {
            market.total_yes_bets
        } else {
            market.total_no_bets
        };
        
        let winnings = (bet.amount * total_bets) / winning_pool;
        
        // Transfer winnings to bettor
        let transfer_ix = system_instruction::transfer(
            &ctx.accounts.market.key(),
            &ctx.accounts.bettor.key(),
            winnings,
        );
        
        invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.market.to_account_info(),
                ctx.accounts.bettor.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[
                b"market",
                market.creator.as_ref(),
                market.created_at.to_le_bytes().as_ref(),
                &[ctx.bumps.market],
            ]],
        )?;
        
        // Mark bet as claimed
        bet.claimed = true;
        
        // Emit event
        emit!(WinningsClaimedEvent {
            bettor: ctx.accounts.bettor.key(),
            market: ctx.accounts.market.key(),
            amount: winnings,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

// Custom errors
#[error_code]
pub enum CustomError {
    #[msg("Invalid end time")]
    InvalidEndTime,
    #[msg("Title too long")]
    TitleTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Too many tags")]
    TooManyTags,
    #[msg("Market is already resolved")]
    MarketAlreadyResolved,
    #[msg("Market is closed")]
    MarketClosed,
    #[msg("Bet amount is too small")]
    BetTooSmall,
    #[msg("Market is not yet closed")]
    MarketNotClosed,
    #[msg("Not the market creator")]
    NotMarketCreator,
    #[msg("Market is not resolved")]
    MarketNotResolved,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Not the bettor")]
    NotBettor,
}

// Platform state account
#[account]
pub struct PlatformState {
    pub authority: Pubkey,
    pub total_markets: u64,
    pub total_volume: u64,
    pub platform_fees: u64,
}

// Market account
#[account]
#[derive(Default)]
pub struct Market {
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub end_time: i64,
    pub resolved: bool,
    pub result: Option<bool>,
    pub total_yes_bets: u64,
    pub total_no_bets: u64,
    pub tags: Vec<String>,
    pub created_at: i64,
}

// Bet account
#[account]
pub struct Bet {
    pub bettor: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
    pub prediction: bool,
    pub timestamp: i64,
    pub claimed: bool,
}

// Events
#[event]
pub struct MarketCreatedEvent {
    pub market_id: Pubkey,
    pub creator: Pubkey,
    pub title: String,
    pub end_time: i64,
    pub created_at: i64,
}

#[event]
pub struct BetPlacedEvent {
    pub bettor: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
    pub prediction: bool,
    pub timestamp: i64,
}

#[event]
pub struct MarketResolvedEvent {
    pub market: Pubkey,
    pub result: bool,
    pub resolved_at: i64,
}

#[event]
pub struct WinningsClaimedEvent {
    pub bettor: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// Context for initializing the platform
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    pub system_program: Program<'info, System>,
}

// Context for creating a market
#[derive(Accounts)]
#[instruction(title: String, description: String, end_time: i64, tags: Vec<String>)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 4 + title.len() + 4 + description.len() + 8 + 1 + 1 + 8 + 8 + 4 + tags.iter().map(|t| 4 + t.len()).sum::<usize>() + 8,
        seeds = [b"market", creator.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    pub system_program: Program<'info, System>,
}

// Context for placing a bet
#[derive(Accounts)]
#[instruction(prediction: bool, amount: u64)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref(), &market.created_at.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(
        init,
        payer = bettor,
        space = 8 + 32 + 32 + 8 + 1 + 8 + 1,
        seeds = [b"bet", bettor.key().as_ref(), market.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    pub system_program: Program<'info, System>,
}

// Context for resolving a market
#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"market", creator.key().as_ref(), &market.created_at.to_le_bytes()],
        bump,
        constraint = creator.key() == market.creator
    )]
    pub market: Account<'info, Market>,
    
    pub system_program: Program<'info, System>,
}

// Context for claiming winnings
#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref(), &market.created_at.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"bet", bettor.key().as_ref(), market.key().as_ref(), &bet.timestamp.to_le_bytes()],
        bump,
        constraint = bettor.key() == bet.bettor && market.key() == bet.market
    )]
    pub bet: Account<'info, Bet>,
    
    pub system_program: Program<'info, System>,
}