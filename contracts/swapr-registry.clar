;; this contract stores all deployed pairs
;; makes it easy the load from a serverless app

;; possible errors
(define-constant pair-already-exists-err (err u1))
(define-constant token-already-exists-err (err u2))
(define-constant token-unknown-err (err u3))
(define-constant fatal-err (err u4))
(define-constant too-many-pairs-err (err u5))
(define-constant too-many-tokens-err (err u6))

;; (define-constant max-name-len 32)  can't be used with (buff max-name-len)
;; (define-constant max-list-len 2200)  can't be used either

;; locate pair details from pair contract
(define-map pair-by-pair-contract
  ((contract-address principal))
  ((name-x (buff 32)) (token-x principal) (name-y (buff 32)) (token-y principal))
)

;; locate pair details from both token contracts (need 2 lookups, xy or yx)
(define-map pair-by-tokens
  ((token-x principal) (token-y principal))
  ((contract-address principal))
)

(define-map token-details
  ((contract-address principal))
  ((name (buff 32)))
)

;; list of pair contracts
(define-data-var pairs (list 2200 principal) (list))

;; list of contract principal
(define-data-var tokens (list 2200 principal) (list))  ;; fails at 7085?! 148 bytes per principal?  but need to account for returning tuple of data


;; TODO(psq): private?
(define-read-only (pair-exists (token-x principal) (token-y principal))
  (ok
    (or
      (is-some (map-get? pair-by-tokens ((token-x token-x) (token-y token-y))))
      (is-some (map-get? pair-by-tokens ((token-x token-y) (token-y token-x))))
    )
  )
)

(define-read-only (get-pair-details (contract-address principal))
  (unwrap-panic (map-get? pair-by-pair-contract ((contract-address contract-address))))
)

(define-read-only (get-pairs)
  (ok (map get-pair-details (var-get pairs)))
)

;; can't add the same pair twice
(define-public (add-pair (contract-address principal) (name-x (buff 32)) (token-x principal) (name-y (buff 32)) (token-y principal))
  (if (unwrap! (pair-exists token-x token-y) fatal-err)
    pair-already-exists-err
    (begin
      (map-insert pair-by-pair-contract ((contract-address contract-address)) ((name-x name-x) (token-x token-x) (name-y name-y) (token-y token-y)))
      (map-insert pair-by-tokens ((token-x token-x) (token-y token-y)) ((contract-address contract-address)))
      (var-set pairs (unwrap! (as-max-len? (append (var-get pairs) contract-address) u2200) too-many-pairs-err))
      (ok true)
    )
  )
)


;; token registry
(define-public (add-token (name (buff 32)) (contract-address principal))
  (if (unwrap! (token-exists contract-address) fatal-err)
    token-already-exists-err
    (begin
      (map-set token-details ((contract-address contract-address)) ((name name)))
      (var-set tokens (unwrap! (as-max-len? (append (var-get tokens) contract-address) u2200) too-many-tokens-err))
      (ok true)
    )
  )
)

;; TODO(psq): do we need this?
(define-public (rename-token (contract-address principal) (name (buff 32)))
  ;; TODO(psq): the return value of map-set is not documented, what does true means? inserted? Actually, always returns true, how helpful is that?
  (if (unwrap! (token-exists contract-address) fatal-err)
    (begin
      (map-set token-details {contract-address: contract-address} {name: name})
      (ok true)
    )
    token-unknown-err
  )
)

(define-read-only (get-token-details (contract-address principal))
  (unwrap-panic (map-get? token-details ((contract-address contract-address))))
)

(define-read-only (get-tokens)
  (ok (map get-token-details (var-get tokens)))
)

;; TODO(psq): private?
(define-read-only (token-exists (contract-address principal))
  (ok (is-some (map-get? token-details ((contract-address contract-address)))))
)
