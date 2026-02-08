const express = require("express");
const { expressjwt: jwt } = require("express-jwt");
const jwks = require("jwks-rsa");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
require("dotenv").config();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user"],
  }),
);

app.get("/health", (req, res) => {
  res.json({
    status: "Gateway OK",
    port: process.env.PORT || 4000,
    timestamp: new Date().toISOString(),
  });
});

const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
});

function injectUserHeader(req, res, next) {
  const userInfo = {
    id: req.auth.sub,
  };
  req.headers["x-user"] = JSON.stringify(userInfo);
  next();
}

// function logger(req,res,next){
//   console.log(req.path)
//   console.log("redirect to user service")
//   next()
// }

// function logger2(req, res,next){
//   console.log(req.path)
//   console.log("redirect to ai service")
//   next()
// }

// Error handling JWT -> JSON
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res
      .status(401)
      .json({ message: "Unauthorized", detail: err.message });
  }
  next(err);
});

// User service proxy
app.use(
  "/users",
  checkJwt,
  createProxyMiddleware({
    target: `${process.env.USER_SERVICE}/users`,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        const userInfo = { id: req.auth.sub };
        // console.log(`Proxying: ${req.method} ${req.url} -> ${process.env.USER_SERVICE}${req.url}`); // dodaj to
        // const userInfo = { id: "auth0|123" };
        proxyReq.setHeader("x-user", JSON.stringify(userInfo));
      },
    },
  }),
);

// AI service - CV generation endpoints (/ai/*)
app.use(
  "/api/ai",
  checkJwt,
  createProxyMiddleware({
    target: `${process.env.AI_SERVICE}`,
    changeOrigin: true,
    timeout: 120000, // 2 minutes timeout
    proxyTimeout: 120000,
    pathRewrite: (path) => `/ai${path}`, // /generate/cv -> /ai/generate/cv
    on: {
      proxyReq: (proxyReq, req) => {
        const userInfo = { id: req.auth.sub };
        proxyReq.setHeader("x-user", JSON.stringify(userInfo));
      },
    },
  }),
);

app.use(
  "/api/jobs",
  checkJwt,
  createProxyMiddleware({
    target: process.env.AI_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      "^/api/jobs": "/api/jobs",
    },
    on: {
      proxyReq: (proxyReq, req) => {
        if (proxyReq.path === "/" || proxyReq.path === "") {
          proxyReq.path = "/api/jobs";
        }
        const userInfo = { id: req.auth.sub };
        proxyReq.setHeader("x-user", JSON.stringify(userInfo));
      },
    },
  }),
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
