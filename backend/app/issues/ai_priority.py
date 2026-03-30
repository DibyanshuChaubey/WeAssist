from app.models import IssuePriority
import re
import sys
import os
import logging

logger = logging.getLogger(__name__)

# Add ai module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    from ai.predict import predict_issue_analysis
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    logger.warning("AI prediction module not available; using rule-based priority fallback")

class PriorityAI:
    """ML-based AI for issue priority suggestion with rule-based fallback"""
    
    # Keyword-based high priority indicators (fallback)
    HIGH_PRIORITY_KEYWORDS = {
        'emergency', 'urgent', 'critical', 'danger', 'broken', 'leak', 'flood',
        'fire', 'electrical fault', 'water shortage', 'no water', 'blackout',
        'power outage', 'gas leak', 'structural damage', 'injury', 'accident',
        'severe', 'hazard', 'risk', 'immediately', 'cannot'
    }
    
    # Category priority mapping (fallback)
    CATEGORY_PRIORITY = {
        'Electrical': 'high',
        'Plumbing': 'high',
        'Security': 'high',
        'Internet/WiFi': 'medium',
        'Maintenance': 'medium',
        'Cleaning': 'low',
        'Furniture': 'medium',
        'Food Quality': 'high',
        'Noise Complaint': 'low',
        'Other': 'medium'
    }
    
    @staticmethod
    def suggest_priority(title, description, category, hostel=None, floor=None):
        """
        Suggest priority based on issue details using ML model
        Returns: (priority, reason)
        """
        # Try ML-based prediction first
        if AI_AVAILABLE:
            try:
                analysis = predict_issue_analysis(title, description)
                if analysis['success'] and analysis['priority']:
                    priority_str = analysis['priority']
                    reason = analysis['reason'] or 'AI-based priority prediction'
                    
                    # Convert string to enum
                    priority_map = {
                        'low': IssuePriority.LOW,
                        'medium': IssuePriority.MEDIUM,
                        'high': IssuePriority.HIGH
                    }
                    priority = priority_map.get(priority_str, IssuePriority.MEDIUM)
                    
                    return priority, reason
            except Exception as e:
                logger.warning(f"ML prediction failed: {e}. Falling back to rule-based priority")
        
        # Fallback to rule-based priority
        return PriorityAI._rule_based_priority(title, description, category, hostel, floor)
    
    @staticmethod
    def _rule_based_priority(title, description, category, hostel=None, floor=None):
        """
        Rule-based fallback for priority suggestion
        Returns: (priority, reason)
        """
        # Convert to lowercase for matching
        text = f"{title} {description}".lower()
        
        # Check for high-priority keywords
        for keyword in PriorityAI.HIGH_PRIORITY_KEYWORDS:
            if keyword in text:
                return IssuePriority.HIGH, f'High-priority keyword detected: "{keyword}"'
        
        # Check entire floor impact (e.g., "floor 2 wifi", "entire floor")
        if any(phrase in text for phrase in ['entire floor', 'all rooms', 'whole floor', 'all students']):
            return IssuePriority.HIGH, 'Issue affects entire floor/multiple students'
        
        # Category-based priority
        base_priority = PriorityAI.CATEGORY_PRIORITY.get(category, 'medium')
        reason = f'Category-based rule: "{category}"'
        
        # Convert string priority to enum
        priority_map = {
            'low': IssuePriority.LOW,
            'medium': IssuePriority.MEDIUM,
            'high': IssuePriority.HIGH
        }
        
        return priority_map[base_priority], reason
    
    @staticmethod
    def get_ai_suggestions():
        """Get list of current AI rules for documentation"""
        return {
            'ml_enabled': AI_AVAILABLE,
            'high_priority_keywords': list(PriorityAI.HIGH_PRIORITY_KEYWORDS),
            'category_priority_mapping': PriorityAI.CATEGORY_PRIORITY,
            'note': 'ML-based system with rule-based fallback. Admin can override AI suggestion.'
        }
