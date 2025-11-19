const express = require("express");
const {expressjwt: jwt} = require("express-jwt");
const jwks = require("jwks-rsa");
const {createProxyMiddleware} = require("http-proxy-middleware");


const app = express();
require("dotenv").config();

const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"] 
});


function injectUserHeader(req, res, next){
  const userInfo = {
    id: req.auth.sub
  }
  req.headers['x-user'] = JSON.stringify(userInfo)
  next()
}


app.use(
  "/users",
  checkJwt,
  injectUserHeader,
  createProxyMiddleware({
    target: "http://localhost:5000",
    changeOrigin: true
  })
);

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
