import { app, config } from '..';
import { getAuthUser, verifyToken } from '../middleware/verifytoken';
import wrapRoute from '../utils/middlewarewrapper';
import { nexus } from '../utils/error';
import { OAuthUtility } from '../utils/clientauth';
import type { User } from '../models/user';
const getStatusResponse = (user: User, clientAllowedActions: string[]) => ({
    serviceInstanceId: 'fortnite',
    status: 'UP',
    message: 'Nexus is up.',
    maintenanceUri: 'https://discord.gg/nexusfn',
    overrideCatalogIds: ['a7f138b2e51945ffbfdacc1af0541053'],
    allowedActions: clientAllowedActions,
    banned: user?.banned || false,
    launcherInfoDTO: {
        appName: 'Fortnite',
        catalogItemId: '4fe75bbc5a674f4f9b356b5c90567da5',
        namespace: 'fn'
    }
});

app.get('/lightswitch/api/service/Fortnite/status', async (c) => {
    const user = await getAuthUser(c);
    if (!user && !OAuthUtility.validateClient(c)) return c.sendError(nexus.authentication.invalidHeader);
    let clientAllowedActions = user?.banned ? ['NONE'] : ['PLAY', 'DOWNLOAD'] ?? ['NONE'];
    if (!user) clientAllowedActions = ['NONE'];
    return c.json(getStatusResponse(user!, clientAllowedActions));
});

app.get(
    '/lightswitch/api/service/bulk/status',
    wrapRoute([verifyToken], async (c) => {
        const user = await getAuthUser(c);
        const clientAllowedActions = user?.banned ? ['NONE'] : ['PLAY', 'DOWNLOAD'];
        return c.json([getStatusResponse(user!, clientAllowedActions)]);
    })
);

app.get('/fortnite/api/version', (c) =>
    c.json({
        app: 'fortnite',
        serverDate: new Date().toISOString(),
        overridePropertiesVersion: 'unknown',
        cln: c.memory.cl,
        build: c.memory.build,
        moduleName: 'Fortnite-Core',
        buildDate: config.dates.seasonStart,
        version: c.memory.build,
        branch: `Release-${c.memory.build}`,
        modules: {
            'Epic-LightSwitch-AccessControlCore': {
                cln: '17237679',
                build: 'b2130',
                buildDate: config.dates.seasonStart,
                version: '1.0.0',
                branch: 'trunk'
            },
            'epic-xmpp-api-v1-base': {
                cln: '5131a23c1470acbd9c94fae695ef7d899c1a41d6',
                build: 'b3595',
                buildDate: config.dates.seasonStart,
                version: '0.0.1',
                branch: 'master'
            },
            'epic-common-core': {
                cln: '17909521',
                build: '3217',
                buildDate: config.dates.seasonStart,
                version: '3.0',
                branch: 'TRUNK'
            }
        }
    })
);

//TODO: Implement SOFT_UPDATE for hotfix overrides and ini file changes
app.get('/fortnite/api/v2/versioncheck/:os', (c) => c.json({ type: 'NO_UPDATE' }));
