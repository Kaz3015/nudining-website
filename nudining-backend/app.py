import json
from bson import json_util
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from pymongo import MongoClient, ReturnDocument
from pathlib import Path
import os
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps





# Load environment variables
env_path = Path(__file__).parent.parent / 'secret.env'

app = Flask(__name__)

cred = credentials.Certificate(os.environ.get("cred"))
firebase_admin.initialize_app(cred)

# Allowed origins (both localhost and 127.0.0.1)
allowed_origins = ["http://localhost:5002", "http://127.0.0.1:5002"]

# Configure CORS
CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)

# MongoDB setup
client = MongoClient(os.environ.get("MONGOURI"))
db = client[os.environ.get("MONGODB_NAME")]
collection = db[os.environ.get("MONGO_COLLECTION_NAME")]
collectionToday = db[os.environ.get("TODAYSFOOD")]
collectionMisc = db[os.environ.get("MISC")]

# Firebase authentication decorator
def firebase_token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        id_token = None
        # Get the token from the Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                id_token = parts[1]
        if not id_token:
            return jsonify({'message': 'Unauthorized'}), 401
        try:
            # Verify the token with Firebase
            decoded_token = auth.verify_id_token(id_token)
            request.uid = decoded_token['uid']
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Authentication error: {e}")
            return jsonify({'message': 'Unauthorized'}), 401
    return decorated_function


@app.after_request
def add_cors_headers(response):
    """Add CORS headers to all responses."""
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Vary'] = 'Origin'
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'

    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    return response


@app.before_request
def handle_options():
    """Handle preflight OPTIONS requests."""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Max-Age'] = '86400'
        return response


@app.errorhandler(401)
def unauthorized(e):
    """Handles unauthorized errors."""
    response = jsonify({"message": "Unauthorized"})
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = 'null'
    return response, 401

@app.errorhandler(Exception)
def handle_exception(e):
    """Handles all exceptions."""
    print(f"Error occurred: {e}")
    response = jsonify({"message": "Internal server error"})
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = 'null'
    return response, 500

@app.route('/api/getCurrentFoodItems', methods=['GET'])
@firebase_token_required
def get_current_food_items():
    """Retrieve current food items."""
    try:
        todaysFoodTitles = list(collectionToday.find({}, {"title": 1, "_id": 0}))
        titleList = [item["title"] for item in todaysFoodTitles]
        todaysFoodItems = list(collection.find({"title": {"$in": titleList}}))

        formatted_items = [
            {
                "title": item.get("title"),
                "dining_hall": item.get("dining_hall"),
                "meal_period": item.get("meal_period"),
                "portion_size": item.get("portion_size"),
                "nutritional_info": item.get("nutritional_info"),
                "table_caption": item.get("table_caption"),
                "rating": item.get("rating"),
                "rating_count": item.get("rating_count"),
                "labels": item.get("labels"),
                "ingredients": item.get("ingredients"),
            }
            for item in todaysFoodItems
        ]
        return jsonify(formatted_items), 200
    except Exception as e:
        print(f"Error in getCurrentFoodItems: {e}")
        return jsonify({"message": "Failed to retrieve food items"}), 500

@app.route('/api/updateMacros', methods=['POST'])
@firebase_token_required
def update_macros():
    """Update user macros."""
    try:
        data = request.json
        print("Received data:", data)

        uid = data.get('uid')
        serving_size = data.get('serving_size')
        food_item = data.get('food_item')

        if not uid or not serving_size or not food_item:
            return jsonify({"message": "Missing required fields"}), 400

        # Parse nutritional information safely
        nutritional_info = food_item.get('nutritional_info')
        if isinstance(nutritional_info, str):
            nutritional_info = json.loads(nutritional_info)

        def safe_float(value):
            """Convert a value to float, defaulting to 0 if it fails."""
            try:
                return float(value.replace("less than", "0").split()[0])  # Handle strings like "less than 1 gram"
            except (ValueError, AttributeError):
                return 0.0

        user = collectionMisc.find_one({"uid": uid})
        if user:
            macros = user.get("macros", {"calories": 0, "protein": 0, "carbs": 0, "fat": 0})
            macros["calories"] += round(safe_float(nutritional_info.get("Calories", "0")) * serving_size)
            macros["protein"] += round(safe_float(nutritional_info.get("Protein (g)", "0")) * serving_size)
            macros["carbs"] += round(safe_float(nutritional_info.get("Total Carbohydrates (g)", "0")) * serving_size)
            macros["fat"] += round(safe_float(nutritional_info.get("Total Fat (g)", "0")) * serving_size)

            # Ensure no negative macros
            macros = {k: max(0, v) for k, v in macros.items()}

            updated_user = collectionMisc.find_one_and_update(
                {"uid": uid},
                {"$set": {"macros": macros}},
                return_document=ReturnDocument.AFTER
            )
            print(f"Updated user macros: {updated_user}")
            return jsonify({"message": "Macros updated successfully", "macros": macros}), 200
        else:
            return jsonify({"message": "User does not exist"}), 404
    except Exception as e:
        print(f"Error in update_macros: {e}")
        return jsonify({"message": "Failed to update macros"}), 500



