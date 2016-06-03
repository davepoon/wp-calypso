/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import moment from 'moment';

/**
 * Internal dependencies
 */
import {
	DESERIALIZE,
	PUSH_NOTIFICATIONS_API_READY,
	PUSH_NOTIFICATIONS_AUTHORIZE,
	PUSH_NOTIFICATIONS_BLOCK,
	PUSH_NOTIFICATIONS_DISABLE,
	PUSH_NOTIFICATIONS_DISMISS_NOTICE,
	PUSH_NOTIFICATIONS_ENABLE,
	PUSH_NOTIFICATIONS_SUBSCRIBE,
	PUSH_NOTIFICATIONS_TOGGLE_UNBLOCK_INSTRUCTIONS,
	PUSH_NOTIFICATIONS_UNSUBSCRIBE
} from 'state/action-types';

function settings( state = {}, action ) {
	switch ( action.type ) {
		case DESERIALIZE: {
			return Object.assign( {}, state, {
				apiReady: false
			} );
		}
		case PUSH_NOTIFICATIONS_API_READY: {
			return Object.assign( {}, state, {
				apiReady: true
			} );
		}

		case PUSH_NOTIFICATIONS_AUTHORIZE: {
			return Object.assign( {}, state, {
				authorized: true,
				blocked: false
			} );
		}

		case PUSH_NOTIFICATIONS_BLOCK: {
			return Object.assign( {}, state, {
				authorized: false,
				blocked: true
			} );
		}

		case PUSH_NOTIFICATIONS_DISABLE: {
			return Object.assign( {}, state, {
				enabled: false
			} );
		}

		case PUSH_NOTIFICATIONS_ENABLE: {
			return Object.assign( {}, state, {
				enabled: false
			} );
		}

		case PUSH_NOTIFICATIONS_DISMISS_NOTICE: {
			return Object.assign( {}, state, {
				dismissedNotice: !! state.dismissedNotice
			} );
		}

		case PUSH_NOTIFICATIONS_DISMISS_NOTICE: {
			return Object.assign( {}, state, {
				dismissedNotice: !! state.dismissedNotice
			} );
		}

		case PUSH_NOTIFICATIONS_SUBSCRIBE: {
			const {
				subscription,
				deviceId
			} = action;

			if ( ! ( subscription && deviceId ) ) {
				return state;
			}
			return Object.assign( {}, state, {
				subscription: {
					deviceId,
					subscription,
					lastModified: moment().format()
				}
			} );
		}

		case PUSH_NOTIFICATIONS_TOGGLE_UNBLOCK_INSTRUCTIONS: {
			return Object.assign( {}, state, {
				showUnblockInstructions: !! state.showUnblockInstructions
			} );
		}

		case PUSH_NOTIFICATIONS_UNSUBSCRIBE: {
			return Object.assign( {}, state, {
				subscription: null
			} );
		}

		default:
			return state;
	}
}

export default combineReducers( {
	settings
} );
