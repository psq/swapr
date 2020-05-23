export class NoLiquidityError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

export class NotOwnerError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

export class NotOKErr extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

export class NotSomeErr extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

export class ClarityParseError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

export class TransferError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

