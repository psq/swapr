import BigNum from 'bn.js'
import { readFileSync } from 'fs'
import fetch from 'node-fetch'
import {
  contractPrincipalCV,
  stringAsciiCV,
  uintCV,

  broadcastTransaction,
  makeContractCall,
  makeContractDeploy,

  PostConditionMode,
} from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'

import {
  getNonce,
  wait,
} from './src/tx-utils.js'

import {
  MODE,
  STACKS_API_URL,

  CONTRACT_NAME_SIP010,
  CONTRACT_NAME_SWAPR_TRAIT,
  CONTRACT_NAME_SWAPR,
  CONTRACT_NAME_STX,
  CONTRACT_NAME_PLAID,
  CONTRACT_NAME_PLAID_STX,

  SWAPR_SK,
  SWAPR_STX,

  USER_SK,
  USER_STX,
} from './src/config.js'

console.log("deploying swapr with", SWAPR_STX, "on", MODE)

const network = MODE === 'mainnet' ? new StacksMainnet() : new StacksTestnet()
network.coreApiUrl = STACKS_API_URL
console.log("using", STACKS_API_URL)

async function deployContract(contract_name, contract_file) {
  const body = readFileSync(contract_file).toString()


  // TODO(psq): remove minting for tokens
  // TODO(psq): SIP-010 trait should use SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-10-ft-standard instead (custom match for mainnet?)

  const codeBody = body
    .replaceAll('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.sip-010', `${SWAPR_STX}.${CONTRACT_NAME_SIP010}`)  // minting
    .replaceAll('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.swapr-trait', `${SWAPR_STX}.${CONTRACT_NAME_SWAPR_TRAIT}`)  // minting
    .replaceAll('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.swapr', `${SWAPR_STX}.${CONTRACT_NAME_SWAPR}`)  // minting
    .replaceAll('ST000000000000000000002AMW42H', SWAPR_STX)
    .replaceAll('ST20ATRN26N9P05V2F1RHFRV24X8C8M3W54E427B2', SWAPR_STX)

  console.log("deploy", contract_name)
  // console.log(codeBody)

  const transaction = await makeContractDeploy({
    contractName: contract_name,
    codeBody,
    senderKey: SWAPR_SK,
    network,
  })

  const result = await broadcastTransaction(transaction, network)
  if (result.error) {
    if (result.reason === 'ContractAlreadyExists') {
      console.log(`${contract_name} already deployed`)
      return
    } else {
      throw new Error(
        `failed to deploy ${contract_name}: ${JSON.stringify(result)}`
      )
    }
  }
  const processed = await processing(result, 0)
  if (!processed) {
    throw new Error(`failed to deploy ${contract_name}: transaction not found`)
  }
  return result
}

async function createPair(token_1, token_2, token_1_2, name, amount_1, amount_2) {
  console.log("createPair", token_1, token_2, token_1_2, name, amount_1, amount_2)
  // const fee = new BigNum(311)
  const addr = SWAPR_STX
  const transaction = await makeContractCall({
    contractAddress: addr,
    contractName: CONTRACT_NAME_SWAPR,
    functionName: 'create-pair',
    functionArgs: [contractPrincipalCV(addr, token_1), contractPrincipalCV(addr, token_2), contractPrincipalCV(addr, token_1_2), stringAsciiCV(name), uintCV(amount_1), uintCV(amount_2)],
    senderKey: USER_SK,
    network,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [
    ],
  })
  console.log("transaction", transaction.payload)
  const serialized = transaction.serialize().toString('hex')
  console.log("serialized", serialized)
  const result = await broadcastTransaction(transaction, network)
  console.log("result", result)
  if (result.error) {
    console.log(result.reason)
    throw new Error(`failed create pair ${token_1} - ${token_2}`)
  }
  const processed = await processing(result, 0)
  if (!processed) {
    throw new Error(`failed to execute create-pair`)
  }
}


