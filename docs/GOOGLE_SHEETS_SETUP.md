# Evara Yoga — Google Sheets setup

The backend can mirror startup data into one Google Spreadsheet without storing passwords in the Sheet.

## Tabs created automatically

When the first Google Sheets request succeeds, the backend creates these tabs if they do not already exist:

- Clients
- Bookings
- Contacts

## Required Vercel environment variables

Add these to the Vercel project for Production (and Preview if you want to test there):

```text
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SHEET_NAME=Clients
GOOGLE_SHEETS_BOOKINGS_SHEET_NAME=Bookings
GOOGLE_SHEETS_CONTACTS_SHEET_NAME=Contacts
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Do not commit the private key to GitHub.

## Google Cloud setup

1. Create/select a Google Cloud project.
2. Enable the Google Sheets API.
3. Create a service account.
4. Create a JSON key for that service account.
5. Copy the service account email into `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
6. Copy the JSON private key into `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, keeping the `\n` line breaks.
7. Create the Google Spreadsheet.
8. Share the spreadsheet with the service-account email as **Editor**.
9. Copy only the spreadsheet ID from the spreadsheet URL into `GOOGLE_SHEETS_SPREADSHEET_ID`.
10. Redeploy the Vercel project.

## What gets written

### Clients
Signup creates a row with:
Client ID, Name, Email, Phone, Signup Date, Last Login, Status.

Signin updates Last Login.

### Bookings
Successful booking creates a row with:
Booking ID, Schedule ID, Customer Name, Email, Phone, Notes, Status, Created At.

### Contacts
Contact form submissions create a row with:
Message ID, Name, Email, Phone, Message, Status, Created At.

Passwords are never sent to Google Sheets.

## Safe failure behavior

Google Sheets is a secondary reporting system. If Sheets is unavailable, signup, booking, and contact submission are not intentionally failed because of the Sheets logging step. The backend logs the Sheets error instead.

## Vercel/domain

The custom domain does not require changing the spreadsheet integration. Keep the Google credentials server-side in Vercel environment variables only.
