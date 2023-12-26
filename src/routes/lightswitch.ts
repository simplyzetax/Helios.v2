import { app } from "..";
import { verifyToken } from "../middleware/verifytoken";
import wrapRoute from "../aids/middlewarewrapper";

// Usage
app.get("/wow", wrapRoute([verifyToken], (c) => {
    return c.json({ message: "wow" });
}));