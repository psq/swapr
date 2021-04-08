import clarity from '@blockstack/clarity'

const { Client, ProviderRegistry, Result } = clarity

import { readFileSync } from 'fs'

import chai from 'chai'
// chai.use(require('chai-string'))
const assert = chai.assert

import { providerWithInitialAllocations } from './providerWithInitialAllocations.js';

import { PlaidTokenClient } from "../../src/clients/plaid-token-client.js"
import { STXTokenClient } from "../../src/clients/stx-token-client.js"
import { PlaidSTXTokenClient } from "../../src/clients/plaid-stx-token-client.js"
import { SwaprClient } from "../../src/clients/swapr-client.js"
import {
  NoLiquidityError,
  NotOKErr,
  NotOwnerError,
  TransferError,
} from '../../src/errors.js'

const keys = JSON.parse(readFileSync('./keys.json').toString())
const balances = JSON.parse(readFileSync('./balances.json'))


describe("full test suite", () => {
  let sip_010_client
  let swapr_trait_client
  let plaid_token_client
  let stx_token_client
  let plaid_stx_token_client
  let swapr_client
  let provider

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",  // alice, u20 tokens of each
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",  // bob, u10 tokens of each
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",  // zoe, no tokens
    "SP138CBPVKYBQQ480EZXJQK89HCHY32XBQ0T4BCCD.swapr",  // contract, starts empty
    "SP1EHFWKXQEQD7TW9WWRGSGJFJ52XNGN6MTJ7X462",
    "SP30JX68J79SMTTN0D2KXQAJBFVYY56BZJEYS3X0B",

  ]
  const alice = addresses[0]
  const bob = addresses[1]
  const zoe = addresses[2]
  const swapr_contract = addresses[3]

  const token1 = `${addresses[4]}.token1`
  const token2 = `${addresses[4]}.token2`
  const token3 = `${addresses[4]}.token3`
  const pair1 = `${addresses[4]}.pair1`
  const pair2 = `${addresses[4]}.pair2`

  const token_plaid = 'SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.plaid-token'
  const token_stx = 'SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.stx-token'
  const token_swapr = 'SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.plaid-stx-token'
  const token_swapr_name = 'plaid.stx.swapr'

  before(async () => {
    ProviderRegistry.registerProvider(
      providerWithInitialAllocations(balances)
    )
    provider = await ProviderRegistry.createProvider()

    sip_010_client = new Client('SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.sip-010', './clarinet/contracts/sip-010', provider)
    swapr_trait_client = new Client('SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.swapr-trait', './clarinet/contracts/swapr-trait', provider)
    plaid_token_client = new PlaidTokenClient(provider)
    stx_token_client = new STXTokenClient(provider)
    plaid_stx_token_client = new PlaidSTXTokenClient(provider)
    swapr_client = new SwaprClient(provider)
  })

  it("should have a valid syntax", async () => {

    await sip_010_client.checkContract()
    await sip_010_client.deployContract()

    await swapr_trait_client.checkContract()
    await swapr_trait_client.deployContract()

    await plaid_token_client.checkContract()
    await plaid_token_client.deployContract()

    await stx_token_client.checkContract()
    await stx_token_client.deployContract()

    await plaid_stx_token_client.checkContract()
    await plaid_stx_token_client.deployContract()

    await swapr_client.checkContract()
    await swapr_client.deployContract()
  })

  it("swapr init", async () => {
    await swapr_client.createPair(token_plaid, token_stx, token_swapr, token_swapr_name, 10_000_000, 10_000_000, {sender: alice})

  })
//   describe.skip("wrapr", () => {
//     it("total supply should be 0", async () => {
//       const totalSupply = await wraprClient.totalSupply(alice)
//       assert.equal(totalSupply, 0)
//     })

//     it("contract balances should be 0", async () => {
//       const x_balance = await x_token_client.balanceOf(swapr_contract)
//       const y_balance = await y_token_client.balanceOf(swapr_contract)
//       assert.equal(x_balance, 0)
//       assert.equal(y_balance, 0)
//     })

//     it("Alice wrapr balance should be 0", async () => {
//       const balance = await wraprClient.balanceOf(alice)
//       assert.equal(balance, 0)
//     })

//     it("with no STX, wrap should fail", async () => {
//       try {
//         const result = await wraprClient.wrap(10, {sender: alice})
//       } catch(e) {
//         // console.log(e)
//         if (e instanceof TransferError) {
//           assert(true)
//         } else {
//           assert(false, "did not throw TransferError")
//         }
//       }
//     })

//     it("with no STX, transfer should fail", async () => {
//       try {
//         const result = await wraprClient.transfer(bob, 15, {sender: alice})
//       } catch(e) {
//         // console.log(e)
//         if (e instanceof TransferError) {
//           assert(true)
//         } else {
//           assert(false, "did not throw TransferError")
//         }
//       }
//     })

//     it("with no STX, unwrap should fail", async () => {
//       try {
//         const result = await wraprClient.unwrap(10, {sender: alice})
//       } catch(e) {
//         // console.log(e)
//         if (e instanceof TransferError) {
//           assert(true)
//         } else {
//           assert(false, "did not throw TransferError")
//         }
//       }
//     })

//   })

//   describe.skip("swapr", () => {
//     describe("after deploying an instance of the contract, with no contributions", () => {
//       it("should return 0 balance for Alice", async () => {
//         const positionAlice = await swapr_lient.positionOf(alice)
//         assert.equal(positionAlice, 0)
//       })
//     })

//     describe("after deploying an instance of the contract, with no contributions", () => {
//       it("should return 0 balance for Alice", async () => {
//         const positionAlice = await swapr_lient.positionOf(alice)
//         assert.equal(positionAlice, 0)
//       })

//       it("should throw NoLiquidityError when calling balances-of", async () => {
//         try {
//           await swapr_lient.balancesOf(alice)
//         } catch(e) {
//           if (e instanceof NoLiquidityError) {
//             assert(true)
//           } else {
//             assert(false, "did not throw NoLiquidityError")
//           }
//         }
//       })

//       it("should display 0 balances overal", async () => {
//         const balances = await swapr_lient.balances()
//         assert.equal(balances.x, 0)
//         assert.equal(balances.y, 0)
//       })
//     })


//     describe("after deploying an instance of the contract, and bob contributes x: 10, y: 5", () => {
//       before(async () => {
//         assert(await swapr_lient.addToPosition(10, 5, {sender: bob}), "addToPosition did not return true")
//       })

//       it("bob's token balances should have changed", async () => {
//         const balance1 = await x_token_client.balanceOf(bob)
//         const balance2 = await y_token_client.balanceOf(bob)
//         assert.equal(balance1, 999990)
//         assert.equal(balance2, 999995)
//       })

//       it("should return a balance of 10 for bob", async () => {
//         const positionBob = await swapr_lient.positionOf(bob)
//         assert.equal(positionBob, 10)
//       })

//       it("should get the proper balances when calling balances-of", async () => {
//         try {
//           const balances = await swapr_lient.balancesOf(bob)
//           assert.equal(balances.x, 10)
//           assert.equal(balances.y, 5)
//         } catch(e) {
//           // console.log(e)
//           assert(false, "should not throw")
//         }
//       })

//       it("should display the proper balances overall", async () => {
//         const balances = await swapr_lient.balances()
//         assert.equal(balances.x, 10)
//         assert.equal(balances.y, 5)
//       })

//       it("should display the proper positions overall", async () => {
//         const positions = await swapr_lient.positions()
//         assert.equal(positions, 10)
//       })

//       it("contract balances should be updated", async () => {
//         const x_balance = await x_token_client.balanceOf(swapr_contract)
//         const y_balance = await y_token_client.balanceOf(swapr_contract)
//         assert.equal(x_balance, 10)
//         assert.equal(y_balance, 5)
//       })

//     })

//     describe("alice contributes x: 20, y: 10", () => {
//       before(async () => {
//         assert(await swapr_lient.addToPosition(20, 10, {sender: alice}), "addToPosition did not return true")
//       })

//       it("alice's token balances should have changed", async () => {
//         const balance1 = await x_token_client.balanceOf(alice)
//         const balance2 = await y_token_client.balanceOf(alice)
//         assert.equal(balance1, 1999980)
//         assert.equal(balance2, 1999990)
//       })

//       it("should return a balance of 20 for Alice", async () => {
//         const positionAlice = await swapr_lient.positionOf(alice)
//         assert.equal(positionAlice, 20)
//       })

//       it("should get the proper balances when calling balances-of", async () => {
//         try {
//           const balances = await swapr_lient.balancesOf(alice)
//           assert.equal(balances.x, 20)
//           assert.equal(balances.y, 10)
//         } catch(e) {
//           // console.log(e)
//           assert(false, "should not throw")
//         }
//       })

//       it("should display the proper balances overall", async () => {
//         const balances = await swapr_lient.balances()
//         assert.equal(balances.x, 30)
//         assert.equal(balances.y, 15)
//       })

//       it("should display the proper positions overall", async () => {
//         const positions = await swapr_lient.positions()
//         assert.equal(positions, 30)
//       })

//       it("contract balances should be updated", async () => {
//         const x_balance = await x_token_client.balanceOf(swapr_contract)
//         const y_balance = await y_token_client.balanceOf(swapr_contract)
//         assert.equal(x_balance, 30)
//         assert.equal(y_balance, 15)
//       })

//     })

//     describe("alice reduces by 50%", () => {
//       before(async () => {
//         const result = await swapr_lient.reducePosition(50, {sender: alice})
//         assert.equal(result.x, 10)
//         assert.equal(result.y, 5)
//       })

//       it("alice's token balances should have changed", async () => {
//         const balance1 = await x_token_client.balanceOf(alice)
//         const balance2 = await y_token_client.balanceOf(alice)
//         assert.equal(balance1, 1999990)
//         assert.equal(balance2, 1999995)
//       })

//       it("should return a balance of 20 for Alice", async () => {
//         const positionAlice = await swapr_lient.positionOf(alice)
//         assert.equal(positionAlice, 10)
//       })

//       it("should get the proper balances when calling balances-of", async () => {
//         try {
//           const balances = await swapr_lient.balancesOf(alice)
//           assert.equal(balances.x, 10)
//           assert.equal(balances.y, 5)
//         } catch(e) {
//           // console.log(e)
//           assert(false, "should not throw")
//         }
//       })

//       it("should display the proper balances overall", async () => {
//         const balances = await swapr_lient.balances()
//         assert.equal(balances.x, 20)
//         assert.equal(balances.y, 10)
//       })

//       it("should display the proper positions overall", async () => {
//         const positions = await swapr_lient.positions()
//         assert.equal(positions, 20)
//       })

//       it("contract balances should be updated", async () => {
//         const x_balance = await x_token_client.balanceOf(swapr_contract)
//         const y_balance = await y_token_client.balanceOf(swapr_contract)
//         assert.equal(x_balance, 20)
//         assert.equal(y_balance, 10)
//       })

//     })

//     // TODO(psq): test that reducePosition does not accept a value > u100

//     describe("Setting the fee", () => {
//       before(async () => {
//       })

//       it("before setting, should return null", async () => {
//         const address = await swapr_lient.getFeeTo()
//         assert.equal(address, null)
//       })

//       it("non owner can not set the address", async () => {
//         try {
//           const result = await swapr_lient.setFeeTo(bob, {sender: bob})
//           assert(false, "should not return")
//         } catch(e) {
//           // console.log(e)
//           if (e instanceof NotOwnerError) {
//             assert(true)
//           } else {
//             assert(false, "did not throw NotOwnerError")
//           }
//         }
//       })

//       it("owner can set the address", async () => {
//         try {
//           const result = await swapr_lient.setFeeTo(zoe, {sender: zoe})
//           assert(result, "should return true")
//         } catch(e) {
//           // console.log(e)
//           assert(false, "should not throw")
//         }
//       })

//       // assumes tests are run sequentially, which chai should be doing
//       // running tests in parallel would require a reorg
//       it("should now return zoe", async () => {
//         const address = await swapr_lient.getFeeTo()
//         assert.equal(address, zoe)
//       })
//     })

//     describe("Clients exchanging tokens", () => {
//       before(async () => {
//         // add lots of liquidity
//         assert(await swapr_lient.addToPosition(500000, 250000, {sender: bob}), "addToPosition did not return true")
//       })

//       it("should display the proper balances overall", async () => {
//         const balances = await swapr_lient.balances()
//         assert.equal(balances.x, 500020)
//         assert.equal(balances.y, 250010)
//       })

//       describe("Alice exchanges 10000 of X for Y", () => {
//         let original_balances
//         let alice_balances = {
//           x: 0,
//           y: 0,
//         }
//         let original_fees
//         let swap_result
//         const dx = 10000
//         const dy = 4887

//         before(async () => {
//           // add lots of liquidity
//           original_balances = await swapr_lient.balances()
//           original_fees = await swapr_lient.fees()
//           alice_balances.x = await x_token_client.balanceOf(alice)
//           alice_balances.y = await y_token_client.balanceOf(alice)
//           swap_result = await swapr_lient.swapExactXforY(dx, {sender: alice})
//         })

//         it("Amount swapped should be correct", async () => {
//           assert.equal(swap_result.x, dx)
//           assert.equal(swap_result.y, dy)
//         })

//         it("Contract balances have been updated", async () => {
//           const balances = await swapr_lient.balances()
//           assert.equal(balances.x, original_balances.x + dx - 5)
//           assert.equal(balances.y, original_balances.y - dy)
//         })

//         it("Contract fees have been updated", async () => {
//           const balance = await swapr_lient.fees()
//           assert.equal(balance.x, 5)
//           assert.equal(balance.y, 0)
//         })

//         it("Alice token balances have been updated", async () => {
//           const balance1 = await x_token_client.balanceOf(alice)
//           const balance2 = await y_token_client.balanceOf(alice)
//           assert.equal(balance1, alice_balances.x - dx)
//           assert.equal(balance2, alice_balances.y + dy)
//         })

//         it("contract balances should be updated", async () => {
//           const x_balance = await x_token_client.balanceOf(swapr_contract)
//           const y_balance = await y_token_client.balanceOf(swapr_contract)
//           assert.equal(x_balance, 500020 + dx)
//           assert.equal(y_balance, 250010 - dy)
//         })

//       })

//       describe("Bob exchanges 20000 of Y for X", () => {
//         let original_balances
//         let bob_balances = {
//           x: 0,
//           y: 0,
//         }
//         let original_fees
//         let swap_result
//         const dx = 38367
//         const dy = 20000

//         before(async () => {
//           // add lots of liquidity
//           original_balances = await swapr_lient.balances()
//           original_fees = await swapr_lient.fees()
//           bob_balances.x = await x_token_client.balanceOf(bob)
//           bob_balances.y = await y_token_client.balanceOf(bob)
//           swap_result = await swapr_lient.swapExactYforX(dy, {sender: bob})
//         })

//         it("Amount swapped should be correct", async () => {
//           assert.equal(swap_result.x, dx)
//           assert.equal(swap_result.y, dy)
//         })

//         it("Contract balances have been updated", async () => {
//           const balances = await swapr_lient.balances()
//           assert.equal(balances.x, original_balances.x - dx)
//           assert.equal(balances.y, original_balances.y + dy - 10)
//         })

//         it("Contract fees have been updated", async () => {
//           const balance = await swapr_lient.fees()
//           assert.equal(balance.x, 5)  // leftover from Alice
//           assert.equal(balance.y, 10)
//         })

//         it("Bob token balances have been updated", async () => {
//           const balance1 = await x_token_client.balanceOf(bob)
//           const balance2 = await y_token_client.balanceOf(bob)
//           assert.equal(balance1, bob_balances.x + dx)
//           assert.equal(balance2, bob_balances.y - dy)
//         })

//         it("contract balances should be updated", async () => {
//           const x_balance = await x_token_client.balanceOf(swapr_contract)
//           const y_balance = await y_token_client.balanceOf(swapr_contract)
//           assert.equal(x_balance, 500020 + 10000 - dx)
//           assert.equal(y_balance, 250010 - 4887 + dy)
//         })

//       })

//       describe("Alice exchanges some X for 25000 of Y", () => {
//         let original_balances
//         let alice_balances = {
//           x: 0,
//           y: 0,
//         }
//         let original_fees
//         let swap_result
//         const dx = 49254
//         const dy = 25000

//         before(async () => {
//           // add lots of liquidity
//           original_balances = await swapr_lient.balances()
//           original_fees = await swapr_lient.fees()
//           alice_balances.x = await x_token_client.balanceOf(alice)
//           alice_balances.y = await y_token_client.balanceOf(alice)
//           swap_result = await swapr_lient.swapXforExactY(dy, {sender: alice})
//         })

//         it("Amount swapped should be correct", async () => {
//           assert.equal(swap_result.x, dx)
//           assert.equal(swap_result.y, dy)
//         })

//         it("Contract balances have been updated", async () => {
//           const balances = await swapr_lient.balances()
//           assert.equal(balances.x, original_balances.x + dx - 24)
//           assert.equal(balances.y, original_balances.y - dy)
//         })

//         it("Contract fees have been updated", async () => {
//           const balance = await swapr_lient.fees()
//           assert.equal(balance.x, 5 + 24)
//           assert.equal(balance.y, 10)
//         })

//         it("Alice token balances have been updated", async () => {
//           const balance1 = await x_token_client.balanceOf(alice)
//           const balance2 = await y_token_client.balanceOf(alice)
//           assert.equal(balance1, alice_balances.x - dx)
//           assert.equal(balance2, alice_balances.y + dy)
//         })

//         it("contract balances should be updated", async () => {
//           const x_balance = await x_token_client.balanceOf(swapr_contract)
//           const y_balance = await y_token_client.balanceOf(swapr_contract)
//           assert.equal(x_balance, 471653 + dx)
//           assert.equal(y_balance, 265123 - dy)
//         })

//       })

//       describe("Bob exchanges some Y for 75000 of X", () => {
//         let original_balances
//         let bob_balances = {
//           x: 0,
//           y: 0,
//         }
//         let original_fees
//         let swap_result
//         const dx = 75000
//         const dy = 40510

//         before(async () => {
//           // add lots of liquidity
//           original_balances = await swapr_lient.balances()
//           original_fees = await swapr_lient.fees()
//           bob_balances.x = await x_token_client.balanceOf(bob)
//           bob_balances.y = await y_token_client.balanceOf(bob)
//           swap_result = await swapr_lient.swapYforExactX(dx, {sender: bob})
//         })

//         it("Amount swapped should be correct", async () => {
//           assert.equal(swap_result.x, dx)
//           assert.equal(swap_result.y, dy)
//         })

//         it("Contract balances have been updated", async () => {
//           const balances = await swapr_lient.balances()
//           assert.equal(balances.x, original_balances.x - dx)
//           assert.equal(balances.y, original_balances.y + dy - 20)
//         })

//         it("Contract fees have been updated", async () => {
//           const balance = await swapr_lient.fees()
//           assert.equal(balance.x, 29)  // leftover from Alice
//           assert.equal(balance.y, 30)
//         })

//         it("Bob token balances have been updated", async () => {
//           const balance1 = await x_token_client.balanceOf(bob)
//           const balance2 = await y_token_client.balanceOf(bob)
//           assert.equal(balance1, bob_balances.x + dx)
//           assert.equal(balance2, bob_balances.y - dy)
//         })

//         it("contract balances should be updated", async () => {
//           const x_balance = await x_token_client.balanceOf(swapr_contract)
//           const y_balance = await y_token_client.balanceOf(swapr_contract)
//           assert.equal(x_balance, 471653 + 49254 - dx)
//           assert.equal(y_balance, 265123 - 25000 + dy)
//         })

//       })

//     })


//     describe.skip("Collecting the fee", () => {
//       let original_fees
//       before(async () => {
//         original_fees = await swapr_lient.fees()
//       })

//       it("should send fees to contract owner", async () => {
//         const fees = await swapr_lient.collectFees({sender: alice}) // anyone can pay for sending the fees :)
//         assert.equal(fees.x, 29)
//         assert.equal(fees.y, 30)
//       })

//       it("contract owner should have received the fees", async () => {
//         const balance1 = await x_token_client.balanceOf(zoe)
//         const balance2 = await y_token_client.balanceOf(zoe)
//         assert.equal(balance1, original_fees.x)
//         assert.equal(balance2, original_fees.y)
//       })

//       it("fees are now 0", async () => {
//         const fees = await swapr_lient.fees()
//         assert.equal(fees.x, 0)
//         assert.equal(fees.y, 0)
//       })

//       it("contract balances should be updated", async () => {
//         const x_balance = await x_token_client.balanceOf(swapr_contract)
//         const y_balance = await y_token_client.balanceOf(swapr_contract)
//         assert.equal(x_balance, 500020 + 10000 - 38367 + 49254 - 75000 - 5 - 24)
//         assert.equal(y_balance, 250010 - 4887 + 20000 - 25000 + 40510 - 10 - 20)
//       })

//     })

//     describe.skip("Resetting the feeTo address", () => {
//       it("non owner can not reset the address", async () => {
//         try {
//           const result = await swapr_lient.resetFeeTo({sender: bob})
//           assert(false, "should not return")
//         } catch(e) {
//           // console.log(e)
//           if (e instanceof NotOwnerError) {
//             assert(true)
//           } else {
//             assert(false, "did not throw NotOwnerError")
//           }
//         }
//       })

//       it("owner can reset the address", async () => {
//         try {
//           const result = await swapr_lient.resetFeeTo({sender: zoe})
//           assert(result, "should return true")
//         } catch(e) {
//           // console.log(e)
//           assert(false, "should not throw")
//         }
//       })

//       // assumes tests are run sequentially, which chai should be doing
//       // running tests in parallel would require a reorg
//       it("should now return null", async () => {
//         const address = await swapr_lient.getFeeTo()
//         assert.equal(address, null)
//       })
//     })
//   })

//   describe("Token Registry Tests", () => {
//     it("has no tokens", async () => {
//       try {
//         const result = await registryClient.getTokens({sender: bob})
//         assert.equal(result.length, 0)
//       } catch(e) {
//         console.log(e)
//         assert(false, "should not throw")
//       }
//     })

//     it("adds a token", async () => {
//       const result1 = await registryClient.addToken('token1', token1, {sender: bob})
//       console.log("result1.add a token", result1)
//       assert.equal(result1, true)

//       const result2 = await registryClient.getTokens({sender: bob})
//       console.log("result2.add a token", result2)
//       assert.equal(result2.length, 1)
//       assert.equal((Buffer.from(result2[0][1][1].substring(2), 'hex')).toString(), 'token1')

//       // const result3 = await registryClient.renameToken(token1, 'token1a', {sender: bob})
//       // console.log("result3.add a token", result3)
//       // assert.equal(result3, true)
//       const result3 = await registryClient.renameToken(token1, 'token1a', {sender: bob})
//       console.log("result3.add a token", result3)
//       assert.equal(result3, true)

//       const result4 = await registryClient.getTokens({sender: bob})
//       console.log("result4.add a token", result4)
//       assert.equal(result4.length, 1)
//       assert.equal((Buffer.from(result4[0][1][1].substring(2), 'hex')).toString(), 'token1a')

//       const result5 = await registryClient.addToken('token2', token2, {sender: bob})
//       console.log("result5.add a token", result5)
//       assert.equal(result5, true)

//       const result6 = await registryClient.getTokens({sender: bob})
//       console.log("result6.add a token", result6)
//       assert.equal(result6.length, 2)
//       assert.equal((Buffer.from(result6[0][1][1].substring(2), 'hex')).toString(), 'token1a')
//       assert.equal((Buffer.from(result6[1][1][1].substring(2), 'hex')).toString(), 'token2')
//     })

//   })

//   describe("Pairs Registry Tests", () => {
//     // TODO(psq): now that swapr registers itself, this is no longer, split into a different file?
//     // TODO(psq): or deploy swapr later after these tests are done?
//     it("has no pairs", async () => {
//       const result = await registryClient.getPairs({sender: bob})
//       assert.equal(result.length, 1)
//     })

//     it("adds a pair", async () => {
//       const result1 = await registryClient.addPair(pair1, 'token3', token3, 'token2', token2, {sender: bob})
//       console.log("result1.add a pair", result1)
//       assert.equal(result1, true)

//       const result2 = await registryClient.getPairs({sender: bob})
//       console.log("result2.add a pair", JSON.stringify(result2, null, 2))
//       assert.equal(result2.length, 2)
//       assert.equal((Buffer.from(result2[0][1][1].substring(2), 'hex')).toString(), '{{token1}}')

//       const result3 = await registryClient.addPair(pair2, 'token1', token1, 'token3', token3, {sender: bob})
//       console.log("result3.add a pair", result3)
//       assert.equal(result3, true)

//       const result4 = await registryClient.getPairs({sender: bob})
//       console.log("result4.add a pair", JSON.stringify(result4, null, 2))
//       assert.equal(result4.length, 3)
//       assert.equal((Buffer.from(result4[0][1][1].substring(2), 'hex')).toString(), '{{token1}}')
//     })

//     it("can't add the same pair again", async () => {
//       try {
//         const result1 = await registryClient.addPair(pair1, 'token3', token3, 'token2', token2, {sender: bob})
//         console.log("result1.add a pair", result1)
//         assert.equal(result1, true)
//       } catch (e) {
//         console.log(e)
//         if (e instanceof NotOKErr) {
//           assert(true)
//         } else {
//           assert(false, "did not throw NotOKErr")
//         }
//       }
//     })

//     it.skip("adds too many pairs", async () => {
//       // TODO(psq): the test works, and fails when trying to create #2198 (zero based, and 2 created earlier), so check the failure happens at that index
//       // disabled for now
//       try {
//         for (let i = 0; i < 10000; i++) {
//           console.log("adding", i)
//           const result1 = await registryClient.addPair(pair1, `token${i}`, keys[i], `token${i + 1}`, keys[i + 1], {sender: bob})
//           assert.equal(result1, true)
//           const result2 = await registryClient.getPairs({sender: bob})
//           assert.equal(result2.length, i + 3)
//         }
//       } catch (e) {
//         console.log(e)
//         if (e instanceof NotOKErr) {
//           assert(true)
//         } else {
//           assert(false, "did not throw NotOKErr")
//         }
//       }
//     })


//   })

  after(async () => {
    await provider.close()
  })
})
