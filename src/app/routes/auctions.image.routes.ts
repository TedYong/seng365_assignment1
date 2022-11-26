import {Express} from "express";

import * as auctions from '../controllers/auctions.image.controller';
import {rootUrl} from "./base.routes";
import * as Console from "console";

module.exports = (app: Express) => {
    app.route(rootUrl + '/auctions/:id/image')
        .get(auctions.getimage)
        .put(auctions.updateimage);
    // app.route(rootUrl + '/users/:id/image')
    //     .post(users.register);
    // app.route(rootUrl + '/users/:id/image')
    //     .put(users.register);
    // app.route(rootUrl + '/users/:id/image')
    //     .delete(users.register);
}