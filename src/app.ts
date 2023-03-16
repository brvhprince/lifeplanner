import express from "express";
import env from "dotenv";
import cors from "cors";
import { makeCallback, authMiddleware } from "./frameworks";
import { createUser, notFound, welcome, userLogin, emailVerification } from "./controllers";
import { validateEnvironmentVariables } from "./frameworks/environment";

env.config();

validateEnvironmentVariables();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

/* To resolve application health check */
app.get("/", makeCallback(welcome));

app.post("/users", makeCallback(createUser));
app.post("/login", makeCallback(userLogin));
app.post("/password/forgot", makeCallback(createUser));
app.post("/password/reset", makeCallback(createUser));
app.post("/verification/send", makeCallback(createUser));
app.get("/verification/email/:code", makeCallback(emailVerification));

/* Protected routes */
app.get("/users/details", authMiddleware, makeCallback(createUser))

/* To resolve not found routes */
app.use(makeCallback(notFound));

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOSTNAME || "0.0.0.0";

app.listen(port, host, () =>
	console.log(`Server ${host} is listening on port ${port}`)
);

export default app;
