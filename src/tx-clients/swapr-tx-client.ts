const BigNum = require('bn.js')
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
  ListCV,
  // @ts-ignore
  PrincipalCV,
  UIntCV,

  ChainID,
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  StacksTestnet,
  broadcastTransaction,

  PostConditionMode,
} from '@blockstack/stacks-transactions'

import {
  wait,
  waitForTX,
} from '../tx-utils'
import { replaceKey } from '../utils'

export class SwaprTXClient {
  keys: any
  network: any
  contract_name: string
  token1: string
  token2: string

  constructor(token1, token2, keys, network) {
    this.keys = keys
    this.network = network
    this.token1 = token1
    this.token2 = token2
    this.contract_name = `swapr-${token1}-${token2}`
  }

  async deployContract(keys_owner: any) {
    const fee = new BigNum(13950)
    const contract_swapr_body = replaceKey(
      replaceKey(
        replaceKey(readFileSync('./contracts/swapr.clar').toString(),
          'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token',
          `${this.keys.stacksAddress}.${this.token1}`),
        'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token',
        `${this.keys.stacksAddress}.${this.token2}`),
      'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR',
      `${keys_owner.stacksAddress}`
    )

    // console.log("contract_swapr_body", this.token1, this.token2, contract_swapr_body)

    console.log(`deploying ${this.contract_name} contract with ${this.token1} ${this.token2}`)
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex"))
    return result
  }

  async addToPosition(x: number, y: number, params: { keys_sender: any }) {
    console.log("addToPosition", params.keys_sender.stacksAddress, x, y)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "add-to-position",
      functionArgs: [uintCV(x), uintCV(y)],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as ListCV
    return result
  }

  async reducePosition(percent: number, params: { keys_sender: any }) {
    console.log("reducePosition", params.keys_sender.stacksAddress, percent)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "reduce-position",
      functionArgs: [uintCV(percent)],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as ListCV
    return result
  }

  async swapExactXforY(dx: number, params: { keys_sender: any }) {
    console.log("swapExactXforY", params.keys_sender.stacksAddress, dx)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "swap-exact-x-for-y",
      functionArgs: [uintCV(dx)],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as ListCV
    return result
  }

  async swapXforExactY(dy: number, params: { keys_sender: any }) {
    console.log("swapXforExactY", params.keys_sender.stacksAddress, dy)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "swap-x-for-exact-y",
      functionArgs: [uintCV(dy)],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as ListCV
    return result
  }

  async swapExactYforX(dy: number, params: { keys_sender: any }) {
    console.log("swapExactYforX", params.keys_sender.stacksAddress, dy)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "swap-exact-y-for-x",
      functionArgs: [uintCV(dy)],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as ListCV
    return result
  }

  async swapYforExactX(dx: number, params: { keys_sender: any }) {
    console.log("swapYforExactX", params.keys_sender.stacksAddress, dx)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "swap-y-for-exact-x",
      functionArgs: [uintCV(dx)],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as ListCV
    return result
  }

  // read only
  async positionOf(keys_owner: any, params: { keys_sender: any }) {
    console.log("balanceOf with sender", keys_owner.stacksAddress, params.keys_sender.stacksAddress)
    const function_name = "get-position-of"

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
        console.log(function_name, result_data)
        // @ts-ignore
        return result_data.value.value
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
    }
  }

  // read only
  async balances(params: { keys_sender: any }) {
    console.log("balances with sender", params.keys_sender.stacksAddress)
    const function_name = "get-balances"

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${params.keys_sender.stacksAddress}","arguments":[]}`,
    }
    const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.keys.stacksAddress}/${this.contract_name}/${function_name}`, options)

    if (response.ok) {
      const result = await response.json()
      if (result.okay) {
        const result_value = deserializeCV(Buffer.from(result.result.substr(2), "hex"))
        const result_data = result_value as ListCV
        // console.log(function_name, result_data)
        // @ts-ignore
        return [result_data.value.list[0].value, result_data.value.list[1].value]
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
    }
  }

  // read only
  async positions(params: { keys_sender: any }) {
    console.log("balanceOf with sender", params.keys_sender.stacksAddress)
    const function_name = "get-positions"

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${params.keys_sender.stacksAddress}","arguments":[]}`,
    }
    const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.keys.stacksAddress}/${this.contract_name}/${function_name}`, options)

    if (response.ok) {
      const result = await response.json()
      if (result.okay) {
        const result_value = deserializeCV(Buffer.from(result.result.substr(2), "hex"))
        const result_data = result_value as UIntCV
        console.log(function_name, result_data)
        // @ts-ignore
        return result_data.value.value
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
    }
  }

  // read only
  async balancesOf(keys_owner: any, params: { keys_sender: any }) {
    console.log("balanceOf with sender", keys_owner.stacksAddress, params.keys_sender.stacksAddress)
    const function_name = "get-balances-of"

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
        const result_data = result_value as ListCV
        // console.log(function_name, result_data)
        // @ts-ignore
        return [result_data.value.list[0].value, result_data.value.list[1].value]
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
    }
  }

  // read only
  async fees(params: { keys_sender: any }) {
    console.log("balanceOf with sender", params.keys_sender.stacksAddress)
    const function_name = "get-fees"

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${params.keys_sender.stacksAddress}","arguments":[]}`,
    }
    const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.keys.stacksAddress}/${this.contract_name}/${function_name}`, options)

    if (response.ok) {
      const result = await response.json()
      if (result.okay) {
        const result_value = deserializeCV(Buffer.from(result.result.substr(2), "hex"))
        const result_data = result_value as ListCV
        // console.log(function_name, result_data)
        // @ts-ignore
        return [result_data.value.list[0].value, result_data.value.list[1].value]
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
    }
  }

  async setFeeTo(keys_collector: any, params: { keys_sender: any }) {
    console.log("setFeeTo", keys_collector.stacksAddress, params.keys_sender.stacksAddress)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "set-fee-to-address",
      functionArgs: [standardPrincipalCV(keys_collector.stacksAddress)],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as BooleanCV
    return result
  }

  async resetFeeTo(params: { keys_sender: any }) {
    console.log("resetFeeTo", params.keys_sender.stacksAddress)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "reset-fee-to-address",
      functionArgs: [],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as BooleanCV
    return result
  }

  async collectFees(params: { keys_sender: any }) {
    console.log("collectFees", params.keys_sender.stacksAddress)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "collect-fees",
      functionArgs: [],
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

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex")) as ListCV
    return result
  }

  // read only
  async getFeeTo(params: { keys_sender: any }) {
    console.log("balanceOf with sender", params.keys_sender.stacksAddress)
    const function_name = "get-fee-to-address"

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${params.keys_sender.stacksAddress}","arguments":[]}`,
    }
    const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.keys.stacksAddress}/${this.contract_name}/${function_name}`, options)

    if (response.ok) {
      const result = await response.json()
      if (result.okay) {
        const result_value = deserializeCV(Buffer.from(result.result.substr(2), "hex"))
        const result_data = result_value as PrincipalCV
        console.log(function_name, result_data)
        return result_data.value.value
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
    }
  }

}