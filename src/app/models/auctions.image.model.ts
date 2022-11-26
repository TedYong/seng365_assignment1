import {getPool} from "../../config/db";
import fs from 'mz/fs';
import * as defaultUsers from "../resources/default_users.json"
import * as Console from "console";
import Logger from "../../config/logger";
import {OkPacket, ResultSetHeader, RowDataPacket} from "mysql2";
import * as crypto from "crypto";
import mime from "mime";
import {compare} from "../middleware/passwordhash";

/**
 * read auction image from auction table with give auction id
 * @param id
 */
const readimage = async (id: number) : Promise<any> => {
    Logger.info(`obtain auction user ${id} image from database resources`);
    const conn = await getPool().getConnection();
    const [query] = await conn.query("select image_filename from auction where id = ?", [id]);
    if (query.length === 0 || query[0].image_filename === null) {
        conn.release();
        return null;
    } else {
        conn.release();
        const photo = await fs.readFile("storage/images/" + query[0].image_filename);
        return {photo, type: mime.getType(query[0].image_filename)};
    }
};

/**
 * store auction image locally to be applied or modified later
 * @param image
 * @param type
 */
const storeimage = async (image: string, type: string) : Promise<any> => {
    const filename = crypto.randomBytes(16).toString('hex') + type;

    try {
        await fs.writeFile('./storage/images/' + filename, image);
        return filename;
    } catch (err) {
        await fs.unlink('./storage/images/' + filename)
            .catch(err);
        throw err;
    }
};

/**
 * edit auction image with sample image and given auction id
 * @param id
 * @param imagefilename
 */
const updateimage = async (id: number, imagefilename: string) : Promise<any> => {
    Logger.info(`Updating Auction image from the database`);

    const conn = await getPool().getConnection();
    const [query] = await conn.query( "update auction set image_filename = ? where id = ?", [[imagefilename], [id]]);
    conn.release();
    return query;

};

/**
 * read file type of image
 * @param imageext
 */
const readext = async (imageext: string) : Promise<string> => {
    Logger.info(`minor function to extract image file extension from header`);
    if (imageext === 'image/jpeg') {
        return '.jpeg';
    } else if (imageext === 'image/jpg') {
        return '.jpg';
    } else if (imageext === 'image/png') {
        return '.png';
    } else if (imageext === 'image/gif') {
        return '.gif';
    } else {
        return null;
    }
};

export {readimage, storeimage, updateimage, readext}