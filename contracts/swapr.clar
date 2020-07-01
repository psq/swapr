;; (use-trait can-transfer-tokens
;;     'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token.can-transfer-tokens)
;; (use-trait y-token
;;     'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token.can-transfer-tokens)
;; TODO(psq): traits still have some issues, so will enable later.  One of the issue was fixed on 5/28, but there may be others, so try the fix when available in new builds

(use-trait can-transfer-tokens 'SP2TPZ623K5N2WYF1BWRMP5A93PSBWWADQGKJRJCS.token-transfer-trait.can-transfer-tokens)

(define-constant contract-owner 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR)
(define-constant no-liquidity-err (err u1))
(define-constant transfer-failed-err (err u2))
(define-constant not-owner-err (err u3))
(define-constant no-fee-to-address-err (err u4))
(define-constant invalid-pair-err (err u5))
(define-constant no-such-position-err (err u6))
(define-constant balance-too-low-err (err u7))
(define-constant too-many-pairs-err (err u8))
(define-constant pair-already-exists-err (err u9))

;; for future use, or debug
(define-constant e10-err (err u20))
(define-constant e11-err (err u21))
(define-constant e12-err (err u22))

;; ;; V1
;; ;; overall balance of x-token and y-token held by the contract
;; (define-data-var balance-x uint u0)
;; (define-data-var balance-y uint u0)

;; ;; fees collected so far, that have not been withdrawn (saves gas while doing exchanges)
;; (define-data-var fee-balance-x uint u0)
;; (define-data-var fee-balance-y uint u0)

;; ;; balances help by all the clients holding shares, this is equal to the sum of all the balances held in shares by each client
;; (define-data-var total-balances uint u0)
;; (define-map shares
;;   ((owner principal))
;;   ((balance uint))
;; )

;; ;; when set, enables the fee, and provides whene to send the fee when calling collect-fees
;; (define-data-var fee-to-address (optional principal) none)

;; V2
;; variables
;; (name) => (token-x, token-y)
;; (token-x, token-y) => (shares-total, balance-x, balance-y, fee-balance-x, fee-balance-y, fee-to-address)
;; (token-x, token-y, principal) => (shares)

(define-map pairs-map
  ((pair-name (buff 65)))
  ((token-x principal) (token-y principal))
)

(define-map pairs-data-map
  ((token-x principal) (token-y principal))
  ((shares-total uint) (balance-x uint) (balance-y uint) (fee-balance-x uint) (fee-balance-y uint) (fee-to-address (optional principal)))
)

(define-map shares-map
  ((token-x principal) (token-y principal) (owner principal))
  ((shares uint))
)

(define-data-var pairs-list (list 2000 (buff 65)) (list))


;; wrappers to get an owner's position
(define-private (shares-of (token-x principal) (token-y principal) (owner principal))
  (default-to u0
    (get shares
      (map-get? shares-map ((token-x token-x) (token-y token-y) (owner owner)))
    )
  )
)

;; get the number of shares of the pool for owner
(define-read-only (get-shares-of (token-x principal) (token-y principal) (owner principal))
  (ok (shares-of token-x token-y owner))
)

;; get the total number of shares in the pool
(define-read-only (get-shares (token-x principal) (token-y principal))
  (ok (get shares-total (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
)

(define-read-only (get-balances-of (token-x principal) (token-y principal) (owner principal))
  (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
    (let ((x (get balance-x pair)) (y (get balance-y pair)) (shares-total (get shares-total pair)) (shares (shares-of token-x token-y owner)))
      (if (> shares-total u0)
        (ok (list (/ (* x shares) shares-total) (/ (* y shares) shares-total)))  ;; less precision loss doing * first
        no-liquidity-err  ;; no liquidity
      )
    )
  )
)

(define-private (increase-shares (token-x principal) (token-y principal) (owner principal) (amount uint))
  (let ((shares (shares-of token-x token-y owner)))
    (map-set shares-map
      ((token-x token-x) (token-y token-y) (owner owner))
      ((shares (+ shares amount)))
    )
    (ok true)
  )
)

(define-private (decrease-shares (token-x principal) (token-y principal) (owner principal) (amount uint))
  (let ((shares (shares-of token-x token-y owner)))
    (if (< amount shares)
      (begin
        (map-set shares-map
          ((token-x token-x) (token-y token-y) (owner owner))
          ((shares (- shares amount)))
        )
        (ok true)
      )
      balance-too-low-err
    )
  )
)

;; get overall balances for the pair
(define-read-only (get-balances (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
    (ok (list (get balance-x pair) (get balance-y pair)))
  )
)

;; since we can't use a constant to refer to contract address, here what x and y are
;; (define-constant x-token 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token)
;; (define-constant y-token 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token)
(define-public (add-to-position (token-x-trait <can-transfer-tokens>) (token-y-trait <can-transfer-tokens>) (x uint) (y uint))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)) (contract-address (as-contract tx-sender)))
      ;; TODO(psq) check if x or y is 0, to calculate proper exchange rate unless shares-total is 0, which would be an error
      (if
        (and
          ;; TODO(psq): check that the amount transfered in matches the amount requested
          (is-ok (print (contract-call? token-x-trait transfer contract-address x)))
          (is-ok (print (contract-call? token-y-trait transfer contract-address y)))
        )
        (begin
          (map-set pairs-data-map ((token-x token-x) (token-y token-y))
            (
              (shares-total
                (if (is-eq (get shares-total pair) u0)
                  (begin
                    (increase-shares token-x token-y tx-sender x)
                    x
                  )
                  (let ((new-shares (* (/ x (get balance-x pair)) (get shares-total pair))))
                    (increase-shares token-x token-y tx-sender new-shares)
                    (+ new-shares (get shares-total pair))
                  )
                )
              )
              (balance-x (+ x (get balance-x pair)))
              (balance-y (+ y (get balance-y pair)))
              (fee-balance-x (get fee-balance-x pair))
              (fee-balance-y (get fee-balance-y pair))
              (fee-to-address (get fee-to-address pair))
            )
          )
          (ok true)
        )
        (begin
          transfer-failed-err
        )
      )
    )
  )
)

(define-read-only (get-pair-details (token-x principal) (token-y principal))
  (unwrap-panic (map-get? pairs-data-map ((token-x token-x) (token-y token-y))))
)

(define-read-only (get-pair-contracts (pair-name (buff 65)))
  (unwrap-panic (map-get? pairs-map ((pair-name pair-name))))
)

(define-read-only (get-pairs)
  (ok (map get-pair-contracts (var-get pairs-list)))
)

(define-public (create-pair (token-x-trait <can-transfer-tokens>) (token-y-trait <can-transfer-tokens>) (x uint) (y uint))
  ;; TOOD(psq): add creation checks, then create map before proceeding to add-to-position
  ;; check neither x,y or y,x exists
  (let ((name-x (unwrap-panic (contract-call? token-x-trait name))) (name-y (unwrap-panic (contract-call? token-y-trait name))))
    (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)) (pair-name (concat name-x (concat "-" name-y))))
      (if (and (is-none (map-get? pairs-data-map ((token-x token-x) (token-y token-y)))) (is-none (map-get? pairs-data-map ((token-x token-y) (token-y token-x)))))
        (begin
          (map-set pairs-data-map ((token-x token-x) (token-y token-y))
            (
              (shares-total u0)
              (balance-x u0)
              (balance-y u0)
              (fee-balance-x u0)
              (fee-balance-y u0)
              (fee-to-address none)
            )
          )
          (map-set pairs-map ((pair-name pair-name)) ((token-x token-x) (token-y token-y)))
          (var-set pairs-list (unwrap! (as-max-len? (append (var-get pairs-list) pair-name) u2000) too-many-pairs-err))
          (add-to-position token-x-trait token-y-trait x y)
        )
        pair-already-exists-err
      )
    )
  )
)



