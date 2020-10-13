# HouseHoldBot
Google Application Script fo filling spreadssheets with household accounts using the LINE Message API.  
It is converting typescript using clasp.

## Spreadsheet composition to record
### sheet 1 household data
Deposit and withdrawal recods are recorded as household account book data.  
The following items are recorded.
- date entered
- input money
- food expenses
- electricity cost
- water charges
- communication costs
- other expenses
- balance

### sheet 2 user session data
Input record of the accessing user.
The following items are recorded.
- UserID (ID recorded in Message API)
- Deposit / withdrawal type
- comment
- Expected input value
- Access time

### sheet 3 log data
Input data and error recording.
The following items are recorded.
- input time
- UserID (ID recorded in Message API)
- Log type (info/error)
- content
