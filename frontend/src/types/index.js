/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @typedef {'dashboard' | 'live-wheel' | 'wallet' | 'history'} Tab
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {string} avatarUrl
 * @property {'active' | 'eliminated'} status
 * @property {number} health - percentage (used to simulate performance bar in the right list)
 * @property {boolean} isUser
 * @property {number} [eliminatedRound]
 */

/**
 * @typedef {Object} MatchHistory
 * @property {string} id
 * @property {string} date
 * @property {string} type
 * @property {number} entryFee
 * @property {number} finalRank - e.g. 1st, 2nd, etc. out of 12
 * @property {'Won' | 'Eliminated'} status
 * @property {number} prize
 * @property {string} duration
 */

/**
 * @typedef {Object} EliminationEvent
 * @property {string} id
 * @property {string} playerName
 * @property {number} round
 * @property {string} timestamp
 * @property {string} avatarUrl
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} date
 * @property {'deposit' | 'withdraw' | 'entry' | 'winnings'} type
 * @property {number} amount
 * @property {'completed' | 'pending'} status
 */

export {};