;; ;; reduce the amount of liquidity the sender provides to the pool
;; ;; to close, use u100
(define-public (reduce-position (token-x-trait <can-transfer-tokens>) (token-y-trait <can-transfer-tokens>) (percent uint))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
      (let ((shares (shares-of tx-sender)) (shares-total (get shares-total pair)) (contract-address (as-contract tx-sender)) (sender tx-sender))
        (let ((withdrawal (/ (* shares percent) u100)))
          (let ((withdrawal-x (/ (* withdrawal (get balance-x pair)) shares-total)) (withdrawal-y (/ (* withdrawal (get balance-y pair)) shares-total)))
            (if
              (and
                (<= percent u100)
                (is-ok (print (as-contract (contract-call? token-x-trait transfer sender withdrawal-x))))
                (is-ok (print (as-contract (contract-call? token-y-trait transfer sender withdrawal-y))))
              )
              (begin
                (decrease-shares token-x token-y tx-sender withdrawal)
                (map-set pairs-data-map ((token-x token-x) (token-y token-y))
                  (
                    (shares-total (- shares-total withdrawal))
                    (balance-x (- (get balance-x pair) withdrawal-x))
                    (balance-y (- (get balance-y pair) withdrawal-y))
                    (fee-balance-x (get fee-balance-x pair))
                    (fee-balance-y (get fee-balance-y pair))
                    (fee-to-address (get fee-to-address pair))
                  )
                )
                (ok (list withdrawal-x withdrawal-y))
              )
              transfer-failed-err
            )
          )
        )
      )
    )
  )
)

