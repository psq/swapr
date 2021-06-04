(impl-trait 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.flash-loan-trait.flash-loan-trait)

(define-constant reimburse-err (err u110))

(define-data-var v1 uint u0)
(define-data-var v2 uint u0)

(define-public (setup-params (value-1 uint) (value-2 uint))
  (begin
    (var-set v1 value-1)
    (var-set v2 value-2)
    (ok u0)
  )
)

(define-public (use-loan (loan-id uint) (reimburse-to principal) (loan-amount uint) (fee uint))
  (begin
    (print "use-loan")
    (print {fee: fee, loan-amount: loan-amount, v1: (var-get v1), v2: (var-get v2), balance: (stx-get-balance (as-contract tx-sender)), reimburse-to: reimburse-to})

    ;; do something with new found riches here

    ;; repay loan and exit
    (unwrap! (as-contract (stx-transfer? (+ loan-amount fee) tx-sender reimburse-to)) reimburse-err)
    (ok u0)
  )
)
