import { Timestamp } from 'firebase/firestore';
import type {
  FleetAsset,
  FleetAssignment,
  FleetDriver,
  FleetWorkOrder,
} from '../types/fleet';

/**
 * Demonstration fleet.
 *
 * Used only when Firestore is unconfigured, so the module can be shown and
 * reviewed before the Bureau's Firebase project exists. It is never mixed with
 * live data: the service layer chooses one source or the other, and the UI says
 * plainly which it is showing.
 *
 * The figures are shaped to exercise the interesting cases rather than to look
 * tidy — a machine past its service interval, one grounded, one waiting on a
 * part, one overdue back, and a spread of hours against kilometres. A demo where
 * everything is green proves nothing.
 */

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => Timestamp.fromDate(new Date(Date.now() - days * DAY));
const ahead = (days: number) => Timestamp.fromDate(new Date(Date.now() + days * DAY));

function asset(a: Partial<FleetAsset> & Pick<FleetAsset, 'assetId' | 'assetType' | 'make' | 'model' | 'zoneId' | 'stationedAt'>): FleetAsset {
  return {
    meterType: 'hours',
    currentMeter: 0,
    status: 'available',
    version: 1,
    ...a,
  } as FleetAsset;
}

export const DEMO_ASSETS: FleetAsset[] = [
  // --- Tractors: the bulk of a bureau fleet, serviced on engine hours
  asset({
    assetId: 'TR-001', assetType: 'tractor', make: 'John Deere', model: '5075E', year: 2021,
    meterType: 'hours', currentMeter: 1348, serviceIntervalMeter: 250, lastServiceMeter: 1250,
    zoneId: 'arsi', stationedAt: 'Asella Zonal Office', status: 'available',
  }),
  asset({
    assetId: 'TR-002', assetType: 'tractor', make: 'Massey Ferguson', model: 'MF 385', year: 2019,
    meterType: 'hours', currentMeter: 4102, serviceIntervalMeter: 250, lastServiceMeter: 3780,
    zoneId: 'arsi', stationedAt: 'Asella Zonal Office', status: 'available', // 322 hrs since service: due
  }),
  asset({
    assetId: 'TR-003', assetType: 'tractor', make: 'New Holland', model: 'TD5.90', year: 2022,
    meterType: 'hours', currentMeter: 890, serviceIntervalMeter: 300, lastServiceMeter: 750,
    zoneId: 'east_shewa', stationedAt: 'Adama Depot', status: 'assigned',
    custodianUid: 'unlinked:Obbo Girmaa Bekele', custodianName: 'Obbo Girmaa Bekele',
    custodianDriverId: 'DR-001',
  }),
  asset({
    assetId: 'TR-004', assetType: 'tractor', make: 'Massey Ferguson', model: 'MF 275', year: 2016,
    meterType: 'hours', currentMeter: 7620, serviceIntervalMeter: 250, lastServiceMeter: 7500,
    zoneId: 'west_shewa', stationedAt: 'Ambo Machinery Yard', status: 'in_maintenance',
  }),
  asset({
    assetId: 'TR-005', assetType: 'tractor', make: 'John Deere', model: '6110B', year: 2023,
    meterType: 'hours', currentMeter: 412, serviceIntervalMeter: 300, lastServiceMeter: 300,
    zoneId: 'jimma', stationedAt: 'Jimma Zonal Office', status: 'available',
  }),
  asset({
    assetId: 'TR-006', assetType: 'tractor', make: 'Kubota', model: 'M7060', year: 2020,
    meterType: 'hours', currentMeter: 2255, serviceIntervalMeter: 250, lastServiceMeter: 2100,
    zoneId: 'bale', stationedAt: 'Robe Machinery Yard', status: 'assigned',
    custodianUid: 'unlinked:Aaddee Caaltuu Nagaasaa', custodianName: 'Aaddee Caaltuu Nagaasaa',
    custodianDriverId: 'DR-002',
  }),
  asset({
    assetId: 'TR-007', assetType: 'tractor', make: 'Massey Ferguson', model: 'MF 385', year: 2018,
    meterType: 'hours', currentMeter: 5140, serviceIntervalMeter: 250, lastServiceMeter: 5050,
    zoneId: 'west_arsi', stationedAt: 'Shashamane Depot', status: 'awaiting_parts',
  }),
  asset({
    assetId: 'TR-008', assetType: 'tractor', make: 'New Holland', model: 'TT4.75', year: 2021,
    meterType: 'hours', currentMeter: 1780, serviceIntervalMeter: 250, lastServiceMeter: 1600,
    zoneId: 'east_wellega', stationedAt: 'Nekemte Zonal Office', status: 'available',
  }),

  // --- Harvesters: seasonal, high hours when working
  asset({
    assetId: 'HV-001', assetType: 'harvester', make: 'Sampo Rosenlew', model: 'C6', year: 2020,
    meterType: 'hours', currentMeter: 1960, serviceIntervalMeter: 200, lastServiceMeter: 1900,
    zoneId: 'arsi', stationedAt: 'Asella Zonal Office', status: 'available',
  }),
  asset({
    assetId: 'HV-002', assetType: 'harvester', make: 'CLAAS', model: 'Crop Tiger 40', year: 2019,
    meterType: 'hours', currentMeter: 2840, serviceIntervalMeter: 200, lastServiceMeter: 2500,
    zoneId: 'west_shewa', stationedAt: 'Ambo Machinery Yard', status: 'out_of_service',
  }),
  asset({
    assetId: 'HV-003', assetType: 'harvester', make: 'Sampo Rosenlew', model: 'C6', year: 2022,
    meterType: 'hours', currentMeter: 640, serviceIntervalMeter: 200, lastServiceMeter: 600,
    zoneId: 'east_shewa', stationedAt: 'Adama Depot', status: 'available',
  }),

  // --- Implements: no meter at all, serviced on inspection
  asset({
    assetId: 'IM-001', assetType: 'implement', make: 'Baldan', model: '3-Furrow Disc Plough',
    meterType: 'none', currentMeter: 0, zoneId: 'arsi', stationedAt: 'Asella Zonal Office',
    status: 'available',
  }),
  asset({
    assetId: 'IM-002', assetType: 'implement', make: 'Agrolead', model: 'Seed Drill 3m',
    meterType: 'none', currentMeter: 0, zoneId: 'east_shewa', stationedAt: 'Adama Depot',
    status: 'assigned', custodianUid: 'unlinked:Obbo Taaddasaa Roobaa', custodianName: 'Obbo Taaddasaa Roobaa',
    custodianDriverId: 'DR-006',
  }),
  asset({
    assetId: 'IM-003', assetType: 'implement', make: 'Ozdoken', model: 'Offset Harrow',
    meterType: 'none', currentMeter: 0, zoneId: 'bale', stationedAt: 'Robe Machinery Yard',
    status: 'available',
  }),
  asset({
    assetId: 'IM-004', assetType: 'implement', make: 'Baldan', model: 'Rotavator 1.8m',
    meterType: 'none', currentMeter: 0, zoneId: 'jimma', stationedAt: 'Jimma Zonal Office',
    status: 'in_maintenance',
  }),

  // --- Road vehicles: kilometres, plates, insurance and inspection
  asset({
    assetId: 'PK-001', assetType: 'pickup', make: 'Toyota', model: 'Hilux 2.4D', year: 2021,
    meterType: 'kilometres', currentMeter: 84200, serviceIntervalMeter: 5000, lastServiceMeter: 80000,
    plateNumber: '3-A12345 OR', zoneId: 'east_shewa', stationedAt: 'Adama Depot',
    status: 'assigned', custodianUid: 'unlinked:Aaddee Boontuu Hundee', custodianName: 'Aaddee Boontuu Hundee',
    custodianDriverId: 'DR-003',
    insuranceExpiry: ahead(112), inspectionExpiry: ahead(40),
  }),
  asset({
    assetId: 'PK-002', assetType: 'pickup', make: 'Toyota', model: 'Land Cruiser 79', year: 2019,
    meterType: 'kilometres', currentMeter: 162400, serviceIntervalMeter: 5000, lastServiceMeter: 155000,
    plateNumber: '3-B48812 OR', zoneId: 'borena', stationedAt: 'Yabelo Field Station',
    status: 'available', insuranceExpiry: ahead(18), inspectionExpiry: ahead(220), // insurance expiring soon
    insurancePolicyNumber: 'EIC/MV/2025/44817', insurer: 'Ethiopian Insurance Corporation',
    insuranceCost: 18400, inspectionCertificateNumber: 'RW-2025-90114', libreNumber: 'LB-3-448120',
  }),
  asset({
    assetId: 'PK-003', assetType: 'pickup', make: 'Isuzu', model: 'D-Max', year: 2022,
    meterType: 'kilometres', currentMeter: 41300, serviceIntervalMeter: 5000, lastServiceMeter: 40000,
    plateNumber: '3-C90233 OR', zoneId: 'west_hararghe', stationedAt: 'Chiro Zonal Office',
    status: 'available', insuranceExpiry: ahead(300), inspectionExpiry: ahead(150),
    insurancePolicyNumber: 'AIC/MV/2026/10233', insurer: 'Awash Insurance',
    insuranceCost: 21750, inspectionCertificateNumber: 'RW-2026-11902', libreNumber: 'LB-3-902317',
  }),
  asset({
    assetId: 'PK-004', assetType: 'pickup', make: 'Toyota', model: 'Hilux 2.4D', year: 2018,
    meterType: 'kilometres', currentMeter: 208900, serviceIntervalMeter: 5000, lastServiceMeter: 205000,
    plateNumber: '3-D11907 OR', zoneId: 'guji', stationedAt: 'Negele Borana Office',
    status: 'in_maintenance', insuranceExpiry: ago(12), inspectionExpiry: ahead(90), // insurance lapsed
    insurancePolicyNumber: 'EIC/MV/2024/33108', insurer: 'Ethiopian Insurance Corporation',
    insuranceCost: 17200, inspectionCertificateNumber: 'RW-2025-77410', libreNumber: 'LB-3-118094',
  }),
  asset({
    assetId: 'TK-001', assetType: 'truck', make: 'Isuzu', model: 'FSR 700', year: 2020,
    meterType: 'kilometres', currentMeter: 96700, serviceIntervalMeter: 10000, lastServiceMeter: 90000,
    plateNumber: '3-E55014 OR', zoneId: 'east_shewa', stationedAt: 'Adama Depot',
    status: 'assigned', custodianUid: 'unlinked:Obbo Dassaalanyi Tolaa', custodianName: 'Obbo Dassaalanyi Tolaa',
    custodianDriverId: 'DR-004',
    // No insurance or roadworthiness recorded at all — deliberately. This is
    // the case the old checks could not see: a truck in daily use whose
    // paperwork nobody has ever entered read as compliant, because both
    // isExpired and isExpiringSoon return false for a date that is not there.
    libreNumber: 'LB-4-550140',
  }),
  asset({
    assetId: 'TK-002', assetType: 'truck', make: 'Sinotruk', model: 'Howo Water Tanker', year: 2021,
    meterType: 'kilometres', currentMeter: 58300, serviceIntervalMeter: 10000, lastServiceMeter: 50000,
    plateNumber: '3-F72330 OR', zoneId: 'borena', stationedAt: 'Yabelo Field Station',
    status: 'available', insuranceExpiry: ahead(160), inspectionExpiry: ahead(85),
    insurancePolicyNumber: 'NIC/MV/2026/55240', insurer: 'Nyala Insurance',
    insuranceCost: 34600, inspectionCertificateNumber: 'RW-2026-20551', libreNumber: 'LB-4-550218',
  }),
  asset({
    assetId: 'MC-001', assetType: 'motorcycle', make: 'Bajaj', model: 'Boxer 150', year: 2023,
    meterType: 'kilometres', currentMeter: 12400, serviceIntervalMeter: 3000, lastServiceMeter: 12000,
    plateNumber: '3-M20114 OR', zoneId: 'jimma', stationedAt: 'Jimma Zonal Office',
    status: 'assigned', custodianUid: 'unlinked:Obbo Fiqaaduu Alamuu', custodianName: 'Obbo Fiqaaduu Alamuu',
    custodianDriverId: 'DR-005',
    insuranceExpiry: ahead(240), inspectionExpiry: ahead(120),
  }),
  asset({
    assetId: 'MC-002', assetType: 'motorcycle', make: 'TVS', model: 'Star HLX 125', year: 2022,
    meterType: 'kilometres', currentMeter: 27800, serviceIntervalMeter: 3000, lastServiceMeter: 24000,
    plateNumber: '3-M31882 OR', zoneId: 'east_hararghe', stationedAt: 'Harar Extension Post',
    status: 'available', insuranceExpiry: ahead(70), inspectionExpiry: ahead(310), // 3800 km since service: due
    insurancePolicyNumber: 'AIC/MC/2026/70119', insurer: 'Awash Insurance',
    insuranceCost: 4100, libreNumber: 'LB-1-701193',
  }),
  asset({
    assetId: 'BS-001', assetType: 'bus', make: 'Toyota', model: 'Coaster', year: 2017,
    meterType: 'kilometres', currentMeter: 311500, serviceIntervalMeter: 8000, lastServiceMeter: 308000,
    plateNumber: '3-G44120 OR', zoneId: 'west_shewa', stationedAt: 'Ambo Machinery Yard',
    status: 'available', insuranceExpiry: ahead(95), inspectionExpiry: ahead(25),
    insurancePolicyNumber: 'EIC/MV/2026/88027', insurer: 'Ethiopian Insurance Corporation',
    insuranceCost: 41200, inspectionCertificateNumber: 'RW-2025-63308', libreNumber: 'LB-5-880273',
  }),

  // --- Static powered equipment: assigned and repaired like anything else
  asset({
    assetId: 'PU-001', assetType: 'pump', make: 'Honda', model: 'WB30XT Irrigation Pump', year: 2022,
    meterType: 'hours', currentMeter: 940, serviceIntervalMeter: 150, lastServiceMeter: 900,
    zoneId: 'west_arsi', stationedAt: 'Shashamane Depot', status: 'available',
  }),
  asset({
    assetId: 'PU-002', assetType: 'pump', make: 'Grundfos', model: 'SP 17-7 Borehole', year: 2021,
    meterType: 'hours', currentMeter: 3110, serviceIntervalMeter: 150, lastServiceMeter: 2900,
    zoneId: 'borena', stationedAt: 'Yabelo Field Station', status: 'awaiting_parts',
  }),
  asset({
    assetId: 'GN-001', assetType: 'generator', make: 'Perkins', model: '30 kVA', year: 2020,
    meterType: 'hours', currentMeter: 2240, serviceIntervalMeter: 250, lastServiceMeter: 2100,
    zoneId: 'east_wellega', stationedAt: 'Nekemte Zonal Office', status: 'available',
  }),
  asset({
    assetId: 'GN-002', assetType: 'generator', make: 'Cummins', model: '60 kVA', year: 2018,
    meterType: 'hours', currentMeter: 6890, serviceIntervalMeter: 250, lastServiceMeter: 6500,
    zoneId: 'horo_gudru_wellega', stationedAt: 'Shambu Office', status: 'disposed',
  }),
];

