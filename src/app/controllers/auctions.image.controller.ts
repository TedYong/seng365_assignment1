import * as auctions from '../models/auctions.image.model';
import * as check from '../models/auctions.model';
import * as users from "../models/users.model";
import Logger from "../../config/logger";
import {Request, Response} from "express";

import {passwordhash} from '../middleware/passwordhash';
import * as Console from "console";

/**
 * read an image of auction from database
 * @param req
 * @param res
 */
const getimage = async (req:Request, res:Response) : Promise<any> => {
    Logger.http(`GET one auction user image from database resources`);
    const id = req.params.id;
    try {
        const result = await auctions.readimage( Number(id) );
        if( result === null ){
            res.status( 404 ).send('Auction user image not found');
            return;
        } else {
            res.status( 200 ).contentType( result.type ).send(result.photo);
        }
    } catch( err ) {
        res.status( 500 ).send( `ERROR reading user ${id}: ${ err }`);
    }
};

/**
 * update an auction image into database
 * @param req
 * @param res
 */
const updateimage = async (req: Request, res: Response) : Promise<void> => {
    Logger.http(`Request to update auction image...'`);
    const image = req.body;
    const id = req.params.id;
    const userid = await users.loginchecker();
    const auct = await check.readauct( Number(id) );
    Console.log(auct);
    if(userid !== true) {
        if (auct !== null) {
            const sellerid = auct[0].sellerId;
            if (Number(userid) === Number(sellerid)) {
                const type = req.header('Content-Type');
                const fileExt: any = await auctions.readext(type);
                if (fileExt !== null) {
                    if (req.body.length !== 0) {
                        const existimage = await auctions.readimage(Number(id));
                        const filename = await auctions.storeimage(image, fileExt);
                        if (existimage) {
                            await auctions.updateimage(Number(id), filename);
                            res.status(200)
                                .send("new auction image is updated");
                            return;
                        } else {
                            await auctions.updateimage(Number(id), filename);
                            res.status(201)
                                .send("auction image is added");
                            return;
                        }
                    } else {
                        res.status(400)
                            .send('image is empty, please verify again');
                        return;
                    }
                } else {
                    res.status(400)
                        .send('image is not in the correct file type: jpeg, jpg, png or gif');
                    return;
                }
            } else {
                res.status(403)
                    .send('authorization fail: cannot edit others auction');
                return;
            }
        } else {
            res.status(404)
                .send("auction is not found");
            return;
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

export {getimage, updateimage}