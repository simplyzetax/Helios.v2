import path from "node:path";
import fs from "node:fs/promises";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import app from "..";
import Hashing from "../utils/hashing";
import UUID from "../utils/uuid";
import { nexus } from "../utils/error";
import wrapRoute from "../utils/middlewarewrapper";
import { verifyToken, verifyTokenWithUser } from "../middleware/verifytoken";
import { hotfixOverrides } from "./overrides";
import type { IReplaceableHotfix } from "../types/overrides";

const S3_CREDENTIALS = {
    accessKeyId: "37ddc36f81fbb183628ae5beb01acf59",
    secretAccessKey: "2d40f74534f5b8571db175d4f9afa7fc4389fdc88625d8c5c337cee12910e70a"
};

const s3Client = new S3Client({
    region: 'auto',
    endpoint: 'https://018c0016ff5a7036ad1f7e576e5da792.r2.cloudflarestorage.com/nexus',
    credentials: S3_CREDENTIALS
});

const cloudFiles: unknown[] = [];

app.get("/fortnite/api/cloudstorage/system", wrapRoute([verifyToken], async (c) => {
    if (cloudFiles.length > 0 && hotfixOverrides.length === 0) {
        return c.json(cloudFiles);
    }

    const dir = path.join(import.meta.dir, "../../", "hotfixes");
    const dirRead = await fs.readdir(dir);

    cloudFiles.splice(0, cloudFiles.length);

    const promises = dirRead.filter(name => name.toLowerCase().endsWith(".ini")).map(async (name) => {
        const filePath = path.join(dir, name);
        const file = Bun.file(filePath);
        const parsedStats = await fs.stat(filePath);

        const useHotfixes = hotfixOverrides.length > 0;
        const dataToHash = useHotfixes ? JSON.stringify(hotfixOverrides) : JSON.stringify(file);
        const length = useHotfixes ? dataToHash.length : (await file.text()).length;
        const uploaded = useHotfixes ? Date.now() : parsedStats.mtimeMs;

        cloudFiles.push({
            uniqueFilename: name,
            filename: name,
            hash: Hashing.sha1(dataToHash),
            hash256: Hashing.sha256(dataToHash),
            length: length,
            contentType: "application/octet-stream",
            uploaded: uploaded,
            storageType: "S3",
            storageIds: { id: UUID.g() },
            doNotCache: true,
        });
    });

    await Promise.all(promises);
    return c.json(cloudFiles);
}));

app.get("/fortnite/api/cloudstorage/system/:file", wrapRoute([verifyToken], async (c) => {
    const requestedFile = c.req.param("file");

    try {
        const file = Bun.file(path.join(import.meta.dir, "../../", "hotfixes", requestedFile));
        let textFile = await file.text();

        textFile = hotfixOverrides.reduce((text: string, override: IReplaceableHotfix) =>
            `${text}\n[${override.header}]\n${override.key}=${override.value}`, textFile)
            .replace(/\[\[/g, "[").replace(/\]\]/g, "]")
            .replace(/^(#|;).*/gm, "").replace(/\n{2,}/g, "\n")

        return c.sendIni(textFile);
    } catch {
        return c.sendError(nexus.cloudstorage.fileNotFound.originatingService(import.meta.file.replace(".ts", "")))
    }
}));

app.get("/fortnite/api/cloudstorage/user/:accountId", wrapRoute([verifyTokenWithUser],async (c) => {
    let content, uploaded;

    try {
        const getObject = await s3Client.send(new GetObjectCommand({ Bucket: "nexus", Key: `user/${c.user?.accountId}/ClientSettings.sav` }));
        if (!getObject.Body) return c.sendError(nexus.cloudstorage.fileNotFound.originatingService(import.meta.file.replace(".ts", "")));
        content = await getObject.Body.transformToString();
        uploaded = getObject.LastModified;
    } catch {
        content = new Date().toISOString();
        uploaded = Date.now();
    }

    return c.json([{
        uniqueFilename: "ClientSettings.Sav",
        filename: "ClientSettings.Sav",
        hash: Hashing.sha1(content),
        hash256: Hashing.sha256(content),
        length: Buffer.byteLength(content),
        contentType: "application/octet-stream",
        uploaded,
        storageType: "S3",
        storageIds: {},
        accountId: c.user?.accountId,
        doNotCache: false
    }]);
}));

const FILE_NAME = "clientsettings.sav";
const BUCKET_NAME = "nexus";

app.get("/fortnite/api/cloudstorage/user/:accountId/:file", wrapRoute([verifyTokenWithUser], async (c) => {
    if (!c.user) return c.sendError(nexus.authentication.authenticationFailed.variable(["token"]));

    const filename = c.req.param("file").toLowerCase();

    if (filename !== FILE_NAME) {
        return c.sendStatus(404);
    }

    try {
        const getObject = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `user/${c.user.accountId}/${FILE_NAME}`
        }));

        if (!getObject.Body) return c.sendError(nexus.cloudstorage.fileNotFound.originatingService(import.meta.file.replace(".ts", "")));

        const content = await getObject.Body.transformToString();

        return c.body(content);
    } catch (error) {
        console.error(error);
        return c.sendStatus(500);
    }
}));

app.put("/fortnite/api/cloudstorage/user/:accountId/:file", wrapRoute([verifyTokenWithUser], async (c) => {
    if (!c.user) return c.sendError(nexus.authentication.authenticationFailed.variable(["token"]));

    const filename = c.req.param("file").toLowerCase();

    if (filename !== FILE_NAME) {
        return c.sendStatus(404);
    }

    try {
        const rawBody = await c.req.arrayBuffer();
        const buffer = Buffer.from(rawBody);

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `user/${c.user.accountId}/${FILE_NAME}`,
            Body: buffer
        }));

        return c.sendStatus(204);
    } catch (error) {
        console.error(error);
        return c.sendStatus(500);
    }
}));