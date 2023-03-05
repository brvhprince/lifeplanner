import express from "express";
import env from "dotenv";
import cors from "cors";

env.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOSTNAME || "0.0.0.0";

app.listen(port, host, () =>
	console.log(`Server ${host} is listening on port ${port}`)
);

export default app;
