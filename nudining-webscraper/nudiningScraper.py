from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import *
from pathlib import Path

import time
from pymongo import MongoClient
import json
import os
import requests
# Set up Selenium WebDriver
 # Update this path to point to your actual chromedriver path
driver = webdriver.Chrome()

#Load env variables
env_path = Path(__file__).parent.parent / 'secret.env'

load_dotenv(dotenv_path=env_path)
print("MONGODB_NAME:", os.getenv("MONGODB_NAME"))
print("MONGODBURI:", os.getenv("MONGOURI"))
print("MONGO_COLLECTION_NAME:", os.getenv("MONGO_COLLECTION_NAME"))



# Set up MongoDB connection
client = MongoClient(os.getenv("MONGOURI"))  # Adjust the connection string if necessary
db = client[os.getenv("MONGODB_NAME")]
collection = db[os.getenv("MONGO_COLLECTION_NAME")]
collectionToday = db[os.getenv("TODAYSFOOD")]
collectionToday.delete_many({})

#Set up API endpoint connection
api_url = os.getenv("FLASK_API_URL")


try:
    # Step 1: Navigate to the page
    driver.get('https://nudining.com/public/whats-on-the-menu')
    print("Navigated to the page.")

    # Step 2: Wait for DropDown to load
    validDiningHalls = ["United Table at International Village", "The Eatery at Stetson East"]
    WebDriverWait(driver, 20).until(
        EC.presence_of_all_elements_located((By.CLASS_NAME, 'dropdown-button-content'))
    )
    diningHallDD = driver.find_elements(By.CLASS_NAME, "dropdown-button-content")
    diningHallDD[0].click()
    time.sleep(5)
    WebDriverWait(driver, 20).until(
        EC.presence_of_all_elements_located((By.CLASS_NAME, 'dropdown-item'))
    )
    dHall = driver.find_elements(By.CLASS_NAME, "dropdown-item")

    # Step 3: Filter Dining Halls
    diningHallList = [hall for hall in dHall if hall.text.strip() in validDiningHalls]

    # Define valid meal periods
    validNames = ["Breakfast", "Lunch", "Dinner", "Everyday"]
    #Used to store allergens
    labels = []

    # Function to find a nav link by text
    def find_nav_link_by_text(text):
        try:
            return driver.find_element(By.XPATH, f"//a[contains(@class, 'nav-link') and normalize-space(text())='{text}']")
        except NoSuchElementException:
            print(f"Nav link with text '{text}' not found.")
            return None

    # Main loop
    for hall in diningHallList:
        if(hall == diningHallList[1]):
            diningHallDD[0].click()
        hall_name = hall.text.strip()
        print(f"Processing dining hall: {hall_name}")

        # Click the dining hall
        try:
            driver.execute_script("arguments[0].scrollIntoView(true);", hall)
            WebDriverWait(driver, 10).until(EC.element_to_be_clickable(hall))
            hall.click()
            time.sleep(2)  # Allow the page to update
        except ElementNotInteractableException:
            print(f"Element not interactable for hall: {hall_name}. Retrying after scrolling.")
            driver.execute_script("arguments[0].scrollIntoView(true);", hall)
            hall.click()
            time.sleep(2)

        # Re-fetch meal periods after each dining hall click
        for mealPeriodName in validNames:
            try:
                # Wait for nav-links to be visible
                WebDriverWait(driver, 20).until(
                    EC.visibility_of_all_elements_located((By.CLASS_NAME, 'nav-link'))
                )

                # Locate the link with the mealPeriodName
                link = find_nav_link_by_text(mealPeriodName)
                if link is None:
                    continue  # Skip if link not found

                print(f"Clicking on meal period: {mealPeriodName}")
                driver.execute_script("arguments[0].scrollIntoView(true);", link)
                WebDriverWait(driver, 10).until(EC.element_to_be_clickable(link))
                link.click()
                time.sleep(2)  # Allow the page to update

                # Wait for the tables to load
                WebDriverWait(driver, 10).until(
                    EC.presence_of_all_elements_located((By.TAG_NAME, 'table'))
                )
                tables = driver.find_elements(By.XPATH, f"//table[contains(@role, 'table')]")


            except Exception as e:
                print(f"Error processing {mealPeriodName} in {hall_name}: {e}")

            # Step 4: Iterate over each table
            for table_index, table in enumerate(tables):
                try:
                    # Extract the caption from the table
                    caption_element = table.find_element(By.TAG_NAME, 'caption')
                    table_caption = caption_element.text.strip()
                    print(f"Table {table_index + 1} Caption: {table_caption}")

                    # Find the tbody inside the table
                    tbody = table.find_element(By.TAG_NAME, 'tbody')

                    # Find all tr elements inside tbody
                    rows = tbody.find_elements(By.TAG_NAME, 'tr')

                    # Step 5: Iterate over each tr (row)
                    for row_index, row in enumerate(rows):
                        try:
                            # Find the two td elements with data-label="Menu item" and data-label="Portion"
                            menu_item_td = row.find_element(By.XPATH, './/td[@data-label="Menu item"]')
                            portion_td = row.find_element(By.XPATH, './/td[@data-label="Portion"]')

                            # In menu_item_td, find the nested <strong> element (could be nested)
                            strong_element = menu_item_td.find_element(By.XPATH, './/strong')
                            title = strong_element.text.strip()
                            print(f"Title: {title}")

                            # Check if the item already exists in the database
                            existing_item = collection.find_one({'title': title})
                            collectionToday.insert_one({"title" : title})
                            print(f"Inserted {title} into todaysFood")
                            if existing_item:
                                print(f"Item '{title}' already exists in the database. Skipping insertion.")
                                continue  # Skip to the next item

                            # In menu_item_td, find the nested <button> element (could be nested)
                            button_element = menu_item_td.find_element(By.XPATH, './/button')

                            # In portion_td, find the <div> element
                            div_element = portion_td.find_element(By.TAG_NAME, 'div')
                            portion_size = div_element.text.strip()
                            print(f"Portion Size: {portion_size}")

                            images = row.find_elements(By.TAG_NAME, 'img')
                            print(f"Image elements: {images}")
                            for img_element in images:
                                src = img_element.get_attribute('src')
                                print(f"Image src: {src}")
                                veganSrc = "https://www.nudining.com/img/icon_vegetarian.png"
                                glutenSrc = "https://nudining.com/img/icon_avoiding_gluten.png"
                                proteinSrc = "https://nudining.com/img/icon_protein.png"

                                if src == veganSrc:
                                    labels.append("vegan")
                                elif src == glutenSrc:
                                    labels.append("gluten")
                                elif src == proteinSrc:
                                    labels.append("protein")
                            print(labels)





                            # Click the button to open the nutritional modal
                            driver.execute_script("arguments[0].scrollIntoView(true);", button_element)  # Scroll to make it visible
                            time.sleep(1)  # Pause for visibility
                            button_element.click()
                            print("Clicked the Nutritional Info button.")

                            # Wait for the modal to appear (id starts with 'nutritional-modal')
                            nutritional_modal = WebDriverWait(driver, 10).until(
                                EC.presence_of_element_located((By.XPATH, "//div[starts-with(@id, 'nutritional-modal')]"))
                            )

                            # Inside the modal, find the <ul> element
                            time.sleep(1)
                            ul_element = nutritional_modal.find_element(By.TAG_NAME, 'ul')

                            # Find all <li> elements inside the <ul>
                            time.sleep(1)
                            li_elements = ul_element.find_elements(By.TAG_NAME, 'li')

                            # Initialize a dictionary to store nutritional info
                            nutritional_info = {}

                            # Iterate over each <li> element
                            for li in li_elements:
                                try:
                                    text = li.text.strip()
                                    macro = text.split(":")
                                    macroName = macro[0]
                                    macoAmount = macro[1]


                                    # Add to nutritional info dictionary
                                    nutritional_info[macroName] = macoAmount
                                    print(f"Extracted - {macroName}: {macoAmount}")
                                except Exception as e:
                                    print(f"Error parsing li element: {e}")
                                    continue

                            # Close the modal
                            close_button = nutritional_modal.find_element(By.XPATH, ".//button[contains(@class, 'close')]")
                            close_button.click()
                            time.sleep(1)  # Wait to ensure the modal is closed

                            # Prepare the data to insert into MongoDB
                            item_data = {
                                'dining_hall': hall_name,
                                'meal_period': mealPeriodName,
                                'title': title,
                                'portion_size': portion_size,
                                'nutritional_info': json.dumps(nutritional_info),  # Convert dictionary to JSON string
                                'table_caption': table_caption,
                                'rating': 0,            # Initialize rating
                                'rating_count': 0,       # Initialize rating count
                                'labels': json.dumps(labels)
                            }

                            # Insert the item into MongoDB
                            collection.insert_one(item_data)
                            print(f"Inserted item '{title}' with caption '{table_caption}' into the database.")
                            labels = []
                            print("-" * 50)

                        except Exception as e:
                            print(f"Error processing row {row_index} in table {table_index}: {e}")
                            continue  # Move to the next row if there's an error

                except Exception as e:
                    print(f"Error processing table {table_index}: {e}")
                    continue  # Move to the next table if there's an error

except Exception as e:
    print("Error:", e)

finally:
    # Close the browser
    driver.quit()
    # Close the MongoDB connection
    client.close()