import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import { MongoClient, ObjectId } from 'mongodb';

const mongodbConnectionUrl = process.env.MONGODB_URI_CONNECTION_STRING;
const mongodbDatabaseName = process.env.MONGODB_URI_DATABASE_NAME;
const mongodbCollectionName = process.env.MONGODB_URI_COLLECTION_NAME;

let client;
let database;
let rentalsCollection;

const toJson = (data) => {
  // convert _id to id and clean up
  const idWithoutUnderscore = data._id.toString();
  delete data._id;

  return {
    id: idWithoutUnderscore,
    ...data,
  };
};

// Get all rentals from database
// Transform `_id` to `id`
export const getRentals = async () => {
  const rentals = await rentalsCollection.find({}).toArray();
  if (!rentals) return [];

  const alteredRentals = rentals.map((rental) => toJson(rental));
  console.log(alteredRentals);
  return alteredRentals;
};
// Get one rental by id
export const getRentalById = async (id) => {
  if (!id) return null;

  const rental = await rentalsCollection.findOne({ _id: new ObjectId(id) });
  return toJson(rental);
};
// Delete one rental by id
export const deleteRentalById = async (id) => {
  if (!id) return null;

  return await rentalsCollection.deleteOne({ _id: ObjectId(id) });
};
// Add one rental
export const addRental = async (rental) => {
  return await rentalsCollection.insertOne(rental);
};
// Update one rental
// Only handles database, image changes are handled in controller
export const updateRental = async (rental) => {
  return await rentalsCollection.updateOne({ _id: new ObjectId(rental.id) }, { $set: rental });
};
// Create database connection
export const connectToDatabase = async () => {

  try{

    if(!mongodbConnectionUrl || !mongodbDatabaseName || !mongodbCollectionName){
      return {
        status: false,
        err: 'Missing required params to begin database connection'
      };
    }

    // if not connected, go ahead and connect
    if (!client || !database || !rentalsCollection) {

      console.log("(Re)Established connection to database");

      // connect
      client = await MongoClient.connect(mongodbConnectionUrl, {
        useUnifiedTopology: true,
      });
  
      // get database
      database = client.db(mongodbDatabaseName);
  
      // create collection if it doesn't exist
      const collections = await database.listCollections().toArray();
      const collectionExists = collections.filter((collection) => collection.name === mongodbCollectionName);
      if (!collectionExists) {
        await database.createCollection(mongodbCollectionName);
      }
  
      // get collection
      rentalsCollection = await database.collection(mongodbCollectionName);
      return {
        status: true, 
        action: "(Re)Established connection to database"
      };
    } else {
      console.log('Already connected');
      return {
        status: true,
        action: "Already connected"
      };
    }
  }catch(err){
    console.log(err);
    return {
      status: false,
      err
    }
  }

};