;; ;; exchange known dx of x-token for whatever dy of y-token based on current liquidity, returns (dx dy)
(define-public (swap-exact-x-for-y (token-x-trait <can-transfer-tokens>) (token-y-trait <can-transfer-tokens>) (dx uint))
  ;; calculate dy
  ;; calculate fee on dx
  ;; transfer
  ;; update balances
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
      (let
        (
          (contract-address (as-contract tx-sender))
          (sender tx-sender)
          (dy (/ (* u997 (get balance-y pair) dx) (+ (* u1000 (get balance-x pair)) (* u997 dx)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
          (fee (/ (* u5 dx) u10000)) ;; 5 bp
        )
        (print contract-address)
        (print (get balance-x pair))
        (print (get balance-y pair))
        (print dx)
        (print dy)
        (print fee)
        (if (and
          ;; TODO(psq): check that the amount transfered in matches the amount requested
          (is-ok (print (contract-call? token-x-trait transfer contract-address dx)))
          (is-ok (print (as-contract (contract-call? token-y-trait transfer sender dy))))
          )
          (begin
            (map-set pairs-data-map ((token-x token-x) (token-y token-y))
              (
                (shares-total (get shares-total pair))
                (balance-x
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (- (+ (get balance-x pair) dx) fee)  ;; add dx - fee
                    (+ (get balance-x pair) dx)  ;; add dx
                  )
                )
                (balance-y (- (get balance-y pair) dy))
                (fee-balance-x
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (+ fee (get fee-balance-x pair))
                    (get fee-balance-x pair)
                  )
                )
                (fee-balance-y (get fee-balance-y pair))
                (fee-to-address (get fee-to-address pair))
              )
            )
            (ok (list dx dy))
          )
          transfer-failed-err
        )
      )
    )
  )
)

