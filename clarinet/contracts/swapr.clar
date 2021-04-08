(use-trait src20-token 'ST000000000000000000002AMW42H.sip-010.ft-trait)
(use-trait swapr-token 'ST000000000000000000002AMW42H.swapr-trait.swapr-trait)

(define-constant contract-owner 'ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA)
(define-constant no-liquidity-err (err u61))
(define-constant transfer-failed-err (err u62))
(define-constant not-owner-err (err u63))
(define-constant no-fee-to-address-err (err u64))
(define-constant invalid-pair-err (err u65))
(define-constant no-such-position-err (err u66))
(define-constant balance-too-low-err (err u67))
(define-constant too-many-pairs-err (err u68))
(define-constant pair-already-exists-err (err u69))
(define-constant wrong-token-err (err u70))
(define-constant too-much-slippage-err (err u71))

;; for future use, or debug
(define-constant e10-err (err u20))
(define-constant e11-err (err u21))
(define-constant e12-err (err u22))

(define-map pairs-map
  { pair-id: uint }
  {
    token-x: principal,
    token-y: principal,
  }
)

(define-map pairs-data-map
  {
    token-x: principal,
    token-y: principal,
  }
  {
    shares-total: uint,
    balance-x: uint,
    balance-y: uint,
    fee-balance-x: uint,
    fee-balance-y: uint,
    fee-to-address: (optional principal),
    swapr-token: principal,
    name: (string-ascii 32),
  }
)

;; TODO(psq): replace use of balance-x/balance-y with a call to balance-of(swapr) on the token itself, no write to do actually!!!  The transfer is the write, that's cool :)
;; I don't think so anymore?

;; (define-data-var pairs-list (list 2000 uint) (list))
(define-data-var pair-count uint u0)


(define-read-only (get-name (token-x-trait <src20-token>) (token-y-trait <src20-token>))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
      (ok (get name pair))
    )
  )
)

(define-public (get-symbol (token-x-trait <src20-token>) (token-y-trait <src20-token>))
  (ok (concat (unwrap-panic (as-max-len? (unwrap-panic (contract-call? token-x-trait get-symbol)) u15)) (concat "-" (unwrap-panic (as-max-len? (unwrap-panic (contract-call? token-y-trait get-symbol)) u15)))))
)

(define-read-only (get-total-supply (token-x-trait <src20-token>) (token-y-trait <src20-token>))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
      (ok (get shares-total pair))
    )
  )
)

;; get the total number of shares in the pool
(define-read-only (get-shares (token-x principal) (token-y principal))
  (ok (get shares-total (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
)

;; get overall balances for the pair
(define-public (get-balances (token-x-trait <src20-token>) (token-y-trait <src20-token>))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
      (ok (list (get balance-x pair) (get balance-y pair)))
    )
  )
)

;; since we can't use a constant to refer to contract address, here what x and y are
;; (define-constant x-token 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token)
;; (define-constant y-token 'SP1QR3RAGH3GEME9WV7XB0TZCX6D5MNDQP97D35EH.my-token)
(define-public (add-to-position (token-x-trait <src20-token>) (token-y-trait <src20-token>) (token-swapr-trait <swapr-token>) (x uint) (y uint))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)) (contract-address (as-contract tx-sender)) (recipient-address tx-sender) (balance-x (get balance-x pair)) (balance-y (get balance-y pair)))
      ;; TODO(psq) check if x or y is 0, to calculate proper exchange rate unless shares-total is 0, which would be an error
      (if
        (and
          ;; TODO(psq): check that the amount transfered in matches the amount requested
          (is-ok (contract-call? token-x-trait transfer x tx-sender contract-address))
          (is-ok (contract-call? token-y-trait transfer y tx-sender contract-address))
        )
        (begin
          (print "calculate new-shares")
          (let ((new-shares (if (is-eq (print (get shares-total pair)) u0)
                  (let ((shares (sqrti (* x y))))
                    ;; (increase-shares token-x token-y tx-sender shares)
                    shares
                  )
                  (let ((shares (/ (* (print x) (print (get shares-total pair))) balance-x)))
                    ;; (increase-shares token-x token-y tx-sender shares)
                    shares
                  )
                )))
            (map-set pairs-data-map { token-x: token-x, token-y: token-y }
              {
                shares-total: (+ new-shares (get shares-total pair)),
                balance-x: (+ balance-x x),
                balance-y: (+ balance-y y),
                fee-balance-x: (get fee-balance-x pair),
                fee-balance-y: (get fee-balance-y pair),
                fee-to-address: (get fee-to-address pair),
                name: (get name pair),
                swapr-token: (get swapr-token pair),
              }
            )
            (print "token-swapr-trait.mint params")
            (print x)
            (print y)
            (print recipient-address)
            (print new-shares)
            (print (contract-call? token-swapr-trait mint recipient-address new-shares))
          )
        )
        (begin
          transfer-failed-err
        )
      )
    )
  )
)

(define-read-only (get-pair-details (token-x principal) (token-y principal))
  (unwrap-panic (map-get? pairs-data-map { token-x: token-x, token-y: token-y }))
)

