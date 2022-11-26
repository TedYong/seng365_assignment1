import * as users from '../models/users.model';
import Logger from "../../config/logger";
import {Request, Response} from "express";

import {passwordhash} from '../middleware/passwordhash';
import * as Console from "console";

/**
 * create a user account into database
 * @param req
 * @param res
 */
const register = async (req: Request, res: Response) : Promise<void> => {
    Logger.http(`POST register a new user in database`)
    if (!(req.body.hasOwnProperty("email")) && (req.body.email !== "")){
        res.status(400).send("email must not be empty, Please insert an email");
        return;
    }
    if (req.body.email.search('@') === -1 ) {
        res.status(400).send("Please provide valid email");
        return;
    }
    if (!((req.body.hasOwnProperty("firstName")) && (req.body.firstName !== ""))) {
        res.status(400).send("first name must not be empty, Please complete the first name");
        return;
    }
    if (!((req.body.hasOwnProperty("lastName")) && (req.body.lastName !== ""))) {
        res.status(400).send("last name must not be empty, Please complete the last name");
        return;
    }
    if (!((req.body.hasOwnProperty("password")) && (req.body.password !== ""))) {
        res.status(400).send("password must not be empty, please try again");
        return;
    }
    const firstname = req.body.firstName;
    const lastname = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const realpassword = await passwordhash(password);

    try {
        const result = await users.register( email, firstname, lastname, realpassword );
        if (result !== null) {
            res.status( 201 ).send({"userId": result.insertId});
            return;
        } else {
            res.status( 400 ).send("This email has been registered, please provide another email");
            return;
        }
    }catch( err ) {
        res.status(500).send(`ERROR creating user: ${err}`);
        return;
    }
};

/**
 * read a user information from database
 * @param req
 * @param res
 */
const read = async (req:Request, res:Response) : Promise<any> => {
    Logger.http(`GET one user information from database`);
    const id = req.params.id;
    const loginckeck = await users.loginchecker();
    if (loginckeck !== true) {
        try {
            const result = await users.read( parseInt(id, 10) );
            if( result === null ){
                res.status( 404 ).send('User not found');
                return;
            } else {
                if (result.hasOwnProperty("email")) {
                    res.status(200).json({"firstName": result.first_name, "lastName": result.last_name, "email": result.email});
                    return;
                } else {
                    res.status( 200 ).json( {"firstName": result.first_name, "lastName": result.last_name} );
                    return;
                }
            }
        } catch( err ) {
            res.status( 500 ).send( `ERROR reading user ${id}: ${ err }`);
        }
    } else {
        res.status(401).send('task denied: user has to login to perform this task');
    }
};

/**
 * update a user information up to database
 * @param req
 * @param res
 */
const update = async (req:Request, res:Response) : Promise<any> => {
    Logger.http(`PATCH update user information`);
    const id = req.params.id;
    const loginckeck = await users.loginchecker();
    if (loginckeck !== true) {
        if (Number(id) === loginckeck) {
            if (req.body.currentPassword === undefined && req.body.password === undefined) {
                if (!(req.body.firstName === undefined && req.body.lastName === undefined && req.body.email === undefined)) {
                    try {
                        const newpass = req.body.password;
                        const oldpass = req.body.currentPassword;
                        const result = await users.update(parseInt(id, 10), req.body.firstName, req.body.lastName, req.body.email, newpass, oldpass);
                        if (result === null) {
                            res.status(404).send('user not found');
                        } else if (result === false) {
                            res.status(401).send('authorization fail');
                        } else {
                            res.status(200).send("user info is updated");
                        }
                    } catch (err) {
                        res.status(500).send(`ERROR update user ${id}: ${err}`);
                    }
                } else {
                    res.status(400).send('Please provide correct information to make change, none of first name, last name, email and password are detected');
                }
            } else if ((req.body.currentPassword === undefined && req.body.password !== undefined) || (req.body.currentPassword !== undefined && req.body.password === undefined)) {
                res.status(400).send('Please provide information to change password: current password and password to change');
            } else {
                const newpass = req.body.password;
                const oldpass = req.body.currentPassword;
                if (req.body.password !== "") {
                    try {
                        const result = await users.update(parseInt(id, 10), req.body.firstName, req.body.lastName, req.body.email, newpass, oldpass);
                        if (result === null) {
                            res.status(404).send('user not found');
                        } else if (result === false) {
                            res.status(401).send('authorization fail');
                        } else {
                            res.status(200).send("user info is updated");
                        }
                    } catch (err) {
                        res.status(500).send(`ERROR update user ${id}: ${err}`);
                    }
                } else {
                    res.status(400).send("password cannot be empty");
                }
            }
        } else {
            res.status(403).send("task denied: user are not allowed to change others details");
        }
    } else {
        res.status(403).send('task denied: user has to login to perform this task');
    }
};

/**
 * create a token to identify user and check authorization
 * @param req
 * @param res
 */
const login = async (req:Request, res:Response) : Promise<any> => {
    Logger.http(`POST user login`)
    if (! req.body.hasOwnProperty("email")){
        res.status(400).send("Please insert an email");
        return;
    }
    if (! req.body.hasOwnProperty("password")){
        res.status(400).send("Please insert an password");
        return;
    }
    const email = req.body.email;
    const password = req.body.password;
    const logincheck = await users.loginchecker();
    if (logincheck === true) {
        try {
            const result = await users.login( email, password );
            if (result !== null) {
                res.status( 200 ).json({"userId": result[1], "token": result[0]});
                return;
            } else {
                res.status( 400 ).send("the email or password are wrong, please check again");
                return;
            }
        }catch( err ) {
            res.status(500).send(`ERROR user login: ${err}`);
            return;
        }
    } else {
        res.status(403).send('user has already logged in');
    }

};

/**
 * remove token from active user so to keep user information safe
 * @param req
 * @param res
 */
const logout = async (req:Request, res:Response) : Promise<any> => {
    Logger.http(`POST user logout`);
    const logincheck = await users.loginchecker();
    if (logincheck !== true) {
        if (req.header("x-authorization") === undefined) {
            res.status(401).send("authorization fail: token is missing or mismatched");
        } else {
            const result = await users.logout();
            try {
                if (result !== null) {
                    res.status(200).send("user has logged out");
                } else {
                    res.status(401).send("unauthorised command");
                    return;
                }
            } catch (err) {
                res.status(500).send(`ERROR user logout: ${err}`);
                return;
            }
        }
    } else {
        res.status(403).send('task denied: user has to login to perform this task');
    }
};


export { register, login, read, update, logout }