const clarity = require('@blockstack/clarity')

const { Client, Provider, Receipt, Result } = clarity

const {
  AlreadyClaimedError,
  NothingToClaimError,
  NoRewardError,
  RewardCycleNeedsRolloverError,
  TransferError,
} = require('../errors.js')

const {
  parse,
  unwrapXYList,
  unwrapSome,
  unwrapOK,
} = require('../utils.js')

class RewardsClient extends Client {

  constructor(provider) {
    super(
      `SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.rewards`,
      './clarinet/contracts/rewards.clar',
      provider
    )
  }

  async getRewardCycle() {
    const query = this.createQuery({
      method: {
        name: 'get-reward-cycle',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    return parseInt(receipt.result.slice(1))
  }

  async getBlockHeight() {
    const query = this.createQuery({
      method: {
        name: 'get-block-height',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    // console.log("getBlockHeight.receipt", receipt, parseInt(receipt.result.slice(1)))
    return parseInt(receipt.result.slice(1))
  }

  async getBlockTime() {
    const query = this.createQuery({
      method: {
        name: 'get-block-time',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    return parseInt(receipt.result.slice(1))
  }

  // a function to make the block advance by 1
  async stxTransfer(recipient, amount, params) {
    const tx = this.createTransaction({
      method: { name: "stx-transfer", args: [`'${recipient}`, `${amount}`] },
    })
    await tx.sign(params.sender)
    const res = await this.submitTransaction(tx)
    return res
  }

  async shouldRolloverRewards(pair, slot, previous_cycle) {
    const query = this.createQuery({
      method: {
        name: 'should-rollover-rewards',
        args: [`"${pair}"`, `u${slot}`, `u${previous_cycle}`, ],
      },
    })
    const receipt = await this.submitQuery(query)
    // console.log("shouldRolloverRewards.receipt", receipt)
    return receipt.result === 'true'
  }

  // (rollover-rewards (pair (string-ascii 32)) (slot uint) (previous-cycle uint))
  async rolloverRewards(pair, slot, previous_cycle, params) {
    console.log("rolloverRewards", pair, slot, previous_cycle)
    const tx = this.createTransaction({
      method: { name: "rollover-rewards", args: [`"${pair}"`, `u${slot}`, `u${previous_cycle}`] }
      })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log(receipt)
    // console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

  // (credit-rewards (cycle uint) (pair (string-ascii 32)) (slot uint) (token <sip-010-token>) (amount uint))
  async creditRewards(cycle, pair, slot, token, amount, params) {
    console.log("creditRewards", cycle, pair, slot, token, amount)
    const tx = this.createTransaction({
      method: { name: "credit-rewards", args: [`u${cycle}`, `"${pair}"`, `u${slot}`, `'${token}`, `u${amount}`] }
      })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log(receipt)
    // console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

  // (claim-rewards (pair (string-ascii 32)) (slot uint) (token <sip-010-token>) (owner principal))
  async claimRewards(pair, slot, token, params) {
    console.log("claimRewards", pair, slot, token)
    const tx = this.createTransaction({
      method: { name: "claim-rewards", args: [`"${pair}"`, `u${slot}`, `'${token}`] }
      })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log("receipt", receipt)
    // console.log("receipt.debugOutput", receipt.debugOutput)
    if (receipt.success) {
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')
    }
    // console.log("receipt.error.message", receipt.error.message)
    const result_code = parseInt(receipt.error.message.slice('Execute expression on contract failed with bad output: Aborted: u'.length))
    console.log("result_code", result_code)
    if (result_code === 115) {
      throw new NoRewardError()
    } else if (result_code === 116) {
      throw new AlreadyClaimedError()
    } else if (result_code === 118) {
      throw new RewardCycleNeedsRolloverError()
    } else if (result_code === 121) {
      throw new NothingToClaimError()
    }
    console.log("unexpected error code", result_code)
  }

  // (claimable-share (pair (string-ascii 32)) (slot uint) (token <sip-010-token>) (owner principal))
  async claimableShare(cycle, pair, owner) {
    const query = this.createQuery({
      method: {
        name: 'claimable-share',
        args: [`u${cycle}`, `"${pair}"`, `'${owner}`],
      },
    })
    const receipt = await this.submitQuery(query)
    console.log("claimableShare.receipt.result", receipt.result)
    return receipt.result.slice(1, receipt.result.length - 1).split(' ').map(v => parseInt(v.slice(1)))
  }

  // (claimable-total-shares (cycle uint) (pair (string-ascii 32)))
  async claimableTotalShares(cycle, pair) {
    const query = this.createQuery({
      method: {
        name: 'claimable-total-shares',
        args: [`u${cycle}`, `"${pair}"`],
      },
    })
    const receipt = await this.submitQuery(query)
    return parseInt(receipt.result.slice(1))
  }


  // (cancel-rewards (pair (string-ascii 32)) (owner principal))
  async cancelRewards(pair, owner, params) {
    console.log("cancelRewards", pair, owner)
    const tx = this.createTransaction({
      method: { name: "cancel-rewards", args: [`"${pair}"`, `'${owner}`] }
      })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log(receipt)
    console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

  // (add-rewards (pair (string-ascii 32)) (owner principal) (shares uint))
  async addRewards(pair, owner, shares, params) {
    console.log("addRewards", pair, owner, shares)
    const tx = this.createTransaction({
      method: { name: "add-rewards", args: [`"${pair}"`, `'${owner}`, `u${shares}`] }
      })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log(receipt)
    console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

  // (setup-upcoming-cycles (pair (string-ascii 32)))
  async setupUpcomingCycles(pair, params) {
    console.log("setupUpcomingCycles", pair)
    const tx = this.createTransaction({
      method: { name: "setup-upcoming-cycles", args: [`"${pair}"`] }
      })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log(receipt)
    console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

}

module.exports = {
  RewardsClient,
}