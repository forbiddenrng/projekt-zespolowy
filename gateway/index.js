const express = require("express");
const { expressjwt: jwt } = require("express-jwt");
const jwks = require("jwks-rsa");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
require("dotenv").config();

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
    }
    }
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
