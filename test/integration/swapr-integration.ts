const BigNum = require('bn.js')
// @ts-ignore
import { readFileSync } from 'fs'
import {
  makeSmartContractDeploy,
  makeContractCall,
  TransactionVersion,
  FungibleConditionCode,
  ClarityValue,
  ClarityType,

  serializeCV,
  deserializeCV,
  standardPrincipalCV,
  uintCV,

  BooleanCV,
  PrincipalCV,
  UIntCV,

  ChainID,
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  StacksTestnet,
  broadcastTransaction,
} from '@blockstack/stacks-transactions'

const chai = require('chai')
chai.use(require('chai-string'))
const assert = chai.assert

import {
  wait,
  waitForTX,
  cvToString,
} from '../../src/tx-utils'
import { replaceString } from '../../src/utils'

import {
  TraitTXClient,
} from '../../src/tx-clients/trait-tx-client'

import {
  MyTokenTXClient,
} from '../../src/tx-clients/my-token-tx-client'

import {
  WraprTXClient,
} from '../../src/tx-clients/wrapr-tx-client'

import {
  SwaprTXClient,
} from '../../src/tx-clients/swapr-tx-client'

import {
  StacksClient,
} from '../../src/tx-clients/stacks-client'

// const STACKS_API_URL = 'http://localhost:20443'
const STACKS_API_URL = 'http://localhost:3999'

