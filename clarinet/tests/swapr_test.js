
import { Clarinet, Tx, types } from 'https://deno.land/x/clarinet@v0.3.0/index.ts'
import { assertEquals, assertExists } from 'https://deno.land/std@0.90.0/testing/asserts.ts'
import { unwrapList, unwrapOK, unwrapTuple, unwrapUInt, parse } from './utils.js'

Clarinet.test({
  name: "Ensure that <...> - swapr",
  async fn(chain, accounts) {
    // console.log("types", types)
    let block = chain.mineBlock([

      Tx.contractCall('swapr', 'create-pair', [
        types.principal('ST000000000000000000002AMW42H.plaid-token'),
        types.principal('ST000000000000000000002AMW42H.stx-token'),
        types.principal('ST000000000000000000002AMW42H.plaid-stx-token'),
        types.ascii('plaid-stx-token'),
        types.uint(10000000),
        types.uint(15000000),
      ], accounts[0].address),

    ])
    // console.log("receipts", JSON.stringify(block.receipts, null, 2))
    assertEquals(block.receipts.length, 1)
    assertEquals(block.height, 2)
    console.log("")

    assertExists(unwrapOK(parse(block.receipts[0].result)))


    const result_get_pair_count = chain.callReadOnlyFn('swapr', 'get-pair-count', [], accounts[0].address).result
    console.log("result_get_pair_count", result_get_pair_count)
    console.log("get-pair-count", unwrapUInt(unwrapOK(parse(result_get_pair_count))))

    const result_get_pair_contracts = chain.callReadOnlyFn('swapr', 'get-pair-contracts', [types.uint(1)], accounts[0].address).result
    console.log("result_get_pair_contracts", result_get_pair_contracts)
    const pair1 = unwrapTuple(parse(result_get_pair_contracts))
    console.log("get-pair-contracts(1)", pair1)

    const result_get_pair_details = chain.callReadOnlyFn('swapr', 'get-pair-details', [types.principal(pair1['token-x']), types.principal(pair1['token-y'])], accounts[0].address).result
    console.log("result_get_pair_details", result_get_pair_details)
    const pair1_details = unwrapTuple(parse(result_get_pair_details))
    console.log("get-pair-details(1)", pair1_details)

    const result_pair1_get_balances = chain.callReadOnlyFn('swapr', 'get-balances', [types.principal(pair1['token-x']), types.principal(pair1['token-y'])], accounts[0].address).result
    console.log("result_pair1_get_balances", result_pair1_get_balances)
    const pair1_balances = unwrapList(unwrapOK(parse(result_pair1_get_balances)))
    console.log("get-balances(1)", pair1_balances)

    const result_stx_token_balance_1 = chain.callReadOnlyFn('stx-token', 'get-balance-of', [types.principal(accounts[0].address)], accounts[0].address).result
    console.log("result_stx_token_balance_1", result_stx_token_balance_1)
    const result_plaid_token_balance_1 = chain.callReadOnlyFn('plaid-token', 'get-balance-of', [types.principal(accounts[0].address)], accounts[0].address).result
    console.log("result_plaid_token_balance_1", result_plaid_token_balance_1)

    const plaid_balance_1 = unwrapUInt(unwrapOK(parse(result_plaid_token_balance_1)))
    const stx_balance_1 = unwrapUInt(unwrapOK(parse(result_stx_token_balance_1)))

    block = chain.mineBlock([

      // swap-x-for-y (token-x-trait <src20-token>) (token-y-trait <src20-token>) (dx uint) (min-dy uint)
      Tx.contractCall('swapr', 'swap-x-for-y', [
        types.principal('ST000000000000000000002AMW42H.plaid-token'),
        types.principal('ST000000000000000000002AMW42H.stx-token'),
        types.uint(10000),
        types.uint(6600),  // with 1.5 exchange rate, would get 6642 with fee
      ], accounts[0].address),

    ])
    assertEquals(block.receipts.length, 1)
    assertEquals(block.height, 3)

    assertExists(unwrapOK(parse(block.receipts[0].result)))


    const result_pair1_get_balances_2 = chain.callReadOnlyFn('swapr', 'get-balances', [types.principal(pair1['token-x']), types.principal(pair1['token-y'])], accounts[0].address).result
    console.log("result_pair1_get_balances_2", result_pair1_get_balances_2)
    const pair1_balances_2 = unwrapList(unwrapOK(parse(result_pair1_get_balances_2)))
    console.log("get-balances(1)", pair1_balances_2)

    const result_stx_token_balance_2 = chain.callReadOnlyFn('stx-token', 'get-balance-of', [types.principal(accounts[0].address)], accounts[0].address).result
    console.log("result_stx_token_balance_2", result_stx_token_balance_2)
    const result_plaid_token_balance_2 = chain.callReadOnlyFn('plaid-token', 'get-balance-of', [types.principal(accounts[0].address)], accounts[0].address).result
    console.log("result_plaid_token_balance_2", result_plaid_token_balance_2)

    const plaid_balance_2 = unwrapUInt(unwrapOK(parse(result_plaid_token_balance_2)))
    const stx_balance_2 = unwrapUInt(unwrapOK(parse(result_stx_token_balance_2)))

    console.log("plaid => stx")
    console.log("plaid", plaid_balance_1, plaid_balance_2, plaid_balance_2 - plaid_balance_1)
    console.log("stx", stx_balance_1, stx_balance_2, stx_balance_2 - stx_balance_1)

  },
})
