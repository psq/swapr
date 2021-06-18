const clarity = require('@blockstack/clarity')

const { Client, ProviderRegistry, Result } = clarity

const { readFileSync } = require('fs')

const chai = require('chai')
// chai.use(require('chai-string'))
const assert = chai.assert

const { providerWithInitialAllocations } = require('./providerWithInitialAllocations.js')

const { STXTokenClient } = require('../../src/clients/stx-token-client.js')
const { RewardsClient } = require('../../src/clients/rewards-client.js')
const {
  NoRewardError,
  AlreadyClaimedError,
  NoLiquidityError,
  NothingToClaimError,
  NotOKErr,
  NotOwnerError,
  RewardCycleNeedsRolloverError,
  TransferError,
} = require('../../src/errors.js')

// TODO(psq): switch to 1 day for now?
// const WEEK = 6 * 24 * 7  // blocks in a week
const WEEK = 6 * 24 * 1  // blocks in a week
const keys = JSON.parse(readFileSync('./keys.json').toString())
const balances = JSON.parse(readFileSync('./balances.json'))


describe("full test suite", () => {
  let provider
  let sip_010_client
  let rewards_client

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",  // alice, u20 tokens of each
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",  // bob, u10 tokens of each
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",  // zoe, no tokens
    "SP138CBPVKYBQQ480EZXJQK89HCHY32XBQ0T4BCCD.swapr",  // contract, starts empty
    "SP1EHFWKXQEQD7TW9WWRGSGJFJ52XNGN6MTJ7X462",
    "SP30JX68J79SMTTN0D2KXQAJBFVYY56BZJEYS3X0B",

  ]
  const alice = addresses[0]
  const bob = addresses[1]
  const zoe = addresses[2]
  const swapr_contract = addresses[3]

  const token1 = `${addresses[4]}.token1`
  const token2 = `${addresses[4]}.token2`
  const token3 = `${addresses[4]}.token3`
  const pair1 = `${addresses[4]}.pair1`
  const pair2 = `${addresses[4]}.pair2`

  const token_plaid = 'SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.plaid-token'
  const token_stx = 'SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.stx-token'
  const token_swapr = 'SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.plaid-stx-token'
  const token_swapr_name = 'plaid.stx.swapr'

  before(async () => {
    ProviderRegistry.registerProvider(
      providerWithInitialAllocations(balances)
    )
    provider = await ProviderRegistry.createProvider()

    sip_010_client = new Client('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.sip-010', './clarinet/contracts/trait-sip-010.clar', provider)
    stx_token_client = new STXTokenClient(provider)
    rewards_client = new RewardsClient(provider)
  })

  it("should have a valid syntax", async () => {

    await sip_010_client.checkContract()
    await sip_010_client.deployContract()

    await stx_token_client.checkContract()
    await stx_token_client.deployContract()

    await rewards_client.checkContract()
    await rewards_client.deployContract()

  })

  it("rewards scenarios", async () => {
    const height1 = await rewards_client.getBlockHeight()
    const time1 = await rewards_client.getBlockTime()
    console.log("height1", height1, time1)

    const pair = "pair"
    const slot = 1
    const token = token_stx
    const starting_reward_cycle = await rewards_client.getRewardCycle()
    let current_reward_cycle = starting_reward_cycle
    console.log("\n======================================", current_reward_cycle)
    await rewards_client.setupUpcomingCycles(pair, {sender: alice})

    await rewards_client.creditRewards(starting_reward_cycle, pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 1 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 2 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 3 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 4 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 5 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 6 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 7 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 8 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 9 , pair, slot, token, 100_000_000, {sender: alice})
    await rewards_client.creditRewards(starting_reward_cycle + 10 , pair, slot, token, 100_000_000, {sender: alice})

    await rewards_client.addRewards(pair, alice, 20000, {sender: alice})
    await rewards_client.addRewards(pair, bob, 80000, {sender: bob})

    // TODO(psq): need a way to retrieve the reward schedule for an address
    const total_shares0 = await rewards_client.claimableTotalShares(starting_reward_cycle + 0, pair)
    const total_shares1 = await rewards_client.claimableTotalShares(starting_reward_cycle + 1, pair)
    const total_shares2 = await rewards_client.claimableTotalShares(starting_reward_cycle + 2, pair)
    const total_shares3 = await rewards_client.claimableTotalShares(starting_reward_cycle + 3, pair)
    const total_shares4 = await rewards_client.claimableTotalShares(starting_reward_cycle + 4, pair)
    const total_shares5 = await rewards_client.claimableTotalShares(starting_reward_cycle + 5, pair)
    const total_shares6 = await rewards_client.claimableTotalShares(starting_reward_cycle + 6, pair)
    const total_shares7 = await rewards_client.claimableTotalShares(starting_reward_cycle + 7, pair)
    const total_shares_all = await rewards_client.claimableTotalShares(0, pair)

    console.log("total_shares", total_shares0, total_shares1, total_shares2, total_shares3, total_shares4, total_shares5, total_shares6, total_shares7)
    console.log("total_shares_all", total_shares_all)

    const claimable_shares0 = await rewards_client.claimableShare(starting_reward_cycle + 0, pair, alice)
    const claimable_shares1 = await rewards_client.claimableShare(starting_reward_cycle + 1, pair, alice)
    const claimable_shares2 = await rewards_client.claimableShare(starting_reward_cycle + 2, pair, alice)
    const claimable_shares3 = await rewards_client.claimableShare(starting_reward_cycle + 3, pair, alice)
    const claimable_shares4 = await rewards_client.claimableShare(starting_reward_cycle + 4, pair, alice)
    const claimable_shares5 = await rewards_client.claimableShare(starting_reward_cycle + 5, pair, alice)
    const claimable_shares6 = await rewards_client.claimableShare(starting_reward_cycle + 6, pair, alice)
    const claimable_shares7 = await rewards_client.claimableShare(starting_reward_cycle + 7, pair, alice)
    const claimable_shares_all = await rewards_client.claimableShare(0, pair, alice)

    console.log("claimable_shares", claimable_shares0, claimable_shares1, claimable_shares2, claimable_shares3, claimable_shares4, claimable_shares5, claimable_shares6, claimable_shares7)
    console.log("claimable_shares_all", claimable_shares_all)

    // claim reward for alice, but not bob, should fail

    try {
      const claim_rewards1 = await rewards_client.claimRewards(pair, 1, token, {sender: alice})
      console.log("claim_rewards1", claim_rewards1)
    } catch(e) {
      if (e instanceof NoRewardError) {
        assert(true)
      } else if (e instanceof NothingToClaimError) {
        assert(true)
      } else {
        assert(false, "did not throw NoRewardError or NothingToClaimError")
      }
    }

    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)

    const height2 = await rewards_client.getBlockHeight()
    const time2 = await rewards_client.getBlockTime()
    console.log("height2", height2, time2)

    // claim reward for alice, but not bob
    const balance_alice_before1 = await stx_token_client.getBalanceOf(alice)
    assert.equal(balance_alice_before1, 198_900_000_000)


    const should_rollover_rewards2 = await rewards_client.shouldRolloverRewards(pair, slot, current_reward_cycle)
    console.log("should_rollover_rewards2", should_rollover_rewards2)

    try {
      const claim_rewards2 = await rewards_client.claimRewards(pair, 1, token, {sender: alice})
      console.log("claim_rewards2", claim_rewards2)
    } catch(e) {
      console.log(e)
      if (e instanceof RewardCycleNeedsRolloverError) {
        assert(true)
      } else {
        assert(false, "did not throw RewardCycleNeedsRolloverError")
      }
    }

    const rollover_rewards2 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards2", rollover_rewards2)

    const claim_rewards2a = await rewards_client.claimRewards(pair, 1, token, {sender: alice})
    console.log("claim_rewards2a", claim_rewards2a)

    const balance_alice_after1 = await stx_token_client.getBalanceOf(alice)
    console.log("balance_alice_before1, balance_alice_after1", balance_alice_before1 / 1_000_000, balance_alice_after1 / 1_000_000, (balance_alice_after1 - balance_alice_before1) / 1_000_000)
    assert.equal(balance_alice_after1 - balance_alice_before1, 40_000_000)

    try {
      const claim_rewards2 = await rewards_client.claimRewards(pair, 1, token, {sender: alice})
      console.log("claim_rewards2", claim_rewards2)
    } catch(e) {
      if (e instanceof AlreadyClaimedError) {
        console.log("correctly returned AlreadyClaimedError")
        assert(true)
      } else {
        assert(false, "did not throw AlreadyClaimedError")
      }
    }

    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)


    const height3 = await rewards_client.getBlockHeight()
    const time3 = await rewards_client.getBlockTime()
    console.log("height3", height3, time3)

    // claim reward for alice, but not bob
    // should include amount rolled over from unclaimed (how do we implement this automatically?)
    const balance_alice_before2 = await stx_token_client.getBalanceOf(alice)

    assert.equal(balance_alice_before2, 198_940_000_000)


    const rollover_rewards3 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards3", rollover_rewards3)

    const claim_rewards3 = await rewards_client.claimRewards(pair, 1, token, {sender: alice})
    console.log("claim_rewards3", claim_rewards3)

    const balance_alice_after2 = await stx_token_client.getBalanceOf(alice)
    console.log("balance_alice_before2, balance_alice_after2", balance_alice_before2 / 1_000_000, balance_alice_after2 / 1_000_000, (balance_alice_after2 - balance_alice_before2) / 1_000_000)

    assert.equal(balance_alice_after2 - balance_alice_before2, 52_000_000)


    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)

    const rollover_rewards4 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards4", rollover_rewards4)

    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)

    const rollover_rewards5 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards5", rollover_rewards5)

    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)



    await rewards_client.addRewards(pair, bob, 100000, {sender: bob})



    const rollover_rewards6 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards6", rollover_rewards6)

    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)

    const rollover_rewards7 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards7", rollover_rewards7)

    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)

    const rollover_rewards8 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards8", rollover_rewards8)

    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)

    const rollover_rewards9 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards9", rollover_rewards9)

    for (let i = 0; i < WEEK; i++) {
      await rewards_client.stxTransfer(alice, 1, {sender: bob})
    }
    current_reward_cycle++
    console.log("\n======================================", current_reward_cycle)

    const rollover_rewards10 = await rewards_client.rolloverRewards(pair, 1, current_reward_cycle - 1, {sender: alice})
    console.log("rollover_rewards10", rollover_rewards10)

    const claim_rewards4 = await rewards_client.claimRewards(pair, 1, token, {sender: alice})
    console.log("claim_rewards4", claim_rewards4)

    const balance_alice_after4 = await stx_token_client.getBalanceOf(alice)
    console.log("balance_alice_before2, balance_alice_after4", balance_alice_after2 / 1_000_000, balance_alice_after4 / 1_000_000, (balance_alice_after4 - balance_alice_after2) / 1_000_000)

    assert.equal(balance_alice_after4 - balance_alice_after2, 108_960_000)

  })

  after(async () => {
    await provider.close()
  })
})