;; ;; exchange whatever dx of x-token for known dy of y-token based on liquidity, returns (dx dy)
(define-public (swap-x-for-exact-y (token-x-trait <can-transfer-tokens>) (token-y-trait <can-transfer-tokens>) (dy uint))
  ;; calculate dx
  ;; calculate fee on dx
  ;; transfer
  ;; update balances
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
      (let
        (
          (contract-address (as-contract tx-sender))
          (sender tx-sender)
          (dx (/ (* u1000 (get balance-x pair) dy) (* u997 (- (get balance-y pair) dy)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
          (fee (/ (* (get balance-x pair) dy) (* u1994 (- (get balance-y pair) dy)))) ;; 5 bp
        )
        (print contract-address)
        (print (get balance-x pair))
        (print (get balance-y pair))
        (print dx)
        (print dy)
        (print fee)
        (if (and
          ;; TODO(psq): check that the amount transfered in matches the amount requested
          (is-ok (print (contract-call? token-x-trait transfer contract-address dx)))
          (is-ok (print (as-contract (contract-call? token-y-trait transfer sender dy))))
          )
          (begin
            (map-set pairs-data-map ((token-x token-x) (token-y token-y))
              (
                (shares-total (get shares-total pair))
                (balance-x
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (- (+ (get balance-x pair) dx) fee)  ;; add dx - fee
                    (+ (get balance-x pair) dx)  ;; add dx
                  )
                )
                (balance-y (- (get balance-y pair) dy))
                (fee-balance-x
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (+ fee (get fee-balance-x pair))
                    (get fee-balance-x pair)
                  )
                )
                (fee-balance-y (get fee-balance-y pair))
                (fee-to-address (get fee-to-address pair))
              )
            )
            (ok (list dx dy))
          )
          transfer-failed-err
        )
      )
    )
  )
)

;; ;; exchange known dy for whatever dx based on liquidity, returns (dx dy)
(define-public (swap-exact-y-for-x (token-x-trait <can-transfer-tokens>) (token-y-trait <can-transfer-tokens>) (dy uint))
  ;; calculate dx
  ;; calculate fee on dy
  ;; transfer
  ;; update balances
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
      (let
        (
          (contract-address (as-contract tx-sender))
          (sender tx-sender)
          (dx (/ (* u997 (get balance-x pair) dy) (+ (* u1000 (get balance-y pair)) (* u997 dy)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
          (fee (/ (* u5 dy) u10000)) ;; 5 bp
        )
        (print (get balance-x pair))
        (print (get balance-y pair))
        (print dx)
        (print dy)
        (print fee)
        (if (and
          ;; TODO(psq): check that the amount transfered in matches the amount requested
          (is-ok (print (as-contract (contract-call? token-x-trait transfer sender dx))))
          (is-ok (print (contract-call? token-y-trait transfer contract-address dy)))
          )
          (begin
            (map-set pairs-data-map ((token-x token-x) (token-y token-y))
              (
                (shares-total (get shares-total pair))
                (balance-x (- (get balance-x pair) dx)) ;; remove dx
                (balance-y
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (- (+ (get balance-y pair) dy) fee)  ;; add dy - fee
                    (+ (get balance-y pair) dy)  ;; add dy
                  )
                )
                (fee-balance-x (get fee-balance-x pair))
                (fee-balance-y
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (+ fee (get fee-balance-y pair))
                    (get fee-balance-y pair)
                  )
                )
                (fee-to-address (get fee-to-address pair))
              )
            )
            (ok (list dx dy))
          )
          transfer-failed-err
        )
      )
    )
  )
)

