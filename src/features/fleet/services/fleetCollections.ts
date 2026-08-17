/**
 * Firestore collection names for the fleet module.
 *
 * A leaf with no imports, so any service can reach any collection name without
 * importing the service that owns it. That matters here: issuing a machine has
 * to read the driver record to check a licence, and the driver service already
 * reads assignments — importing each from the other would close a cycle for the
 * sake of two strings.
 *
 * Each name is also re-exported from the service that owns the collection, so
 * existing imports keep working and there is still one obvious place to look.
 */

export const FLEET_ASSETS_COLLECTION = 'fleetAssets';
export const FLEET_ASSIGNMENTS_COLLECTION = 'fleetAssignments';
export const FLEET_WORK_ORDERS_COLLECTION = 'fleetWorkOrders';
export const FLEET_STATUS_EVENTS_COLLECTION = 'fleetStatusEvents';
export const FLEET_SERVICE_RECORDS_COLLECTION = 'fleetServiceRecords';
export const FLEET_DRIVERS_COLLECTION = 'fleetDrivers';
