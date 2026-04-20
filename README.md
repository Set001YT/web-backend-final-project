# Kazakh Restaurant - Full-Stack Application

Complete full-stack restaurant management system with **JWT Authentication**, **Role-Based Access Control (RBAC)**, **Shopping Cart**, and **Order Management**.

## Technologies

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **Architecture**: MVC Pattern
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

##  Project Structure (MVC)

```
kazakh-menu-api/
├── config/
│   └── db.js                    # MongoDB connection
├── models/
│   ├── User.js                  # User schema with bcrypt
│   ├── MenuItem.js              # Menu item schema
│   ├── Review.js                # Review schema
│   └── Order.js                 # Order schema
├── controllers/
│   ├── authController.js        # Auth logic (register, login)
│   ├── menuItemController.js    # Menu CRUD logic
│   ├── reviewController.js      # Review CRUD logic
│   ├── adminController.js       # Admin promotion logic
│   └── orderController.js       # Order management logic
├── routes/
│   ├── auth.js                  # Auth routes
│   ├── menuItems.js             # Menu routes with RBAC
│   ├── reviews.js               # Review routes
│   ├── admin.js                 # Admin routes
│   └── orders.js                # Order routes
├── middleware/
│   ├── auth.js                  # JWT verification
│   └── rbac.js                  # Role-based access control
├── public/
│   └── index.html               # Frontend SPA
├── server.js                    # Main entry point
├── .env                         # Environment variables (Didn't published for security reasons)
├── screenshots/                 # Screenshots of Postman tests
├── .gitignore
├── package.json                 # Dependencies
├── Final Project(Admin Promotion).postman_collection.json   # Additional collection of exported tests
└── Kazakh_Menu_API_Final_Project.postman_collection.json    # Collection of exported tests
```

## Three Related Objects

### 1. **MenuItem** (Primary Object)

Restaurant menu dishes with full CRUD operations.

