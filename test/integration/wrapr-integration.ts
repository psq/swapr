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

    fee = new BigNum(2087)

    const transaction_deploy_trait = await makeSmartContractDeploy({
      contractName: contract_trait_name,
      codeBody: contract_trait_body,
      senderKey: keys_contracts.secretKey,
      network,
      fee,
      // nonce: new BigNum(0),
    })
    console.log(await broadcastTransaction(transaction_deploy_trait, network))
    await wait(10000)

    const transaction_deploy_wrapr = await makeSmartContractDeploy({
      contractName: contract_wrapr_name,
      codeBody: contract_wrapr_body,
      senderKey: keys_contracts.secretKey,
      network,
      // optional
      fee,
      // nonce: new BigNum(1),
    })
    console.log(await broadcastTransaction(transaction_deploy_wrapr, network))
    await wait(15000)

    fee = new BigNum(256);

    const transaction_wrap = await makeContractCall({
      contractAddress: keys_contracts.stacksAddress,
      contractName: contract_wrapr_name,
      functionName: "wrap",
      functionArgs: [uintCV(100000)],
      senderKey: keys_alice.secretKey,
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
      fee,
      // nonce: new BigNum(0),
    })
    console.log(await broadcastTransaction(transaction_wrap, network))
    await wait(15000)



    const function_name = "get-total-supply"

    const body = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${keys_alice.stacksAddress}","arguments":[]}`,
    }
    console.log("request.body", body)

    const response = await fetch(
      network.coreApiUrl +
        `/v2/contracts/call-read/${keys_contracts.stacksAddress}/${contract_wrapr_name}/${function_name}`,
      body,
    )
    console.log(response.status)
    if (response.status === 200) {
      const result = await response.json()
      if (result.okay) {
        console.log(result)
        const result_value = deserializeCV(
          Buffer.from(result.result.substr(2), "hex")
        )
        const result_data = result_value as UIntCV
        console.log("result_data.value", result_data.value)
        console.log("result_data.value.value.toString()", result_data.value.value.toString())
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
      console.log("not 200 response", JSON.stringify(response, null, 2))
    }


    const function_name2 = "balance-of"

    const owner = serializeCV(standardPrincipalCV(keys_alice.stacksAddress))

    const body2 = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${keys_alice.stacksAddress}","arguments":["0x${owner.toString("hex")}"]}`,
    }
    console.log("request.body", body2)

    const response2 = await fetch(
      network.coreApiUrl +
        `/v2/contracts/call-read/${keys_contracts.stacksAddress}/${contract_wrapr_name}/${function_name2}`,
      body2,
    )
    console.log(response2.status)
    if (response2.status === 200) {
      const result = await response2.json()
      if (result.okay) {
        console.log(result)
        const result_value = deserializeCV(
          Buffer.from(result.result.substr(2), "hex")
        )
        const result_data = result_value as UIntCV
        console.log(result_data.value)
        console.log(result_data.value.value.toString())
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response2)
      console.log("not 200 response", JSON.stringify(await response2.json(), null, 2))
    }




  })


  it("should wrap STX", async () => {
  })

  it("should tranfer wrapr token", async () => {

  })

  it("should unwrap STX", async () => {
  })

})