/**
 * The people who hold the machines above.
 *
 * Names deliberately match the holders the fixture already used, so the driver
 * records and the sign-out history describe the same people rather than two
 * parallel casts. Licences are spread across every state the rules distinguish —
 * valid, expiring, lapsed, none at all — because a demo where every licence is
 * in order proves nothing about the checks.
 */
export const DEMO_DRIVERS: FleetDriver[] = [
  {
    driverId: 'DR-001', fullName: 'Obbo Girmaa Bekele', phone: '+251 911 204 118',
    employeeNumber: 'OAB-3312', employment: 'permanent',
    licenceNumber: 'ET-3-448127', licenceGrade: '3', licenceExpiry: ahead(412),
    zoneId: 'east_shewa', stationedAt: 'Adama Depot', status: 'active', version: 1,
  },
  {
    driverId: 'DR-002', fullName: 'Aaddee Caaltuu Nagaasaa', phone: '+251 912 776 043',
    employeeNumber: 'OAB-2874', employment: 'permanent',
    licenceNumber: 'ET-3-330916', licenceGrade: '3', licenceExpiry: ahead(233),
    zoneId: 'bale', stationedAt: 'Robe Machinery Yard', status: 'active', version: 1,
  },
  {
    // Holds PK-001, a pickup. Licence still valid, but only just — issuing a
    // road vehicle to her warns rather than refuses.
    driverId: 'DR-003', fullName: 'Aaddee Boontuu Hundee', phone: '+251 913 550 287',
    employeeNumber: 'OAB-4106', employment: 'permanent',
    licenceNumber: 'ET-2-771540', licenceGrade: '2', licenceExpiry: ahead(21),
    zoneId: 'east_shewa', stationedAt: 'Adama Depot', status: 'active', version: 1,
  },
  {
    // The case worth seeing: already out with TK-001, a truck, on a licence that
    // lapsed while the vehicle was signed out. Nothing recalls it automatically —
    // the register can only surface it, which is what the compliance view is for.
    driverId: 'DR-004', fullName: 'Obbo Dassaalanyi Tolaa', phone: '+251 911 908 336',
    employment: 'contract',
    licenceNumber: 'ET-4-118203', licenceGrade: '4', licenceExpiry: ago(9),
    zoneId: 'east_shewa', stationedAt: 'Adama Depot', status: 'active', version: 1,
  },
  {
    driverId: 'DR-005', fullName: 'Obbo Fiqaaduu Alamuu', phone: '+251 917 442 690',
    employeeNumber: 'OAB-5027', employment: 'permanent',
    licenceNumber: 'ET-1-620884', licenceGrade: '1', licenceExpiry: ahead(508),
    zoneId: 'jimma', stationedAt: 'Jimma Zonal Office', status: 'active', version: 1,
  },
  {
    // Daily labour, no licence on file. Holds an implement, which needs none —
    // so this issue is allowed, with a warning that a road move would not be.
    driverId: 'DR-006', fullName: 'Obbo Taaddasaa Roobaa', phone: '+251 918 113 725',
    employment: 'daily',
    zoneId: 'east_shewa', stationedAt: 'Adama Seed Site', status: 'active', version: 1,
  },
  {
    driverId: 'DR-007', fullName: 'Obbo Kabbadaa Tolaa', phone: '+251 911 337 052',
    employeeNumber: 'OAB-1998', employment: 'permanent',
    licenceNumber: 'ET-3-205774', licenceGrade: '3', licenceExpiry: ahead(690),
    zoneId: 'arsi', stationedAt: 'Asella Zonal Office', status: 'active', version: 1,
  },
  {
    driverId: 'DR-008', fullName: 'Aaddee Hawwii Guutuu', phone: '+251 916 820 471',
    employeeNumber: 'OAB-4471', employment: 'seconded',
    licenceNumber: 'ET-3-664219', licenceGrade: '3', licenceExpiry: ahead(147),
    zoneId: 'arsi', stationedAt: 'Asella Zonal Office', status: 'active', version: 1,
  },
  {
    // Nobody's machine at the moment, so the directory is not entirely busy.
    driverId: 'DR-009', fullName: 'Obbo Nagaash Baqqalaa', phone: '+251 910 665 194',
    employeeNumber: 'OAB-3760', employment: 'permanent',
    licenceNumber: 'ET-3-903518', licenceGrade: '3', licenceExpiry: ahead(365),
    zoneId: 'west_arsi', stationedAt: 'Shashamane Depot', status: 'active', version: 1,
  },
  {
    // Suspended, so the outright refusal is demonstrable without editing anything.
    driverId: 'DR-010', fullName: 'Aaddee Meskerem Taye', phone: '+251 915 271 608',
    employment: 'contract',
    licenceNumber: 'ET-2-540117', licenceGrade: '2', licenceExpiry: ahead(276),
    zoneId: 'jimma', stationedAt: 'Jimma Zonal Office', status: 'suspended', version: 1,
    notes: { en: 'Suspended pending the outcome of a road incident review.' },
  },
];

