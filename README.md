# Swapr: trustless token exchange

An exploration on how to implement an automated token exchange modeled after [Uniswap](https://uniswap.exchange) in Clarity for [Stacks 2.0](https://github.com/blockstack/stacks-blockchain)

Of special interest, reading the [x-y-k paper](https://github.com/runtimeverification/verified-smart-contracts/blob/uniswap/uniswap/x-y-k.pdf) and [V2 whitepaper](https://uniswap.org/whitepaper.pdf) would provide some background on understanding how things work (some things have been simplified, notably the initial burning of 1000 times the minimum pool share to prevent attacks right after the first addition to the liquidity pool)

The API has been reimagined, and hopefully simplified to its minima, withough impeding on proper functioning of the trustless exchange.

## main contract API

# `(add-to-position (x uint) (y uint))`

# `(reduce-position (percent uint))`

# `(swap-exact-x-for-y (x uint))`

# `(swap-x-for-exact-y (y uint))`

# `(swap-exact-y-for-x (y uint))`

# `(swap-y-for-exact-x (x uint))`

## Wrapr contract
Additionally, a contract to wrap STX (a la WETH) is also included so people could create pairs against STX.  Unfortunately, as of writing this, there is no way to add STX to an address in the testing framework, so only minimal testing is provided.

## Further thoughts
Solidity does not make it easy to implement `sqrt`, although the "egyptian" method seems fine, however not having loops in Clarity makes it impractical to implement, so the contract uses the old method, but if the x pair is a lot less valuable than the y pair, rounding issues may occur.  Rahter, I would hope `sqrt` can be added as a prinitive to Clarity (see section 3.4 of the V2 whitepaper)

The current design of the Clarity traits makes it quite impractical to implement exchanging multiple pairs with single contracts, so a contract will need to be custom written (easy to automate) and deployed for each pair.

I disagree with the formula showed in section 3.3.2 of the x-y-k paper (the `+ 1` should not be there), so unless someone can explain why it is there, I'm using my own formula.  The modeling I did in a spreadsheet was clearly showing that with small numbers, the formula would be way off...  Story to be continued.