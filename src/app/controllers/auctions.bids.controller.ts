import * as auctions from '../models/auctions.bids.model';
import Logger from "../../config/logger";
import {Request, Response} from "express";
import * as Console from "console";
import * as users from "../models/users.model";

/**
 * read an auction bid from database
 * @param req
 * @param res
 */
const getbid = async (req: Request, res: Response) : Promise<void> =>
{
    Logger.http(`GET all auction bids`);
    const id = req.params.id;
    const logincheck = await users.loginchecker();
    if(logincheck !== true) {
        try {
            const result = await auctions.getbid(Number(id));
            if (result !== null) {
                res.status(200).send(result);
            } else {
                res.status(404).send('auction not found');
            }
        } catch (err) {
            res.status(500)
                .send(`ERROR getting users ${err}`);
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

/**
 * add an auction bid into database
 * @param req
 * @param res
 */
const addbid = async (req: Request, res: Response) : Promise<void> =>
{
    Logger.http(`GET all auction bids`);
    const id = req.params.id;
    const amount = req.body.amount;
    const logincheck = await users.loginchecker();
    if(logincheck !== true) {
        try {
            const result = await auctions.addbid(Number(id), Number(logincheck), Number(amount));
            if (result === true) {
                res.status(201).send("new bid has been added");
            } else if (result === false) {
                res.status(403).send('users cannot bid for themselves, please confirm if auction id is correct');
            } else if (result === null) {
                res.status(404).send('auction not found');
            } else {
                res.status(400).send('task denied: the bid amount is equal or lower than current bid')
            }
        } catch (err) {
            res.status(500)
                .send(`ERROR getting users ${err}`);
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

export {getbid, addbid}