const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const ejs = require("ejs");
const cors = require("cors");
const https = require("https");
const fs = require("fs");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const serviceRouter = require("./routes/serviceRoutes");
const userRouter = require("./routes/userRoutes");
const appointmentRouter = require("./routes/appointmentRoutes");
const Transaction = require("./routes/Transaction");
const app = express();

const options = {
  key: fs.readFileSync("/path/to/private/key.pem"),
  cert: fs.readFileSync("/path/to/certificate.pem")
};
const socketServer = https.createServer(options, app);
const io = require("socket.io")(socketServer);

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

io.on("connection", (client) => {
  client.on("event", (data) => {
    /* … */
    console.log("jjj", data);
  });
  client.on("disconnect", () => {
    /* … */
  });

  client.emit(`customer`, 123);
});

socketServer.listen(process.env.SOCKET_PORT, () => {
  console.log("Socket connect");
});

// const limiter = rateLimit({
//   max: 200,
//   windowMs: 60 * 60 * 12000,
//   message: 'Too many requests from this IP, please try again in an hour!'
// });
// app.use('/api', limiter);

app.use(express.json({ limit: "10kb" }));

app.use(mongoSanitize());

app.use(xss());

app.use(cors());

app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price"
    ]
  })
);

app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.io = io;
  req.requestTime = new Date().toISOString();
  next();
});
app.set("view engine", "ejs");

// 3) ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/services", serviceRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/transaction", Transaction);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