describe("swapr scenario", async () => {
  const keys_alice = JSON.parse(readFileSync('./keys-alice.json').toString())
  const keys_bob = JSON.parse(readFileSync('./keys-bob.json').toString())
  const keys_zoe = JSON.parse(readFileSync('./keys-zoe.json').toString())
  const keys_contracts = JSON.parse(readFileSync('./keys-contracts.json').toString())

  const network = new StacksTestnet()
  network.coreApiUrl = STACKS_API_URL
  const stacksClient = new StacksClient(network)

  const traitTXClient = new TraitTXClient(keys_contracts, network)
  const wraprTXClient = new WraprTXClient(keys_contracts, network)

  const token1TXClient = new MyTokenTXClient('token1', 'token1', keys_contracts, network)
  const token2TXClient = new MyTokenTXClient('token2', 'token2', keys_contracts, network)

  const swaprToken1Token2TXClient = new SwaprTXClient('token1', 'token2', keys_contracts, network)
  const swaprWraprToken1TXClient = new SwaprTXClient('wrapr', 'token1', keys_contracts, network)

  before(async () => {
    await traitTXClient.deployContract()
    await wraprTXClient.deployContract()

    await token1TXClient.deployContract()
    await token2TXClient.deployContract()

    await swaprToken1Token2TXClient.deployContract(keys_zoe)
    await swaprWraprToken1TXClient.deployContract(keys_zoe)
  })

  it("scenario #1", async () => {
    const tx_wrap_alice = await wraprTXClient.wrap(800000, { keys_sender: keys_alice })
    console.log("tx_wrap_alice", cvToString(tx_wrap_alice))
    assert.equal(tx_wrap_alice.list[0].value.toString(), '800000')  // wrapped value
    assert.equal(tx_wrap_alice.list[1].value.toString(), '800000')  // total wrapped

    const tx_wrap_bob = await wraprTXClient.wrap(800000, { keys_sender: keys_bob })
    console.log("tx_wrap_bob", cvToString(tx_wrap_bob))
    assert.equal(tx_wrap_bob.list[0].value.toString(), '800000')
    assert.equal(tx_wrap_bob.list[1].value.toString(), '1600000')

    const tx_wrap_zoe = await wraprTXClient.wrap(500000, { keys_sender: keys_zoe })
    console.log("tx_wrap_zoe", cvToString(tx_wrap_zoe))
    assert.equal(tx_wrap_zoe.list[0].value.toString(), '500000')
    assert.equal(tx_wrap_zoe.list[1].value.toString(), '2100000')

    // check individual balances
    const balance_alice_wrapr_0 = await wraprTXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    const balance_bob_wrapr_0 = await wraprTXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    const balance_zoe_wrapr_0 = await wraprTXClient.balanceOf(keys_zoe, { keys_sender: keys_zoe })
    assert.equal(balance_alice_wrapr_0.toString(), '800000')
    assert.equal(balance_bob_wrapr_0.toString(), '800000')
    assert.equal(balance_zoe_wrapr_0.toString(), '500000')


    const balance_alice_token1_0 = await token1TXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    const balance_bob_token1_0 = await token1TXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    const balance_zoe_token1_0 = await token1TXClient.balanceOf(keys_zoe, { keys_sender: keys_zoe })
    assert.equal(balance_alice_token1_0.toString(), '2000000')
    assert.equal(balance_bob_token1_0.toString(), '1000000')
    assert.equal(balance_zoe_token1_0.toString(), '0')

    const balance_alice_token2_0 = await token2TXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    const balance_bob_token2_0 = await token2TXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    const balance_zoe_token2_0 = await token2TXClient.balanceOf(keys_zoe, { keys_sender: keys_zoe })
    assert.equal(balance_alice_token2_0.toString(), '2000000')
    assert.equal(balance_bob_token2_0.toString(), '1000000')
    assert.equal(balance_zoe_token2_0.toString(), '0')

    const balance_alice_stx_0 = await stacksClient.STXBalance(keys_alice)
    const balance_bob_stx_0 = await stacksClient.STXBalance(keys_bob)
    const balance_zoe_stx_0 = await stacksClient.STXBalance(keys_zoe)
    assert.equal(balance_alice_stx_0.toString(), '199744')
    assert.equal(balance_bob_stx_0.toString(), '199744')
    assert.equal(balance_zoe_stx_0.toString(), '499744')

    // initial exchanges
    // 1 wrapr for 2 token1
    // 5 token1 for 2 token2

    // zoe is operating the pools and will get the 5bp fee while alice and bob will get 25bp
    const token1_token2_set_fee = await swaprToken1Token2TXClient.setFeeTo(keys_zoe, { keys_sender: keys_zoe })
    console.log("token1_token2_set_fee", cvToString(token1_token2_set_fee))

    const swapr_token1_set_fee = await swaprWraprToken1TXClient.setFeeTo(keys_zoe, { keys_sender: keys_zoe })
    console.log("swapr_token1_set_fee", cvToString(swapr_token1_set_fee))

    // alice funds wrapr-token1
    const tx_add_alice_0 = await swaprWraprToken1TXClient.addToPosition(500000, 1000000, { keys_sender: keys_alice })
    console.log("tx_add_alice_0", cvToString(tx_add_alice_0))

    // bob funds token1-token2
    const tx_add_bob_0 = await swaprToken1Token2TXClient.addToPosition(500000, 200000, { keys_sender: keys_bob })
    console.log("tx_add_bob_0", cvToString(tx_add_bob_0))

    // alice funds token1-token2
    const tx_add_alice_1 = await swaprToken1Token2TXClient.addToPosition(1000000, 400000, { keys_sender: keys_alice })
    console.log("tx_add_alice_1", cvToString(tx_add_alice_1))

    // check pool balances
    const wrapr_token1_balances_0 = await swaprWraprToken1TXClient.balances({ keys_sender: keys_alice })
    const token1_token2_balances_0 = await swaprToken1Token2TXClient.balances({ keys_sender: keys_alice })
    assert.equal(wrapr_token1_balances_0[0].toString(), '500000')
    assert.equal(wrapr_token1_balances_0[1].toString(), '1000000')
    assert.equal(token1_token2_balances_0[0].toString(), '1500000')
    assert.equal(token1_token2_balances_0[1].toString(), '600000')

    const wrapr_token1_alice_balances_0 = await swaprWraprToken1TXClient.balancesOf(keys_alice, { keys_sender: keys_alice })
    const wrapr_token1_bob_balances_0 = await swaprWraprToken1TXClient.balancesOf(keys_bob, { keys_sender: keys_bob })
    assert.equal(wrapr_token1_alice_balances_0[0].toString(), '500000')
    assert.equal(wrapr_token1_alice_balances_0[1].toString(), '1000000')
    assert.equal(wrapr_token1_bob_balances_0[0].toString(), '0')
    assert.equal(wrapr_token1_bob_balances_0[1].toString(), '0')

    const token1_token2_alice_balances_0 = await swaprToken1Token2TXClient.balancesOf(keys_alice, { keys_sender: keys_alice })
    const token1_token2_bob_balances_0 = await swaprToken1Token2TXClient.balancesOf(keys_bob, { keys_sender: keys_bob })
    assert.equal(token1_token2_alice_balances_0[0].toString(), '1000000')
    assert.equal(token1_token2_alice_balances_0[1].toString(), '400000')
    assert.equal(token1_token2_bob_balances_0[0].toString(), '500000')
    assert.equal(token1_token2_bob_balances_0[1].toString(), '200000')



    // individual accounts
    // alice STX      199744
    // bob STX        199744
    // zoe STX        499744
    // alice wrapr    800000
    // bob wrapr      800000
    // zoe wrapr      500000
    // alice token1  2000000
    // bob token1     500000
    // zoe token1          0
    // alice token2  2000000
    // bob token2    1000000
    // zoe token2          0

    // pool balances
    // shares of wrapr-token1
    // pool           500000     1000000   => rate = 0.5
    // fees                0           0
    // alice          500000     1000000
    // bob                 0           0
    // shares of token1_token2
    // pool          1500000      600000   => rate = 2.5
    // fees                0           0
    // alice         1000000      400000
    // bob            500000      200000


    // alice exchanges token2 for token1
    const tx_swap_alice_0 = await swaprToken1Token2TXClient.swapExactYforX(25000, { keys_sender: keys_alice })
    console.log("tx_swap_alice_0", cvToString(tx_swap_alice_0))
    assert.equal(tx_swap_alice_0.list[0].value.toString(), '59827')
    assert.equal(tx_swap_alice_0.list[1].value.toString(), '25000')

    // bob exchanges wrapr for token1
    const tx_swap_bob_0 = await swaprWraprToken1TXClient.swapXforExactY(30000, { keys_sender: keys_bob })
    console.log("tx_swap_bob_0", cvToString(tx_swap_bob_0))
    assert.equal(tx_swap_bob_0.list[0].value.toString(), '15510')
    assert.equal(tx_swap_bob_0.list[1].value.toString(), '30000')

    // zoe exchanges wrapr for token1, then token1 for token2
    const tx_swap_zoe_0 = await swaprWraprToken1TXClient.swapXforExactY(50000, { keys_sender: keys_zoe })
    console.log("tx_swap_zoe_0", cvToString(tx_swap_zoe_0))
    assert.equal(tx_swap_zoe_0.list[0].value.toString(), '28100')
    assert.equal(tx_swap_zoe_0.list[1].value.toString(), '50000')

    const tx_swap_zoe_1 = await swaprToken1Token2TXClient.swapExactXforY(50000, { keys_sender: keys_zoe })
    console.log("tx_swap_zoe_1", cvToString(tx_swap_zoe_1))
    assert.equal(tx_swap_zoe_1.list[0].value.toString(), '50000')
    assert.equal(tx_swap_zoe_1.list[1].value.toString(), '20909')

    // check individual balances
    const balance_alice_wrapr_1 = await wraprTXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    const balance_bob_wrapr_1 = await wraprTXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    const balance_zoe_wrapr_1 = await wraprTXClient.balanceOf(keys_zoe, { keys_sender: keys_zoe })
    assert.equal(balance_alice_wrapr_1.toString(), '300000')
    assert.equal(balance_bob_wrapr_1.toString(), '784490')
    assert.equal(balance_zoe_wrapr_1.toString(), '471900')  // 471899?

    const balance_alice_token1_1 = await token1TXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    const balance_bob_token1_1 = await token1TXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    const balance_zoe_token1_1 = await token1TXClient.balanceOf(keys_zoe, { keys_sender: keys_zoe })
    assert.equal(balance_alice_token1_1.toString(), '59827')
    assert.equal(balance_bob_token1_1.toString(), '530000')
    assert.equal(balance_zoe_token1_1.toString(), '0')

    const balance_alice_token2_1 = await token2TXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    const balance_bob_token2_1 = await token2TXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    const balance_zoe_token2_1 = await token2TXClient.balanceOf(keys_zoe, { keys_sender: keys_zoe })
    assert.equal(balance_alice_token2_1.toString(), '1575000')
    assert.equal(balance_bob_token2_1.toString(), '800000')
    assert.equal(balance_zoe_token2_1.toString(), '20909')

    // check pool balances
    const wrapr_token1_balances_1 = await swaprWraprToken1TXClient.balances({ keys_sender: keys_alice })
    const token1_token2_balances_1 = await swaprToken1Token2TXClient.balances({ keys_sender: keys_alice })
    assert.equal(wrapr_token1_balances_1[0].toString(), '543589')
    assert.equal(wrapr_token1_balances_1[1].toString(), '920000')
    assert.equal(token1_token2_balances_1[0].toString(), '1490148')
    assert.equal(token1_token2_balances_1[1].toString(), '604079')

    const wrapr_token1_alice_balances_1 = await swaprWraprToken1TXClient.balancesOf(keys_alice, { keys_sender: keys_alice })
    const wrapr_token1_bob_balances_1 = await swaprWraprToken1TXClient.balancesOf(keys_bob, { keys_sender: keys_bob })
    assert.equal(wrapr_token1_alice_balances_1[0].toString(), '543589')
    assert.equal(wrapr_token1_alice_balances_1[1].toString(), '920000')
    assert.equal(wrapr_token1_bob_balances_1[0].toString(), '0')
    assert.equal(wrapr_token1_bob_balances_1[1].toString(), '0')

    const token1_token2_alice_balances_1 = await swaprToken1Token2TXClient.balancesOf(keys_alice, { keys_sender: keys_alice })
    const token1_token2_bob_balances_1 = await swaprToken1Token2TXClient.balancesOf(keys_bob, { keys_sender: keys_bob })
    assert.equal(token1_token2_alice_balances_1[0].toString(), '993432')
    assert.equal(token1_token2_alice_balances_1[1].toString(), '402719')
    assert.equal(token1_token2_bob_balances_1[0].toString(), '496716')
    assert.equal(token1_token2_bob_balances_1[1].toString(), '201359')

    // check pool operator collected fees
    const token1_token2_fees_0 = await swaprToken1Token2TXClient.fees({ keys_sender: keys_zoe })
    const swapr_token1_fees_0 = await swaprWraprToken1TXClient.fees({ keys_sender: keys_zoe })
    assert.equal(token1_token2_fees_0[0].toString(), '25')
    assert.equal(token1_token2_fees_0[1].toString(), '12')
    assert.equal(swapr_token1_fees_0[0].toString(), '21')
    assert.equal(swapr_token1_fees_0[1].toString(), '0')

    // alice wrapr    300000
    // bob wrapr      784490
    // zoe wrapr      471899
    // alice token1    59827
    // bob token1     530000
    // zoe token1          0
    // alice token2  1575000
    // bob token2     800000
    // zoe token2      20909

    // pool balances
    // shares of wrapr-token1
    // pool           543589     920000   => rate = .590857609 (+18%)
    // fees               21          0
    // alice          543589     920000   alice started with 500000 + 1000000*.05 = 1000000 uSTX, now she has 1087178 uSTX (.590857609 * 920000 + 543589), including 105 uSTX collected as fees
    // bob                 0          0
    // shares of token1_token2
    // pool          1490148     604079   => rate = 2.466809805 (-1.3%)
    // fees               25         12
    // alice          993432     402719
    // bob            496716     201359

    // check alice and bob profit from fees, even though they might also have losses/gains because of the change in exchange rate


  })

})
