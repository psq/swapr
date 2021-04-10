import dotenv from 'dotenv'

dotenv.config({path: './.env'})

export const STACKS_API_URL = process.env.STACKS_API_URL
export const MODE = process.env.MODE

export const CONTRACT_NAME_SIP010 = process.env.CONTRACT_NAME_SIP010
export const CONTRACT_NAME_SWAPR_TRAIT = process.env.CONTRACT_NAME_SWAPR_TRAIT
export const CONTRACT_NAME_SWAPR = process.env.CONTRACT_NAME_SWAPR
export const CONTRACT_NAME_STX = process.env.CONTRACT_NAME_STX
export const CONTRACT_NAME_PLAID = process.env.CONTRACT_NAME_PLAID
export const CONTRACT_NAME_PLAID_STX = process.env.CONTRACT_NAME_PLAID_STX

export const SWAPR_PK = process.env.SWAPR_PK
export const SWAPR_SK = process.env.SWAPR_SK
export const SWAPR_STX = process.env.SWAPR_STX

export const USER_STX = process.env.USER_STX
export const USER_SK = process.env.USER_SK