"""
AI Model Training Script for Hostel Issue Classification and Priority Prediction

This script trains ML models to:
1. Classify issue categories (Electrical, Plumbing, Cleaning, etc.)
2. Predict issue priority (Low, Medium, High)

Uses scikit-learn with TF-IDF vectorization and ensemble methods.
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib

# Define issue categories
CATEGORIES = [
    'Electrical',
    'Plumbing',
    'Cleaning',
    'Maintenance',
    'Internet/WiFi',
    'Security',
    'Furniture',
    'Food Quality',
    'Noise Complaint',
    'Other'
]

# Define priorities
PRIORITIES = ['low', 'medium', 'high']

def load_training_data():
    """
    Load training data from CSV or create synthetic dataset
    Expected format: id, title, description, category, priority
    """
    # Try to load from dataset folder
    dataset_path = os.path.join(os.path.dirname(__file__), '..', '..', 'dataset', 'complaints.csv')
    
    if os.path.exists(dataset_path):
        try:
            df = pd.read_csv(dataset_path)
            print(f"Loaded {len(df)} records from {dataset_path}")
            return df
        except Exception as e:
            print(f"Error loading dataset: {e}")
    
    # Create synthetic training data
    print("Creating synthetic training data...")
    data = generate_synthetic_data()
    
    # Save synthetic data
    os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
    data.to_csv(dataset_path, index=False)
    print(f"Saved synthetic data to {dataset_path}")
    
    return data

def generate_synthetic_data(n_samples=500):
    """Generate synthetic training data for demonstration"""
    
    synthetic_issues = {
        'Electrical': [
            ('Power outage in room', 'high'),
            ('Light not working', 'medium'),
            ('Socket not functioning', 'medium'),
            ('Fan not working in summer', 'high'),
            ('Tube light flickering', 'low'),
            ('Switch board damaged', 'high'),
            ('No electricity since morning', 'high'),
            ('Frequent voltage fluctuations', 'medium'),
        ],
        'Plumbing': [
            ('Water leakage from ceiling', 'high'),
            ('Tap not working', 'medium'),
            ('Toilet flush broken', 'high'),
            ('No hot water', 'medium'),
            ('Drainage blocked', 'high'),
            ('Water pressure very low', 'medium'),
            ('Bathroom flooding issue', 'high'),
            ('Tap water smells bad', 'high'),
        ],
        'Cleaning': [
            ('Room not cleaned for days', 'medium'),
            ('Garbage not collected', 'medium'),
            ('Common area very dirty', 'medium'),
            ('Bathroom needs cleaning', 'low'),
            ('Corridor not swept', 'low'),
            ('Dustbin overflowing', 'medium'),
            ('Foul smell in washroom', 'high'),
        ],
        'Maintenance': [
            ('Door lock broken', 'high'),
            ('Window pane cracked', 'medium'),
            ('Ceiling paint peeling', 'low'),
            ('Cupboard door fallen', 'medium'),
            ('Wall has cracks', 'low'),
            ('Door not closing properly', 'medium'),
            ('Ventilator broken', 'low'),
        ],
        'Internet/WiFi': [
            ('WiFi not working', 'high'),
            ('Very slow internet speed', 'medium'),
            ('Cannot connect to hostel WiFi', 'high'),
            ('Network down since yesterday', 'high'),
            ('Frequent disconnections', 'medium'),
            ('Router not functioning', 'high'),
        ],
        'Security': [
            ('Unknown person in hostel', 'high'),
            ('Gate lock broken', 'high'),
            ('CCTV not working', 'medium'),
            ('Guards not on duty', 'high'),
            ('Suspicious activity reported', 'high'),
        ],
        'Furniture': [
            ('Bed broken', 'high'),
            ('Chair needs repair', 'medium'),
            ('Table wobbling', 'low'),
            ('Mattress very uncomfortable', 'medium'),
            ('Almirah lock jammed', 'medium'),
        ],
        'Food Quality': [
            ('Food quality very poor', 'high'),
            ('Found insect in food', 'high'),
            ('Meal not properly cooked', 'high'),
            ('Less quantity served', 'medium'),
            ('Stale food served', 'high'),
        ],
        'Noise Complaint': [
            ('Too much noise at night', 'medium'),
            ('Neighbors playing loud music', 'low'),
            ('Construction noise unbearable', 'medium'),
        ],
        'Other': [
            ('General complaint', 'low'),
            ('Suggestion for improvement', 'low'),
            ('Need additional facility', 'low'),
        ]
    }
    
    data_list = []
    issue_id = 1
    
    # Generate multiple variations of each issue
    for category, issues in synthetic_issues.items():
        for title, priority in issues:
            # Create variations
            for _ in range(n_samples // (len(synthetic_issues) * 8)):
                description = f"{title}. Need urgent attention. Located on floor {np.random.randint(1, 5)}."
                data_list.append({
                    'id': issue_id,
                    'title': title,
                    'description': description,
                    'category': category,
                    'priority': priority
                })
                issue_id += 1
    
    df = pd.DataFrame(data_list)
    return df

def train_category_classifier(X_train, y_train, X_test, y_test):
    """Train model to classify issue category"""
    print("\n=== Training Category Classifier ===")
    
    # Create pipeline with TF-IDF and Random Forest
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=1000, ngram_range=(1, 2))),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    # Train
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Accuracy: {accuracy:.3f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return pipeline

def train_priority_predictor(X_train, y_train, X_test, y_test):
    """Train model to predict issue priority"""
    print("\n=== Training Priority Predictor ===")
    
    # Create pipeline with TF-IDF and Gradient Boosting
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=800, ngram_range=(1, 2))),
        ('clf', GradientBoostingClassifier(n_estimators=100, random_state=42))
    ])
    
    # Train
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Accuracy: {accuracy:.3f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return pipeline

def save_models(category_model, priority_model):
    """Save trained models"""
    models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    category_path = os.path.join(models_dir, 'category_classifier.pkl')
    priority_path = os.path.join(models_dir, 'priority_predictor.pkl')
    
    joblib.dump(category_model, category_path)
    joblib.dump(priority_model, priority_path)
    
    print(f"\n✓ Models saved to {models_dir}")
    print(f"  - {category_path}")
    print(f"  - {priority_path}")

def main():
    """Main training function"""
    print("=" * 60)
    print("Hostel Issue Classification - AI Model Training")
    print("=" * 60)
    
    # Load data
    df = load_training_data()
    
    # Prepare features (combine title and description)
    df['text'] = df['title'].fillna('') + ' ' + df['description'].fillna('')
    
    # Train Category Classifier
    X = df['text']
    y_category = df['category']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_category, test_size=0.2, random_state=42, stratify=y_category
    )
    
    category_model = train_category_classifier(X_train, y_train, X_test, y_test)
    
    # Train Priority Predictor
    y_priority = df['priority']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_priority, test_size=0.2, random_state=42, stratify=y_priority
    )
    
    priority_model = train_priority_predictor(X_train, y_train, X_test, y_test)
    
    # Save models
    save_models(category_model, priority_model)
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()
