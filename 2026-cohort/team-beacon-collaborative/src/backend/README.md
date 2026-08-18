\# Beacon Backend \& Firebase Handoff



This folder contains the Firebase initialization, authentication helpers, Firestore helpers, and security test suite for the Beacon Collaborative project.



\## Files



\### firebaseConfig.js



Initializes the Firebase Web App and exports:



app

auth

db



Frontend code should import auth and db from this file.



\### authHelpers.js



Provides authentication helpers for the frontend.



Available functions:



loginWithEmail(auth, email, password)

logout(auth)

watchAuthState(auth, callback)



Example import:



import { auth } from "./firebaseConfig.js";



import {

&#x20; loginWithEmail,

&#x20; logout,

&#x20; watchAuthState,

} from "./authHelpers.js";



\### firebaseHelpers.js



Provides Firestore operations for the main application workflow.



Available functions:



getCurrentUserProfile(db, auth)



createDonation(

&#x20; db,

&#x20; auth,

&#x20; {

&#x20;   title,

&#x20;   description,

&#x20;   quantity,

&#x20; }

)



getAvailableDonations(db)



reserveDonation(

&#x20; db,

&#x20; auth,

&#x20; donationId

)



getMyReservations(db, auth)



approveOrganization(

&#x20; db,

&#x20; organizationId

)



rejectOrganization(

&#x20; db,

&#x20; organizationId

)



Example import:



import {

&#x20; auth,

&#x20; db,

} from "./firebaseConfig.js";



import {

&#x20; createDonation,

&#x20; getAvailableDonations,

&#x20; reserveDonation,

} from "./firebaseHelpers.js";



\## Firestore Collections



\### users



Document ID:



Firebase Authentication UID



Expected fields:



role

accountStatus

displayName

organizationId



Supported application roles:



admin

donor

recipient



Common account states:



active

suspended

deactivated



\### organizations



Expected fields:



name

type

verificationStatus

createdBy



Supported organization types:



donor

recipient



Verification states:



pending

approved

rejected

suspended



New organizations must begin as:



pending



Only an authenticated admin may update organization verification state.



\### donations



Expected fields:



organizationId

createdBy

status

title

description

quantity



Donation status values used by the security rules:



available

reserved

picked\_up

cancelled



Approved donors may create donations only for their own organization.



\### reservations



Expected fields:



donationId

recipientOrganizationId

createdBy

status



Reservation status values:



active

cancelled

completed



\## Important Reservation Rule



The reservation document ID must equal the donation document ID.



Example:



donations/abc123

reservations/abc123



Do not generate a separate reservation ID.



The reserveDonation() helper handles this automatically.



Reservation creation and donation status changes are performed together in a Firestore transaction:



donation status:

available -> reserved



AND



matching reservation document is created



Both changes succeed together or neither succeeds.



This prevents two recipients from successfully reserving the same donation.



\## Core Application Flow



The intended MVP flow is:



Organization submits registration

&#x20;       ↓

organization verificationStatus = pending

&#x20;       ↓

Admin approves organization

&#x20;       ↓

verificationStatus = approved

&#x20;       ↓

Donor creates donation

&#x20;       ↓

Recipient views available donations

&#x20;       ↓

Recipient calls reserveDonation()

&#x20;       ↓

Donation becomes reserved

\+

Reservation is created atomically



\## Security Enforcement



Frontend checks are provided for clearer UI errors, but the frontend is not the security boundary.



Firestore Security Rules enforce:



\- authentication requirements

\- active account requirements

\- role-based access control

\- organization verification

\- organization ownership

\- cross-organization isolation

\- protected ownership fields

\- admin-only organization verification

\- reservation availability

\- atomic reservation creation

\- default deny for unmatched collections



The application should not rely on hiding buttons or pages as authorization.



\## Security Tests



Security Rules tests are located in:



firestore.rules.test.js



Run the Firestore emulator from the project root:



firebase emulators:start --only firestore



Then, in another terminal:



node src\\backend\\firestore.rules.test.js



The test suite covers successful operations and intentionally blocked operations, including:



\- unauthenticated access

\- role access

\- organization boundaries

\- suspended users

\- organization self-approval attempts

\- ownership-field changes

\- invalid reservation creation

\- atomic reservation behavior

\- double-reservation attempts



PERMISSION\_DENIED messages are expected during tests that intentionally verify blocked actions.



The important result is:



All current security tests passed.



\## Frontend Integration Notes



Use the exported helper functions instead of duplicating Firestore logic inside UI event handlers.



For example, a Reserve button should call:



await reserveDonation(

&#x20; db,

&#x20; auth,

&#x20; donationId

);



Do not separately:



1\. create a reservation

2\. update the donation



The helper already performs those operations atomically.



Likewise, donor listing creation should use:



await createDonation(

&#x20; db,

&#x20; auth,

&#x20; {

&#x20;   title,

&#x20;   description,

&#x20;   quantity,

&#x20; }

);



Firestore Security Rules remain authoritative even when these helpers are used.

