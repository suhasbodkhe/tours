## MongoDB

Connection string: (if connection fails, check the IP address in the Mongo ATLAS)
For Mongo Shell - mongo "mongodb+srv://cluster0.xx4n5.mongodb.net/myFirstDatabase" --username suhas004
For MongoDB-Compass - mongodb+srv://suhas004:<password>@cluster0.xx4n5.mongodb.net/test
For MongoDB connection with our Application - mongodb+srv://suhas004:<password>@cluster0.xx4n5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority

mongod.exe - the server
mongo.exe - the shell - here we execute the DB queries
quit() - to quit the DB.
MongoDB consists of colections (equivalent to Table in RDBMS) and documents (equivalent to rows in RDBMS).
use <db_name> - creates (if doesn't exist) and switches to the given db_name
db.tours.insertMany(object[]) - Here, "db" refers to the current database and "tours" is a collection name. InsertMany function will populate the collection with multiple documents.
MongoDB can accept collection of documents with different properties.
For example, insertMany([{name: "some name"},{name: "another name", price: 45}, {price: 789}])

MongoDB uses BSON (has strict type checking), which is equivalent to JSON in structure. When a JSON like object is passed in insertMany({}), it is automatically converted to the BSON.

for example, db.tours.insertMany({ name: "A name here", price: 235}, {{ name: "Another name here", price: 435}}); Property names here can also have double quotes like JSON object.

## Functions on collections:

## List Database commands:

show dbs - shows all the databases
use <db_name> - creates (if doesn't exist) and switches to the given db_name
show collections - shows all the collections

## Database creation:

To be used on - db.<collection>.<method>

insertMany([{},{}]) - inserts multiple documents/objects/rows. Accetps an array of multiple objects.
insertOne({}) - inserts only one document/object/row
updateOne/Many, deleteMany/One, replaceOne
find() - lists all the collections

The following methods can also add new documents to a collection:

db.collection.insert() - used to insert single or many documents.

NOTE: All update operators use $set operator
db.collection.update() when used with the upsert: true option.
db.collection.updateOne() when used with the upsert: true option. See example below.
db.collection.updateMany() when used with the upsert: true option.
db.collection.findAndModify() when used with the upsert: true option.
db.collection.findOneAndUpdate() when used with the upsert: true option.
db.collection.findOneAndReplace() when used with the upsert: true option.
db.collection.save().
db.collection.bulkWrite().

## Query operators

To be used on - db.<collection>.<method>

find() - returns all the documents from the collection
find({}) - returns document as per the filter specified. for example, db.tours.find({name: "some name"});
find({price: {$lte: 500}}) - logical operator lte, gte, gt, lt, in, nin, eq, ne.

The following example retrieves all documents from the inventory collection where status equals either "A" or "D":
db.inventory.find( { status: { $in: [ "A", "D" ] } } )

NOTE: Although you can express this query using the $or operator, use the $in operator rather than the $or operator when performing equality checks on the same field.

## OR operators

db.inventory.find( { $or: [ { status: "A" }, { qty: { $lt: 30 } } ] } )

## AND operator

db.inventory.find( { status: "A", qty: { $lt: 30 } } )

## AND as well as OR operators

db.inventory.find( {
status: "A",
$or: [ { qty: { $lt: 30 } }, { item: /^p/ } ]
} )

## Match an array

To specify equality condition on an array, use the query document { <field>: <value> } where <value> is the exact array to match, including the order of the elements.

The following example queries for all documents where the field tags value is an array with exactly two elements, "red" and "blank", in the specified order:

db.inventory.find( { tags: ["red", "blank"] } )

If, instead, you wish to find an array that contains both the elements "red" and "blank", without regard to order or other elements in the array, use the $all operator:

db.inventory.find( { tags: { $all: ["red", "blank"] } } )

## Update operators

db.tours.updateOne({name: "Coding Geek"}, {$set: {experience: 9}}); This updates only the first one if occurences/matches (with name as "Coding Geek") are many.

db.tours.updateMany({price: {$gt: 500}, rating: {$gte: 4.8}}, {$set: {premium: true}});

## Delete operators

db.tours.deleteMany( {rating : {$lt: 4}})

CAUTION: Following will delete all documents from a collection
db.tours.deleteMany({})
