
export const isApiReady = ( state ) => !! state.pushNotifications.settings.apiReady;
export const isAuthorized = ( state ) => !! state.pushNotifications.settings.authorized;
export const isBlocked = ( state ) => !! state.pushNotifications.settings.blocked;
export const isEnabled = ( state ) => !! state.pushNotifications.settings.enabled;
export const isNoticeDismissed = ( state ) => !! state.pushNotifications.settings.dismissedNotice;
export const getSubscription = ( state ) => state.pushNotifications.settings.subscription;

export function isNoticeVisible( state ) {
	return (
		isApiReady( state ) &&
		isAuthorized( state ) &&
		isEnabled( state ) &&
		! isNoticeDismissed( state )
	);
}

export function isSubscribed( state ) {
	const subscription = getSubscription( state );
	return (
		subscription &&
		isEnabled( state ) &&
		! isBlocked( state )
	);
}

export function getStatus( state ) {
	// Status is one of: 'unknown', 'subscribed', 'unsubscribed', or 'denied'
	if ( isSubscribed( state ) ) {
		return 'subscribed';
	}

	if ( isBlocked( state ) ) {
		return 'denied';
	}

	if ( isAuthorized( state ) ) {
		return 'unsubscribed';
	}

	return 'unknown';
}