export const DEMO_ASSIGNMENTS: FleetAssignment[] = [
  {
    assignmentId: 'demo-as-1', assetId: 'TR-003', zoneId: 'east_shewa',
    assignedToUid: 'unlinked:Obbo Girmaa Bekele', assignedToName: 'Obbo Girmaa Bekele', driverId: 'DR-001',
    purpose: { en: 'Ploughing at Boset farmers cooperative' },
    issuedAt: ago(6), dueAt: ahead(3), returnedAt: null,
    meterOut: 872, meterIn: null, status: 'active', issuedByUid: 'demo-fleetofficer-001',
  },
  {
    assignmentId: 'demo-as-2', assetId: 'TR-006', zoneId: 'bale',
    assignedToUid: 'unlinked:Aaddee Caaltuu Nagaasaa', assignedToName: 'Aaddee Caaltuu Nagaasaa', driverId: 'DR-002',
    purpose: { en: 'Land preparation, Sinana demonstration plots' },
    // Deliberately overdue, so the dashboard has something to flag.
    issuedAt: ago(21), dueAt: ago(4), returnedAt: null,
    meterOut: 2180, meterIn: null, status: 'active', issuedByUid: 'demo-fleetofficer-001',
  },
  {
    assignmentId: 'demo-as-3', assetId: 'PK-001', zoneId: 'east_shewa',
    assignedToUid: 'unlinked:Aaddee Boontuu Hundee', assignedToName: 'Aaddee Boontuu Hundee', driverId: 'DR-003',
    purpose: { en: 'Extension officer field visits, Lume woreda' },
    issuedAt: ago(2), dueAt: ahead(12), returnedAt: null,
    meterOut: 83900, meterIn: null, status: 'active', issuedByUid: 'demo-fleetofficer-001',
  },
  {
    assignmentId: 'demo-as-4', assetId: 'TK-001', zoneId: 'east_shewa',
    assignedToUid: 'unlinked:Obbo Dassaalanyi Tolaa', assignedToName: 'Obbo Dassaalanyi Tolaa', driverId: 'DR-004',
    purpose: { en: 'Fertiliser delivery to Adama and Boset stores' },
    issuedAt: ago(1), dueAt: ahead(2), returnedAt: null,
    meterOut: 96100, meterIn: null, status: 'active', issuedByUid: 'demo-fleetofficer-001',
  },
  {
    assignmentId: 'demo-as-5', assetId: 'MC-001', zoneId: 'jimma',
    assignedToUid: 'unlinked:Obbo Fiqaaduu Alamuu', assignedToName: 'Obbo Fiqaaduu Alamuu', driverId: 'DR-005',
    purpose: { en: 'Coffee extension visits, Gomma woreda' },
    issuedAt: ago(9), dueAt: ahead(20), returnedAt: null,
    meterOut: 11800, meterIn: null, status: 'active', issuedByUid: 'demo-fleetofficer-001',
  },
  {
    assignmentId: 'demo-as-6', assetId: 'IM-002', zoneId: 'east_shewa',
    assignedToUid: 'unlinked:Obbo Taaddasaa Roobaa', assignedToName: 'Obbo Taaddasaa Roobaa', driverId: 'DR-006',
    purpose: { en: 'Row seeding at Adama seed multiplication site' },
    issuedAt: ago(4), dueAt: ahead(6), returnedAt: null,
    meterOut: 0, meterIn: null, status: 'active', issuedByUid: 'demo-fleetofficer-001',
  },
  // Closed rows, so the history table is not empty
  {
    assignmentId: 'demo-as-7', assetId: 'TR-001', zoneId: 'arsi',
    assignedToUid: 'unlinked:Obbo Kabbadaa Tolaa', assignedToName: 'Obbo Kabbadaa Tolaa', driverId: 'DR-007',
    purpose: { en: 'Ploughing, Tiyo woreda' },
    issuedAt: ago(34), dueAt: ago(20), returnedAt: ago(22),
    meterOut: 1265, meterIn: 1310, status: 'returned',
    issuedByUid: 'demo-fleetofficer-001', returnedByUid: 'demo-fleetofficer-001',
  },
  {
    assignmentId: 'demo-as-8', assetId: 'TR-001', zoneId: 'arsi',
    assignedToUid: 'unlinked:Aaddee Hawwii Guutuu', assignedToName: 'Aaddee Hawwii Guutuu', driverId: 'DR-008',
    purpose: { en: 'Harrowing, Digeluna Tijo woreda' },
    issuedAt: ago(15), dueAt: ago(8), returnedAt: ago(9),
    meterOut: 1310, meterIn: 1348, status: 'returned',
    issuedByUid: 'demo-fleetofficer-001', returnedByUid: 'demo-fleetofficer-001',
  },
];

