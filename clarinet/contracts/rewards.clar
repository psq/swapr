(use-trait sip-010-token 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.sip-010.ft-trait)

(define-constant token-1-err (err u111))
(define-constant token-2-err (err u112))
(define-constant token-3-err (err u113))
(define-constant reward-transfer-err (err u114))
(define-constant no-reward-err (err u115))

(define-constant WEEK (* (* u3600 u24) u7))  ;; 604_800


(define-map rewards-amounts
  {
    cycle: uint
  }
  {
    rewards: (list 3 {token: principal, amount: uint}),
    ;; ;; up to 3 tokens as reward
    ;; token-1: (optional principal),
    ;; amount-1: uint,
    ;; token-2: (optional principal),
    ;; amount-2: uint,
    ;; token-3: (optional principal),
    ;; amount-3: uint,
  }
)

;; if no data for cycle, use cycle u0
(define-map rewards-shares
  {
    cycle: uint
  }
  {
    total-shares: uint,  ;; the total amount of reward shares earned for that cycle
  }
)

;; adding liquidity should mix and match multiplier
;; removing liquidity resets multiplier back to 1x for what is left (removing liquidity is not a desirable event)
;; keep reward share for next 8, or use 3x if no data
;; adding more will add 1x, 2x, 3x values for next 8, and/or add 3x if no next is available
;; beautiful!

;; so, include next 8 cycle values, or assume 3x shares
;; cycle 0 is steady state after specific ramping up slots are done
;; so if {cycle} has a value, use it, otherwise, use {0}
(define-map rewards-provider
  {
    recipient : principal,
    cycle: uint,  ;; when last provide event occured
  }
  {
    shares: uint,
  }
)


;; a swapper only gets rewarded for a cycle where an exchange happened
;; an LP gets increasingly rewarded for supplying liquidity longer
;; TODO(psq): can only claim on current, maybe don't store more?

(define-map rewards-user
  {
    recipient : principal,
    cycle: uint,
  }
  {
    shares: uint,
  }
)

;; TODO(psq):  can only claim on current, maybe don't store more?
(define-map rewards-claim
  {
    recipient : principal,
    cycle : uint,
  }
  {
    claimed-1: bool,
    claimed-2: bool,
    claimed-3: bool,
  }
)

;; the week number, with week 0 starting at unix epoch start
;; example now = 1621276500, Monday, May 17th 2021, 11:35:00
;; reward cycle = 2680 (which is 2680 * WEEK, starts Wednesday, May 12th 2021, 17:00:00)
;; reward-cycle * <= now < (reward-cycle + 1) * WEEK


;; current reward cycle, need to use previous block as current block data is not available
(define-read-only (get-reward-cycle)
  (/ (unwrap-panic (get-block-info? time (if (> block-height u0) (- block-height u1) u0))) WEEK)
)

;; 1x < 4 weeks, 2 x > 4 weeks, 3x > 8 weeks
;; new liq resets multiplier, or maybe not?
;; claim reward => escrow (locked 6-12 months, starts at 6 and gradually ramps up to 12 right away)
;; move unclaimed reward to next cycle
;; claim from escrow, and withdraw
;; claim from escrow, and stake


;; the previous cycle (cycle -1) must exist, and its data will be copied to cycle i
(define-public (check-cylcle-or-create (cycle uint))
  (let ((shares (map-get? rewards-shares { cycle: cycle})))
    (if (is-none shares)
      (begin
        (let ((previous-shares (unwrap-panic (map-get? rewards-shares { cycle: (- cycle u1)}))))
          (map-set rewards-shares { cycle: cycle} previous-shares)
          (ok true)
        )
      )
      (ok true)
    )
  )
)

;; there should never be a bucket for > current + 8
(define-public (setup-upcoming-cycles)
  (let ((current (get-reward-cycle)))
    (unwrap-panic (check-cylcle-or-create (+ current u1)))
    (unwrap-panic (check-cylcle-or-create (+ current u2)))
    (unwrap-panic (check-cylcle-or-create (+ current u3)))
    (unwrap-panic (check-cylcle-or-create (+ current u4)))
    (unwrap-panic (check-cylcle-or-create (+ current u5)))
    (unwrap-panic (check-cylcle-or-create (+ current u6)))
    (unwrap-panic (check-cylcle-or-create (+ current u7)))
    ;; (unwrap-panic (check-cylcle-or-create (+ current u8)))  ;; TODO(psq): as this is also same as u0, don't create?
    (ok true)
  )
)

(define-private (add-rewards-1 (cycle uint) (owner principal) (shares uint))
  ;; add shares to rewards-shares or create for cycle
  ;; add shares to rewards-provider or create for cycle
  (let
    (
      (rewards-shares-opt (map-get? rewards-shares {cycle: cycle}))
      (rewards-provider-opt (map-get? rewards-provider {recipient: owner, cycle: cycle}))
    )
    (if (is-none rewards-shares-opt)
      (map-set rewards-shares {cycle: cycle} {total-shares: shares})
      (map-set rewards-shares {cycle: cycle} {total-shares: (+ (get total-shares (unwrap-panic rewards-shares-opt)) shares)})
    )
    (if (is-none rewards-provider-opt)
      (map-set rewards-provider {recipient: owner, cycle: cycle} {shares: shares})
      (map-set rewards-provider {recipient: owner, cycle: cycle} {shares: (+ (get shares (unwrap-panic rewards-provider-opt)) shares)})
    )
  )
)

