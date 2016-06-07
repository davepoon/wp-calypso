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
	PUSH_NOTIFICATIONS_RECEIVE_DEACTIVATED_SUBSCRIPTION,
	PUSH_NOTIFICATIONS_RECEIVE_REGISTER_DEVICE,
	PUSH_NOTIFICATIONS_RECEIVE_SUBSCRIPTION,
	PUSH_NOTIFICATIONS_RECEIVE_UNREGISTER_DEVICE,
	PUSH_NOTIFICATIONS_TOGGLE_UNBLOCK_INSTRUCTIONS,
	PUSH_NOTIFICATIONS_UNSUBSCRIBE,
} from 'state/action-types';

import {
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
			dispatch( apiNotReady() );
			return;
		}

		dispatch( fetchAndLoadServiceWorker() );
	};
}

export function fetchAndLoadServiceWorker() {
	return dispatch => {
		debug( 'Registering service worker' );

		window.navigator.serviceWorker.register( '/service-worker.js' )
			.then( () => {
				dispatch( apiReady() );
				dispatch( checkPermissionsState() );
			} )
			.catch( err => dispatch( serviceWorkerLoadingError( err ) ) )
		;
	};
}

export function receivedDeactivatedSubscription() {
	debug( 'Deactivated subscription' );
	return {
		type: PUSH_NOTIFICATIONS_RECEIVE_DEACTIVATED_SUBSCRIPTION,
	};
}

/* @TODO fix this
export function deactivateSubscription() {
	return dispatch => {
		window.navigator.serviceWorker.ready
			.then( () => {
				getPushManagerSubscription()
					.then( pushSubscription => {
						if ( ! pushSubscription ) {
							return dispatch( receivedDeactivatedSubscription() );
						}

						unregisterDevice();

						pushSubscription.unsubscribe()
							.then( () => resolve() )
							.catch( ( err ) => {
								debug( 'Error while unsubscribing', err );
								reject( err );
							} )
						;
					} )
					.catch( err => reject( err ) )
				;
			} );
	};
}
*/

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

export function triggerBrowserForPermission() {
	return dispatch => {
		window.navigator.serviceWorker.ready
			.then( ( serviceWorkerRegistration ) => {
				serviceWorkerRegistration.pushManager.permissionState( { userVisibleOnly: true } )
					.then( permission => dispatch( receivedPermission( permission ) ) )
					.catch( err => dispatch( receivedPermission( 'blocked', err ) ) )
				;
			} )
			.catch( err => debug( 'Error triggering browser for permission', err ) )
		;
	};
}

export function apiNotReady() {
	return {
		type: PUSH_NOTIFICATIONS_API_NOT_READY
	};
}

export function apiReady() {
	return dispatch => {
		dispatch( receiveApiReady() );
	};
}

export function fetchPushManagerSubscription() {
	return dispatch => {
		window.navigator.serviceWorker.ready
			.then( ( serviceWorkerRegistration ) => {
				serviceWorkerRegistration.pushManager.getSubscription()
					.then( subscription => {
						dispatch( receiveSubscription( subscription ) );
						debug( 'have sub, @TODO do something with it', subscription );
					} )
					.catch( err => debug( 'Error receiving subscription', err ) )
				;
			} )
			.catch( err => debug( 'Error fetching push manager subscription', err )	)
		;
	};
}

export function receiveApiReady() {
	return {
		type: PUSH_NOTIFICATIONS_API_READY
	};
}

export function saveSubscription( subscription ) {
	debug( 'Saving subscription', subscription );
	/* @TODO fix this!
	const oldSub = getSubscription();
	const lastUpdated = oldSub.lastModified;

	let age;

	if ( lastUpdated ) {
		age = moment().diff( moment( lastUpdated ), 'days' );
		if ( age > DAYS_BEFORE_FORCING_REGISTRATION_REFRESH ) {
			debug( 'Subscription did not need updating.', age );
			return;
		}
	}

	debug( 'Subscription needed updating.', age );
	registerDevice();
	*/
}

export function activateSubscription() {
	return dispatch => {
		window.navigator.serviceWorker.ready
			.then( ( serviceWorkerRegistration ) => {
				serviceWorkerRegistration.pushManager.subscribe( { userVisibleOnly: true } )
					.then( subscription => dispatch( receivedSubscription( subscription ) ) )
					.catch( err => dispatch( errorReceivingSubscription( err ) ) )
				;
			} )
			.catch( err => debug( 'Error activating subscription', err )	)
		;
	};
}

export function receivedSubscription( subscription ) {
	return {
		type: PUSH_NOTIFICATIONS_RECEIVE_SUBSCRIPTION,
		subscription: subscription
	};
}

export function errorReceivingSubscription( err ) {
	return () => debug( 'Error receiving subscription', err );
}

export function registerDevice( subscription ) {
	return dispatch => {
		wpcom.undocumented().registerDevice( subscription, 'browser', 'Browser' )
			.then( ( data ) => {
				dispatch( {
					type: PUSH_NOTIFICATIONS_RECEIVE_REGISTER_DEVICE,
					data
				} );
			} )
			.catch( ( err ) => debug( 'Couldn\'t register device', err ) )
		;
	};
}

export function unregisterDevice( deviceId ) {
	return dispatch => {
		wpcom.undocumented().unregisterDevice( deviceId )
			.then( ( data ) => {
				debug( 'Unregistered device', data );
				dispatch( receiveUnregisterDevice( data ) );
			} )
			.catch( ( err ) => debug( 'Couldn\'t unregister device', err ) );
	};
}

export function receiveUnregisterDevice( data ) {
	return {
		type: PUSH_NOTIFICATIONS_RECEIVE_UNREGISTER_DEVICE,
		data
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
		const enabling = !isEnabled( getState() );
		console.log( 'enabling?', enabling );
		dispatch( {
			type: PUSH_NOTIFICATIONS_TOGGLE_ENABLED
		} );
		dispatch( triggerBrowserForPermission() );
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

export function unsubscribe() {
	return {
		type: PUSH_NOTIFICATIONS_UNSUBSCRIBE
	};
}
