import {Express} from "express";

import * as users from '../controllers/users.image.controller';
import {rootUrl} from "./base.routes";
import * as Console from "console";

module.exports = (app: Express) => {
    app.route(rootUrl + '/users/:id/image')
        .get(users.getimage)
        .put(users.updateimage)
        .delete(users.deleteimage);

    // app.route(rootUrl + '/users/:id/image')
    //     .put(users.register);
    // app.route(rootUrl + '/users/:id/image')
    //     .delete(users.register);
}