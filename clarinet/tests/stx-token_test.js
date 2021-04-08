
import { Clarinet, Tx, types } from 'https://deno.land/x/clarinet@v0.3.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that <...> - stx-token",
    async fn(chain, accounts) {
        let block = chain.mineBlock([
            /*
             * Add transactions with:
             * Tx.contractCall(...)
            */
        ]);
        assertEquals(block.receipts.length, 0);
        assertEquals(block.height, 2);

        block = chain.mineBlock([
            /*
             * Add transactions with:
             * Tx.contractCall(...)
            */
        ]);
        assertEquals(block.receipts.length, 0);
        assertEquals(block.height, 3);

        console.log("get-total-supply", chain.callReadOnlyFn("stx-token", "get-total-supply", [], accounts[0].address));

    },
});
