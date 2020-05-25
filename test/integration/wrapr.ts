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

import { wait } from '../../src/wait'
import { replaceKey } from '../../src/utils'


const STACKS_API_URL = 'http://localhost:20443'

describe("wrapr contract tests", async () => {
  const network = new StacksTestnet()
  network.coreApiUrl = STACKS_API_URL
  let fee

  before(async () => {
    const keys_alice = JSON.parse(fs.readFileSync('./keys-alice.json').toString())
    const keys_bob = JSON.parse(fs.readFileSync('./keys-bob.json').toString())
    const keys_contracts = JSON.parse(fs.readFileSync('./keys-contracts.json').toString())

    // const contract_contracts_address = keys_contracts.stacksAddress
    // const contract_contracts_secret = keys_contracts.secretKey
    const contract_trait_name = 'token-transfer-trait'
    const contract_wrapr_name = 'wrapr'
    const contract_trait_body = fs.readFileSync('./contracts/token-transfer-trait.clar').toString()
    const contract_wrapr_body = replaceKey(fs.readFileSync('./contracts/wrapr.clar').toString(), 'SP2TPZ623K5N2WYF1BWRMP5A93PSBWWADQGKJRJCS', keys_contracts.stacksAddress)

    console.log("deploy trait")
    console.log("deploy wrapr")

    fee = new BigNum(2000)

    const transaction_deploy_trait = await makeSmartContractDeploy({
      contractName: contract_trait_name,
      codeBody: contract_trait_body,
      fee,
      senderKey: keys_contracts.secretKey,
      nonce: new BigNum(0),
      network,
    })
    console.log(await broadcastTransaction(transaction_deploy_trait, network))
    await wait(10000)

    const transaction_deploy_wrapr = await makeSmartContractDeploy({
      contractName: contract_wrapr_name,
      codeBody: contract_wrapr_body,
      fee,
      senderKey: keys_contracts.secretKey,
      nonce: new BigNum(1),
      network,
    })
    console.log(await broadcastTransaction(transaction_deploy_wrapr, network))
    await wait(10000)

    fee = new BigNum(256);

    const transaction_wrap = await makeContractCall({
      contractAddress: keys_contracts.stacksAddress,
      contractName: contract_wrapr_name,
      functionName: "wrap",
      functionArgs: [uintCV(100000)],
      fee,
      senderKey: keys_alice.secretKey,
      nonce: new BigNum(0),
      network,
      postConditions: [
        makeStandardSTXPostCondition(
          keys_alice.stacksAddress,
          FungibleConditionCode.Equal,
          new BigNum(100000)
        ),
        // makeStandardFungiblePostCondition(
        // ),
      ],
    });
    console.log(await broadcastTransaction(transaction_wrap, network));



  })


  it("should wrap STX", async () => {
  })

  it("should tranfer wrapr token", async () => {

  })

  it("should unwrap STX", async () => {
  })

})