export const DEMO_WORK_ORDERS: FleetWorkOrder[] = [
  {
    workOrderId: 'demo-wo-1', assetId: 'TR-004', zoneId: 'west_shewa',
    reportedByUid: 'demo-fleetofficer-001', reportedByName: 'Obbo Tashoomaa Waaqjiraa',
    reportedAt: ago(11),
    faultDescription: { en: 'Hydraulic leak on the left lift ram; loses pressure under load.' },
    severity: 'grounded', status: 'in_progress',
    assignedGarage: 'Ambo Machinery Yard', assignedTechnician: 'Obbo Solomon Warqu',
    partsUsed: [{ name: 'Hydraulic seal kit', quantity: 1, cost: 3200 }],
    labourCost: 1800, totalCost: 5000, meterAtReport: 7620,
    startedAt: ago(9), version: 3,
  },
  {
    workOrderId: 'demo-wo-2', assetId: 'TR-007', zoneId: 'west_arsi',
    reportedByUid: 'demo-fleetofficer-001', reportedByName: 'Obbo Tashoomaa Waaqjiraa',
    reportedAt: ago(26),
    faultDescription: { en: 'Clutch slipping badly. Replacement plate ordered from Adama.' },
    severity: 'grounded', status: 'awaiting_parts',
    assignedGarage: 'Shashamane Depot',
    partsUsed: [{ name: 'Clutch plate assembly', quantity: 1, cost: 14500 }],
    labourCost: 0, totalCost: 14500, meterAtReport: 5140,
    startedAt: ago(24), version: 3,
  },
  {
    workOrderId: 'demo-wo-3', assetId: 'PU-002', zoneId: 'borena',
    reportedByUid: 'demo-fleetofficer-001', reportedByName: 'Obbo Tashoomaa Waaqjiraa',
    reportedAt: ago(18),
    faultDescription: { en: 'Borehole pump not priming; suspect worn impeller.' },
    severity: 'grounded', status: 'awaiting_parts',
    assignedGarage: 'Yabelo Field Station',
    partsUsed: [{ name: 'Impeller set', quantity: 1, cost: 7400 }],
    labourCost: 0, totalCost: 7400, meterAtReport: 3110, version: 2,
  },
  {
    workOrderId: 'demo-wo-4', assetId: 'PK-004', zoneId: 'guji',
    reportedByUid: 'demo-fleetofficer-001', reportedByName: 'Obbo Tashoomaa Waaqjiraa',
    reportedAt: ago(5),
    faultDescription: { en: 'Front suspension knocking over rough road; insurance also lapsed.' },
    severity: 'grounded', status: 'triaged',
    assignedGarage: 'Negele Borana Office', meterAtReport: 208900, version: 2,
  },
  {
    workOrderId: 'demo-wo-5', assetId: 'IM-004', zoneId: 'jimma',
    reportedByUid: 'demo-fleetofficer-001', reportedByName: 'Obbo Tashoomaa Waaqjiraa',
    reportedAt: ago(3),
    faultDescription: { en: 'Two rotavator blades bent after striking a buried stone.' },
    severity: 'high', status: 'reported', meterAtReport: 0, version: 1,
  },
  {
    workOrderId: 'demo-wo-6', assetId: 'HV-002', zoneId: 'west_shewa',
    reportedByUid: 'demo-fleetofficer-001', reportedByName: 'Obbo Tashoomaa Waaqjiraa',
    reportedAt: ago(64),
    faultDescription: { en: 'Engine overheating repeatedly. Withdrawn pending assessment.' },
    severity: 'grounded', status: 'reported', meterAtReport: 2840, version: 1,
  },
  {
    workOrderId: 'demo-wo-7', assetId: 'TR-002', zoneId: 'arsi',
    reportedByUid: 'demo-fleetofficer-001', reportedByName: 'Obbo Tashoomaa Waaqjiraa',
    reportedAt: ago(41),
    faultDescription: { en: 'Cracked wing mirror and a blown work light.' },
    severity: 'low', status: 'verified',
    assignedGarage: 'Asella Zonal Office', assignedTechnician: 'Obbo Nugusee Gadaa',
    partsUsed: [{ name: 'Mirror assembly', quantity: 1, cost: 850 }, { name: 'Work lamp', quantity: 1, cost: 600 }],
    labourCost: 400, totalCost: 1850, meterAtReport: 3990,
    startedAt: ago(39), completedAt: ago(38), verifiedAt: ago(37),
    verifiedByUid: 'demo-fleetofficer-001', version: 5,
  },
  {
    workOrderId: 'demo-wo-8', assetId: 'PK-001', zoneId: 'east_shewa',
    reportedByUid: 'demo-fleetofficer-001', reportedByName: 'Obbo Tashoomaa Waaqjiraa',
    reportedAt: ago(52),
    faultDescription: { en: 'Routine 80,000 km service: oil, filters, brake pads.' },
    severity: 'medium', status: 'verified',
    assignedGarage: 'Adama Depot', assignedTechnician: 'Aaddee Meseret Bekele',
    partsUsed: [{ name: 'Service kit', quantity: 1, cost: 4200 }, { name: 'Brake pad set', quantity: 1, cost: 2600 }],
    labourCost: 1500, totalCost: 8300, meterAtReport: 80000,
    startedAt: ago(51), completedAt: ago(50), verifiedAt: ago(50),
    verifiedByUid: 'demo-fleetofficer-001', version: 5,
  },
];