;; ;; exchange whatever dy for known dx based on liquidity, returns (dx dy)
(define-public (swap-y-for-exact-x (token-x-trait <can-transfer-tokens>) (token-y-trait <can-transfer-tokens>) (dx uint))
  ;; calculate dy
  ;; calculate fee on dy
  ;; transfer
  ;; update balances
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
      (let
        (
          (contract-address (as-contract tx-sender))
          (sender tx-sender)
          (dy (/ (* u1000 (get balance-y pair) dx) (* u997 (- (get balance-x pair) dx)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
          (fee (/ (* (get balance-y pair) dx) (* u1994 (- (get balance-x pair) dx)))) ;; 5 bp
        )
        (print contract-address)
        (print (get balance-x pair))
        (print (get balance-y pair))
        (print dx)
        (print dy)
        (print fee)
        (if (and
          ;; TODO(psq): check that the amount transfered in matches the amount requested
          (is-ok (print (as-contract (contract-call? token-x-trait transfer sender dx))))
          (is-ok (print (contract-call? token-y-trait transfer contract-address dy)))
          )
          (begin
            (map-set pairs-data-map ((token-x token-x) (token-y token-y))
              (
                (shares-total (get shares-total pair))
                (balance-x (- (get balance-x pair) dx)) ;; remove dx
                (balance-y
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (- (+ (get balance-y pair) dy) fee)  ;; add dy - fee
                    (+ (get balance-y pair) dy)  ;; add dy
                  )
                )
                (fee-balance-x (get fee-balance-x pair))
                (fee-balance-y
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (+ fee (get fee-balance-y pair))
                    (get fee-balance-y pair)
                  )
                )
                (fee-to-address (get fee-to-address pair))
              )
            )
            (ok (list dx dy))
          )
          transfer-failed-err
        )
      )
    )
  )
)

;; ;; activate the contract fee for swaps by setting the collection address, restricted to contract owner
(define-public (set-fee-to-address (token-x principal) (token-y principal) (address principal))
  (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
    (if (is-eq tx-sender contract-owner)
      (begin
        (map-set pairs-data-map ((token-x token-x) (token-y token-y))
          (
            (shares-total (get shares-total pair))
            (balance-x (get balance-x pair))
            (balance-y (get balance-y pair))
            (fee-balance-x (get fee-balance-y pair))
            (fee-balance-y (get fee-balance-y pair))
            (fee-to-address (some address))
          )
        )
        (ok true)
      )
      not-owner-err
    )
  )
)

;; ;; clear the contract fee addres
;; ;; TODO(psq): if there are any collected fees, prevent this from happening, as the fees can no longer be colllect with `collect-fees`
(define-public (reset-fee-to-address (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
    (if (is-eq tx-sender contract-owner)
      (begin
        (map-set pairs-data-map ((token-x token-x) (token-y token-y))
          (
            (shares-total (get shares-total pair))
            (balance-x (get balance-x pair))
            (balance-y (get balance-y pair))
            (fee-balance-x (get fee-balance-y pair))
            (fee-balance-y (get fee-balance-y pair))
            (fee-to-address none)
          )
        )
        (ok true)
      )
      not-owner-err
    )
  )
)

;; ;; get the current address used to collect a fee
(define-read-only (get-fee-to-address (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
    (ok (get fee-to-address pair))
  )
)

;; ;; get the amount of fees charged on x-token and y-token exchanges that have not been collected yet
(define-read-only (get-fees (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
    (ok (list (get fee-balance-x pair) (get fee-balance-y pair)))
  )
)

;; ;; send the collected fees the fee-to-address
(define-public (collect-fees (token-x-trait <can-transfer-tokens>) (token-y-trait <can-transfer-tokens>))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map ((token-x token-x) (token-y token-y))) invalid-pair-err)))
      (let ((address (unwrap! (get fee-to-address pair) no-fee-to-address-err)) (fee-x (get fee-balance-x pair)) (fee-y (get fee-balance-y pair)))
        (print fee-x)
        (print fee-y)
        (print (as-contract tx-sender))
        (print address)
        (if
          (and
            (or (is-eq fee-x u0) (is-ok (print (as-contract (contract-call? token-x-trait transfer address fee-x)))))
            (or (is-eq fee-y u0) (is-ok (print (as-contract (contract-call? token-y-trait transfer address fee-y)))))
          )
          (begin
            (map-set pairs-data-map ((token-x token-x) (token-y token-y))
              (
                (shares-total (get shares-total pair))
                (balance-x (get balance-x pair))
                (balance-y (get balance-y pair))
                (fee-balance-x u0)
                (fee-balance-y u0)
                (fee-to-address (get fee-to-address pair))
              )
            )
            (ok (list fee-x fee-y))
          )
          transfer-failed-err
        )
      )
    )
  )
)
