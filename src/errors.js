class NoLiquidityError extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class NotOwnerError extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class NotOKErr extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class NotSomeErr extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class ClarityParseError extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class TransferError extends Error {
  constructor(message) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class NoRewardError extends Error {
  constructor() {
    super('no reward available')
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class AlreadyClaimedError extends Error {
  constructor() {
    super('reward already claimed')
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class NothingToClaimError extends Error {
  constructor() {
    super('nothing to claim')
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

class RewardCycleNeedsRolloverError extends Error {
  constructor() {
    super('Reward cycle needs rollover')
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

module.exports = {
  NoLiquidityError,
  NotOwnerError,
  NotOKErr,
  NotSomeErr,
  ClarityParseError,
  TransferError,
  NoRewardError,
  AlreadyClaimedError,
  NothingToClaimError,
  RewardCycleNeedsRolloverError,
}