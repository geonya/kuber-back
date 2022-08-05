# Kuber : Backend

## User Entity:

- id
- createdAt
- updatedAt

- email
- password
- role

## User CRUD:

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email

## Restaurant

- Edit Restaurant
- Delete Restaurant
- Create Restaurant
- Search Restaurant

### Dish

- Create Dish
- Edit Dish
- Delete Dish

## Order

- Order CRUD
- Orders Subscription (Owner, Customer, Delivery)

## Subscriptions

- Orders Subscription:

  - Pending Orders (subscribe : New Order, trigger : createOrder(newOrder))
  - Order Status (Customer, Delivery, Owner) (subscribe : Order Update, trigger : Edit Order)
  - Pending Pickup Order (Driver) (subscribe : Order Update, trigger : Edit Order)

## Payment

- Payments(CRON) with paddle

## Testing

- restaurants
- order
