import {getPool} from "../../config/db";
import fs from 'mz/fs';
import * as defaultUsers from "../resources/default_users.json"
import * as Console from "console";
import Logger from "../../config/logger";
import {OkPacket, ResultSetHeader, RowDataPacket} from "mysql2";
import { ParsedQs } from "qs";

/**
 * extract all conformed results with all query inputs
 * @param q
 * @param categoryIds
 * @param sellerId
 * @param sortBy
 * @param count
 * @param startIndex
 * @param bidderId
 */
const view = async (q:string | string[] | ParsedQs | ParsedQs[], categoryIds:string | string[] | ParsedQs | ParsedQs[], sellerId:string | string[] | ParsedQs | ParsedQs[], sortBy:string | string[] | ParsedQs | ParsedQs[], count:string | string[] | ParsedQs | ParsedQs[], startIndex:string | string[] | ParsedQs | ParsedQs[], bidderId:string | string[] | ParsedQs | ParsedQs[]) : Promise<any> => {
    Logger.info(`Getting designated auction from the database`);
    const conn = await getPool().getConnection();
    if (q === undefined && categoryIds === undefined && sellerId === undefined && sortBy === undefined && count === undefined && startIndex === undefined && bidderId === undefined) {
        const query = "select auction.id as auctionId, auction.title as title, auction.reserve as reserve,\n" +
            "       auction.seller_id as sellerId, auction.category_id as categoryId, user.first_name as sellerFirstName,  user.last_name as sellerLastName,\n" +
            "       auction.end_date as endDate, count(auction_bid.auction_id) as numBids, coalesce (max(auction_bid.amount),null) as highestBid\n" +
            "        from auction join user on auction.seller_id = user.id\n" +
            "           join category on auction.category_id = category.id\n" +
            "            left join auction_bid on auction.id = auction_bid.auction_id\n" +
            "group by auction.id\n" +
            "order by auction.end_date ASC";
        const [zquery] = await conn.query(query);
        conn.release();
        return zquery;
    } else {
        let indexstring: string = "";
        let countstring: string = "";
        let sortstring: string = "";
        let qstring: string = "";
        const result: number[] = [];
        const counts: object = {};
        let nummy: number = 0;
        if (q !== undefined) {
            if (typeof q === 'string') {
                qstring = ` and auction.title like '%${q}%' `;
            } else {
                conn.release();
                return false;
            }
        }
        if (bidderId !== undefined) {
            if (isNaN(Number(bidderId)) !== true) {
                const [bquery] = await conn.query('select auction_id from auction_bid where user_id = ?', [Number(bidderId)]);
                // tslint:disable-next-line:prefer-for-of
                for (let i: number = 0; i < bquery.length; i++) {
                    result.push(bquery[i].auction_id);
                }
                nummy += 1;
            } else {
                conn.release();
                return false;
            }
        }

        if (sellerId !== undefined) {
            if (isNaN(Number(sellerId)) !== true) {
                const [squery] = await conn.query('select id from auction where seller_id = ?', [Number(sellerId)]);
                // tslint:disable-next-line:prefer-for-of
                for (let i: number = 0; i < squery.length; i++) {
                    result.push(squery[i].id);
                }
                nummy += 1;
            } else {
                conn.release();
                return false;
            }
        }
        if (categoryIds !== undefined) {
            if (isNaN(Number(categoryIds)) !== true) {
                const [cquery] = await conn.query('select id from auction where category_id = ?', [Number(categoryIds)]);
                // tslint:disable-next-line:prefer-for-of
                for (let i: number = 0; i < cquery.length; i++) {
                    result.push(cquery[i].id);
                }
                nummy += 1;
            } else {
                conn.release();
                return false;
            }
        }
        for (const num of result) {
            // @ts-ignore
            counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        const amap = new Map();
        for (const num of result) {
            // @ts-ignore
            amap.set(num, counts[num]);
        }
        const fresult: number[] = [];
        for (const [key, value] of amap.entries()) {
            // @ts-ignore
            if (value >= nummy) {
                fresult.push(key);
            }
        }
        if (startIndex !== undefined) {
            if (count === undefined) {
                conn.release();
                return 1;
            }
            if (isNaN(Number(startIndex)) !== true) {
                indexstring = ` offset ${startIndex}`;
            } else {
                conn.release();
                return false;
            }
        }
        if (count !== undefined) {
            if (isNaN(Number(count)) !== true) {
                countstring = ` limit ${count}`;
            } else {
                conn.release();
                return false;
            }
        }
        if (sortBy !== undefined) {
            if (typeof sortBy === 'string') {
                if (sortBy === 'ALPHABETICAL_ASC') {
                    sortstring = ` order by auction.title ASC`;
                } else if (sortBy === 'ALPHABETICAL_DESC') {
                    sortstring = ` order by auction.title DESC`;
                } else if (sortBy === 'BIDS_ASC') {
                    sortstring = ` order by auction_bid.amount ASC`;
                } else if (sortBy === 'BIDS_DESC') {
                    sortstring = ` order by auction_bid.amount DESC`;
                } else if (sortBy === 'CLOSING_SOON') {
                    sortstring = ` order by date(auction.end_date) ASC`;
                } else if (sortBy === 'CLOSING_LAST') {
                    sortstring = ` order by date(auction.end_date) DESC`;
                } else if (sortBy === 'RESERVE_ASC') {
                    sortstring = ` order by auction.reserve ASC`;
                } else if (sortBy === 'RESERVE_DESC') {
                    sortstring = ` order by auction.reserve DESC`;
                } else {
                    conn.release();
                    return false;
                }
            } else {
                conn.release();
                return false;
            }
        }
        if (!(Object.keys(fresult).length === 0)) {
            if (sortstring !== "") {
                const [rquery] = await conn.query(`select auction.id                              as auctionId,
                                                          auction.title,
                                                          auction.reserve,
                                                          auction.seller_id                       as sellerId,
                                                          auction.category_id                     as categoryId,
                                                          user.first_name                         as sellerFirstName,
                                                          user.last_name                          as sellerLastName,
                                                          auction.end_date                        as endDate,
                                                          count(auction_bid.amount)               as numBids,
                                                          coalesce(max(auction_bid.amount), null) as highestBid
                                                   from auction
                                                            join user on auction.seller_id = user.id
                                                            join category on auction.category_id = category.id
                                                            left join auction_bid on auction.id = auction_bid.auction_id
                                                   where auction.id in (${fresult})` + qstring +
                    `group by auction.id` + sortstring + countstring + indexstring);
                conn.release();
                return rquery;
            } else {
                const [rquery] = await conn.query(`select auction.id                              as auctionId,
                                                          auction.title,
                                                          auction.reserve,
                                                          auction.seller_id                       as sellerId,
                                                          auction.category_id                     as categoryId,
                                                          user.first_name                         as sellerFirstName,
                                                          user.last_name                          as sellerLastName,
                                                          auction.end_date                        as endDate,
                                                          count(auction_bid.amount)               as numBids,
                                                          coalesce(max(auction_bid.amount), null) as highestBid
                                                   from auction
                                                            join user on auction.seller_id = user.id
                                                            join category on auction.category_id = category.id
                                                            left join auction_bid on auction.id = auction_bid.auction_id
                                                   where auction.id in (${fresult})` + qstring + `group by auction.id` + ` order by auction.end_date ASC` + countstring + indexstring);
                conn.release();
                return rquery;
            }
        } else if (qstring !== "") {
            qstring = ` auction.title like '%${q}%' `;
            if (sortstring === "") {
                const [rquery] = await conn.query(`select auction.id                              as auctionId,
                                                          auction.title,
                                                          auction.reserve,
                                                          auction.seller_id                       as sellerId,
                                                          auction.category_id                     as categoryId,
                                                          user.first_name                         as sellerFirstName,
                                                          user.last_name                          as sellerLastName,
                                                          auction.end_date                        as endDate,
                                                          count(auction_bid.amount)               as numBids,
                                                          coalesce(max(auction_bid.amount), null) as highestBid
                                                   from auction
                                                            join user on auction.seller_id = user.id
                                                            join category on auction.category_id = category.id
                                                            left join auction_bid on auction.id = auction_bid.auction_id
                                                   where` + qstring + `group by auction.id` + ` order by auction.end_date ASC` + countstring + indexstring);
                conn.release();
                return rquery;
            } else {
                const [rquery] = await conn.query(`select auction.id                              as auctionId,
                                                          auction.title,
                                                          auction.reserve,
                                                          auction.seller_id                       as sellerId,
                                                          auction.category_id                     as categoryId,
                                                          user.first_name                         as sellerFirstName,
                                                          user.last_name                          as sellerLastName,
                                                          auction.end_date                        as endDate,
                                                          count(auction_bid.amount)               as numBids,
                                                          coalesce(max(auction_bid.amount), null) as highestBid
                                                   from auction
                                                            join user on auction.seller_id = user.id
                                                            join category on auction.category_id = category.id
                                                            left join auction_bid on auction.id = auction_bid.auction_id
                                                   where` + qstring + `group by auction.id` + sortstring + countstring + indexstring);
                conn.release();
                return rquery;
            }
        } else if (sortstring !== "") {
            const [rquery] = await conn.query(`select auction.id                              as auctionId,
                                                      auction.title,
                                                      auction.reserve,
                                                      auction.seller_id                       as sellerId,
                                                      auction.category_id                     as categoryId,
                                                      user.first_name                         as sellerFirstName,
                                                      user.last_name                          as sellerLastName,
                                                      auction.end_date                        as endDate,
                                                      count(auction_bid.amount)               as numBids,
                                                      coalesce(max(auction_bid.amount), null) as highestBid
                                               from auction
                                                        join user on auction.seller_id = user.id
                                                        join category on auction.category_id = category.id
                                                        left join auction_bid on auction.id = auction_bid.auction_id
                                               group by auction.id` + sortstring + countstring + indexstring);
            conn.release();
            return rquery;
        }else if (countstring !== "") {
            const [rquery] = await conn.query(`select auction.id                              as auctionId,
                                                      auction.title,
                                                      auction.reserve,
                                                      auction.seller_id                       as sellerId,
                                                      auction.category_id                     as categoryId,
                                                      user.first_name                         as sellerFirstName,
                                                      user.last_name                          as sellerLastName,
                                                      auction.end_date                        as endDate,
                                                      count(auction_bid.amount)               as numBids,
                                                      coalesce(max(auction_bid.amount), null) as highestBid
                                               from auction
                                                        join user on auction.seller_id = user.id
                                                        join category on auction.category_id = category.id
                                                        left join auction_bid on auction.id = auction_bid.auction_id
                                               group by auction.id
                                               order by auction.end_date ASC` + countstring + indexstring);
            conn.release();
            return rquery;
        } else {
            conn.release();
            return null;
        }
    }
}

/**
 * add an auction with given values
 * @param values
 * @param reserve
 * @param sellerid
 */
const additem = async (values: auctionType,reserve:number,sellerid:number) : Promise<ResultSetHeader> => {
    Logger.info(`Adding a new product into the auction`);
    const conn = await getPool().getConnection();
    const [cquery] = await conn.query("select * from category where id = ?", [values.categoryId]);
    if (cquery.length === 0) {
        conn.release();
        return null;
    } else {
        const query = "insert into auction (title, description, end_date, category_id, reserve, seller_id) values(?)";
        await conn.query(query,[[[values.title],[values.description],[values.endDate],[values.categoryId],[reserve],[sellerid]]]);
        const [realresult] = await conn.query("select id from auction where seller_id = ?", [sellerid] );
        conn.release();
        return realresult[0].id;
    }
};

/**
 * update auction inform with given auction id
 * @param values
 * @param id
 */
const updateauct = async (values: auctionType, id:number) : Promise<any> => {
    Logger.info(`Updating product info`);
    const conn = await getPool().getConnection();
    const [cquery] = await conn.query("select * from category where id = ?", [values.categoryId]);
    const [nquery] = await conn.query("select * from auction_bid where auction_id = ?", [id]);
    const [squery] = await conn.query("select * from auction where id = ?", [id]);
    if (cquery.length === 0) {
        conn.release();
        return null;
    } else if (nquery.length !== 0) {
        conn.release();
        return false;
    } else {
        if (values.title === undefined) {
            values.title = squery[0].title;
        }
        if (values.description === undefined) {
            values.description = squery[0].description;
        }
        if (values.endDate === undefined) {
            const date = new Date(squery[0].end_date);
            values.endDate = date.toISOString().split('T')[0];
        }
        if (values.reserve === undefined) {
            values.reserve = squery[0].reserve;
        }
        if (values.categoryId === undefined) {
            values.categoryId = squery[0].category_id;
        }
        if (values.imageFilename === undefined) {
            values.imageFilename = squery[0].image_filename;
        }
        const query = `update auction set title = '${values.title}', description = '${values.description}', end_date = '${values.endDate}', category_id = ${values.categoryId}, reserve = ${values.reserve}, image_filename = ${values.imageFilename} where id = ${id}`;
        await conn.query(query);
        conn.release();
        return true;
    }
};

/**
 * get all categories
 */
const getcate = async () : Promise<any> => {
    Logger.info(`Getting all data from the auction categories`);
    const conn = await getPool().getConnection();
    const query = 'select * from category';
    const [ rows ] = await conn.query( query );
    conn.release();
    return rows;
};

/**
 * check if the adding auction is existed in the auction bid table
 * @param title
 */
const postchecker = async (title:string): Promise<any> => {
    Logger.info(`A minor function to check if there's duplication between database and added auction`);
    const conn = await getPool().getConnection();
    const [query] = await conn.query("select * from auction where title = ?", [title]);
    if (query.length === 0) {
        conn.release();
        return true;
    } else {
        conn.release();
        return false;
    }
}

/**
 * read auction with auction id
 * @param id
 */
const readauct = async (id:number) : Promise<any> => {
    Logger.info(`Getting all data from the auction categories`);
    const conn = await getPool().getConnection();
    const query = 'select auction.id as auctionId, auction.title, auction.description, auction.category_id as categoryId, auction.seller_id as sellerId, user.first_name as sellerFirstName, user.last_name as sellerLastName, auction.reserve, count(auction_bid.amount) as numBids, coalesce(max(auction_bid.amount), null) as highestBid, auction.end_date as endDate from auction join user on auction.seller_id = user.id join category on auction.category_id = category.id left join auction_bid on auction.id = auction_bid.auction_id where auction.id = ? order by auction_bid.amount DESC';
    const [result] = await conn.query(query, [id]);
    if (result[0].auctionId === null)
    {
        conn.release();
        return null;
    } else {
        conn.release();
        return result;
    }
};

/**
 * delete auction with auction id
 * @param id
 */
const deleteauct = async (id:number) : Promise<any> => {
    Logger.info(`Getting all data from the auction categories`);
    const conn = await getPool().getConnection();
    const [query] = await conn.query("select * from auction where id = ?", [id]);
    const [bquery] = await conn.query("select * from auction_bid where auction_id = ?", [id]);
    if (query.length > 0) {
        if (bquery.length > 0) {
            conn.release();
            return null;
        } else {
            await conn.query("delete from auction where id = ?", [id]);
            conn.release();
            return true;
        }
    } else {
        conn.release();
        return false;
    }
};


export {view, getcate, additem, postchecker, readauct, updateauct, deleteauct}