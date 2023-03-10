import express from "express";
import env from "dotenv";
import cors from "cors";
import { makeCallback } from "./frameworks";
import { createUser, notFound, welcome } from "./controllers";

env.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

/* To resolve application health check */
app.get("/", makeCallback(welcome));

app.post("/users", makeCallback(createUser));

/* To resolve not found routes */
app.use(makeCallback(notFound));

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOSTNAME || "0.0.0.0";

app.listen(port, host, () =>
	console.log(`Server ${host} is listening on port ${port}`)
);

export default app;
