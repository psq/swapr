const BigNum = require('bn.js')
import fs from 'fs'
import {
  makeSmartContractDeploy,
  makeContractCall,
  TransactionVersion,
  FungibleConditionCode,

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

import {
  wait,
  waitForTX,
} from '../../src/tx-utils'
import { replaceKey } from '../../src/utils'

import {
  TraitTXClient,
} from '../../src/tx-clients/trait-tx-client'

import {
  WraprTXClient,
} from '../../src/tx-clients/wrapr-tx-client'

import {
  StacksClient,
} from '../../src/tx-clients/stacks-client'

// const STACKS_API_URL = 'http://localhost:20443'
const STACKS_API_URL = 'http://localhost:3999'

describe("wrapr contract tests", async () => {
  const keys_alice = JSON.parse(fs.readFileSync('./keys-alice.json').toString())
  const keys_bob = JSON.parse(fs.readFileSync('./keys-bob.json').toString())
  const keys_contracts = JSON.parse(fs.readFileSync('./keys-contracts.json').toString())

  const network = new StacksTestnet()
  network.coreApiUrl = STACKS_API_URL
  const traitTXClient = new TraitTXClient(keys_contracts, network)
  const wraprTXClient = new WraprTXClient(keys_contracts, network)
  const stacksClient = new StacksClient(network)

  before(async () => {

    await traitTXClient.deployContract()
    await wraprTXClient.deployContract()

    const tx_wrap = await wraprTXClient.wrap(keys_alice, 100000)
    console.log("tx_wrap", JSON.stringify(tx_wrap, null, 2))

    const total_supply0 = await wraprTXClient.totalSupply({ keys_sender: keys_alice })
    console.log("total_supply", total_supply0.toString())

    const tx_unwrap_alice = await wraprTXClient.unwrap(keys_alice, 20000)
    console.log("tx_unwrap_alice", JSON.stringify(tx_unwrap_alice, null, 2))

    const total_supply1 = await wraprTXClient.totalSupply({ keys_sender: keys_alice })
    console.log("total_supply", total_supply1.toString())

    const balance_alice0 = await wraprTXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    const balance_bob0 = await wraprTXClient.balanceOf(keys_bob, { keys_sender: keys_bob })

    console.log("balance_alice", balance_alice0.toString())
    console.log("balance_bob", balance_bob0.toString())

    const tx_tranfer = await wraprTXClient.transfer(keys_alice, keys_bob, 50000)
    console.log("tx_tranfer", JSON.stringify(tx_tranfer, null, 2))

    const tx_unwrap_bob = await wraprTXClient.unwrap(keys_bob, 20000)
    console.log("tx_unwrap_bob", JSON.stringify(tx_unwrap_bob, null, 2))

    const balance_alice1_token = await wraprTXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    console.log("balance_alice token", balance_alice1_token.toString())

    const balance_alice1_stx = await stacksClient.STXBalance(keys_alice)
    console.log("balance_alice STX", balance_alice1_stx.toString())

    const balance_bob1_token = await wraprTXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    console.log("balance_bob token", balance_bob1_token.toString())

    const balance_bob1_stx = await stacksClient.STXBalance(keys_bob)
    console.log("balance_bob STX", balance_bob1_stx.toString())

    const balance_wrapr_stx = await stacksClient.STXBalance(keys_contracts)
    console.log("balance_wrapr STX", balance_wrapr_stx.toString())

  })


  it("should wrap STX", async () => {
  })

  it("should tranfer wrapr token", async () => {

  })

  it("should unwrap STX", async () => {
  })

})