**Schema:**
```javascript
{
  name: String,           // Dish name (required, min 2 chars)
  description: String,    // Description (required, min 10 chars)
  price: Number,          // Price in Tenge (required, >= 0)
  category: String,       // Appetizers | Main Courses | Dessert | Drinks
  imageUrl: String,       // Image URL (optional)
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

**Access Control:**
- **GET** (all/single) - Public
- **POST/PUT/DELETE** - Admin only

---

### 2. **Review** (Secondary Object)

User reviews for menu items with ratings and comments.

**Schema:**
```javascript
{
  user: ObjectId,         // Reference to User
  menuItem: ObjectId,     // Reference to MenuItem
  rating: Number,         // 1-5 stars (required)
  comment: String,        // Review text (5-500 chars)
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

**Relationships:** 
- Review → User (many-to-one)
- Review → MenuItem (many-to-one)

**Access Control:**
- **GET** - Public
- **POST** - Authenticated users
- **PUT/DELETE** - Owner or Admin

**Business Rule:** One user can review each dish only once (unique index)

---

### 3. **Order** (Third Object)

Customer orders with items, quantities, and status tracking.

**Schema:**
```javascript
{
  user: ObjectId,         // Reference to User (who placed order)
  items: [{
    menuItem: ObjectId,   // Reference to MenuItem
    name: String,         // Dish name (snapshot)
    quantity: Number,     // Quantity ordered
    price: Number         // Price at time of order
  }],
  totalAmount: Number,    // Total order amount (auto-calculated)
  status: String,         // pending | confirmed | completed | cancelled
  createdAt: Date,        // Order timestamp
  updatedAt: Date         // Last update timestamp
}
```

**Relationships:**
- Order → User (many-to-one)
- Order → MenuItem (many-to-many through items array)

**Access Control:**
- **GET all** - User sees own orders, Admin sees all
- **GET single** - Owner or Admin
- **POST** - Authenticated users
- **PUT status** - Admin only
- **DELETE** - Admin only

**Business Logic:** 
- Total amount auto-calculated from items
- Price snapshot stored at order time (price changes don't affect old orders)

---

## Role-Based Access Control (RBAC)

### User Model

```javascript
{
  name: String,
  email: String,          // Unique
  password: String,       // Hashed with bcrypt
  role: String,           // "user" or "admin" (default: "user")
  createdAt: Date,
  updatedAt: Date
}
```

### Role Permissions

| Action | Public | User | Admin |
|--------|--------|------|-------|
| **Authentication** |
| Register | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ |
| **Menu Items** |
| GET (view) | ✅ | ✅ | ✅ |
| POST (create) | ❌ | ❌ | ✅ |
| PUT (update) | ❌ | ❌ | ✅ |
| DELETE | ❌ | ❌ | ✅ |
| **Reviews** |
| GET (view) | ✅ | ✅ | ✅ |
| POST (create) | ❌ | ✅ | ✅ |
| PUT (own) | ❌ | ✅ | ✅ |
| PUT (any) | ❌ | ❌ | ✅ |
| DELETE (own) | ❌ | ✅ | ✅ |
| DELETE (any) | ❌ | ❌ | ✅ |
| **Orders** |
| GET (own) | ❌ | ✅ | ✅ |
| GET (all) | ❌ | ❌ | ✅ |
| POST (create) | ❌ | ✅ | ✅ |
| PUT (status) | ❌ | ❌ | ✅ |
| DELETE | ❌ | ❌ | ✅ |
| **Admin Promotion** |
| GET (a list of users) | ❌ | ❌ | ✅ |
| POST (promote) | ❌ | ❌ | ✅ |
| POST (demote) | ❌ | ❌ | ✅ |

### How Roles Are Handled

**1. Password Security:**
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Automatic hashing via Mongoose pre-save hook
- `select: false` on password field

**2. JWT Authentication:**
- Token generated on register/login
- Expires in 30 days
- Payload contains `userId`
- Verified by `authenticate` middleware

**3. Role Checks:**
- `authenticate` middleware: Verifies JWT and attaches user to `req.user`
- `requireAdmin` middleware: Checks `req.user.role === 'admin'`
- Controller logic: Ownership checks for reviews and orders

**4. Middleware Chain:**
```javascript
// Public route
router.get('/menu-items', getAllMenuItems);

// Admin only route
router.post('/menu-items', authenticate, requireAdmin, createMenuItem);

// Authenticated users route
router.post('/orders', authenticate, createOrder);

// Owner or Admin route (checked in controller)
router.put('/reviews/:id', authenticate, updateReview);
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires token)

### Menu Items
- `GET /api/menu-items` - Get all items (public)
- `GET /api/menu-items/:id` - Get single item (public)
- `POST /api/menu-items` - Create item (admin only)
- `PUT /api/menu-items/:id` - Update item (admin only)
- `DELETE /api/menu-items/:id` - Delete item (admin only)

**Query Parameters:**
- `?category=Appetizers` - Filter by category
- `?minPrice=1000&maxPrice=5000` - Filter by price range
- `?search=beshbarmak` - Search in name/description

### Reviews
- `GET /api/reviews` - Get all reviews (public)
- `GET /api/reviews/menu-item/:menuItemId` - Get reviews for specific dish (public)
- `GET /api/reviews/:id` - Get single review (public)
- `POST /api/reviews` - Create review (authenticated)
- `PUT /api/reviews/:id` - Update review (owner or admin)
- `DELETE /api/reviews/:id` - Delete review (owner or admin)

### Orders
- `GET /api/orders` - Get orders (user sees own, admin sees all)
- `GET /api/orders/:id` - Get single order (owner or admin)
- `POST /api/orders` - Create order (authenticated)
- `PUT /api/orders/:id` - Update order status (admin only)
- `DELETE /api/orders/:id` - Delete order (admin only)


### Admin promotion
- `POST /api/admin/promote` - Grant the admin role to the user
- `POST /api/admin/demote` - Revoke the admin role to the user
- `GET  /api/admin/users` - Get a list of all users

---

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/your-username/kazakh-menu-api.git
cd kazakh-menu-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup MongoDB Atlas
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create M0 cluster (free tier)
3. Create database user with password
4. Configure Network Access: Add IP `0.0.0.0/0`
5. Get connection string from "Connect" → "Connect your application"

### 4. Create `.env` File
```env
MONGODB_URI=Your_MongoDB_URI
PORT=Your_Port
JWT_SECRET=Your_JWT_Secret
```

**Important:** Replace `username`, `password`, and `cluster` with your actual MongoDB Atlas credentials.

### 5. Start Server
```bash
npm start
```

Server runs on `http://localhost:{Your_Port}`

**Expected output:**
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:Your_Port
📡 API available at http://localhost:Your_Port/api
```

---

## Web Application Features

Open `http://localhost:Your_Port` in browser for the interactive Single Page Application (SPA):

### Features:

**1. Authentication System**
- User registration with role selection (user/admin)
- Login with JWT token storage
- Automatic authentication check on page load
- Session persistence via localStorage

**2. Menu Management (Admin)**
- Create, edit, delete menu items
- Upload dish images
- Categorize dishes (Appetizers, Main Courses, Dessert, Drinks)
- Form validation

**3. Menu Browsing (All Users)**
- Grid view of all dishes
- Click on dish to view details in modal
- View average ratings and review count
- Filter and search capabilities

**4. Review System**
- View all reviews for each dish
- Average rating calculation
- Users can write reviews (one per dish)
- Edit/delete own reviews
- Admin can delete any review

**5. Shopping Cart**
- Add dishes to cart with quantity selection
- Cart persists in localStorage
- Modify quantities (+/-)
- Remove items
- Real-time total calculation
- Cart badge with item count

**6. Order Management**
- Place orders from cart
- View order history
- Track order status (pending → confirmed → completed)
- Admin can update order status
- Order details with itemized list

**7. Responsive Design**
- Works on desktop, tablet, and mobile
- Modal windows for detailed views
- Tab-based navigation
- Dynamic UI based on user role

---
## QA Testing

This project was also tested from a QA perspective using Postman.

- Tested REST API endpoints (GET, POST, PUT, DELETE)
- Verified HTTP status codes (200, 201, 400, 401, 403)
- Validated JSON response structure and data correctness
- Tested authentication (JWT) and role-based access control (RBAC)
- Covered positive and negative scenarios (valid/invalid input, unauthorized access)
- Performed testing of core business flows: authentication, menu CRUD, reviews, orders

### Example Test Scenarios
- Unauthorized request → 401 Unauthorized
- User attempting admin action → 403 Forbidden
- Invalid input data → validation error
  
---

## Testing with Postman

### Import Collections
1. Import `Kazakh_Menu_API_Final_Project.postman_collection.json` and `Final Project(Admin Promotion).postman_collection.json`
2. Collections contains **25 tests** in **6 folders**:
   - **1. Auth** (3 tests)
   - **2. Menu Items (Public)** (2 tests)
   - **3. Menu Items (Admin Protected)** (6 tests)
   - **4. Reviews** (4 tests)
   - **5. Orders** (7 tests)
   - **6. Admin Promotion** (3 tests)

### Test Flow

**Step 1: Authentication**
```json
// Register Admin
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "admin123",
  "role": "admin"
}
// Copy token from response

// Register User
POST /api/auth/register
{
  "name": "Regular User",
  "email": "user@test.com",
  "password": "user123",
  "role": "user"
}
// Copy token from response
```

**Step 2: Menu Items (Admin)**
```json
// Create Menu Item
POST /api/menu-items
Headers: Authorization: Bearer <admin_token>
{
  "name": "Beshbarmak",
  "description": "Traditional Kazakh dish with boiled meat and flat noodles",
  "price": 3500,
  "category": "Main Courses"
}
// Copy _id from response
```

**Step 3: Reviews (User)**
```json
// Create Review
POST /api/reviews
Headers: Authorization: Bearer <user_token>
{
  "menuItem": "<menu_item_id>",
  "rating": 5,
  "comment": "Excellent traditional dish! Highly recommend."
}
```

**Step 4: Orders (User)**
```json
// Create Order
POST /api/orders
Headers: Authorization: Bearer <user_token>
{
  "items": [
    {
      "menuItem": "<menu_item_id>",
      "quantity": 2
    }
  ]
}
// Order total calculated automatically
```

**Step 5: Admin Actions**
```json
// Update Order Status
PUT /api/orders/<order_id>
Headers: Authorization: Bearer <admin_token>
{
  "status": "confirmed"
}


```
**Step 6: Admin Promotion**
```json
// Promote the admin role
POST /api/admin/promote
Headers: Authorization: Bearer <admin_token>
{
  "email": "user2@test.com"
}

```

### Test Results Summary

| Category | Tests | Success ✅ | Expected Failures ❌ |
|----------|-------|-----------|---------------------|
| Auth | 3 | 3 | 0 |
| Menu (Public) | 2 | 2 | 0 |
| Menu (Admin) | 6 | 3 | 3 |
| Reviews | 4 | 3 | 1 |
| Orders | 7 | 5 | 2 |
| Admin Promotion | 3 | 3 | 0 |
| **Total** | **25** | **19** | **6** |

**Expected failures demonstrate proper RBAC:**
- User cannot create/update/delete menu items (403)
- Unauthenticated requests blocked (401)
- Users can only access their own resources

---

## Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Tokens**: Secure tokens with 30-day expiration
3. **Role-Based Access**: Middleware enforcement at route level
4. **Input Validation**: Mongoose schema validation
5. **Error Handling**: Proper HTTP status codes
6. **Ownership Checks**: Users can only modify their own reviews/orders
7. **Environment Variables**: Sensitive data in .env (not in git)
8. **CORS Enabled**: Cross-origin resource sharing for frontend
9. **Unique Constraints**: Email uniqueness, one review per user per dish

---

## Database Schema Relationships

```
User (1) ----< (Many) Review
User (1) ----< (Many) Order

MenuItem (1) ----< (Many) Review
MenuItem (1) ----< (Many) Order.items

Review (Many) >---- (1) User
Review (Many) >---- (1) MenuItem

Order (Many) >---- (1) User
Order.items (Many) >---- (1) MenuItem
```

**Referential Integrity:**
- All ObjectId references use Mongoose `ref` for population
- Deleting a user/menu item doesn't cascade (manual cleanup needed)
- Reviews tied to specific menu items
- Orders snapshot item details (name, price) at order time

---

## Deployment

### Backend Deployment (Render)

1. **Push code to GitHub**
```bash
git add .
git commit -m "Final project ready for deployment"
git push origin main
```

2. **Create Render account** at [render.com](https://render.com)

3. **Create New Web Service (My example)** 
   - Connect GitHub repository
   - Name: `kazakh-restaurant-api`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add Environment Variables**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your secret key
   - `PORT`: 3000 (Render sets this automatically)

5. **Deploy**: Click "Create Web Service"

6. **Get URL (My example)**: `https://kazakh-restaurant-asset-iglikov.onrender.com`

### Frontend Deployment

Frontend is served from the same backend via `express.static('public')`, so it deploys automatically with the backend.

**Access your app at:** `https://kazakh-restaurant-asset-iglikov.onrender.com`

---

## Live Demo

**Application URL:** https://kazakh-restaurant-asset-iglikov.onrender.com/  
**API Base URL:** https://kazakh-restaurant-asset-iglikov.onrender.com/api  
**GitHub Repository:** https://github.com/Set001YT/web-backend-final-project

**Test Credentials:**
- Admin: admin@test.com / admin123
- User1: user@test.com / user123
- User2: user2@test.com /user2134
*Note: Free tier may take 30-60 seconds to wake up from sleep after inactivity.*
---

## Author

**Name**: Asset Iglikov  
**Group**: SE-2434  
**Course**: WEB Technologies 2 (Back End) | Samat Tankeyev  
**College/University**: Astana IT University (AITU)  
**Project**: Final Project - Full-Stack Restaurant Management System

---

## License

ISC

---

## Future Enhancements

- Email notifications for order status changes
- Payment gateway integration
- Real-time order tracking with WebSockets
- Image upload for menu items (Cloudinary/AWS S3)
- Advanced search and filtering
- User profiles with order history
- Restaurant analytics dashboard
- Multi-language support (Kazakh, Russian, English)
- Delivery address management
- Promo codes and discounts
