import * as auctions from '../models/auctions.model';
import Logger from "../../config/logger";
import {Request, Response} from "express";
import * as Console from "console";
import * as users from "../models/users.model";
import {ParsedQs} from "qs";

/**
 * find and read auctions that match the condition user insert
 * @param req
 * @param res
 */
const view = async (req: Request, res: Response) : Promise<any> =>
{
    try {
        Logger.http(`GET auction/auctions by various input/inputs`);
        const checklist: string[] = ['q', 'categoryIds', 'sellerId', 'sortBy', 'count', 'startIndex', 'bidderId'];
        // if (req.query === {}) {
        const result = await auctions.view(req.query.q, req.query.categoryIds, req.query.sellerId, req.query.sortBy, req.query.count, req.query.startIndex, req.query.bidderId);

        if (result === null) {
            const ob = new Array();
            res.status(200).json({auctions: ob, count: 0});
        } else if (result === false) {
            res.status(400).send('input query error, please try again');
        } else if (result === 1) {
            res.status(401).send('start index provided without count, please check again');
        } else {
            res.status(200).json({auctions: result, count: result.length});
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR getting users ${err}`);
    }
};

/**
 * add a auction into database
 * @param req
 * @param res
 */
const additem = async (req: Request, res: Response) : Promise<any> => {
    Logger.http(`Post add a new product into database`);

    if (!(req.body.hasOwnProperty("categoryId")) && (req.body.categoryId !== ""))  {
        res.status(400).send("Please provide category id");
        return;
    }
    if (!(req.body.hasOwnProperty("title")) && (req.body.title !== "")) {
        res.status(400).send("Please add a title");
        return;
    }
    if (!(req.body.hasOwnProperty("description")) && (req.body.description !== "")) {
        res.status(400).send("Please add a description");
        return;
    }
    if (!(req.body.hasOwnProperty("endDate")) && (req.body.endDate !== "")) {
        res.status(400).send("Please complete the endDate");
        return;
    }
    const postcheck = await auctions.postchecker(req.body.title);
    const logincheck = await users.loginchecker();
    if(logincheck !== true) {
        if (postcheck === true) {
            if (req.header("x-authorization") === undefined) {
                res.status(401).send('authorization fail: token is missing');
            }else if (req.body.hasOwnProperty("reserve")) {
                const reserve = req.body.reserve;
                try {
                    const result = await auctions.additem(req.body, reserve, logincheck);
                    if (result !== null) {
                        res.status(201).json({"auctionId": result});
                        return;
                    } else {
                        res.status(400).send("category id is not found in category table");
                        return;
                    }
                } catch (err) {
                    res.status(500).send(`ERROR creating user: ${err}`);
                    return;
                }
            } else {
                const reserve = 1;
                try {
                    const result = await auctions.additem(req.body, reserve, logincheck);
                    if (result !== null) {
                        res.status(201).json({"auctionId": result});
                        return;
                    } else {
                        res.status(400).send("category id is not found in category table");
                        return;
                    }
                } catch (err) {
                    res.status(500).send(`ERROR insert new auction: ${err}`);
                    return;
                }
            }
        } else {
            res.status(401).send('this auction has been added, please check its details again');
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

/**
 * extract all auction categories
 * @param req
 * @param res
 */
const getcate = async (req: Request, res: Response) : Promise<void> =>
{
    Logger.http(`GET all categories`)
    const logincheck = await users.loginchecker();
    if(logincheck !== true) {
        try {
            const result = await auctions.getcate();
            res.status(200).json(result);
        } catch (err) {
            res.status(500)
                .send(`ERROR getting categories ${err}`);
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

/**
 * extract an auction information from database
 * @param req
 * @param res
 */
const readauct = async (req: Request, res: Response) : Promise<any> =>
{
    Logger.http(`GET auction info`);
    const id = req.params.id;
    const logincheck = await users.loginchecker();
    if(logincheck !== true) {
        try {
            const result = await auctions.readauct(Number(id));
            if (result !== null) {
                res.status(200).json(result[0]);
            } else {
                res.status(404).json('auction not found');
            }
        } catch (err) {
            res.status(500)
                .send(`ERROR getting categories ${err}`);
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

/**
 * update an auction information into database
 * @param req
 * @param res
 */
const updateauct = async (req: Request, res: Response) : Promise<any> =>
{
    Logger.http(`GET auction info`);
    const id = req.params.id;
    const logincheck = await users.loginchecker();
    const postcheck = await auctions.postchecker(req.body.title);
    if(logincheck !== true) {
        if(postcheck === true) {
            try {
                const result = await auctions.updateauct(req.body, Number(id));
                if (result === null) {
                    res.status(404).send('auction not found');
                } else if (result === false) {
                    res.status(403).send('auction has been added to the market, cannot edit the info');
                } else {
                    res.status(200).send('auction info has been updated');
                }
            } catch (err) {
                res.status(500)
                    .send(`ERROR getting categories ${err}`);
            }
        } else {
            res.status(400).send('this auction has been added, please check its details again');
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

/**
 * delete an auction information in the database
 * @param req
 * @param res
 */
const deleteauct = async (req: Request, res: Response) : Promise<any> =>
{
    Logger.http(`GET auction info`);
    const id = req.params.id;
    const logincheck = await users.loginchecker();
    if(logincheck !== true) {
        try {
            const result = await auctions.deleteauct(Number(id));
            if (result === true) {
                res.status(200).send(`auction ${id} has been removed`);
            } else if (result === false){
                res.status(404).send(`auction ${id} does not found`);
            } else {
                res.status(403).send(`task denied: auction ${id} must close before deleting it`);
            }
        } catch (err) {
            res.status(500)
                .send(`ERROR getting categories ${err}`);
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

export {view, getcate, additem, readauct, updateauct, deleteauct}