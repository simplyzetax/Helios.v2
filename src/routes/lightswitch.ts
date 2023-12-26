import { app, config } from "..";
import { verifyToken } from "../middleware/verifytoken";
import wrapRoute from "../aids/middlewarewrapper";
import { nexus } from "../aids/error";
import { OAuthUtility } from "../aids/clientauth";
import type { User } from "../models/user";

const getStatusResponse = (user: User, userAllowed: string[]) => ({
    serviceInstanceId: "fortnite",
    status: "UP",
    message: "Nexus is up.",
    maintenanceUri: "https://discord.gg/nexusfn",
    overrideCatalogIds: ["a7f138b2e51945ffbfdacc1af0541053"],
    allowedActions: userAllowed,
    banned: user?.banned || false,
    launcherInfoDTO: {
        appName: "Fortnite",
        catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
        namespace: "fn",
    },
});

app.get("/lightswitch/api/service/Fortnite/status", async (c) => {
    const user = c.user;
    const userAllowed = user?.banned ? ["NONE"] : ["PLAY", "DOWNLOAD"];

    if (!user && !OAuthUtility.validateClient(c)) {
        return c.sendError(nexus.authentication.invalidHeader);
    }

    return c.json(getStatusResponse(user!, userAllowed));
});

app.get("/lightswitch/api/service/bulk/status", wrapRoute([verifyToken], async (c) => {
    const user = c.user;
    let userAllowed = ["PLAY", "DOWNLOAD"];
    if (user?.banned) userAllowed = ["NONE"];

    return c.json([getStatusResponse(user!, userAllowed)]);
}));

app.get("/fortnite/api/version", (c) => {

    return c.json({
        app: "fortnite",
        serverDate: new Date().toISOString(),
        overridePropertiesVersion: "unknown",
        cln: c.version.cl,
        build: c.version.build,
        moduleName: "Fortnite-Core",
        buildDate: config.dates.seasonStart,
        version: c.version.build,
        branch: `Release-${c.version.build}`,
        modules: {
            "Epic-LightSwitch-AccessControlCore": {
                cln: "17237679",
                build: "b2130",
                buildDate: config.dates.currentTime,
                version: "1.0.0",
                branch: "trunk",
            },
            "epic-xmpp-api-v1-base": {
                cln: "5131a23c1470acbd9c94fae695ef7d899c1a41d6",
                build: "b3595",
                buildDate: config.dates.currentTime,
                version: "0.0.1",
                branch: "master",
            },
            "epic-common-core": {
                cln: "17909521",
                build: "3217",
                buildDate: config.dates.currentTime,
                version: "3.0",
                branch: "TRUNK",
            },
        },
    });
});

app.get("/fortnite/api/v2/versioncheck/:os", (c) => {

    const os = c.req.param("os");

    //TODO: Add hotfix overrides

    /*const allowedVersions = ["++Fortnite+Release-15.30-CL-15341163-Windows"];

    if (!allowedVersions.includes(version) || hotfixOverrides.length > 0) return c.json({
        "type": "SOFT_UPDATE"
    })*/

    return c.json({
        type: "NO_UPDATE",
    });
});