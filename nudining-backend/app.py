import json

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv, find_dotenv
import os

load_dotenv(dotenv_path="C:\\Users\\kzich\\OneDrive\Desktop\\nudining-website\\secret.env")
print("MONGODB_NAME:", os.getenv("MONGODB_NAME"))
print("MONGODBURI:", os.getenv("MONGOURI"))
print("MONGO_COLLECTION_NAME:", os.getenv("MONGO_COLLECTION_NAME"))

app = Flask(__name__)
CORS(app) 

 
# Set up MongoDB connection
client = MongoClient(os.getenv("MONGOURI"))  # Adjust the connection string if necessary
db = client[os.getenv("MONGODB_NAME")]
collection = db[os.getenv("MONGO_COLLECTION_NAME")]
collectionToday = db[os.getenv("TODAYSFOOD")]

@app.route('/api/getCurrentFoodItems', methods=['GET'])
def getCurrentFoodItems():
        # Query MongoDB for the specified food items
        
        todaysFoodTitles = list(collectionToday.find({}, {"title" : 1, "_id" : 0}))
        titleList = [item["title"] for item in todaysFoodTitles]
        todaysFoodItems = list(collection.find({"title" : {"$in" : titleList}}))
        

        formatted_items = [
            {
                "title": item.get("title"),
                "dining_hall": item.get("dining_hall"),
                "meal_period": item.get("meal_period"),
                "portion_size": item.get("portion_size"),
                "nutritional_info": item.get("nutritional_info"),
                "table_caption": item.get("table_caption"),
                "rating": item.get("rating"),
                "rating_count": item.get("rating_count")
            }
            for item in todaysFoodItems
        ]

        return jsonify(formatted_items)


@app.route('/api/rate', methods=['POST'])
def updateRating():
    @app.route('/api/rate', methods=['POST'])
    def rate_item():
        data = request.get_json()
        title = data.get('title')
        new_rating = data.get('rating')

        # Update the item in the database
        updated_item = db.your_collection.find_one_and_update(
            {"title": title},
            {"$inc": {"rating": new_rating, "rating_count": 1}},
            return_document=True  # Return the updated document
        )

        # Ensure the response is JSON-serializable
        if updated_item:
            updated_item = convert_id(updated_item)

        return jsonify(updated_item), 200

if __name__ == '__main__':
    app.run(debug=True)

    
    
    
    
    
