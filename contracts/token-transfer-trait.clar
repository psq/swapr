(define-trait can-transfer-tokens
  (
    (transfer (principal uint) (response bool uint))
    (name () (response (buff 32) uint))
  )
)
