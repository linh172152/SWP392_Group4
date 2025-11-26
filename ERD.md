# Entity Relationship Diagram (ERD)
## EV Battery Swap System Database Schema

```mermaid
erDiagram
    users ||--o{ vehicles : "owns"
    users ||--o| wallets : "has"
    users ||--o{ bookings : "creates"
    users ||--o{ transactions : "makes"
    users ||--o{ user_subscriptions : "subscribes"
    users ||--o{ notifications : "receives"
    users ||--o{ station_ratings : "rates"
    users ||--o{ support_tickets : "creates"
    users ||--o{ ticket_replies : "replies"
    users ||--o{ payments : "makes"
    users ||--o{ battery_transfer_logs : "transfers"
    users ||--o{ battery_history : "tracks"
    users ||--o{ staff_schedules : "schedules"
    users }o--|| stations : "assigned_to (staff)"
    
    stations ||--o{ batteries : "contains"
    stations ||--o{ bookings : "receives"
    stations ||--o{ transactions : "processes"
    stations ||--o{ battery_pricings : "has"
    stations ||--o{ station_ratings : "rated_by"
    stations ||--o{ battery_transfer_logs : "from/to"
    stations ||--o{ staff_schedules : "scheduled_at"
    stations ||--o{ users : "manages"
    
    batteries ||--o{ battery_history : "tracked_in"
    batteries ||--o{ battery_transfer_logs : "transferred"
    batteries ||--o{ transactions : "old/new"
    batteries ||--o{ vehicles : "current"
    
    vehicles ||--o{ bookings : "books_for"
    vehicles ||--o{ transactions : "swaps"
    vehicles ||--o{ battery_history : "tracks"
    vehicles }o--|| batteries : "current_battery"
    
    bookings ||--|| transactions : "completes"
    bookings ||--o{ battery_history : "tracks"
    bookings }o--|| stations : "at"
    bookings }o--|| vehicles : "for"
    bookings }o--|| users : "by"
    bookings }o--o| users : "checked_by_staff"
    
    transactions ||--|| payments : "paid_by"
    transactions ||--o| station_ratings : "rated"
    transactions }o--|| bookings : "from"
    transactions }o--|| stations : "at"
    transactions }o--|| vehicles : "for"
    transactions }o--|| users : "by"
    transactions }o--|| users : "processed_by_staff"
    transactions }o--|| batteries : "old_battery"
    transactions }o--|| batteries : "new_battery"
    
    payments }o--|| users : "paid_by"
    payments }o--o| transactions : "for_transaction"
    payments }o--o| user_subscriptions : "for_subscription"
    payments }o--o| topup_packages : "topup_package"
    
    service_packages ||--o{ user_subscriptions : "subscribed_to"
    user_subscriptions }o--o{ payments : "paid_by"
    
    support_tickets ||--o{ ticket_replies : "has"
    support_tickets }o--|| users : "created_by"
    support_tickets }o--o| users : "assigned_to_staff"
    
    topup_packages ||--o{ payments : "used_in"
    
    users {
        uuid user_id PK
        string full_name
        string email UK
        string password_hash
        string phone
        string avatar
        enum role
        uuid station_id FK
        enum status
        datetime created_at
        datetime updated_at
        datetime last_login_at
    }
    
    stations {
        uuid station_id PK
        string name
        string address
        decimal latitude
        decimal longitude
        int capacity
        json supported_models
        string operating_hours
        enum status
        datetime created_at
        datetime updated_at
    }
    
    batteries {
        uuid battery_id PK
        string battery_code UK
        uuid station_id FK
        string model
        decimal capacity_kwh
        decimal voltage
        int current_charge
        enum status
        datetime last_charged_at
        decimal health_percentage
        int cycle_count
        datetime created_at
        datetime updated_at
    }
    
    vehicles {
        uuid vehicle_id PK
        uuid user_id FK
        string license_plate UK
        enum vehicle_type
        string make
        string model
        int year
        string battery_model
        uuid current_battery_id FK
        datetime created_at
        datetime updated_at
    }
    
    bookings {
        uuid booking_id PK
        string booking_code UK
        uuid user_id FK
        uuid vehicle_id FK
        uuid station_id FK
        string battery_model
        datetime scheduled_at
        enum status
        datetime checked_in_at
        uuid checked_in_by_staff_id FK
        boolean is_instant
        uuid locked_battery_id FK
        uuid locked_subscription_id FK
        int locked_swap_count
        decimal locked_wallet_amount
        uuid locked_wallet_payment_id FK
        boolean use_subscription
        datetime hold_expires_at
        string cancellation_reason
        string cancellation_notes
        string notes
        datetime created_at
    }
    
    transactions {
        uuid transaction_id PK
        string transaction_code UK
        uuid booking_id FK UK
        uuid user_id FK
        uuid vehicle_id FK
        uuid station_id FK
        uuid old_battery_id FK
        uuid new_battery_id FK
        uuid staff_id FK
        datetime swap_at
        datetime swap_started_at
        datetime swap_completed_at
        int swap_duration_minutes
        enum payment_status
        decimal amount
        string notes
        datetime created_at
    }
    
    payments {
        uuid payment_id PK
        uuid transaction_id FK UK
        uuid subscription_id FK
        uuid user_id FK
        decimal amount
        enum payment_method
        enum payment_status
        string payment_gateway_ref
        datetime paid_at
        uuid topup_package_id FK
        enum payment_type
        json metadata
        datetime created_at
    }
    
    wallets {
        uuid wallet_id PK
        uuid user_id FK UK
        decimal balance
        datetime created_at
        datetime updated_at
    }
    
    service_packages {
        uuid package_id PK
        string name
        string description
        decimal price
        int swap_limit
        int duration_days
        json battery_models
        boolean is_active
        int battery_capacity_kwh
        enum billing_cycle
        json benefits
        json metadata
        datetime created_at
        datetime updated_at
    }
    
    user_subscriptions {
        uuid subscription_id PK
        uuid user_id FK
        uuid package_id FK
        datetime start_date
        datetime end_date
        int remaining_swaps
        enum status
        boolean auto_renew
        datetime cancelled_at
        string cancellation_reason
        json metadata
        datetime created_at
        datetime updated_at
    }
    
    station_ratings {
        uuid rating_id PK
        uuid user_id FK
        uuid station_id FK
        uuid transaction_id FK UK
        int rating
        string comment
        datetime created_at
        datetime updated_at
    }
    
    battery_history {
        uuid history_id PK
        uuid battery_id FK
        uuid booking_id FK
        uuid vehicle_id FK
        uuid station_id FK
        uuid actor_user_id FK
        enum action
        string notes
        json metadata
        datetime created_at
    }
    
    battery_transfer_logs {
        uuid transfer_id PK
        uuid battery_id FK
        uuid from_station_id FK
        uuid to_station_id FK
        uuid transferred_by FK
        string transfer_reason
        datetime transferred_at
        string notes
        enum transfer_status
    }
    
    battery_pricings {
        uuid pricing_id PK
        string battery_model
        uuid station_id FK
        decimal price
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    staff_schedules {
        uuid schedule_id PK
        uuid staff_id FK
        uuid station_id FK
        date shift_date
        timestamptz shift_start
        timestamptz shift_end
        enum status
        string notes
        datetime created_at
        datetime updated_at
    }
    
    support_tickets {
        uuid ticket_id PK
        string ticket_number UK
        uuid user_id FK
        uuid assigned_to_staff_id FK
        enum category
        string subject
        string description
        enum priority
        enum status
        datetime resolved_at
        datetime created_at
        datetime updated_at
    }
    
    ticket_replies {
        uuid reply_id PK
        uuid ticket_id FK
        uuid user_id FK
        string message
        boolean is_staff
        datetime created_at
    }
    
    notifications {
        uuid notification_id PK
        uuid user_id FK
        string type
        string title
        string message
        boolean is_read
        json data
        datetime created_at
    }
    
    topup_packages {
        uuid package_id PK
        string name
        string description
        decimal topup_amount
        decimal bonus_amount
        decimal actual_amount
        boolean is_active
        datetime created_at
        datetime updated_at
    }
```

