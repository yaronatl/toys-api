# Toys REST API

REST API for a toys shop: users sign up and log in, and logged-in users manage their own toys.
Stack: Node.js, Express, MongoDB (Mongoose), Joi, bcrypt, JWT.

Live on Vercel: <url>

## Setup
Create a `.env` file (see `.env.example`) with:
- `MONGO_DB` - MongoDB connection string (local or Atlas)
- `TOKEN_SECRET` - secret used to sign the JWT tokens

```
npm install
npm start          # http://localhost:3001
npm run seed       # optional, adds sample toys
```

## Endpoints
Lists return 10 toys per page; `?skip=` is the page number. Protected routes need the `x-api-key` header with the token from login.

- `GET /toys` - list, optional `?s=`, `?category=`, `?sort=`, `?reverse=yes`
- `GET /toys/search?s=` - search in name or info
- `GET /toys/category/:catname`
- `GET /toys/prices?min=&max=`
- `GET /toys/single/:id`
- `GET /toys/count`
- `POST /toys` - add a toy (token)
- `PUT /toys/:id` - edit your toy (token)
- `DELETE /toys/:id` - delete your toy, admin can delete any (token)
- `POST /users` - sign up
- `POST /users/login` - returns the token

The docs page is served at `/`.
