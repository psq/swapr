export class NoLiquidityError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}
