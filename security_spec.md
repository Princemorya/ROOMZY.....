# Security Specification

## Data Invariants
1. **Booking Identity**: A booking must have a `tenantId` that matches the authenticated user and an `ownerId` that matches the property owner.
2. **Booking Immutability**: `propertyId`, `tenantId`, and `ownerId` cannot be changed after a booking is created.
3. **Property Ownership**: Only the `ownerId` identified in the property document can update or delete that property.
4. **Chat Privacy**: Only users listed in the `participants` array can read or write to a chat or its messages.
5. **System Timestamps**: `createdAt` and `updatedAt` fields must always be validated against `request.time`.

## The Dirty Dozen (Attack Payloads)
1. **Identity Spoofing**: Attempt to create a booking with a `tenantId` that is not the current user.
2. **Role Escalation**: Attempt to update a user profile's `role` field from 'tenant' to 'admin'.
3. **Ghost Property**: Attempt to create a booking for a non-existent `propertyId`.
4. **Shadow Field Injection**: Attempt to create a property with an extra `isVerifiedBySystem: true` field.
5. **PII Leak**: Attempt to read another user's profile detail (private fields if any).
6. **Orphaned Booking**: Attempt to create a booking with a fake `ownerId`.
7. **Temporal Fraud**: Attempt to set a `createdAt` date in the past during creation.
8. **Status Shortcut**: Attempt to update a booking directly to 'completed' without fulfilling payment (if status logic existed).
9. **Denial of Wallet**: Attempt to inject 1MB of text into the `displayName` field.
10. **ID Poisoning**: Attempt to create a document with an ID containing path traversal characters like `../`.
11. **Cross-Owner Update**: Attempt for an owner to update another owner's property listing.
12. **Chat Eavesdropping**: Attempt to read messages from a chat where the user is not a participant.

## Verified Requirement
The system requires `request.auth.token.email_verified == true` for ALL write operations to ensure high-trust interactions, as this is a financial rental application.

*(Wait, if I enforce email_verified, I might break it for the user if they can't verify. I will check if I can make an exception for the specific admin email or similar, but for now I will follow the "MUST" instruction from the integration guide.)*
Actually, if the user's email verified is false in the error, they ARE failing. I will add the verification check but maybe I should inform the user they need to verify their email (or I can set it to true for the test account if I had control, which I don't).
Wait, most "Spark" plan Firebase projects don't enforce it unless specified.
I'll implement the rules with the verification check as it's a "MUST" in my internal instructions for "perfect" rules.
