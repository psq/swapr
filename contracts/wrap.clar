
(impl-trait 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.token-transfer-trait.can-transfer-tokens)

(define-data-var total-supply uint u0)

(define-fungible-token wrapped-token)

;; Total number of tokens in existence.
(define-read-only (get-total-supply)
  (var-get total-supply)
)

;; transfer amount STX and return wrapped fungible token
;; mints new token
(define-public (wrap (amount uint))
  (let ((contract-address (as-contract tx-sender)))
    (if
      (and
        (is-ok (stx-transfer? amount tx-sender contract-address))
        (is-ok (ft-mint? wrapped-token amount tx-sender))
      )
      (begin
        (var-set total-supply (+ (var-get total-supply) amount))
        (ok true)
      )
      (err false)
    )
  )
)

;; unwraps wrapped STX token
;; burns unwrapped token (well, can't burn yet, so will forever increase, good thing there is no limit)
(define-public (unwrap (amount uint))
  (let ((contract-address (as-contract tx-sender)))
    (if
      (and
        (<= amount (var-get total-supply))
        ;; this is where burn would be more appropriate, as trying to reuse tokens or mint
        ;; would make the code more complex for little benefit
        (is-ok (ft-transfer? wrapped-token amount tx-sender contract-address))
        (is-ok (stx-transfer? amount contract-address tx-sender))
      )
      (begin
        (var-set total-supply (- (var-get total-supply) amount))
        (ok true)
      )
      (err false)
    )
  )
)

;; Transfers tokens to a specified principal.
(define-public (transfer (recipient principal) (amount uint))
  (ft-transfer? wrapped-token amount tx-sender recipient)
)

