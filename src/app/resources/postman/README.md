# Introduction to this Postman collection
This Postman collection has been provided to aid you in developing your API to the expected specification. Doing well in
these tests is an indication that you will do well in the assignment, however note that this is not a complete test
suite, and will not exactly reflect what is used for marking your assignments. You are more than welcome to add your own
tests to the collection to increase your coverage, though make sure these accurately represent the specification 
described in the api spec, if you have any concerns about this feel free to ask a tutor for help. 

## Importing and setting up the collection
To import the collection:
1. Click Import (top left)
2. Click Choose Files
3. Select `Auctions site.postman_collection.json`

To import the environments:
4. Click the gear icon (⚙️)
5. Click Import
6. Click Choose Files
7. Select the three files that end in `.postman_environment.json`
8. Click Petitions: deployed application
9. Change the current value so that it uses your `SENG365_PORT` instead of `4001`
10. Click Update

To choose which application you send your requests to, select the corresponding environment from the dropdown in the top right (by default, it will be "No Environment"). This will set the `BASE_URL` variable.

* "Petitions: localhost" will use the locally running application (on port 4941).
* "Petitions: reference server" will use the reference server.


## Notes about the collection
The collection we have provided does depend on some requests as dependencies of others. Whilst it likely makes sense 
to require login functionality before being able to do other user operations such as editing and deleting. However, the 
login functionality is also used for other requests (such as creating an auction) as authorisation is needed. Similar 
dependencies exists throughout, e.g. first creating an auction before deleting it

Therefore, it is recommended that you first complete the login and register user endpoints, and for each sub section you 
first implement the POST and GET endpoints before working on PATCH/PUT and DELETE.

## Found an Issue?
If you believe you have found an issue with the collection please reach out to Morgan English via email 
`morgan.english@canterbury.ac.nz`