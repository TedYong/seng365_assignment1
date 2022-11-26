import {Express} from "express";

import * as auctions from '../controllers/auctions.bids.controller';
import {rootUrl} from "./base.routes";
import * as Console from "console";

module.exports = (app: Express) => {
    app.route(rootUrl + '/auctions/:id/bids')
        .get(auctions.getbid)
        .post(auctions.addbid);
};
