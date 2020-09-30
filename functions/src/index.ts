/*
 *-------------------------------------------------------
 * EXPORT MODULES
 *-------------------------------------------------------
 * Export modules to Cloud Functions
 */
module.exports = {
	...require('./users/background'),
	...require('./storage/background'),
};
