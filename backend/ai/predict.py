"""
AI Prediction Module for Issue Classification and Priority

This module loads trained models and provides prediction functions
for classifying hostel issues and predicting their priority.
"""

import os
import joblib
import logging

logger = logging.getLogger(__name__)

class IssuePredictorService:
    """Service for AI-based issue prediction"""
    
    def __init__(self):
        self.category_model = None
        self.priority_model = None
        self.models_loaded = False
        self._load_models()
    
    def _load_models(self):
        """Load trained ML models"""
        try:
            models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
            category_path = os.path.join(models_dir, 'category_classifier.pkl')
            priority_path = os.path.join(models_dir, 'priority_predictor.pkl')
            
            if os.path.exists(category_path) and os.path.exists(priority_path):
                self.category_model = joblib.load(category_path)
                self.priority_model = joblib.load(priority_path)
                self.models_loaded = True
                logger.info("✓ AI models loaded successfully")
            else:
                logger.info("AI models not found. Using rule-based fallback.")
                logger.debug(f"Expected: {category_path}")
                logger.debug(f"Expected: {priority_path}")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self.models_loaded = False
    
    def predict_category(self, title, description):
        """
        Predict issue category
        
        Args:
            title: Issue title
            description: Issue description
            
        Returns:
            str: Predicted category or None
        """
        if not self.models_loaded:
            logger.debug("Models not loaded, cannot predict category")
            return None
        
        try:
            text = f"{title} {description}"
            category = self.category_model.predict([text])[0]
            
            # Get probability scores
            probabilities = self.category_model.predict_proba([text])[0]
            confidence = max(probabilities)
            
            logger.info(f"Predicted category: {category} (confidence: {confidence:.2f})")
            return category
        except Exception as e:
            logger.error(f"Error predicting category: {e}")
            return None
    
    def predict_priority(self, title, description, category=None):
        """
        Predict issue priority
        
        Args:
            title: Issue title
            description: Issue description
            category: Optional category for context
            
        Returns:
            tuple: (priority, reason) or (None, None)
        """
        if not self.models_loaded:
            logger.debug("Models not loaded, cannot predict priority")
            return None, None
        
        try:
            text = f"{title} {description}"
            if category:
                text += f" {category}"
            
            priority = self.priority_model.predict([text])[0]
            
            # Get probability scores
            probabilities = self.priority_model.predict_proba([text])[0]
            confidence = max(probabilities)
            
            # Generate reason based on confidence
            reason = self._generate_priority_reason(priority, confidence, title, description)
            
            logger.info(f"Predicted priority: {priority} (confidence: {confidence:.2f})")
            return priority, reason
        except Exception as e:
            logger.error(f"Error predicting priority: {e}")
            return None, None
    
    def _generate_priority_reason(self, priority, confidence, title, description):
        """Generate human-readable reason for priority assignment"""
        
        # Keywords that influence priority
        urgent_keywords = ['urgent', 'emergency', 'immediately', 'critical', '危urgent', 'severe']
        safety_keywords = ['safety', 'dangerous', 'risk', 'hazard', 'injury', 'fire', 'electrical']
        discomfort_keywords = ['unbearable', 'extreme', 'cannot', 'broken', 'flooding', 'leakage']
        
        text = (title + ' ' + description).lower()
        
        reasons = []
        
        if priority == 'high':
            if any(keyword in text for keyword in urgent_keywords):
                reasons.append("urgent nature of the issue")
            if any(keyword in text for keyword in safety_keywords):
                reasons.append("potential safety concerns")
            if any(keyword in text for keyword in discomfort_keywords):
                reasons.append("severe impact on living conditions")
            
            if not reasons:
                reasons.append("significant impact on student welfare")
        
        elif priority == 'medium':
            reasons.append("moderate impact requiring timely attention")
        
        else:  # low
            reasons.append("routine maintenance requirement")
        
        reason_text = "AI suggests " + priority.upper() + " priority based on " + ", ".join(reasons)
        reason_text += f" (confidence: {confidence:.0%})"
        
        return reason_text
    
    def analyze_issue(self, title, description):
        """
        Complete analysis of an issue
        
        Args:
            title: Issue title
            description: Issue description
            
        Returns:
            dict: Analysis results with category, priority, and reason
        """
        if not self.models_loaded:
            return {
                'category': None,
                'priority': None,
                'reason': 'AI models not available',
                'success': False
            }
        
        category = self.predict_category(title, description)
        priority, reason = self.predict_priority(title, description, category)
        
        return {
            'category': category,
            'priority': priority,
            'reason': reason,
            'success': True
        }

# Global predictor instance
_predictor = None

def get_predictor():
    """Get or create predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = IssuePredictorService()
    return _predictor

def predict_issue_analysis(title, description):
    """
    Convenience function for issue analysis
    
    Args:
        title: Issue title
        description: Issue description
        
    Returns:
        dict: Analysis results
    """
    predictor = get_predictor()
    return predictor.analyze_issue(title, description)