@app.route('/api/getUserRatedFood', methods=['GET'])
@firebase_token_required
def get_user_rated_food():
    """Retrieve list of food items rated by the user."""
    try:
        uid = request.uid  # Retrieved from the authentication decorator
        print(f"Fetching rated food for user UID: {uid}")

        user = collectionMisc.find_one({"uid": uid})
        if user:
            rated_food = user.get("ratedFood", [])
            return jsonify({"ratedFood": rated_food}), 200
        else:
            return jsonify({"ratedFood": []}), 200
    except Exception as e:
        print(f"Error in getUserRatedFood: {e}")
        return jsonify({"message": "Failed to fetch user rated food"}), 500

@app.route('/api/makeUser', methods=['POST'])
@firebase_token_required
def make_user():
    """Create a new user in the database."""
    try:
        data = request.json
        uid = data.get('uid')

        existing_user = collectionMisc.find_one({"uid": uid})
        if existing_user:
            return jsonify({"message": "User already exists"}), 200

        new_user = {"uid": uid, "ratedFood": [], "macros": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}}
        collectionMisc.insert_one(new_user)
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        print(f"Error in make_user: {e}")
        return jsonify({"message": "Failed to create user"}), 500

@app.route('/api/getUserMacros', methods=['GET'])
@firebase_token_required
def get_user_macros():
    """Retrieve user's current macros."""
    try:
        uid = request.uid  # Retrieved from the authentication decorator
        print(f"Fetching macros for user UID: {uid}")

        user = collectionMisc.find_one({"uid": uid})
        if user:
            macros = user.get("macros", {"calories": 0, "protein": 0, "carbs": 0, "fat": 0})
            return jsonify({"macros": macros}), 200
        else:
            return jsonify({"message": "User does not exist"}), 404
    except Exception as e:
        print(f"Error in getUserMacros: {e}")
        return jsonify({"message": "Failed to fetch user macros"}), 500

@app.route('/api/rate', methods=['POST'])
@firebase_token_required
def update_rating():
    """Update rating for a food item."""
    try:
        data = request.json
        print("Received data:", data)

        title = data.get('title')
        new_rating = data.get('rating')
        uid = data.get('uid')

        if not title or not new_rating or not uid:
            return jsonify({"message": "Missing required fields"}), 400

        user = collectionMisc.find_one({"uid": uid})
        if user:
            rated_food = user.get("ratedFood", [])

            if title in rated_food:
                # Update the existing rating
                existing_rating = collection.find_one({"title": title})
                if existing_rating:
                    total_rating = existing_rating.get("rating", 0)
                    rating_count = existing_rating.get("rating_count", 0)
                    new_total_rating = total_rating + new_rating - (total_rating / rating_count)
                    collection.find_one_and_update(
                        {"title": title},
                        {"$set": {"rating": new_total_rating}},
                        return_document=ReturnDocument.AFTER,
                    )
            else:
                # Add new rating
                collection.find_one_and_update(
                    {"title": title},
                    {"$inc": {"rating": new_rating, "rating_count": 1}},
                    return_document=ReturnDocument.AFTER,
                )
                collectionMisc.find_one_and_update(
                    {"uid": uid},
                    {"$push": {"ratedFood": title}},
                    return_document=ReturnDocument.AFTER,
                )

            updated_item = collection.find_one({"title": title})
            send_item = json.loads(json_util.dumps(updated_item))
            return jsonify(send_item), 200
        else:
            return jsonify({"message": "User does not exist"}), 404
    except Exception as e:
        print(f"Error in update_rating: {e}")
        return jsonify({"message": "Failed to update rating"}), 500

@app.route('/api/resetMacros', methods=['POST'])
@firebase_token_required
def resetMacros():
    data = request.json
    print("Received data:", data)
    uid = data.get('uid')
    if not uid:
        return jsonify({"message": "Missing required fields"}), 400
    user = collectionMisc.find_one({"uid": uid})
    if user:
        collectionMisc.find_one_and_update(
            {"uid": uid},
            {"$set": {"macros": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}}},
            return_document=ReturnDocument.AFTER
        )
        return jsonify({"message": "Macros reset successfully"}), 200
    else:
        return jsonify({"message": "User does not exist"}), 404

if __name__ == '__main__':
    app.run(debug=False)
