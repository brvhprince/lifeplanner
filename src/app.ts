import express from "express";
import env from "dotenv";
import cors from "cors";
import formData from "express-form-data";
import os from "os";
import path from "path";

import { makeCallback, authMiddleware } from "./frameworks";
import {
	createUser,
	notFound,
	welcome,
	userLogin,
	emailVerification,
	fetchUserDetails,
	createAccount,
	newTwoFa,
	twoFaVerification,
	passwordVerification,
	pinCodeVerification
} from "./controllers";
import { validateEnvironmentVariables } from "./frameworks/environment";

env.config();

validateEnvironmentVariables();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
	formData.parse({
		uploadDir: os.tmpdir(),
		autoClean: true
	})
);

// delete from the request all empty files (size == 0)
app.use(formData.format());

// union the body and the files
app.use(formData.union());

if (process.env.STORAGE === "local") {
	const basePath = path.join(__dirname, String(process.env.LOCAL_FOLDER_NAME));
	app.use("/static", express.static(basePath));
}

app.use(cors());

/* To resolve application health check */
app.get("/", makeCallback(welcome));

app.post("/users", makeCallback(createUser));
app.post("/login", makeCallback(userLogin));
app.post("/verify/twofa", makeCallback(twoFaVerification));
// app.post("/password/forgot", makeCallback(createUser));
// app.post("/password/reset", makeCallback(createUser));
// app.post("/verification/send", makeCallback(createUser));
app.get("/verification/email/:code", makeCallback(emailVerification));

/* Protected routes */
app.get("/twofa", authMiddleware, makeCallback(newTwoFa));
app.post("/verify/password", authMiddleware, makeCallback(passwordVerification));
app.get(
	"/verify/pincode/:code",
	authMiddleware,
	makeCallback(pinCodeVerification)
);
app.get("/users/details", authMiddleware, makeCallback(fetchUserDetails));
app.post("/accounts", authMiddleware, makeCallback(createAccount));

/* To resolve not found routes */
app.use(makeCallback(notFound));

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOSTNAME || "0.0.0.0";

app.listen(port, host, () =>
	console.log(`Server ${host} is listening on port ${port}`)
);

export default app;
