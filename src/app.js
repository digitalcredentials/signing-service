import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import issue from './issue.js'
import generateSeed from './generate.js';

export async function build(opts = {}) {

    var app = express();

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors())

    app.get('/', function (req, res, next) {
        res.send({ message: 'signing-service server status: ok.' })
    });

    app.post("/instance/:instanceId/credentials/sign",
        async (req, res) => {
            try {
                const instanceId = req.params.instanceId //the issuer instance/tenant with which to sign
                const unSignedVC = req.body;
                if (!req.body || !Object.keys(req.body).length) return res.status(400).send({message: 'A verifiable credential must be provided in the body', code: 400})
                const signedVC = await issue(unSignedVC, instanceId)
                return res.json(signedVC)
            } catch (error) {
                console.log(error);
                const code = error.code || 403
                const message = `The signing service threw an error: ${error.message || error}`
                return res.status(code).json({message, code});
            }
        })

    app.get('/seedgen', async (req, res, next) => {
        const newSeed = await generateSeed()
        res.json(newSeed)
    });

    return app;

}
