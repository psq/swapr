
(define-public (loan1)
  (begin
    ;; fund the load contract, including tx fees ;)
    (unwrap-panic (stx-transfer? u1006000000000 tx-sender 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.flash-loan))
    ;; fund the loan user with enough to pay loan fee and tx fees
    (unwrap-panic (stx-transfer? u6000000000 tx-sender 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.flash-loan-impl))

    (let ((amount u100000000000))
      (unwrap-panic (contract-call? .flash-loan-impl setup-params u123 u456))

      (contract-call? .flash-loan loan
        u1
        'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.flash-loan-impl
        amount
        'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.stx-token
      )
    )
  )
)
