## Lightweight E-commerce Backend

### Overview
This project is a lightweight, flexible e-commerce backend built with NestJS and Prisma. It provides all the essential functionality needed for an e-commerce platform, including user authentication, product management, shopping cart operations, and order processing.

### Features
Authentication & Authorization

- JWT-based authentication
- Role-based access control (Customer/Admin)
- User registration and login

User Management

- User profiles
- Password hashing for security
- Role management

Product Management

- CRUD operations for products
- Advanced filtering (search, price range)
- Pagination support

Shopping Cart

- Add/update/remove items
- Persistent cart storage
- Item quantity management

Order Processing

- Order placement
- Order status tracking
- Order history
- Admin order management

API Documentation

- Swagger/OpenAPI integration
- Comprehensive endpoint documentation

### Tech Stack
- **Framework**: NestJS
- **Database ORM**: Prisma
- **Authentication**: Passport.js with JWT
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest

### Getting Started
Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database

Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lightweight-e-commerce-backend.git
cd lightweight-e-commerce-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Create a .env file with the following variables
DATABASE_URL=postgresql://username:password@localhost:5432/ecommerce
JWT_SECRET=your_jwt_secret
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run start:dev
```

The API will be available at http://localhost:3000.

### API Endpoints
Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive access token
- `GET /auth/profile` - Get current user profile

Users
- `GET /users/me` - Get current user details
- `POST /users` - Create a new user

Products
- `GET /product` - Get all products with filtering
- `GET /product/:id` - Get a specific product
- `POST /product` - Create a product (Admin only)
- `PATCH /product/:id` - Update a product (Admin only)
- `DELETE /product/:id` - Delete a product (Admin only)

Cart
- `GET /cart` - Get user's cart
- `POST /cart` - Add item to cart
- `PATCH /cart` - Update cart item quantity
- `DELETE /cart/:productId` - Remove item from cart
- `POST /cart/clear` - Clear cart

Orders
- `POST /orders` - Place an order
- `GET /orders` - Get user's orders
- `GET /orders/admin` - Get all orders (Admin only)
- `PATCH /orders/admin/:orderId/status` - Update order status (Admin only)
- `GET /orders/admin/:orderId/history` - Get order history (Admin only)

### Testing
Unit Tests

Run the unit tests locally:

```bash
npm run test
```

With coverage report:

```bash
mpm run test:cov
```

Docker Testing Environment

Run tests in a Docker container:

```bash
# Build the docker container
docker build -t lightweight-e-commerce-backend-app .

# Run the docker container with the unit tests
docker run -e DATABASE_URL=postgresql://user:password@host:5432/testdb lightweight-e-commerce-backend-app
```

### Database Management

```bash
# Drop the database
npx prisma migrate reset

# Apply migrations
npx prisma migrate dev
```

### CI/CD
This project uses GitHub Actions for continuous integration. The workflow automatically runs tests when code is pushed to any branch. See [the CI workflow configuration](.github/workflows/tests.yml) for details.

### Deployment

For production deployment:

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start:prod
```

```
Project Structure

src/
├── auth/              # Authentication related files
├── cart/              # Shopping cart functionality
├── order/             # Order processing
├── product/           # Product management
├── prisma/            # Prisma schema and migrations
├── user/              # User management
├── app.module.ts      # Main application module
└── main.ts            # Application entry point
```