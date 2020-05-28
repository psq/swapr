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
} from '../tx-utils'
import { replaceKey } from '../utils'



export class MyTokenTXClient {
  constructor(contract_name, keys, network) {
    this.keys = keys
    this.network = network
    this.contract_name = contract_name
  }

  async deployContract() {
    const fee = new BigNum(5380)
    const contract_swapr_body = replaceKey(fs.readFileSync('./contracts/my-token.clar').toString(), 'SP2TPZ623K5N2WYF1BWRMP5A93PSBWWADQGKJRJCS', this.keys.stacksAddress)

    console.log(`deploying ${this.contract_name} contract`)
    const transaction_deploy_trait = await makeSmartContractDeploy({
      contractName: this.contract_name,
      codeBody: contract_swapr_body,
      senderKey: this.keys.secretKey,
      network: this.network,
      fee,
      // nonce: new BigNum(0),
    })
    const tx_id = await broadcastTransaction(transaction_deploy_trait, this.network)
    const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)
    return tx
  }

  async transfer(recipient: string, amount: number, params: { sender: string }): Promise<Receipt> {
    console.log("transfer", params.keys_sender.stacksAddress, address)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "transfer",
      functionArgs: [standardPrincipalCV(address), UIntCV(amount)],
      senderKey: params.keys_sender.secretKey,
      network: this.network,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [
        // makeStandardSTXPostCondition(
        //   keys_sender.stacksAddress,
        //   FungibleConditionCode.Equal,
        //   new BigNum(amount)
        // ),
        // makeStandardFungiblePostCondition(
        // ),
      ],
      fee,
      // nonce: new BigNum(0),
    })
    const tx_id = await broadcastTransaction(transaction, this.network)
    const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)
    return tx
  }

  // read only
  async balanceOf(keys_owner, params: { keys_sender: any }) {
    console.log("balanceOf with sender", keys_owner.stacksAddress, params.keys_sender.stacksAddress)
    const function_name = "balance-of"

    const owner = serializeCV(standardPrincipalCV(keys_owner.stacksAddress))

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${params.keys_sender.stacksAddress}","arguments":["0x${owner.toString("hex")}"]}`,
    }
    const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.keys.stacksAddress}/${this.contract_name}/${function_name}`, options)

    if (response.ok) {
      const result = await response.json()
      if (result.okay) {
        const result_value = deserializeCV(Buffer.from(result.result.substr(2), "hex"))
        const result_data = result_value as UIntCV
        // console.log(function_name, result_data.value.value.toString())
        return result_data.value.value
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
    }
  }

}