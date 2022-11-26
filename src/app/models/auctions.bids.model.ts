import {getPool} from "../../config/db";
import fs from 'mz/fs';
import * as defaultUsers from "../resources/default_users.json"
import * as Console from "console";
import Logger from "../../config/logger";
import {OkPacket, ResultSetHeader, RowDataPacket} from "mysql2";
import * as crypto from "crypto";
import {compare} from "../middleware/passwordhash";

/**
 * read auction bid with auction id
 * @param id
 */
const getbid = async (id:number) : Promise<any> => {
    Logger.info(`Getting all data from the auction categories`);
    const conn = await getPool().getConnection();
    const query = 'select auction_bid.id as bidId, auction_bid.user_id as bidderId, auction_bid.amount, user.first_name as firstName, user.last_name as lastName, auction_bid.timestamp from auction_bid inner join user on auction_bid.user_id = user.id where auction_bid.auction_id = ? order by auction_bid.timestamp DESC';
    const [result] = await conn.query(query, [id]);
    conn.release();
    if (result.length === 0)
    {
        return null;
    } else {
        return result;
    }
};

/**
 * add an auction bid into auction bid table with given auction id, user id and bid amount
 * @param id
 * @param userid
 * @param amount
 */
const addbid = async (id:number, userid:number, amount:number) : Promise<any> => {
    Logger.info(`Adding a new bid into the auction_bid`);
    const conn = await getPool().getConnection();
    const [cquery] = await conn.query("select amount from auction_bid where auction_id = ?",[id]);
    const [aquery] = await conn.query("select seller_id from auction where id = ?", [id]);
    const [jquery] = await conn.query("select user_id from auction_bid where user_id = ?", [id]);
    const date = new Date();
    if (jquery.length === 0 || userid === Number(jquery[0].user_id)) {
        conn.release();
        return false;
    } else if (aquery.length === 0) {
        conn.release();
        return null;
    } else {
        if (cquery.length === 0) {
            const query = "insert into auction_bid (auction_id, user_id, amount, timestamp) values(?)";
            await conn.query(query,[[[id],[userid],[amount],[date]]]);
            conn.release();
            return true;
        } else {
            const [xquery] = await conn.query("select amount from auction_bid where auction_id = ? order by amount DESC", [id]);
            if (Number(xquery[0].amount) >= amount) {
                conn.release();
                return 0;
            } else {
                const query = "insert into auction_bid (auction_id, user_id, amount, timestamp) values(?)";
                await conn.query(query,[[[id],[userid],[amount],[date]]]);
                conn.release();
                return true;
            }
        }
    }
};


export {getbid, addbid}