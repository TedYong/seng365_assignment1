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
 * read a user image from user table with given user id
 * @param id
 */
const readimage = async (id: number) : Promise<any> => {
    Logger.info(`obtain user ${id} image from database resources`);
    const conn = await getPool().getConnection();
    const [query] = await conn.query("select image_filename from user where id = ?", [id]);
    if (query.length === 0 || query[0].image_filename === null) {
        conn.release();
        return false;
    } else {
        conn.release();
        const photo = await fs.readFile("storage/images/" + query[0].image_filename);
        return {photo, type: mime.getType(query[0].image_filename)};
    }
};

/**
 * change or add a user image to account with given user id and new image
 * @param id
 * @param newphoto
 */
const updateimage = async (id: number, newphoto: string) : Promise<any> => {
    Logger.info(`update user ${id} image to database`);
    const conn = await getPool().getConnection();
    const [result] = await conn.query("update user set image_filename = ? where id = ?", [[newphoto], [id]]);
    conn.release();
    return result;
};

/**
 * store image in local folder so new added image can be found
 * @param image
 * @param type
 */
const storeimage = async (image:string, type:string) : Promise<any> => {
    Logger.info(`minor function to store image in folder`);
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
 * delete user image with user id
 * @param id
 */
const deleteimage = async (id: number) : Promise<any> => {
    Logger.info(`delete user ${id} image to database`);
    const conn = await getPool().getConnection();
    const [query] = await conn.query("select image_filename from user where id = ?", [id]);
    if (query.length !== 0) {
        await conn.query(`update user set image_filename = null where id = '${id}'`);
        conn.release();
        return true;
    } else {
        conn.release();
        return false;
    }
};

/**
 * read image file type
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
export {readimage, updateimage, deleteimage, storeimage, readext}