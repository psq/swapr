import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";

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
  let myToken1Client: Client;
  let myToken2Client: Client;
  let tokenTraitClient: Client;
  let swaprClient: Client;
  let wraprClient: Client;
  let provider: Provider;

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",  // alice, u20 tokens of each
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",  // bob, u10 tokens of each
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",  // zoe, no tokens
  ];
  const alice = addresses[0];
  const bob = addresses[1];
  const zoe = addresses[2];


  before(async () => {
    provider = await ProviderRegistry.createProvider()
    tokenTraitClient = new Client("SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.token-transfer-trait", "token-transfer-trait", provider)
    myToken1Client = new TokenClient("SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1", provider)
    myToken2Client = new TokenClient("SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH", provider)
    swaprClient = new SwaprClient(provider)
    wraprClient = new WraprClient(provider)
  });

  it("should have a valid syntax", async () => {
    await tokenTraitClient.checkContract();
    await tokenTraitClient.deployContract();
    await myToken1Client.checkContract();
    await myToken1Client.deployContract();
    await myToken2Client.checkContract();
    await myToken2Client.deployContract();
    await swaprClient.checkContract()
    await wraprClient.checkContract()

    await wraprClient.deployContract();
    await swaprClient.deployContract();
  });

  describe("after deploying an instance of the wrapr contract, with no contributions", () => {
    it("should total supply should be 0", async () => {
      const totalSupply = await wraprClient.totalSupply(alice)
      assert.equal(totalSupply, 0)
    })

    it("with no STX, wrap should fail", async () => {
      try {
        const result = await wraprClient.wrap(10, {sender: alice})
      } catch(e) {
        console.log(e)
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
        console.log(e)
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
        console.log(e)
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
      const balance1 = await myToken1Client.balanceOf(bob)
      const balance2 = await myToken2Client.balanceOf(bob)
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
  })

  // TODO(psq): check token balances have been updated as well
  describe("alice contributes x: 20, y: 10", () => {
    before(async () => {
      assert(await swaprClient.addToPosition(20, 10, {sender: alice}), "addToPosition did not return true")
    })

    it("alice's token balances should have changed", async () => {
      const balance1 = await myToken1Client.balanceOf(alice)
      const balance2 = await myToken2Client.balanceOf(alice)
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
  })

  // TODO(psq): check token balances have been updated as well
  describe("alice reduces by 50%", () => {
    before(async () => {
      const result = await swaprClient.reducePosition(50, {sender: alice})
      assert.equal(result.x, 10)
      assert.equal(result.y, 5)
    })

    it("alice's token balances should have changed", async () => {
      const balance1 = await myToken1Client.balanceOf(alice)
      const balance2 = await myToken2Client.balanceOf(alice)
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

    // TODO(psq): check collect-fees and the owner's balance


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
