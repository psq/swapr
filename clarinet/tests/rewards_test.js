import { Clarinet, Tx, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts'
// import { Clarinet, Tx, types } from './clarinet.ts'
import { assertEquals, assertExists } from 'https://deno.land/std@0.90.0/testing/asserts.ts'
import { unwrapList, unwrapOK, unwrapTuple, unwrapUInt, parse } from './utils.js'

// figure out starting reward, whether `time` works in a predictible fashion
// credit-rewards (cycle uint) (slot uint) (token <sip-010-token>) (amount uint)
// (claim-rewards (owner principal) (token <sip-010-token>)) should get nothing

// (add-rewards (owner principal) (shares uint)) from 2 addresses, 90/10
// (claim-rewards (owner principal) (token <sip-010-token>)) should get nothing
// wait till next cycle, then something, check 2x, 3x

// (cancel-rewards (owner principal))
// (claim-rewards (owner principal) (token <sip-010-token>)) should get nothing

const WEEK = 6 * 24 * 7

Clarinet.test({
  name: "Ensure that <...> - swapr",
  async fn(chain, accounts) {
    const wallet_1 = accounts.get("wallet_1")
    const wallet_2 = accounts.get("wallet_2")

    const asset_map = chain.getAssetsMaps()
    console.log("asset_map", asset_map)

    const result_get_block_height1 = chain.callReadOnlyFn('rewards', 'get-block-height', [], wallet_1.address).result
    console.log("result_get_block_height1", result_get_block_height1)

    const result_get_block_time1 = chain.callReadOnlyFn('rewards', 'get-block-time', [], wallet_1.address).result
    console.log("result_get_block_time1", result_get_block_time1)

    const result_get_reward_cycle1 = chain.callReadOnlyFn('rewards', 'get-reward-cycle', [], wallet_1.address).result
    console.log("result_get_reward_cycle1", result_get_reward_cycle1)

    for (let i = 0; i < 2 * WEEK; i++) {
      // console.log("mining", i)
      let block = chain.mineBlock([
      ])
      // assertEquals(block.receipts.length, 0)
      // assertEquals(block.height, 2)
    }

    const result_get_block_height2 = chain.callReadOnlyFn('rewards', 'get-block-height', [], wallet_1.address).result
    console.log("result_get_block_height2", result_get_block_height2)

    const result_get_block_time2 = chain.callReadOnlyFn('rewards', 'get-block-time', [], wallet_1.address).result
    console.log("result_get_block_time2", result_get_block_time2)

    const result_get_reward_cycle2 = chain.callReadOnlyFn('rewards', 'get-reward-cycle', [], wallet_1.address).result
    console.log("result_get_reward_cycle2", result_get_reward_cycle2)

    // block.receipts[0].result.expectOk().expectBool(true);


  },
})
