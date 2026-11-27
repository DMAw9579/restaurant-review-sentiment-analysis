import csv
import random
from datetime import datetime, timedelta

# Sample data for generation
restaurant_names = ['Spice Villa', 'Urban Tandoor', 'Burger Blast']
cities = ['Mumbai', 'Pune', 'Delhi']
positive_reviews = [
    'Excellent food and service!', 'Loved the ambiance and the dishes.',
    'Amazing experience, will visit again.', 'Very tasty and fresh food.',
    'Great service and delicious meals.', 'Highly recommended restaurant.',
    'The best place in town for dinner.', 'Staff were friendly and food was superb.',
    'Fantastic flavors and fast service.', 'Top-notch experience, food was great!'
]
negative_reviews = [
    'Food was cold and bland.', 'Service was very slow.',
    'Too pricey for the quality.', 'Not a good experience.',
    'Disappointed with the food.', 'Ambiance was dull and food was soggy.',
    'Poor service and average taste.', 'Overcooked food and noisy place.',
    'Tables were dirty, not worth it.', 'Would not recommend this place.'
]

# Helper function for sentiment analysis (basic logic)
def get_sentiment(text):
    score = sum(word in text.lower() for word in ['excellent', 'loved', 'amazing', 'tasty', 'great', 'recommended', 'best', 'friendly', 'fantastic', 'top-notch'])
    score -= sum(word in text.lower() for word in ['cold', 'slow', 'pricey', 'disappointed', 'dull', 'poor', 'overcooked', 'dirty', 'not worth', 'noisy'])
    return 'Positive' if score > 0 else 'Negative' if score < 0 else 'Neutral'

# Generate 50 sample reviews
entries = []
for _ in range(50):
    restaurant = random.choice(restaurant_names)
    city = random.choice(cities)
    date = (datetime.today() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d')
    rating = random.randint(1, 5)
    review = random.choice(positive_reviews if rating >= 4 else negative_reviews)
    sentiment = get_sentiment(review)

    entries.append({
        'restaurant_name': restaurant,
        'city': city,
        'review_date': date,
        'review_rating': rating,
        'review_text': review,
        'review_sentiment': sentiment
    })

# Save to CSV format as string
csv_output = "restaurant_name,city,review_date,review_rating,review_text,review_sentiment\n"
for entry in entries:
    csv_output += f"{entry['restaurant_name']},{entry['city']},{entry['review_date']},{entry['review_rating']}," \
                  f"\"{entry['review_text']}\",{entry['review_sentiment']}\n"

csv_output[:1000]  # Preview first 1000 characters of CSV data