(define-read-only (get-pair-contracts (pair-id uint))
  (unwrap-panic (map-get? pairs-map { pair-id: pair-id }))
)

(define-read-only (get-pair-count)
  (ok (var-get pair-count))
)

;; (define-read-only (get-pairs)
;;   (ok (map get-pair-contracts (var-get pairs-list)))
;; )

(define-public (create-pair (token-x-trait <src20-token>) (token-y-trait <src20-token>) (token-swapr-trait <swapr-token>) (pair-name (string-ascii 32)) (x uint) (y uint))
  ;; TOOD(psq): add creation checks, then create map before proceeding to add-to-position
  ;; check neither x,y or y,x exists`
  (let ((name-x (unwrap-panic (contract-call? token-x-trait get-name))) (name-y (unwrap-panic (contract-call? token-y-trait get-name))))
    (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)) (pair-id (+ (var-get pair-count) u1)))
      (if (and (is-none (map-get? pairs-data-map { token-x: token-x, token-y: token-y })) (is-none (map-get? pairs-data-map { token-x: token-y, token-y: token-x })))
        (begin
          (map-set pairs-data-map { token-x: token-x, token-y: token-y }
            {
              shares-total: u0,
              balance-x: u0,
              balance-y: u0,
              fee-balance-x: u0,
              fee-balance-y: u0,
              fee-to-address: none,
              swapr-token: (contract-of token-swapr-trait),
              name: pair-name,
            }
          )
          (map-set pairs-map { pair-id: pair-id } { token-x: token-x, token-y: token-y })
          ;; (var-set pairs-list (unwrap! (as-max-len? (append (var-get pairs-list) pair-id) u2000) too-many-pairs-err))
          (var-set pair-count pair-id)
          (add-to-position token-x-trait token-y-trait token-swapr-trait x y)
        )
        pair-already-exists-err
      )
    )
  )
)



;; ;; reduce the amount of liquidity the sender provides to the pool
;; ;; to close, use u100
(define-public (reduce-position (token-x-trait <src20-token>) (token-y-trait <src20-token>) (token-swapr-trait <swapr-token>) (percent uint))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)) (balance-x (get balance-x pair)) (balance-y (get balance-y pair)))
      (let ((shares (unwrap-panic (contract-call? token-swapr-trait get-balance-of tx-sender))) (shares-total (get shares-total pair)) (contract-address (as-contract tx-sender)) (sender tx-sender))
        (let ((withdrawal (/ (* shares percent) u100)))
          (let ((withdrawal-x (/ (* withdrawal balance-x) shares-total)) (withdrawal-y (/ (* withdrawal balance-y) shares-total)))
            (if
              (and
                (<= percent u100)
                (is-ok (as-contract (contract-call? token-x-trait transfer withdrawal-x contract-address sender)))
                (is-ok (as-contract (contract-call? token-y-trait transfer withdrawal-y contract-address sender)))
              )
              (begin
                ;; (unwrap-panic (decrease-shares token-x token-y tx-sender withdrawal)) ;; should never fail, you know...
                (map-set pairs-data-map { token-x: token-x, token-y: token-y }
                  {
                    shares-total: (- shares-total withdrawal),
                    balance-x: (- (get balance-x pair) withdrawal-x),
                    balance-y: (- (get balance-y pair) withdrawal-y),
                    fee-balance-x: (get fee-balance-x pair),
                    fee-balance-y: (get fee-balance-y pair),
                    fee-to-address: (get fee-to-address pair),
                    name: (get name pair),
                    swapr-token: (get swapr-token pair),
                  }
                )
                ;; TODO(psq): use burn
                (unwrap-panic (contract-call? token-swapr-trait transfer withdrawal tx-sender contract-address))  ;; transfer back to swapr, wish there was a burn instead...
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

;; exchange known dx of x-token for whatever dy of y-token based on current liquidity, returns (dx dy)
;; the swap will not happen if can't get at least min-dy back
(define-public (swap-x-for-y (token-x-trait <src20-token>) (token-y-trait <src20-token>) (dx uint) (min-dy uint))
  ;; calculate dy
  ;; calculate fee on dx
  ;; transfer
  ;; update balances
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)) (balance-x (get balance-x pair)) (balance-y (get balance-y pair)))
      (let
        (
          (contract-address (as-contract tx-sender))
          (sender tx-sender)
          (dy (/ (* u997 balance-x dx) (+ (* u1000 balance-y) (* u997 dx)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
          (fee (/ (* u5 dx) u10000)) ;; 5 bp
        )
        (if (and
          ;; TODO(psq): check that the amount transfered in matches the amount requested
            (is-ok (contract-call? token-x-trait transfer dx sender contract-address))
            (is-ok (as-contract (contract-call? token-y-trait transfer dy contract-address sender)))
          )
          (begin
            (map-set pairs-data-map { token-x: token-x, token-y: token-y }
              {
                shares-total: (get shares-total pair),
                balance-x: (+ (get balance-x pair) dx),
                balance-y: (- (get balance-y pair) dy),
                fee-balance-x:
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (+ fee (get fee-balance-x pair))
                    (get fee-balance-x pair)
                  )
                ,
                fee-balance-y: (get fee-balance-y pair),
                fee-to-address: (get fee-to-address pair),
                name: (get name pair),
                swapr-token: (get swapr-token pair),
              }
            )
            (ok (list dx dy))
          )
          transfer-failed-err
        )
      )
    )
  )
)

;; exchange known dy for whatever dx based on liquidity, returns (dx dy)
;; the swap will not happen if can't get at least min-dx back
(define-public (swap-y-for-x (token-x-trait <src20-token>) (token-y-trait <src20-token>) (dy uint) (min-dx uint))
  ;; calculate dx
  ;; calculate fee on dy
  ;; transfer
  ;; update balances
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)))
    (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)) (balance-x (get balance-x pair)) (balance-y (get balance-y pair)))
      (let
        (
          (contract-address (as-contract tx-sender))
          (sender tx-sender)
          ;; check formula, vs x-for-y???
          (dx (/ (* u997 balance-x dy) (+ (* u1000 balance-y) (* u997 dy)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
          (fee (/ (* u5 dy) u10000)) ;; 5 bp
        )
        (if (and
          ;; TODO(psq): check that the amount transfered in matches the amount requested
          (is-ok (as-contract (contract-call? token-x-trait transfer dx contract-address sender)))
          (is-ok (contract-call? token-y-trait transfer dy sender contract-address))
          )
          (begin
            (map-set pairs-data-map { token-x: token-x, token-y: token-y }
              {
                shares-total: (get shares-total pair),
                balance-x: (- (get balance-x pair) dx),
                balance-y: (+ (get balance-y pair) dy),
                fee-balance-x: (get fee-balance-x pair),
                fee-balance-y:
                  (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
                    (+ fee (get fee-balance-y pair))
                    (get fee-balance-y pair)
                  )
                ,
                fee-to-address: (get fee-to-address pair),
                name: (get name pair),
                swapr-token: (get swapr-token pair),
              }
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
  (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
    (if (is-eq tx-sender contract-owner)
      (begin
        (map-set pairs-data-map { token-x: token-x, token-y: token-y }
          {
            shares-total: (get shares-total pair),
            balance-x: (get balance-y pair),
            balance-y: (get balance-y pair),
            fee-balance-x: (get fee-balance-y pair),
            fee-balance-y: (get fee-balance-y pair),
            fee-to-address: (some address),
            name: (get name pair),
            swapr-token: (get swapr-token pair),
          }
        )
        (ok true)
      )
      not-owner-err
    )
  )
)

;; ;; clear the contract fee addres
;; ;; TODO(psq): if there are any collected fees, prevent this from happening, as the fees can no longer be collect with `collect-fees`
(define-public (reset-fee-to-address (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
    (if (is-eq tx-sender contract-owner)
      (begin
        (map-set pairs-data-map { token-x: token-x, token-y: token-y }
          {
            shares-total: (get shares-total pair),
            balance-x: (get balance-x pair),
            balance-y: (get balance-y pair),
            fee-balance-x: (get fee-balance-y pair),
            fee-balance-y: (get fee-balance-y pair),
            fee-to-address: none,
            name: (get name pair),
            swapr-token: (get swapr-token pair),
          }
        )
        (ok true)
      )
      not-owner-err
    )
  )
)

;; ;; get the current address used to collect a fee
(define-read-only (get-fee-to-address (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
    (ok (get fee-to-address pair))
  )
)

;; ;; get the amount of fees charged on x-token and y-token exchanges that have not been collected yet
(define-read-only (get-fees (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
    (ok (list (get fee-balance-x pair) (get fee-balance-y pair)))
  )
)

;; ;; send the collected fees the fee-to-address
(define-public (collect-fees (token-x-trait <src20-token>) (token-y-trait <src20-token>))
  (let ((token-x (contract-of token-x-trait)) (token-y (contract-of token-y-trait)) (contract-address (as-contract tx-sender)))
    (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
      (let ((address (unwrap! (get fee-to-address pair) no-fee-to-address-err)) (fee-x (get fee-balance-x pair)) (fee-y (get fee-balance-y pair)))
        (if
          (and
            (or (is-eq fee-x u0) (is-ok (as-contract (contract-call? token-x-trait transfer fee-x contract-address address))))
            (or (is-eq fee-y u0) (is-ok (as-contract (contract-call? token-y-trait transfer fee-y contract-address address))))
          )
          (begin
            (map-set pairs-data-map { token-x: token-x, token-y: token-y }
              {
                shares-total: (get shares-total pair),
                balance-x: (get balance-x pair),
                balance-y: (get balance-y pair),
                fee-balance-x: u0,
                fee-balance-y: u0,
                fee-to-address: (get fee-to-address pair),
                name: (get name pair),
                swapr-token: (get swapr-token pair),
              }
            )
            (ok (list fee-x fee-y))
          )
          transfer-failed-err
        )
      )
    )
  )
)
