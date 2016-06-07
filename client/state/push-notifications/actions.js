/**
 * External dependencies
 */
import debugFactory from 'debug';
import moment from 'moment';
import wpcom from 'lib/wp';

/**
 * Internal dependencies
 */
import {
	PUSH_NOTIFICATIONS_API_READY,
	PUSH_NOTIFICATIONS_API_NOT_READY,
	PUSH_NOTIFICATIONS_AUTHORIZE,
	PUSH_NOTIFICATIONS_BLOCK,
	PUSH_NOTIFICATIONS_TOGGLE_ENABLED,
	PUSH_NOTIFICATIONS_DISMISS_NOTICE,
	PUSH_NOTIFICATIONS_MUST_PROMPT,
	PUSH_NOTIFICATIONS_RECEIVE_REGISTER_DEVICE,
	PUSH_NOTIFICATIONS_RECEIVE_SUBSCRIPTION,
	PUSH_NOTIFICATIONS_RECEIVE_UNREGISTER_DEVICE,
	PUSH_NOTIFICATIONS_TOGGLE_UNBLOCK_INSTRUCTIONS,
} from 'state/action-types';

import {
	getDeviceId,
	getLastUpdated,
	getSavedSubscription,
	isBlocked,
	isEnabled,
	isPushNotificationsDenied,
	isPushNotificationsSupported,
} from './selectors';

const debug = debugFactory( 'calypso:push-notifications' );
const DAYS_BEFORE_FORCING_REGISTRATION_REFRESH = 15;

export function init() {
	return dispatch => {
		// Only continue if the service worker supports notifications
		if ( ! isPushNotificationsSupported() ) {
			debug( 'Push Notifications are not supported' );
			dispatch( apiNotReady() );
			return;
		}

		if ( isPushNotificationsDenied() ) {
			debug( 'Push Notifications have been denied' );
			dispatch( block() );
			dispatch( apiReady() );
			return;
		}

		dispatch( fetchAndLoadServiceWorker() );
	};
}

export function fetchAndLoadServiceWorker() {
	return dispatch => {
		debug( 'Registering service worker' );

		window.navigator.serviceWorker.register( '/service-worker.js' )
			.then( ( serviceWorkerRegistration ) => {
				dispatch( apiReady( serviceWorkerRegistration ) );
			} )
			.catch( err => dispatch( serviceWorkerLoadingError( err ) ) )
		;
	};
}

export function deactivateSubscription() {
	return dispatch => {
		window.navigator.serviceWorker.ready
			.then( ( serviceWorkerRegistration ) => {
				serviceWorkerRegistration.pushManager.getSubscription()
					.then( pushSubscription => {
						if ( ! pushSubscription ) {
							debug( 'Deactivated subscription' );
							dispatch( receiveSubscription( null ) );
							return;
						}

						dispatch( unregisterDevice() );

						pushSubscription.unsubscribe()
							.then( () => {
								dispatch( receiveSubscription( null ) );
							} )
							.catch( ( err ) => {
								debug( 'Error while unsubscribing', err );
							} )
						;
					} )
					.catch( err => {
						debug( 'Error getting subscription to deactivate', err );

						// @TODO is this correct behavior?
						dispatch( receiveSubscription( null ) );
					} )
				;
			} );
	};
}

export function receivedPermission( permission ) {
	return dispatch => {
		if ( permission === 'granted' ) {
			dispatch( authorize() );
			return;
		}

		if ( permission === 'denied' ) {
			dispatch( block() );
			return;
		}
		dispatch( mustPrompt() );
	};
}

export function triggerBrowserForPermission( serviceWorkerRegistration ) {
	return dispatch => {
		debug( 'Triggering browser for permission' );
		serviceWorkerRegistration.pushManager.subscribe( { userVisibleOnly: true } )
			.then( subscription => {
				debug( 'Got push manager subscription', subscription );
				serviceWorkerRegistration.pushManager.permissionState( { userVisibleOnly: true } )
					.then( permissionState => {
						debug( 'Got permission state', permissionState );
						if ( 'granted' === permissionState ) {
							dispatch( authorize() );
						} else {
							debug( 'not granted: ' + permissionState );
							dispatch( toggleEnabled() );
						}
					} )
					.catch( err => debug( 'Error getting subscription state', err ) )
				;
			} )
			.catch( err => {
				dispatch( block() );
				debug( 'Error prompting for subscription', err );
			} )
		;
	};
}

export function apiNotReady() {
	return {
		type: PUSH_NOTIFICATIONS_API_NOT_READY
	};
}

export function apiReady( serviceWorkerRegistration ) {
	return ( dispatch, getState ) => {
		dispatch( {
			type: PUSH_NOTIFICATIONS_API_READY
		} );
		const state = getState();
		if ( ! isBlocked( state ) && isEnabled( state ) ) {
			dispatch( checkPermissionsState() );
			dispatch( triggerBrowserForPermission( serviceWorkerRegistration ) );
		}
	};
}

