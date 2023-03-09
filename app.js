import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import issue from './issue.js'

export async function build(opts = {}) {

    var app = express();

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cors())

    app.get('/', function (req, res, next) {
        res.send({ status: true, message: 'hello' })
    });

    app.post("/credentials/issue", 
        async (req, res) => {
            try {
                const unSignedVC = req.body;
                const signedVC = await issue(unSignedVC)
                return res.json(signedVC)
            } catch (error) {
                console.log(error);
                return res.status(403).json(error);
            }
        })
    return app;

}
