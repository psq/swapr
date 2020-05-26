const BigNum = require('bn.js')
import fs from 'fs'
import {
  makeSmartContractDeploy,
  makeContractCall,
  TransactionVersion,
  FungibleConditionCode,
  uintCV,
  ChainID,
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  StacksTestnet,
  broadcastTransaction,
} from '@blockstack/stacks-transactions'

const STACKS_API_URL = 'http://localhost:20443'

describe("escrow contract test suite", async () => {
  before(async () => {
  })


  it("should deposit and payout balance", async () => {
  })
})
