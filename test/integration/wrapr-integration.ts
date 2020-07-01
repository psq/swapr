const BigNum = require('bn.js')
// @ts-ignore
import { readFileSync } from 'fs'
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
  WraprTXClient,
} from '../../src/tx-clients/wrapr-tx-client'

import {
  StacksClient,
} from '../../src/tx-clients/stacks-client'

// const STACKS_API_URL = 'http://localhost:20443'
const STACKS_API_URL = 'http://localhost:3999'

describe("wrapr scenario", async () => {
  const keys_alice = JSON.parse(readFileSync('./keys-alice.json').toString())
  const keys_bob = JSON.parse(readFileSync('./keys-bob.json').toString())
  const keys_contracts = JSON.parse(readFileSync('./keys-contracts.json').toString())

  const network = new StacksTestnet()
  network.coreApiUrl = STACKS_API_URL
  const traitTXClient = new TraitTXClient(keys_contracts, network)
  const wraprTXClient = new WraprTXClient(keys_contracts, network)
  const stacksClient = new StacksClient(network)
  let contract_fees = null

  before(async () => {
    const deploy_trait = await traitTXClient.deployContract()
    // console.log(deploy_trait.fee_rate)
    const deploy_wrapr = await wraprTXClient.deployContract()
    // console.log(deploy_wrapr.fee_rate)

    // contract_fees = (new BigNum(deploy_trait.fee_rate)).add(new BigNum(deploy_wrapr.fee_rate))  // TODO(psq): the fee is no longer available, need fix
  })

  it("scenario #1", async () => {
    const tx_wrap = await wraprTXClient.wrap(100000, { keys_sender: keys_alice })

    const total_supply_0 = await wraprTXClient.totalSupply({ keys_sender: keys_alice })
    assert.equal(total_supply_0.toString(), '100000')

    const tx_unwrap_alice = await wraprTXClient.unwrap(20000, { keys_sender: keys_alice })

    const total_supply_1 = await wraprTXClient.totalSupply({ keys_sender: keys_alice })
    assert.equal(total_supply_1.toString(), '80000')

    const balance_alice_0 = await wraprTXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    const balance_bob_0 = await wraprTXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    assert.equal(balance_alice_0.toString(), '80000')
    assert.equal(balance_bob_0.toString(), '0')

    const tx_tranfer = await wraprTXClient.transfer(keys_bob, 50000, { keys_sender: keys_alice})

    const tx_unwrap_bob = await wraprTXClient.unwrap(20000, { keys_sender: keys_bob })

    const alice_fees = new BigNum('768')
    const bob_fees = new BigNum('256')

    const balance_alice_token_0 = await wraprTXClient.balanceOf(keys_alice, { keys_sender: keys_alice })
    assert.equal(balance_alice_token_0.toString(), '30000')

    const balance_alice_stx_0 = await stacksClient.STXBalance(keys_alice)
    assert.equal(balance_alice_stx_0.toString(), ((new BigNum('920000')).sub(alice_fees)).toString())

    const balance_bob_token_1 = await wraprTXClient.balanceOf(keys_bob, { keys_sender: keys_bob })
    assert.equal(balance_bob_token_1.toString(), '30000')

    const balance_bob_stx_1 = await stacksClient.STXBalance(keys_bob)
    assert.equal(balance_bob_stx_1.toString(), ((new BigNum('1020001')).sub(bob_fees)).toString())

    const balance_wrapr_stx = await stacksClient.STXBalance(keys_contracts)
    assert.equal(balance_wrapr_stx.toString(), new BigNum('1995291').toString())
  })

})
