import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity"

var chai = require('chai')
chai.use(require('chai-string'))
const assert = chai.assert

import { WraprClient } from "../src/clients/wrapr-client"
import { SwaprClient } from "../src/clients/swapr-client"
import { TokenClient } from "../src/clients/token-client"
import {
  NoLiquidityError,
  NotOwnerError,
  TransferError,
} from '../src/errors'


describe("swapr contract test suite", () => {
  let x_token_client: Client
  let y_token_client: Client
  let tokenTraitClient: Client
  let swaprClient: Client
  let wraprClient: Client
  let provider: Provider

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",  // alice, u20 tokens of each
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",  // bob, u10 tokens of each
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",  // zoe, no tokens
    "SP138CBPVKYBQQ480EZXJQK89HCHY32XBQ0T4BCCD.swapr",  // contract, starts empty
  ]
  const alice = addresses[0]
  const bob = addresses[1]
  const zoe = addresses[2]
  const swapr_contract = addresses[3]


  before(async () => {
    provider = await ProviderRegistry.createProvider()
    tokenTraitClient = new Client("SP2TPZ623K5N2WYF1BWRMP5A93PSBWWADQGKJRJCS.token-transfer-trait", "token-transfer-trait", provider)
    x_token_client = new TokenClient("SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1", provider)
    y_token_client = new TokenClient("SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH", provider)
    swaprClient = new SwaprClient(provider)
    wraprClient = new WraprClient(provider)
  })

  it("should have a valid syntax", async () => {
    await tokenTraitClient.checkContract()
    await tokenTraitClient.deployContract()
    await x_token_client.checkContract()
    await x_token_client.deployContract()
    await y_token_client.checkContract()
    await y_token_client.deployContract()
    await swaprClient.checkContract()
    await wraprClient.checkContract()

    await wraprClient.deployContract()
    await swaprClient.deployContract()
  })

  describe("after deploying an instance of the wrapr contract, with no contributions", () => {
    it("should total supply should be 0", async () => {
      const totalSupply = await wraprClient.totalSupply(alice)
      assert.equal(totalSupply, 0)
    })

    it("contract balances should be 0", async () => {
      const x_balance = await x_token_client.balanceOf(swapr_contract)
      const y_balance = await y_token_client.balanceOf(swapr_contract)
      assert.equal(x_balance, 0)
      assert.equal(y_balance, 0)
    })

    it("with no STX, wrap should fail", async () => {
      try {
        const result = await wraprClient.wrap(10, {sender: alice})
      } catch(e) {
        // console.log(e)
        if (e instanceof TransferError) {
          assert(true)
        } else {
          assert(false, "did not throw TransferError")
        }
      }
    })

    it("with no STX, transfer should fail", async () => {
      try {
        const result = await wraprClient.transfer(bob, 15, {sender: alice})
      } catch(e) {
        // console.log(e)
        if (e instanceof TransferError) {
          assert(true)
        } else {
          assert(false, "did not throw TransferError")
        }
      }
    })

    it("with no STX, unwrap should fail", async () => {
      try {
        const result = await wraprClient.unwrap(10, {sender: alice})
      } catch(e) {
        // console.log(e)
        if (e instanceof TransferError) {
          assert(true)
        } else {
          assert(false, "did not throw TransferError")
        }
      }
    })

  })


  describe("after deploying an instance of the contract, with no contributions", () => {
    it("should return 0 balance for Alice", async () => {
      const positionAlice = await swaprClient.positionOf(alice)
      assert.equal(positionAlice, 0)
    })
  })

  describe("after deploying an instance of the contract, with no contributions", () => {
    it("should return 0 balance for Alice", async () => {
      const positionAlice = await swaprClient.positionOf(alice)
      assert.equal(positionAlice, 0)
    })

    it("should throw NoLiquidityError when calling balances-of", async () => {
      try {
        await swaprClient.balancesOf(alice)
      } catch(e) {
        if (e instanceof NoLiquidityError) {
          assert(true)
        } else {
          assert(false, "did not throw NoLiquidityError")
        }
      }
    })

    it("should display 0 balances overal", async () => {
      const balances = await swaprClient.balances()
      assert.equal(balances.x, 0)
      assert.equal(balances.y, 0)
    })
  })


  describe("after deploying an instance of the contract, and bob contributes x: 10, y: 5", () => {
    before(async () => {
      assert(await swaprClient.addToPosition(10, 5, {sender: bob}), "addToPosition did not return true")
    })

    it("bob's token balances should have changed", async () => {
      const balance1 = await x_token_client.balanceOf(bob)
      const balance2 = await y_token_client.balanceOf(bob)
      assert.equal(balance1, 999990)
      assert.equal(balance2, 999995)
    })

    it("should return a balance of 10 for bob", async () => {
      const positionBob = await swaprClient.positionOf(bob)
      assert.equal(positionBob, 10)
    })

    it("should get the proper balances when calling balances-of", async () => {
      try {
        const balances = await swaprClient.balancesOf(bob)
        assert.equal(balances.x, 10)
        assert.equal(balances.y, 5)
      } catch(e) {
        // console.log(e)
        assert(false, "should not throw")
      }
    })

    it("should display the proper balances overall", async () => {
      const balances = await swaprClient.balances()
      assert.equal(balances.x, 10)
      assert.equal(balances.y, 5)
    })

    it("should display the proper positions overall", async () => {
      const positions = await swaprClient.positions()
      assert.equal(positions, 10)
    })

    it("contract balances should be updated", async () => {
      const x_balance = await x_token_client.balanceOf(swapr_contract)
      const y_balance = await y_token_client.balanceOf(swapr_contract)
      assert.equal(x_balance, 10)
      assert.equal(y_balance, 5)
    })

  })

  // TODO(psq): check token balances have been updated as well
  describe("alice contributes x: 20, y: 10", () => {
    before(async () => {
      assert(await swaprClient.addToPosition(20, 10, {sender: alice}), "addToPosition did not return true")
    })

    it("alice's token balances should have changed", async () => {
      const balance1 = await x_token_client.balanceOf(alice)
      const balance2 = await y_token_client.balanceOf(alice)
      assert.equal(balance1, 1999980)
      assert.equal(balance2, 1999990)
    })

    it("should return a balance of 20 for Alice", async () => {
      const positionAlice = await swaprClient.positionOf(alice)
      assert.equal(positionAlice, 20)
    })

    it("should get the proper balances when calling balances-of", async () => {
      try {
        const balances = await swaprClient.balancesOf(alice)
        assert.equal(balances.x, 20)
        assert.equal(balances.y, 10)
      } catch(e) {
        // console.log(e)
        assert(false, "should not throw")
      }
    })

    it("should display the proper balances overall", async () => {
      const balances = await swaprClient.balances()
      assert.equal(balances.x, 30)
      assert.equal(balances.y, 15)
    })

    it("should display the proper positions overall", async () => {
      const positions = await swaprClient.positions()
      assert.equal(positions, 30)
    })

    it("contract balances should be updated", async () => {
      const x_balance = await x_token_client.balanceOf(swapr_contract)
      const y_balance = await y_token_client.balanceOf(swapr_contract)
      assert.equal(x_balance, 30)
      assert.equal(y_balance, 15)
    })

  })

  // TODO(psq): check token balances have been updated as well
  describe("alice reduces by 50%", () => {
    before(async () => {
      const result = await swaprClient.reducePosition(50, {sender: alice})
      assert.equal(result.x, 10)
      assert.equal(result.y, 5)
    })

    it("alice's token balances should have changed", async () => {
      const balance1 = await x_token_client.balanceOf(alice)
      const balance2 = await y_token_client.balanceOf(alice)
      assert.equal(balance1, 1999990)
      assert.equal(balance2, 1999995)
    })

    it("should return a balance of 20 for Alice", async () => {
      const positionAlice = await swaprClient.positionOf(alice)
      assert.equal(positionAlice, 10)
    })

    it("should get the proper balances when calling balances-of", async () => {
      try {
        const balances = await swaprClient.balancesOf(alice)
        assert.equal(balances.x, 10)
        assert.equal(balances.y, 5)
      } catch(e) {
        // console.log(e)
        assert(false, "should not throw")
      }
    })

    it("should display the proper balances overall", async () => {
      const balances = await swaprClient.balances()
      assert.equal(balances.x, 20)
      assert.equal(balances.y, 10)
    })

    it("should display the proper positions overall", async () => {
      const positions = await swaprClient.positions()
      assert.equal(positions, 20)
    })

    it("contract balances should be updated", async () => {
      const x_balance = await x_token_client.balanceOf(swapr_contract)
      const y_balance = await y_token_client.balanceOf(swapr_contract)
      assert.equal(x_balance, 20)
      assert.equal(y_balance, 10)
    })

  })

  // TODO(psq): test that reducePosition does not accept a value > u100

  describe("Setting the fee", () => {
    before(async () => {
    })

    it("before setting, should return null", async () => {
      const address = await swaprClient.getFeeTo()
      assert.equal(address, null)
    })

    it("non owner can not set the address", async () => {
      try {
        const result = await swaprClient.setFeeTo(bob, {sender: bob})
        assert(false, "should not return")
      } catch(e) {
        // console.log(e)
        if (e instanceof NotOwnerError) {
          assert(true)
        } else {
          assert(false, "did not throw NotOwnerError")
        }
      }
    })

    it("owner can set the address", async () => {
      try {
        const result = await swaprClient.setFeeTo(zoe, {sender: zoe})
        assert(result, "should return true")
      } catch(e) {
        // console.log(e)
        assert(false, "should not throw")
      }
    })

    // assumes tests are run sequentially, which chai should be doing
    // running tests in parallel would require a reorg
    it("should now return zoe", async () => {
      const address = await swaprClient.getFeeTo()
      assert.equal(address, zoe)
    })
  })

  describe("Clients exchanging tokens", () => {
    before(async () => {
      // add lots of liquidity
      assert(await swaprClient.addToPosition(500000, 250000, {sender: bob}), "addToPosition did not return true")
    })

    it("should display the proper balances overall", async () => {
      const balances = await swaprClient.balances()
      assert.equal(balances.x, 500020)
      assert.equal(balances.y, 250010)
    })

    describe("Alice exchanges 10000 of X for Y", () => {
      let original_balances
      let alice_balances = {
        x: 0,
        y: 0,
      }
      let original_fees
      let swap_result
      const dx = 10000
      const dy = 4887

      before(async () => {
        // add lots of liquidity
        original_balances = await swaprClient.balances()
        original_fees = await swaprClient.fees()
        alice_balances.x = await x_token_client.balanceOf(alice)
        alice_balances.y = await y_token_client.balanceOf(alice)
        swap_result = await swaprClient.swapExactXforY(dx, {sender: alice})
      })

      it("Amount swapped should be correct", async () => {
        assert.equal(swap_result.x, dx)
        assert.equal(swap_result.y, dy)
      })

      it("Contract balances have been updated", async () => {
        const balances = await swaprClient.balances()
        assert.equal(balances.x, original_balances.x + dx)
        assert.equal(balances.y, original_balances.y - dy)  // TODO(psq): actually should include the fee (254897)
      })

      it("Contract fees have been updated", async () => {
        const balance = await swaprClient.fees()
        assert.equal(balance.x, 5)
        assert.equal(balance.y, 0)
      })

      it("Alice token balances have been updated", async () => {
        const balance1 = await x_token_client.balanceOf(alice)
        const balance2 = await y_token_client.balanceOf(alice)
        assert.equal(balance1, alice_balances.x - dx)
        assert.equal(balance2, alice_balances.y + dy)
      })

      it("contract balances should be updated", async () => {
        const x_balance = await x_token_client.balanceOf(swapr_contract)
        const y_balance = await y_token_client.balanceOf(swapr_contract)
        assert.equal(x_balance, 500020 + dx)
        assert.equal(y_balance, 250010 - dy)
      })

    })

    describe("Bob exchanges 20000 of Y for X", () => {
      let original_balances
      let bob_balances = {
        x: 0,
        y: 0,
      }
      let original_fees
      let swap_result
      const dx = 38367
      const dy = 20000

      before(async () => {
        // add lots of liquidity
        original_balances = await swaprClient.balances()
        original_fees = await swaprClient.fees()
        bob_balances.x = await x_token_client.balanceOf(bob)
        bob_balances.y = await y_token_client.balanceOf(bob)
        swap_result = await swaprClient.swapExactYforX(dy, {sender: bob})
      })

      it("Amount swapped should be correct", async () => {
        assert.equal(swap_result.x, dx)
        assert.equal(swap_result.y, dy)
      })

      it("Contract balances have been updated", async () => {
        const balances = await swaprClient.balances()
        assert.equal(balances.x, original_balances.x - dx)
        assert.equal(balances.y, original_balances.y + dy)  // TODO(psq): actually should include the fee (254897)
      })

      it("Contract fees have been updated", async () => {
        const balance = await swaprClient.fees()
        assert.equal(balance.x, 5)  // leftover from Alice
        assert.equal(balance.y, 10)
      })

      it("Bob token balances have been updated", async () => {
        const balance1 = await x_token_client.balanceOf(bob)
        const balance2 = await y_token_client.balanceOf(bob)
        assert.equal(balance1, bob_balances.x + dx)
        assert.equal(balance2, bob_balances.y - dy)
      })

      it("contract balances should be updated", async () => {
        const x_balance = await x_token_client.balanceOf(swapr_contract)
        const y_balance = await y_token_client.balanceOf(swapr_contract)
        assert.equal(x_balance, 500020 + 10000 - dx)
        assert.equal(y_balance, 250010 - 4887 + dy)
      })

    })

  })


  describe("Collecting the fee", () => {
    let original_fees
    before(async () => {
      original_fees = await swaprClient.fees()
    })

    it("should send fees to contract owner", async () => {
      const fees = await swaprClient.collectFees({sender: alice}) // anyone can pay for sending the fees :)
      assert.equal(fees.x, 5)
      assert.equal(fees.y, 10)
    })

    it("contract owner should have received the fees", async () => {
      const balance1 = await x_token_client.balanceOf(zoe)
      const balance2 = await y_token_client.balanceOf(zoe)
      assert.equal(balance1, original_fees.x)
      assert.equal(balance2, original_fees.y)
    })

    it("fees are now 0", async () => {
      const fees = await swaprClient.fees()
      assert.equal(fees.x, 0)
      assert.equal(fees.y, 0)
    })

    it("contract balances should be updated", async () => {
      const x_balance = await x_token_client.balanceOf(swapr_contract)
      const y_balance = await y_token_client.balanceOf(swapr_contract)
      assert.equal(x_balance, 500020 + 10000 - 38367 - 5)
      assert.equal(y_balance, 250010 - 4887 + 20000 - 10)
    })

  })

  describe("Resetting the feeTo address", () => {
    it("non owner can not reset the address", async () => {
      try {
        const result = await swaprClient.resetFeeTo({sender: bob})
        assert(false, "should not return")
      } catch(e) {
        // console.log(e)
        if (e instanceof NotOwnerError) {
          assert(true)
        } else {
          assert(false, "did not throw NotOwnerError")
        }
      }
    })

    it("owner can reset the address", async () => {
      try {
        const result = await swaprClient.resetFeeTo({sender: zoe})
        assert(result, "should return true")
      } catch(e) {
        // console.log(e)
        assert(false, "should not throw")
      }
    })

    // assumes tests are run sequentially, which chai should be doing
    // running tests in parallel would require a reorg
    it("should now return null", async () => {
      const address = await swaprClient.getFeeTo()
      assert.equal(address, null)
    })
  })

  after(async () => {
    await provider.close()
  })
})