export function fetchPushManagerSubscription() {
	return dispatch => {
		window.navigator.serviceWorker.ready
			.then( ( serviceWorkerRegistration ) => {
				serviceWorkerRegistration.pushManager.getSubscription()
					.then( subscription => {
						dispatch( receiveSubscription( subscription ) );
						dispatch( sendSubscriptionToWPCOM() );
					} )
					.catch( err => debug( 'Error receiving subscription', err ) )
				;
			} )
			.catch( err => debug( 'Error fetching push manager subscription', err )	)
		;
	};
}

export function sendSubscriptionToWPCOM() {
	return ( dispatch, getState ) => {
		const state = getState();
		const lastUpdated = getLastUpdated( state );
		debug( 'Subscription last updated: ' + lastUpdated );

		let age;

		if ( lastUpdated ) {
			age = moment().diff( moment( lastUpdated ), 'days' );
			if ( age < DAYS_BEFORE_FORCING_REGISTRATION_REFRESH ) {
				debug( 'Subscription did not need updating.', age );
				return;
			}
		}

		debug( 'Subscription needed updating.', age );

		const sub = getSavedSubscription( state );
		if ( ! sub ) {
			debug( 'No subscription to send to WPCOM' );
			// @TODO dispatch something :)
			return;
		}
		debug( 'Sending subscription to WPCOM', sub );

		wpcom.undocumented().registerDevice( JSON.stringify( sub ), 'browser', 'Browser' )
			.then( data => dispatch( {
				type: PUSH_NOTIFICATIONS_RECEIVE_REGISTER_DEVICE,
				data
			} ) )
			.catch( ( err ) => debug( 'Couldn\'t register device', err ) )
		;
	};
}

export function activateSubscription() {
	return dispatch => {
		window.navigator.serviceWorker.ready
			.then( serviceWorkerRegistration => {
				serviceWorkerRegistration.pushManager.subscribe( { userVisibleOnly: true } )
					.then( subscription => dispatch( receiveSubscription( subscription ) ) )
					.catch( err => dispatch( errorReceivingSubscription( err ) ) )
				;
			} )
			.catch( err => debug( 'Error activating subscription', err )	)
		;
	};
}

export function errorReceivingSubscription( err ) {
	return () => debug( 'Error receiving subscription', err );
}

export function unregisterDevice() {
	return ( dispatch, getState ) => {
		const deviceId = getDeviceId( getState() );
		if ( ! deviceId ) {
			debug( 'Couldn\'t unregister device. Unknown device ID' );
			return;
		}
		wpcom.undocumented().unregisterDevice( deviceId )
			.then( ( data ) => {
				debug( 'Successfully unregistered device', data );
				dispatch( {
					type: PUSH_NOTIFICATIONS_RECEIVE_UNREGISTER_DEVICE,
					data
				} );
			} )
			.catch( ( err ) => debug( 'Couldn\'t unregister device', err ) );
	};
}

export function checkPermissionsState() {
	return dispatch => {
		window.navigator.serviceWorker.ready
			.then( ( serviceWorkerRegistration ) => {
				serviceWorkerRegistration.pushManager.permissionState( { userVisibleOnly: true } )
					.then( pushMessagingState => {
						debug( 'Received push messaging state', pushMessagingState );
						dispatch( receivedPermission( pushMessagingState ) );
					} )
					.catch( err => {
						debug( 'Error checking permission state', err );
						dispatch( receivedPermission( 'denied', err ) );
					} )
				;
			} )
			.catch( err => debug( 'Error checking permission state -- not ready', err )	)
		;
	};
}

export function serviceWorkerLoadingError( err ) {
	return dispatch => {
		debug( 'Error loading service worker!', err );
		dispatch( apiNotReady() );
	};
}

export function authorize() {
	return dispatch => {
		dispatch( receiveAuthorized() );
		dispatch( fetchPushManagerSubscription() );
	};
}

export function receiveAuthorized() {
	debug( 'Push notifications authorized' );
	return {
		type: PUSH_NOTIFICATIONS_AUTHORIZE
	};
}

export function block() {
	return {
		type: PUSH_NOTIFICATIONS_BLOCK
	};
}

export function mustPrompt() {
	return {
		type: PUSH_NOTIFICATIONS_MUST_PROMPT
	};
}

export function toggleEnabled() {
	return ( dispatch, getState ) => {
		const enabling = ! isEnabled( getState() );
		const doing = enabling ? 'enabling' : 'disabling';
		debug( doing );
		dispatch( {
			type: PUSH_NOTIFICATIONS_TOGGLE_ENABLED
		} );
		if ( enabling ) {
			dispatch( fetchAndLoadServiceWorker() );
		} else {
			dispatch( deactivateSubscription() );
		}
		// @TODO dispatch perm check, get PN sub, register device, etc.
	};
}

export function receiveSubscription( subscription ) {
	return {
		type: PUSH_NOTIFICATIONS_RECEIVE_SUBSCRIPTION,
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
