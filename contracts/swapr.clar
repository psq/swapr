;; (use-trait can-transfer-tokens
;;     'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token.can-transfer-tokens)
;; (use-trait y-token
;;     'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token.can-transfer-tokens)

(define-constant contract-owner 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR)
(define-constant no-liquidity-err (err u1))
(define-constant transfer-failed-err (err u2))
(define-constant not-owner-err (err u3))
(define-constant no-fee-to-address-err (err u4))
;; for future use, or debug
(define-constant e10-err (err u10))
(define-constant e11-err (err u11))
(define-constant e12-err (err u12))

;; overall balance of x-token and y-token held by the contract
(define-data-var x-balance uint u0)
(define-data-var y-balance uint u0)

;; fees collected so far, that have not been withdrawn (saves gas while doing exchanges)
(define-data-var fee-x-balance uint u0)
(define-data-var fee-y-balance uint u0)

;; balances help by all the clients holding positions, this is equal to the sum of all the balances held in positions by each client
(define-data-var total-balances uint u0)
(define-map positions
  ((owner principal))
  ((balance uint))
)

;; when set, enables the fee, and provides whene to send the fee when calling collect-fees
(define-data-var fee-to-address (optional principal) none)


;; wrappers to get an owner's position
(define-private (position-of (owner principal))
  (default-to u0
    (get balance
      (map-get? positions ((owner owner)))
    )
  )
)

;; get the number of shares of the pool for owner
(define-read-only (get-position-of (owner principal))
  (ok (position-of owner))
)

;; get the total number of shares in the pool
(define-read-only (get-positions)
  (ok (var-get total-balances))
)

;; get the balances owner provided as liquidity, plus fees based on current exchange rate
(define-read-only (get-balances-of (owner principal))
  (let ((x (var-get x-balance)) (y (var-get y-balance)) (balance (var-get total-balances)) (share (position-of owner)))
    (if (> balance u0)
      (ok (list (/ (* x share) balance) (/ (* y share) balance)))  ;; less precision loss doing * first
      no-liquidity-err  ;; no liquidity
    )
  )
)

;; Decrease position of a specified spender.
(define-private (decrease-position (owner principal) (amount uint))
  (let ((balance (position-of owner)))
    (if (or (> amount balance) (<= amount u0))
      true
      (begin
        (map-set positions
          ((owner owner))
          ((balance (- balance amount))))
        true)
    )
  )
)

;; Internal - Increase position of a specified spender.
(define-private (increase-position (owner principal) (amount uint))
  (let ((balance (position-of owner)))
    (if (<= amount u0)
      false
      (begin
        (print (tuple (owner owner)))
        (print (map-set positions
          ((owner owner))
          ((balance (+ balance amount)))))
        true)
    )
  )
)

;; get overall balances for the pair
(define-read-only (get-balances)
  (ok (list (var-get x-balance) (var-get y-balance)))
)

;; since we can't use a constant to refer to contract address, here what x and y are
;; (define-constant x-token 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token)
;; (define-constant y-token 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token)

;; how much of each token to buy, unless this is the first addition
;; TODO(psq): use 0 for x or y to get perfect ratio based on current exchange rate, otherwise this will upset the balance
;; although that would be an opportunity to arbitrage that out for someone
(define-public (add-to-position (x uint) (y uint))
  (let ((contract-address (as-contract tx-sender)))
    (if
      (and
        (is-ok (print (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer contract-address x)))
        (is-ok (print (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token transfer contract-address y)))
      )
      (begin
        (if (is-eq (var-get total-balances) u0)
          (begin
            (increase-position tx-sender x)
            (var-set total-balances x)
          )
          (let ((new-shares (* (/ x (var-get x-balance)) (var-get total-balances))))
            (increase-position tx-sender new-shares)
            (var-set total-balances (+ new-shares (var-get total-balances)))
          )
        )
        (var-set x-balance (+ x (var-get x-balance)))
        (var-set y-balance (+ y (var-get y-balance)))
        (ok true)
      )
      (begin
        transfer-failed-err
      )
    )
  )
)

;; reduce the amount of liquidity the sender provides to the pool
;; to close, use u100
(define-public (reduce-position (percent uint))
  (let ((position (position-of tx-sender)) (balances (var-get total-balances)) (contract-address (as-contract tx-sender)) (sender tx-sender))
    (let ((withdrawal (/ (* position percent) u100)))
      (let ((remaing-position (- position withdrawal)) (withdrawal-x (/ (* withdrawal (var-get x-balance)) balances)) (withdrawal-y (/ (* withdrawal (var-get y-balance)) balances)))
        (if
          (and
            (<= percent u100)
            (is-ok (print (as-contract (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer sender withdrawal-x))))
            (is-ok (print (as-contract (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token transfer sender withdrawal-y))))
          )
          (begin
            (decrease-position tx-sender withdrawal)
            (var-set total-balances (- balances withdrawal))
            (var-set x-balance (- (var-get x-balance) withdrawal-x))
            (var-set y-balance (- (var-get y-balance) withdrawal-y))
            (ok (list withdrawal-x withdrawal-y))
          )
          (begin
            (err transfer-failed-err)
          )
        )
      )
    )
  )
)

;; exchange known dx of x-token for whatever dy of y-token based on current liquidity, returns (dx dy)
(define-public (swap-exact-x-for-y (dx uint))
  ;; calculate dy
  ;; calculate fee on dx
  ;; transfer
  ;; update balances
  (let
    (
      (contract-address (as-contract tx-sender))
      (sender tx-sender)
      (dy (/ (* u997 (var-get y-balance) dx) (+ (* u1000 (var-get x-balance)) (* u997 dx)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
      (fee (/ (* u5 dx) u10000)) ;; 5 bp
    )
    (print contract-address)
    (print (var-get x-balance))
    (print (var-get y-balance))
    (print dx)
    (print dy)
    (print fee)
    (if (and
      (is-ok (print (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer contract-address dx)))
      (is-ok (print (as-contract (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token transfer sender dy))))
      )
      (begin
        (var-set x-balance (+ (var-get x-balance) dx))  ;; add dx
        (var-set y-balance (- (var-get y-balance) dy))  ;; remove dy
        (if (is-some (var-get fee-to-address))  ;; only collect fee when fee-to-address is set
          (var-set fee-x-balance (+ fee (var-get fee-x-balance)))
          false  ;; why is the else `expr` required
        )
        (ok (list dx dy))
      )
      transfer-failed-err
    )
  )
)

;; exchange whatever dx of x-token for known dy of y-token based on liquidity, returns (dx dy)
(define-public (swap-x-for-exact-y (dy uint))
  ;; calculate dx
  ;; calculate fee on dx
  ;; transfer
  ;; update balances
  (let
    (
      (contract-address (as-contract tx-sender))
      (sender tx-sender)
      (dx (/ (* u1000 (var-get x-balance) dy) (* u997 (- (var-get y-balance) dy)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
      (fee (/ (* (var-get x-balance) dy) (* u1994 (- (var-get y-balance) dy)))) ;; 5 bp
    )
    (print contract-address)
    (print (var-get x-balance))
    (print (var-get y-balance))
    (print dx)
    (print dy)
    (print fee)
    (if (and
      (is-ok (print (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer contract-address dx)))
      (is-ok (print (as-contract (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token transfer sender dy))))
      )
      (begin
        (var-set x-balance (+ (var-get x-balance) dx))  ;; add dx
        (var-set y-balance (- (var-get y-balance) dy))  ;; remove dy
        (if (is-some (var-get fee-to-address))  ;; only collect fee when fee-to-address is set
          (var-set fee-x-balance (+ fee (var-get fee-x-balance)))
          false  ;; why is the else `expr` required
        )
        (ok (list dx dy))
      )
      transfer-failed-err
    )
  )
)

;; exchange known dy for whatever dx based on liquidity, returns (dx dy)
(define-public (swap-exact-y-for-x (dy uint))
  ;; calculate dx
  ;; calculate fee on dy
  ;; transfer
  ;; update balances
  (let
    (
      (contract-address (as-contract tx-sender))
      (sender tx-sender)
      (dx (/ (* u997 (var-get x-balance) dy) (+ (* u1000 (var-get y-balance)) (* u997 dy)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
      (fee (/ (* u5 dy) u10000)) ;; 5 bp
    )
    (print (var-get x-balance))
    (print (var-get y-balance))
    (print dx)
    (print dy)
    (print fee)
    (if (and
      (is-ok (print (as-contract (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer sender dx))))
      (is-ok (print (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token transfer contract-address dy)))
      )
      (begin
        (var-set x-balance (- (var-get x-balance) dx))  ;; remove dx
        (var-set y-balance (+ (var-get y-balance) dy))  ;; add dy
        (if (is-some (var-get fee-to-address))  ;; only collect fee when fee-to-address is set
          (var-set fee-y-balance (+ fee (var-get fee-y-balance)))
          false
        )
        (ok (list dx dy))
      )
      transfer-failed-err
    )
  )
)

;; exchange whatever dy for known dx based on liquidity, returns (dx dy)
(define-public (swap-y-for-exact-x (dx uint))
  ;; calculate dy
  ;; calculate fee on dy
  ;; transfer
  ;; update balances
  (let
    (
      (contract-address (as-contract tx-sender))
      (sender tx-sender)
      (dy (/ (* u1000 (var-get y-balance) dx) (* u997 (- (var-get x-balance) dx)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
      (fee (/ (* (var-get y-balance) dx) (* u1994 (- (var-get x-balance) dx)))) ;; 5 bp
    )
    (print contract-address)
    (print (var-get x-balance))
    (print (var-get y-balance))
    (print dx)
    (print dy)
    (print fee)
    (if (and
      (is-ok (print (as-contract (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer sender dx))))
      (is-ok (print (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token transfer contract-address dy)))
      )
      (begin
        (var-set x-balance (- (var-get x-balance) dx))  ;; add dx
        (var-set y-balance (+ (var-get y-balance) dy))  ;; remove dy
        (if (is-some (var-get fee-to-address))  ;; only collect fee when fee-to-address is set
          (var-set fee-y-balance (+ fee (var-get fee-y-balance)))
          false  ;; why is the else `expr` required
        )
        (ok (list dx dy))
      )
      transfer-failed-err
    )
  )
)

;; activate the contract fee for swaps by setting the collection address, restricted to contract owner
(define-public (set-fee-to-address (address principal))
  (begin
    (if (is-eq tx-sender contract-owner)
      (begin
        (var-set fee-to-address (some address))
        (ok true)
      )
      not-owner-err
    )
  )
)

;; clear the contract fee for swaps by resetting the collection address
(define-public (reset-fee-to-address)
  (begin
    (if (is-eq tx-sender contract-owner)
      (begin
        (var-set fee-to-address none)
        (ok true)
      )
      not-owner-err
    )
  )
)

;; get the current address used to collect a fee
(define-read-only (get-fee-to-address)
  (ok (var-get fee-to-address))
)

;; get the current address used to collect a fee
(define-read-only (get-fees)
  (begin
    (ok (list (var-get fee-x-balance) (var-get fee-y-balance)))
  )
)

;; drain the collected fees and send to the fee-to-address
(define-public (collect-fees)
  (let ((address (unwrap! (var-get fee-to-address) no-fee-to-address-err)) (fee-x (var-get fee-x-balance)) (fee-y (var-get fee-y-balance)))
    (print fee-x)
    (print fee-y)
    (print (as-contract tx-sender))
    (print (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token balance-of (as-contract tx-sender)))
    (print (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token balance-of (as-contract tx-sender)))
    (print address)
    (if
      (and
        (or (is-eq fee-x u0) (is-ok (print (as-contract (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer address fee-x)))))
        (or (is-eq fee-y u0) (is-ok (print (as-contract (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token transfer address fee-y)))))
      )
      (begin
        (var-set fee-x-balance u0)
        (var-set fee-y-balance u0)
        (ok (list fee-x fee-y))
      )
      transfer-failed-err
    )
  )
)
