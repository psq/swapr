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
  const keys_alice = JSON.parse(fs.readFileSync('./keys-alice.json').toString())
  const keys_bob = JSON.parse(fs.readFileSync('./keys-bob.json').toString())
  const keys_zoe = JSON.parse(fs.readFileSync('./keys-zoe.json').toString())
  const keys_contracts = JSON.parse(fs.readFileSync('./keys-contracts.json').toString())

  const network = new StacksTestnet()
  network.coreApiUrl = STACKS_API_URL
  const stacksClient = new StacksClient(network)

  const traitTXClient = new TraitTXClient(keys_contracts, network)
  const wraprTXClient = new WraprTXClient(keys_contracts, network)

  const token1TXClient = new MyTokenTXClient('token1', keys_contracts, network)
  const token2TXClient = new MyTokenTXClient('token2', keys_contracts, network)

  const swaprToken1Token2TXClient = new SwaprTXClient('token1', 'token2', keys_contracts, network)
  const swaprWraprToken1TXClient = new SwaprTXClient('wrapr', 'token1', keys_contracts, network)

  before(async () => {
    await traitTXClient.deployContract()
    await wraprTXClient.deployContract()

    await token1TXClient.deployContract()
    await token2TXClient.deployContract()

    await swaprToken1Token2TXClient.deployContract()
    await swaprWraprToken1TXClient.deployContract()
  })

  it("scenario #1", async () => {
    const tx_wrap_alice = await wraprTXClient.wrap(keys_alice, 800000)
    console.log("tx_wrap_alice", JSON.stringify(tx_wrap_alice, null, 2))
    const tx_wrap_bob = await wraprTXClient.wrap(keys_bob, 800000)
    console.log("tx_wrap_bob", JSON.stringify(tx_wrap_bob, null, 2))
    const tx_wrap_zoe = await wraprTXClient.wrap(keys_zoe, 500000)
    console.log("tx_wrap_zoe", JSON.stringify(tx_wrap_zoe, null, 2))

    const balance_alice0 = await wraprTXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    console.log("balance_alice", balance_alice0.toString())

    const balance_bob0 = await wraprTXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    console.log("balance_bob", balance_bob0.toString())

    const balance_zoe0 = await wraprTXClient.balanceOf(keys_zoe, { keys_sender: keys_zoe })
    console.log("balance_bob", balance_zoe0.toString())

    // alice funds wrapr-token1
    // bob funds token1-token2
    // alice exchanges token2 for token1
    // bob exchanges wrapr for token1
    // zoe exchanges wrapr for token1
    // zoe exchanges token1 for token2
  })

})
