import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import { initializeStatusManager } from './status.js';
import issue from './issue.js'
import revoke from './revoke.js'
import generateSeed from './generate.js';
import verifyAccess from './verifyAuthHeader.js'
import { getConfig } from './config.js';

const { enableStatusAllocation } = getConfig();

export async function build(opts = {}) {

    if (enableStatusAllocation) await initializeStatusManager()
    
    var app = express();

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors())

    app.get('/', function (req, res, next) {
        
        res.send({ message: 'signing-service server status: ok.' })
    });

    app.post("/instance/:instanceId/credentials/issue", 
        async (req, res) => {
            try {
                const instanceId = req.params.instanceId //the issuer instance/tenant with which to sign
                try {
                    await verifyAccess(req.headers.authorization, instanceId)
                } catch (e) {
                    return res.status(e.code).send(e.message)
                }
                const unSignedVC = req.body;
                if (!req.body || !Object.keys(req.body).length ) return res.status(400).send('A verifiable credential must be provided in the body')
                const signedVC = await issue(unSignedVC, instanceId)
                return res.json(signedVC)
            } catch (error) {
                console.log(error);
                return res.status(403).json(error);
            }
        })

    // the body will look like:  {credentialId: '23kdr', credentialStatus: [{type: 'StatusList2021Credential', status: 'revoked'}]}
    app.post("/instance/:instanceId/credentials/status", 
        async (req, res) => {
            try {
                if (!enableStatusAllocation) return res.status(405).send("The status service has not been enabled.")
                const instanceId = req.params.instanceId 
                try {
                    await verifyAccess(req.headers.authorization, instanceId)
                } catch (e) {
                    return res.status(e.code).send(e.message)
                }
                if (!req.body || !Object.keys(req.body).length ) return res.status(400).send('No update request was provided in the body')
                
                const {credentialId, credentialStatus} = req.body;
                const status = credentialStatus[0].status
                const statusType = credentialStatus[0].type
                if (statusType === 'StatusList2021Credential') {
                    const statusResponse = await revoke(credentialId, status)
                    return res.status(statusResponse.code).send(statusResponse.message)
                } else {
                    return res.status(400).send('StatusList2021Credential is the only supported revocation mechanism.')
                }
            } catch (error) {
                console.log(error);
                return res.status(500).json(error);
            }
        })

        app.get('/seedgen', async (req, res, next) => {
            const newSeed = await generateSeed()
            res.send(newSeed)
        });

    return app;

}
