/**
 * Internal dependencies
 */
import {
	PUSH_NOTIFICATIONS_API_READY,
	PUSH_NOTIFICATIONS_AUTHORIZE,
	PUSH_NOTIFICATIONS_BLOCK,
	PUSH_NOTIFICATIONS_DISABLE,
	PUSH_NOTIFICATIONS_ENABLE,
	PUSH_NOTIFICATIONS_SUBSCRIBE,
	PUSH_NOTIFICATIONS_DISMISS_NOTICE,
	PUSH_NOTIFICATIONS_TOGGLE_UNBLOCK_INSTRUCTIONS,
	PUSH_NOTIFICATIONS_UNSUBSCRIBE
} from 'state/action-types';

export function apiReady() {
	// @TODO this has to be blacklisted from the localForage config
	return {
		type: PUSH_NOTIFICATIONS_API_READY
	};
}

export function authorize() {
	return {
		type: PUSH_NOTIFICATIONS_AUTHORIZE
	};
}

export function block() {
	return {
		type: PUSH_NOTIFICATIONS_BLOCK
	};
}

export function disable() {
	return {
		type: PUSH_NOTIFICATIONS_DISABLE
	};
}

export function enable() {
	return {
		type: PUSH_NOTIFICATIONS_ENABLE
	};
}

export function subscribe( subscription ) {
	return {
		type: PUSH_NOTIFICATIONS_SUBSCRIBE,
		subscription
	};
}

export function toggleUnblockInstructions() {
	return {
		type: PUSH_NOTIFICATIONS_TOGGLE_UNBLOCK_INSTRUCTIONS
	};
}

export function dismissNotice() {
	return {
		type: PUSH_NOTIFICATIONS_DISMISS_NOTICE
	};
}

export function unsubscribe() {
	return {
		type: PUSH_NOTIFICATIONS_UNSUBSCRIBE
	};
}
