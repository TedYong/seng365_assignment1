import {getPool} from "../../config/db";
import fs from 'mz/fs';
import * as defaultUsers from "../resources/default_users.json"
import * as Console from "console";
import Logger from "../../config/logger";
import {OkPacket, ResultSetHeader, RowDataPacket} from "mysql2";
import * as crypto from "crypto";
import {compare} from "../middleware/passwordhash";
import {passwordhash} from "../middleware/passwordhash";

/**
 * register a user into system with necessary information
 * @param email
 * @param firstname
 * @param lastname
 * @param password
 */
const register = async (email: string, firstname: string, lastname: string, password: string) : Promise<ResultSetHeader> => {
    Logger.info(`Registering a new user into the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, password) values ( ? )';
    const [testemail] = await conn.query("select * from user where email = ?", [email]);
    if (testemail.length > 0) {
        conn.release();
        return null;
    } else {
        const [ result ] = await conn.query( query, [[[ email ], [firstname], [lastname], [password ]]] );
        conn.release();
        return result;
    }
};

/**
 * read user from user table with given user id
 * @param id
 */
const read = async (id: number) : Promise<any> => {
    Logger.info(`Getting user ${id} from the database`);
    const conn = await getPool().getConnection();
    const [query] = await conn.query("select first_name, last_name, email, auth_token from user where id = ?", [id]);
    const [noemailquery] = await conn.query("select first_name, last_name from user where id = ?", [id]);
    if (query.length === 0) {
        conn.release();
        return null;
    } else {
        if (query[0].auth_token === null) {
            conn.release();
            return noemailquery[0];
        } else {
            conn.release();
            return query[0];
        }
    }
};

/**
 * update a user's first name or last name or email or password with given user id
 * @param id
 * @param firstname
 * @param lastname
 * @param email
 * @param newpass
 * @param oldpass
 */
const update = async (id: number, firstname:string, lastname:string, email:string, newpass: string, oldpass:string) : Promise<any> => {
    Logger.info(`update user ${id} information`);
    const conn = await getPool().getConnection();
    const [tquery] = await conn.query("select password, auth_token from user where id = ?", [id]);
    if (tquery[0].auth_token === null) {
        conn.release();
        return null;
    } else {
        if (oldpass !== undefined && newpass !== undefined) {
            const pquery = await compare(oldpass, tquery[0].password);
            if (pquery !== false) {
                if (firstname !== undefined) {
                    await conn.query(`update user
                                      set first_name = '${firstname}'
                                      where id = '${id}'`)
                }
                if (lastname !== undefined) {
                    await conn.query(`update user
                                      set last_name = '${lastname}'
                                      where id = '${id}'`)
                }
                if (email !== undefined) {
                    await conn.query(`update user
                                      set email = '${email}'
                                      where id = '${id}'`)
                }
                await conn.query(`update user
                                  set password = '${await passwordhash(newpass)}'
                                  where id = '${id}'`);
                conn.release();
                return true;
            } else {
                conn.release();
                return false;
            }
        } else {
            if (firstname !== undefined) {
                await conn.query(`update user
                                      set first_name = '${firstname}'
                                      where id = '${id}'`)
            }
            if (lastname !== undefined) {
                await conn.query(`update user
                                      set last_name = '${lastname}'
                                      where id = '${id}'`)
            }
            if (email !== undefined) {
                await conn.query(`update user
                                      set email = '${email}'
                                      where id = '${id}'`)
            }
            conn.release();
            return true;
        }
    }
};

/**
 * login a user to perform tasks safely
 * @param email
 * @param password
 */
const login = async (email: string, password: string) : Promise<any> => {
    Logger.info(`user ${email} login`);
    const conn = await getPool().getConnection();
    const [equery] = await conn.query("select * from user where email = ?", [email]);
    // const [pquery] = await conn.query("select * from user where password = ?", [password]);
    const pquery = await compare(password, equery[0].password);
    if (equery.length === 0 || pquery === false) {
        conn.release();
        return null;
    } else {
        const token = crypto.randomBytes(16).toString('hex');
        await conn.query(`update user set auth_token = '${token}' where email = '${email}'`);
        conn.release();
        return [token, equery[0].id];
    }
};
/** log out the user
 */
const logout = async () : Promise<any> => {
    Logger.info(`user logout`);
    const conn = await getPool().getConnection();
    const [query] = await conn.query("select id from user where auth_token != ?", ['null']);
    if (query.length === 0) {
        conn.release();
        return null;
    } else {
        const id = query[0].id;
        const nu = 'null';
        const [dquery] = await conn.query(`update user set auth_token = ${nu} where id = ${id}`);
        conn.release();
        return dquery;
    }
};
/** check if user is logged in
 */
const loginchecker = async () : Promise<any> => {
    Logger.info(`minor function to check if user has logged in`);
    const conn = await getPool().getConnection();
    const [query] = await conn.query("select id from user where auth_token != ?", ['null']);
    if (query.length === 0 ) {
        conn.release();
        return true;
    } else {
        conn.release();
        return query[0].id;
    }
};
export {register, login, read, update, logout, loginchecker }