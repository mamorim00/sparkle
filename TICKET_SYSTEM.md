# Ticket System Implementation

## Overview
A comprehensive support ticket system has been implemented for handling disputes, refunds, complaints, and other customer issues. The system allows users to submit tickets and admins to manage them through a dedicated dashboard.

## Features Implemented

### 1. User Features
- **Submit Tickets**: Users can create support tickets with:
  - Type: dispute, refund, complaint, technical, other
  - Priority: low, medium, high, urgent
  - Subject and detailed description
  - Optional booking ID reference
- **View Tickets**: Users can see all their submitted tickets with status updates
- **Easy Access**: "Support" link in navbar (visible only to logged-in users)

### 2. Admin Features
- **Tickets Dashboard Tab**: New tab in admin dashboard showing:
  - Stats: Open, In Progress, Resolved, and Total tickets
  - Full ticket list with color-coded status and priority
  - Search functionality
  - Action buttons:
    - Start Working (open → in_progress)
    - Mark Resolved (in_progress → resolved)
    - Close Ticket (any status → closed)
  - Priority management dropdown
  - Message count display

### 3. Security & Data Structure
- **Firestore Rules**: Comprehensive security rules ensuring:
  - Users can only read their own tickets
  - Admins can read and list all tickets
  - Users can create tickets with validated fields
  - Users can update only messages field
  - Admins can update status, priority, and admin-specific fields
- **Type Safety**: Full TypeScript types for all ticket entities

## File Structure

### New Files Created
1. **`src/types/ticket.ts`**: TypeScript type definitions
   - `TicketType`, `TicketStatus`, `TicketPriority` types
   - `Ticket` and `TicketMessage` interfaces
   - `CreateTicketData` interface

2. **`src/components/TicketsTab.tsx`**: Admin tickets management UI
   - Stats display
   - Ticket list with filtering
   - Status and priority management
   - Color-coded indicators

3. **`src/app/support/page.tsx`**: User ticket submission page
   - Ticket creation form
   - User's ticket history
   - Real-time status updates

4. **`TICKET_SYSTEM.md`**: This documentation file

### Modified Files
1. **`firestore.rules`**: Added tickets collection rules (lines 173-204)
2. **`src/app/admin/dashboard/page.tsx`**:
   - Added tickets state and fetching
   - Added tickets tab navigation
   - Imported TicketsTab component
   - Added updateTicketStatus function
3. **`src/components/Navbar.tsx`**: Added Support link for logged-in users

## Usage

### For Users
1. Log in to your account
2. Click "Support" in the navbar
3. Fill out the ticket form with:
   - Type of issue
   - Priority level
   - Subject (max 100 chars)
   - Detailed description (max 1000 chars)
   - Optional booking ID
4. Click "Submit Ticket"
5. View your tickets in the right panel

### For Admins
1. Log in with admin credentials
2. Go to Admin Dashboard
3. Click the "Tickets" tab
4. View all open tickets (badge shows count)
5. Take action on tickets:
   - Click "Start Working" to begin addressing the issue
   - Click "Mark Resolved" when issue is fixed
   - Click "Close Ticket" to close without resolving
   - Change priority using the dropdown
6. Use search to filter tickets

## Data Flow

### Creating a Ticket
```
User fills form → Submit → Firestore tickets collection
                           ↓
                  Server validates (Firestore rules)
                           ↓
                  Ticket created with:
                  - userId, userName, userEmail (from auth)
                  - type, subject, description (from form)
                  - status: "open"
                  - priority (from form)
                  - bookingId (optional)
                  - messages: []
                  - createdAt, updatedAt timestamps
```

### Admin Updates
```
Admin clicks action → updateTicketStatus function
                           ↓
                  Firestore updateDoc with:
                  - status change
                  - optional priority change
                  - updatedAt timestamp
                  - resolvedAt & resolvedBy (if resolved/closed)
                           ↓
                  fetchAllData refreshes ticket list
```

## Firestore Collection Structure

### tickets/{ticketId}
```typescript
{
  id: string;
  userId: string;              // Ticket creator
  userName: string;            // Display name
  userEmail: string;           // Contact email

  type: "dispute" | "refund" | "complaint" | "technical" | "other";
  subject: string;             // Brief summary
  description: string;         // Detailed explanation
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";

  bookingId?: string;          // Related booking (optional)
  cleanerId?: string;          // Related cleaner (optional)
  cleanerName?: string;

  messages: TicketMessage[];   // Message thread

  assignedTo?: string;         // Admin user ID
  adminNotes?: string;         // Internal notes
  resolvedAt?: string;         // Resolution timestamp
  resolvedBy?: string;         // Admin who resolved

  createdAt: string;
  updatedAt: string;
}
```

## Testing Checklist

### User Flow
- [ ] User can access /support page when logged in
- [ ] User is redirected to login if not authenticated
- [ ] User can submit ticket with all required fields
- [ ] Form validation works (max lengths, required fields)
- [ ] User sees their tickets in the right panel
- [ ] Ticket status displays correctly (open, in_progress, resolved, closed)
- [ ] Priority displays with correct colors
- [ ] Message count shows if messages exist

### Admin Flow
- [ ] Admin can access Tickets tab in dashboard
- [ ] Open ticket count badge displays correctly
- [ ] All tickets display in the list
- [ ] Status colors are correct (red=open, yellow=in_progress, green=resolved, gray=closed)
- [ ] Priority colors are correct (red=urgent, orange=high, yellow=medium, blue=low)
- [ ] "Start Working" button appears for open tickets
- [ ] "Mark Resolved" button appears for in_progress tickets
- [ ] "Close Ticket" button appears for open/in_progress tickets
- [ ] Priority dropdown updates ticket priority
- [ ] Search filters tickets by subject/userName/userEmail/type
- [ ] Ticket stats update after actions

### Security
- [ ] Users cannot read other users' tickets
- [ ] Users cannot update ticket status (only admins)
- [ ] Users cannot create tickets with invalid types
- [ ] Users cannot create tickets with status other than "open"
- [ ] Non-admins cannot access admin dashboard

### Edge Cases
- [ ] Empty ticket list displays correctly
- [ ] Long descriptions don't break layout
- [ ] Tickets without bookingId display correctly
- [ ] Tickets with 0 messages display correctly
- [ ] Rapid status changes don't cause issues
- [ ] Form resets after successful submission

## Future Enhancements

### Potential Additions
1. **Message Threading**: Add ability to reply to tickets
2. **Email Notifications**: Notify users when status changes
3. **File Attachments**: Allow users to upload screenshots/documents
4. **Ticket Assignment**: Allow admins to assign tickets to specific team members
5. **SLA Tracking**: Track response times and highlight overdue tickets
6. **Canned Responses**: Quick reply templates for common issues
7. **Ticket Categories**: More granular categorization
8. **Customer Satisfaction**: Rating system after resolution
9. **Ticket Export**: Download tickets as CSV/PDF
10. **Advanced Filters**: Filter by date range, status, priority

## Notes

- Tickets are stored in Firestore and benefit from real-time updates
- No API routes were needed - Firestore rules handle security
- The system is fully client-side with server-side security via Firestore rules
- Message threading is supported in the data model but UI is not yet implemented
- Admin notes field exists but has no UI (can be added later)