async function getContractInfo(contract_name) {
  var result = await fetch(`${STACKS_API_URL}/extended/v1/contract//${SWAPR_STX}.${contract_name}`)
  // console.log("result", result)
  var value = await result.json()
  // console.log("value", value)
  if (value.error) {
    return null
  }
  return value.tx_id
}

async function processing(tx, count) {
  console.log("processing", tx, count)
  var result = await fetch(`${STACKS_API_URL}/extended/v1/tx/${tx}`)
  var value = await result.json()
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`)
    // console.log(value)
    return true
  }
  if (count > 10) {
    console.log("failed after 10 attempts", value)
    return false
  }

  await wait(30000)
  return processing(tx, count + 1)
}

// TODO(psq): figure out nonces so all contracts can deployed in a batch from nonce...nonce+5

await getContractInfo(CONTRACT_NAME_SIP010)

if (!await getContractInfo(CONTRACT_NAME_SIP010)) {
  await deployContract(CONTRACT_NAME_SIP010, './clarinet/contracts/sip-010.clar')
}
if (!await getContractInfo(CONTRACT_NAME_SWAPR_TRAIT)) {
  await deployContract(CONTRACT_NAME_SWAPR_TRAIT, './clarinet/contracts/swapr-trait.clar')
}
if (!await getContractInfo(CONTRACT_NAME_SWAPR)) {
  await deployContract(CONTRACT_NAME_SWAPR, './clarinet/contracts/swapr.clar')
}
if (!await getContractInfo(CONTRACT_NAME_STX)) {
  await deployContract(CONTRACT_NAME_STX, './clarinet/contracts/stx-token.clar')
}
if (!await getContractInfo(CONTRACT_NAME_PLAID)) {
  await deployContract(CONTRACT_NAME_PLAID, './clarinet/contracts/plaid-token.clar')
}
if (!await getContractInfo(CONTRACT_NAME_PLAID_STX)) {
  await deployContract(CONTRACT_NAME_PLAID_STX, './clarinet/contracts/plaid-stx-token.clar')
}


if (!await getContractInfo(CONTRACT_NAME_THING)) {
  await deployContract(CONTRACT_NAME_THING, './clarinet/contracts/thing-token.clar')
}
if (!await getContractInfo(CONTRACT_NAME_PLAID_THING)) {
  await deployContract(CONTRACT_NAME_PLAID_THING, './clarinet/contracts/plaid-thing-token.clar')
}
if (!await getContractInfo(CONTRACT_NAME_TOKENSOFT)) {
  await deployContract(CONTRACT_NAME_TOKENSOFT, './clarinet/contracts/tokensoft-token.clar')
}
if (!await getContractInfo(CONTRACT_NAME_TOKENSOFT_STX)) {
  await deployContract(CONTRACT_NAME_TOKENSOFT_STX, './clarinet/contracts/tokensoft-stx-token.clar')
}

// create plaid-stx pair
const result_pair_1 = await createPair(
  `${CONTRACT_NAME_PLAID}`,
  `${CONTRACT_NAME_STX}`,
  `${CONTRACT_NAME_PLAID_STX}`,
  'Plaid-STX',
   25_000_000_000_000,
   500_000_000_000,
)

const result_pair_2 = await createPair(
  `${CONTRACT_NAME_PLAID}`,
  `${CONTRACT_NAME_THING}`,
  `${CONTRACT_NAME_PLAID_THING}`,
  'Plaid-Thing',
   100_000_000_000,
   200_000_000_000,
)

const result_pair_3 = await createPair(
  `${CONTRACT_NAME_TOKENSOFT}`,
  `${CONTRACT_NAME_STX}`,
  `${CONTRACT_NAME_TOKENSOFT_STX}`,
  'xBTC-STX',
   2_000_000_000_000,    // 20 BTC
   1_200_000_000_000,   // 1_200_000 STX
)
console.log("done")
// create a second pair?
