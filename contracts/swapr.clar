(use-trait can-transfer-tokens
    'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.token-transfer-trait.can-transfer-tokens)

;; (define-constant x-cont <can-transfer-tokens>)

(define-constant contract-owner 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR)
(define-constant no-liquidity-err (err u1))
(define-constant transfer-failed-err (err u2))
(define-constant not-owner-err (err u2))


;; (define-data-var x-contract principal 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token)  ;; can't init to `none`, so...
;; (define-data-var y-contract principal 'SP138CBPVKYBQQ480EZXJQK89HCHY32XBQ0T4BCCD)
(define-data-var x-balance uint u0)
(define-data-var y-balance uint u0)
(define-data-var total-balances uint u0)
;; (define-fungible-token position)
(define-map positions
  ((owner principal))
  ((balance uint))
)
;; only to store wether the contract should capture a 5 bp fee, and where to send the fee
(define-map fee-to
  ((key uint)) ;; only valid value is u0
  ((address principal))
)

(define-private (position-of (owner principal))
  (default-to u0
    (get balance
      (map-get? positions ((owner owner)))
    )
  )
)

(define-read-only (get-position-of (owner principal))
  (ok (position-of owner))
)

(define-read-only (get-positions)
  (ok (var-get total-balances))
)

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


;; x: 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token
;; y: 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token

;; how much of each token to buy, unless this is the first addition
;; this will respect current ratio
;; use 0 for x or y to get perfect ratio
(define-public (add-to-position (x uint) (y uint))
  (let ((contract-address (as-contract tx-sender)))
    (if
      (and
        (is-ok (print (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer contract-address x)))
        (is-ok (print (contract-call? 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token transfer contract-address y)))
      )
      (begin
        ;; (print "22222222")
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
        ;; (print "44444444")
        (ok true)
      )
      (begin
        ;; (print "33333333")
        transfer-failed-err
      )
    )
  )
)

;; to close, use 100
(define-public (reduce-position (percent uint))
  (let ((position (position-of tx-sender)) (balances (var-get total-balances)) (contract-address (as-contract tx-sender)) (sender tx-sender))
    (let ((withdrawal (/ (* position percent) u100)))
      (let ((remaing-position (- position withdrawal)) (withdrawal-x (/ (* withdrawal (var-get x-balance)) balances)) (withdrawal-y (/ (* withdrawal (var-get y-balance)) balances)))
        (print withdrawal)
        (print balances)
        (print (var-get x-balance))
        (print (var-get y-balance))
        (print withdrawal-x)
        (print withdrawal-y)

        (if
          (and
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

;; ;; get position for owner
;; (define-read-only (get-position (owner principal))
;;   1
;; )

;; get overall balances for the pair
(define-read-only (get-balances)
  (ok (list (var-get x-balance) (var-get y-balance)))
)

;; exchange known x for whatever y based on liquidity, returns y
(define-public (swap-exact-x-for-y (x uint))
  (ok u0)
)

;; exchange whatever x for known y based on liquidity, returns x
(define-public (swap-x-for-exact-y (y uint))
  (ok u0)
)

;; exchange known y for whatever x based on liquidity, returns x
(define-public (swap-exact-y-for-x (y uint))
  (ok u0)
)

;; exchange whatever y for known x based on liquidity, returns y
(define-public (swap-y-for-exact-x (x uint))
  (ok u0)
)

;; set the contract fee for swaps, restricted to contract owner
(define-public (set-fee-to-address (address principal))
  (begin
    (if (is-eq tx-sender contract-owner)
      (begin
        (map-set fee-to (tuple (key u0)) (tuple (address address)))
        (ok true)
      )
      not-owner-err
    )
  )
)

(define-public (get-fee-to-address)
  (begin
    (ok (get address (map-get? fee-to ((key u0)))))
  )
)



;; init the tokens, restricted to contract owner, callable only once
;; (define-public (init (x <can-transfer-tokens>) (y <can-transfer-tokens>))
;;   (ok u0)
;; )

;; (init 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token)

;; (define-public (init (x <can-transfer-tokens>))
;;   (ok u0)
;; )

;; ;; (init 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token)
;; (init 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token)
