import * as users from '../models/users.image.model';
import Logger from "../../config/logger";
import {Request, Response} from "express";
import * as auth_checker from '../models/users.model';
import {passwordhash} from '../middleware/passwordhash';
import * as Console from "console";
import * as check from "../models/users.model";
import * as auctions from "../models/auctions.image.model";

/**
 * extract a user image from database
 * @param req
 * @param res
 */
const getimage = async (req:Request, res:Response) : Promise<any> => {
    Logger.http(`GET one user image from database resources`);
    const id = req.params.id;
    try {
        const result = await users.readimage( Number(id) );
        if( result === false){
            res.status( 404 ).send('User image not found');
            return;
        } else {
            res.status( 200 ).contentType( result.type ).send(result.photo);
            return;
        }
    } catch( err ) {
        res.status( 500 ).send( `ERROR reading user ${id}: ${ err }`);
    }
};

/**
 * delete a user image from database
 * @param req
 * @param res
 */
const deleteimage = async (req:Request, res:Response) : Promise<any> => {
    Logger.http(`GET one user image from database resources`);
    const id = req.params.id;
    const logincheck = await check.loginchecker();
    if(logincheck !== true) {
        if (Number(logincheck) === Number(id)) {
            if (req.header("x-authorization") === undefined) {
                res.status(401).send('authorization fail: token is missing');
            } else {
                    try {
                        const result = await users.deleteimage(Number(id));
                        if (result === false) {
                            res.status(404).send('User image not found');
                            return;
                        } else {
                            res.status(200).send('User image is deleted');
                            return;
                        }
                    } catch (err) {
                        res.status(500).send(`ERROR reading user ${id}: ${err}`);
                    }
                }
        } else {
            res.status(403)
                .send('authorization fail: cannot delete others image');
            return;
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

/**
 * update a user image into database
 * @param req
 * @param res
 */
const updateimage = async (req: Request, res: Response) : Promise<void> => {
    Logger.http(`Request to update auction image...'`);
    const image = req.body;
    const id = req.params.id;
    const logincheck = await check.loginchecker();
    if(logincheck !== true) {
        if (Number(logincheck) === Number(id)) {
            const type = req.header('Content-Type');
            const fileExt: any = await users.readext(type);
            if (fileExt !== null) {
                if (req.body.length !== 0) {
                    const existimage = await users.readimage(Number(id));
                    const filename = await users.storeimage(image, fileExt);
                    if (existimage) {
                        await users.updateimage(Number(id), filename);
                        res.status(200)
                            .send("user image is updated");
                        return;
                    } else {
                        await users.updateimage(Number(id), filename);
                        res.status(201)
                            .send("user image is added");
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
                .send('authorization fail: cannot edit others image');
            return;
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

export {getimage, updateimage,deleteimage}