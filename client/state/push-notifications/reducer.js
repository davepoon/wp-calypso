/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	PUSH_NOTIFICATIONS_API_READY,
	PUSH_NOTIFICATIONS_AUTHORIZE,
	PUSH_NOTIFICATIONS_BLOCK,
	PUSH_NOTIFICATIONS_DISABLE,
	PUSH_NOTIFICATIONS_ENABLE,
	PUSH_NOTIFICATIONS_TOGGLE_NOTICE
} from 'state/action-types';

function settings( state = {}, action ) {
	switch ( action.type ) {
		case PUSH_NOTIFICATIONS_API_READY: {
			return Object.assign( {}, state, {
				ready: true
			} );
		}

		case PUSH_NOTIFICATIONS_AUTHORIZE: {
			return Object.assign( {}, state, {
				authorized: true
			} );
		}

		case PUSH_NOTIFICATIONS_BLOCK: {
			return Object.assign( {}, state, {
				authorized: false
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

		case PUSH_NOTIFICATIONS_TOGGLE_NOTICE: {
			return Object.assign( {}, state, {
				showNotice: !! state.showNotice
			} );
		}

		default:
			return state;
	}
}

export default combineReducers( {
	settings
} );