(define-public (add-rewards (owner principal) (shares uint))
  (let ((current (get-reward-cycle)))
    ;; add 1x for 1, 2, 3
    (add-rewards-1 (+ current u1) owner shares)
    (add-rewards-1 (+ current u2) owner shares)
    (add-rewards-1 (+ current u3) owner shares)
    ;; add 2x for 4, 5, 6, 7
    (add-rewards-1 (+ current u4) owner (* shares u2))
    (add-rewards-1 (+ current u5) owner (* shares u2))
    (add-rewards-1 (+ current u6) owner (* shares u2))
    (add-rewards-1 (+ current u7) owner (* shares u2))
    ;; add 3x for all others, steady state
    (add-rewards-1 u0 owner (* shares u3))
    (ok true)
  )
)

(define-private (cancel-rewards-1 (cycle uint) (owner principal))
  ;; if rewards-provider data exists for {cycle, owner}
  ;; remove from rewards-shares for {cycle}
  (let
    (
      (rewards-provider-opt (map-get? rewards-provider {recipient: owner, cycle: cycle}))
    )
    (if (is-some rewards-provider-opt)
      (let ((rewards-shares-op (map-get? rewards-shares {cycle: cycle})))
        (if (is-some rewards-shares-op)
          (map-set rewards-shares {cycle: cycle} {total-shares: (- (get shares (unwrap-panic rewards-provider-opt)))})
          false
        )
      )
      false  ;; why is there no variant with only expr1, although what would the value be?  just don't care about value here
    )
  )
)

;; when LP remove-all and then `add-rewards` which resets mulitplier
(define-public (cancel-rewards (owner principal))
  (let ((current (get-reward-cycle)))
    (cancel-rewards-1 (+ current u1) owner)
    (cancel-rewards-1 (+ current u2) owner)
    (cancel-rewards-1 (+ current u3) owner)
    (cancel-rewards-1 (+ current u4) owner)
    (cancel-rewards-1 (+ current u5) owner)
    (cancel-rewards-1 (+ current u6) owner)
    (cancel-rewards-1 (+ current u7) owner)

    (cancel-rewards-1 (+ current u0) owner)
    (ok true)
  )
)

(define-public (claim-rewards (owner principal) (token <sip-010-token>))
  ;; TODO(psq)
  ;; check not claimed already
  ;; calculate reward share for provider (either {cycle} or {u0})
  ;; calculate reward sharefor user (either {cycle} or {u0})
  ;; transfer reward share / total share of weekly reward
  ;; mark reward as claimed
  (let
    (
      (contract (contract-of token))
      ;; (cycle (get-reward-cycle))
      ;; (rewards-claim (default-to {claimed-1: false, claimed-2: false, claimed-3: false} (map-get? rewards-claim {recipient: owner, cycle: cycle})))
      ;; (rewards-provider (default-to (default-to {shares: u0} (map-get? rewards-provider {recipient: owner, cycle: u0}))) (map-get? rewards-provider {recipient: owner, cycle: cycle}))
      ;; (rewards-user (default-to {shares: u0}) (map-get? rewards-user {recipient: owner, cycle}))
    )
    ;; (if (is-some rewards-claim-opt)
      (ok true)
    ;;   no-reward-err
    ;; )
  )
)

(define-public (claim-rewards-2 (owner principal) (token-1 <sip-010-token>) (token-2 <sip-010-token>))
  (begin
    (unwrap! (claim-rewards owner token-1) token-1-err)
    (unwrap! (claim-rewards owner token-2) token-2-err)
    (ok u0)
  )
)

(define-public (claim-rewards-3 (owner principal) (token-1 <sip-010-token>) (token-2 <sip-010-token>) (token-3 <sip-010-token>))
  (begin
    (unwrap! (claim-rewards owner token-1) token-1-err)
    (unwrap! (claim-rewards owner token-2) token-2-err)
    (unwrap! (claim-rewards owner token-3) token-3-err)
    (ok u0)
  )
)

(define-public (credit-rewards (cycle uint) (slot uint) (token <sip-010-token>) (amount uint))
  (let
    (
      (contract-address (as-contract tx-sender))
      (rewards-opt (map-get? rewards-amounts {cycle: cycle}))
      (rewards-new (if (is-none rewards-opt)
        (list {token: (contract-of token), amount: amount})  ;; new list
        (append (get rewards (unwrap-panic rewards-opt)) {token: (contract-of token), amount: amount})  ;; append to list
      ))
    )
    (map-set rewards-amounts {cycle: cycle} {rewards: (unwrap-panic (as-max-len? rewards-new u3))})
    (unwrap! (contract-call? token transfer amount contract-caller contract-address) reward-transfer-err)
    (ok true)
  )
)

(define-public (credit-rewards-2 (cycle uint) (token-1 <sip-010-token>) (amount-1 uint) (token-2 <sip-010-token>) (amount-2 uint))
  (begin
    (unwrap! (credit-rewards cycle u1 token-1 amount-1) token-1-err)
    (unwrap! (credit-rewards cycle u2 token-2 amount-2) token-2-err)
    (ok u0)
  )
)

(define-public (credit-rewards-3 (cycle uint) (token-1 <sip-010-token>) (amount-1 uint) (token-2 <sip-010-token>) (amount-2 uint) (token-3 <sip-010-token>) (amount-3 uint))
  (begin
    (unwrap! (credit-rewards cycle u1 token-1 amount-1) token-1-err)
    (unwrap! (credit-rewards cycle u2 token-2 amount-2) token-2-err)
    (unwrap! (credit-rewards cycle u3 token-2 amount-2) token-3-err)
    (ok u0)
  )
)

(map-set rewards-shares { cycle: u0} {total-shares: u0})
(map-set rewards-shares { cycle: (print (get-reward-cycle))} {total-shares: u0})

;; TODO(psq): escrow and claim from escrow