## Key Relationships

### Core Entities
- **users**: Central entity (DRIVER, STAFF, ADMIN)
- **stations**: Battery swap stations
- **batteries**: Physical battery inventory
- **vehicles**: User vehicles

### Transaction Flow
1. **bookings** → User books a battery swap
2. **transactions** → Actual swap happens (1:1 with booking)
3. **payments** → Payment for the swap
4. **station_ratings** → User rates the station (1:1 with transaction)

### Subscription Flow
1. **service_packages** → Available subscription packages
2. **user_subscriptions** → User subscribes to a package
3. **payments** → Payment for subscription
4. **bookings** → Uses subscription for swaps

### Support Flow
1. **support_tickets** → User creates a ticket
2. **ticket_replies** → Staff/user replies to ticket

### Battery Management
1. **battery_history** → Tracks all battery movements
2. **battery_transfer_logs** → Tracks battery transfers between stations
3. **battery_pricings** → Pricing for different battery models

## Important Constraints

### Unique Constraints
- `users.email` - Unique
- `batteries.battery_code` - Unique
- `vehicles.license_plate` - Unique
- `bookings.booking_code` - Unique
- `transactions.transaction_code` - Unique
- `transactions.booking_id` - Unique (1:1 relationship)
- `station_ratings.transaction_id` - Unique (1 rating per transaction)
- `wallets.user_id` - Unique (1 wallet per user)
- `payments.transaction_id` - Unique (1 payment per transaction)

### Foreign Key Relationships
- All relationships properly defined with cascade deletes where appropriate
- Many-to-many relationships handled through junction tables

