import {Express} from "express";

import * as auctions from '../controllers/auctions.controller';
import {rootUrl} from "./base.routes";
import * as Console from "console";


module.exports = (app: Express) => {
    app.route(rootUrl + '/auctions')
        .get(auctions.view)
        .post(auctions.additem);

    app.route(rootUrl + '/auctions/:id')
        .get(auctions.readauct)
        .patch(auctions.updateauct)
        .delete(auctions.deleteauct);

    app.route(rootUrl + '/auctions/categories')
        .get(auctions.getcate);
};
