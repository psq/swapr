(define-constant ERR-UNAUTHORIZED u1)
(define-constant ERR-YOU-POOR u2)
(define-fungible-token wrapped-nthng)
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-constant contract-creator tx-sender)
(impl-trait 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.sip-010.ft-trait)

(define-public (donate (amount uint))
    (stx-transfer? amount tx-sender contract-creator))

(define-public (wrap-nthng (amount uint))
    (if
        (is-ok
            (contract-call? .micro-nthng transfer (as-contract tx-sender) amount))
        (begin
            (ft-mint?
                wrapped-nthng amount tx-sender)
        )
        (err ERR-YOU-POOR)))


(define-public (unwrap (amount uint))
    (if
        (is-ok (ft-burn? wrapped-nthng amount tx-sender))
            (let ((unwrapper tx-sender))
                (as-contract (contract-call? .micro-nthng transfer unwrapper amount)))
        (err ERR-YOU-POOR)
    ))

;;;;;;;;;;;;;;;;;;;;; SIP 010 ;;;;;;;;;;;;;;;;;;;;;;

(define-public (transfer (amount uint) (from principal) (to principal))
    (begin
        (asserts! (is-eq from tx-sender)
            (err ERR-UNAUTHORIZED))

        (ft-transfer? wrapped-nthng amount from to)
    )
)

(define-read-only (get-name)
    (ok "Wrapped Nothing"))

(define-read-only (get-symbol)
    (ok "WMNO"))

(define-read-only (get-decimals)
    (ok u0))

(define-read-only (get-balance-of (user principal))
    (ok (ft-get-balance wrapped-nthng user)))

(define-read-only (get-total-supply)
    (ok (ft-get-supply wrapped-nthng)))

(define-public (set-token-uri (value (string-utf8 256)))
    (if
        (is-eq tx-sender contract-creator)
            (ok (var-set token-uri (some value)))
        (err ERR-UNAUTHORIZED)))

(define-read-only (get-token-uri)
    (ok (var-get token-uri)))

;; send-many\

(define-public (send-nothing (amount uint) (to principal))
    (let ((transfer-ok (try! (transfer amount tx-sender to))))
    (ok transfer-ok)))

(define-private (send-nothing-unwrap (recipient { to: principal, amount: uint }))
    (send-nothing
        (get amount recipient)
        (get to recipient)))

(define-private (check-err  (result (response bool uint))
                            (prior (response bool uint)))
    (match prior ok-value result
                err-value (err err-value)))

(define-public (send-many (recipients (list 200 { to: principal, amount: uint })))
    (fold check-err
        (map send-nothing-unwrap recipients)
        (ok true)))


(define-constant wrap-amount u50000000000000)
;; TODO(psq): doesn't work, probably because not funding the right thing, but ok because just minting will provide balance
;; (if
;;     (is-ok (contract-call? .micro-nthng transfer 'ST2SVRCJJD90TER037VCSAFA781HQTCPFK9YRA6J5 wrap-amount))
;;     (ft-mint? wrapped-nthng wrap-amount 'ST2SVRCJJD90TER037VCSAFA781HQTCPFK9YRA6J5)
;;     (err ERR-YOU-POOR)
;; )

(ft-mint? wrapped-nthng wrap-amount 'ST2SVRCJJD90TER037VCSAFA781HQTCPFK9YRA6J5)
(set-token-uri u"https://swapr.finance/tokens/wrapped-nothing.json")
