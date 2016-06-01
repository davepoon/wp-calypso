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

export function apiReady() {
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

export function toggleNotice() {
	return {
		type: PUSH_NOTIFICATIONS_TOGGLE_NOTICE
	};
}
