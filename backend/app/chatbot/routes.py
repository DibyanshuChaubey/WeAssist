import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User, UserRole, HostelIssue, IssueStatus, UserStatus
from app.utils.errors import ValidationError
from app.chatbot.llm_service import generate_assistant_reply, llm_enabled

chatbot_bp = Blueprint('chatbot', __name__)

FAQ_ENTRIES = [
    {
        'id': 'account_verification',
        'keywords': ['verify', 'verification', 'approved', 'approval', 'pending'],
        'answer': (
            'Student accounts are created as pending and must be approved by an admin. '
            'Once approved, you can report issues and access full dashboard features.'
        ),
    },
    {
        'id': 'issue_lifecycle',
        'keywords': ['lifecycle', 'status flow', 'issue status', 'reported', 'in_progress', 'resolved'],
        'answer': (
            'Issue lifecycle is: reported -> in_progress -> resolved_by_admin -> closed. '
            'Admins cannot directly close issues; reporter confirmation closes them.'
        ),
    },
    {
        'id': 'report_issue',
        'keywords': ['report issue', 'create issue', 'new issue', 'complaint'],
        'answer': (
            'Go to the Issues page and use Report New Issue. Include a clear title, description, '
            'category, and location details (hostel, floor, room) for faster resolution.'
        ),
    },
    {
        'id': 'event_registration',
        'keywords': ['event', 'register', 'unregister', 'slot'],
        'answer': (
            'Open Events to register/unregister. Registration depends on event registration_status '
            '(upcoming/open/closed) and slot availability.'
        ),
    },
]


def _to_status_summary(issue):
    return {
        'id': issue.id,
        'title': issue.title,
        'status': issue.status.value,
        'reportedDate': issue.reported_date.isoformat() if issue.reported_date else None,
        'updatedDate': issue.updated_date.isoformat() if issue.updated_date else None,
    }


def _status_guidance(status):
    if status == IssueStatus.REPORTED:
        return 'Your issue is queued and waiting for admin action.'
    if status == IssueStatus.IN_PROGRESS:
        return 'Your issue is actively being worked on by the admin team.'
    if status == IssueStatus.RESOLVED_BY_ADMIN:
        return 'Admin marked this resolved. Please confirm resolution to close it.'
    if status == IssueStatus.CLOSED:
        return 'This issue is closed.'
    return 'Status available.'


def _message_has_status_intent(message):
    lowered = message.lower()
    intent_tokens = ['status', 'my issue', 'my complaint', 'ticket', 'progress', 'update']
    return any(token in lowered for token in intent_tokens)


def _extract_issue_id_hint(message):
    match = re.search(r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', message.lower())
    if match:
        return match.group(1)

    short_match = re.search(r'issue\s+#?([a-f0-9]{6,12})', message.lower())
    if short_match:
        return short_match.group(1)

    return None


def _match_faq(message):
    lowered = message.lower()
    best_entry = None
    best_score = 0

    for entry in FAQ_ENTRIES:
        score = 0
        for keyword in entry['keywords']:
            if keyword in lowered:
                score += 1
        if score > best_score:
            best_score = score
            best_entry = entry

    return best_entry if best_score > 0 else None


def _build_user_context(current_user):
    if not current_user:
        return 'auth=anonymous'

    return (
        f"auth=authenticated role={current_user.role.value} "
        f"status={current_user.status.value} hostel={current_user.hostel or 'unknown'}"
    )


@chatbot_bp.route('/ask', methods=['POST'])
def ask_chatbot():
    try:
        data = request.get_json(silent=True) or {}
        message = (data.get('message') or '').strip()
        if not message:
            raise ValidationError('message is required')
    except ValidationError as e:
        return jsonify({'error': 'Invalid request', 'detail': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Invalid request', 'detail': str(e)}), 400

    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        # Treat invalid or expired token as anonymous for chatbot UX.
        user_id = None
    current_user = User.query.get(user_id) if user_id else None
    user_context = _build_user_context(current_user)

    if _message_has_status_intent(message):
        if not current_user:
            return jsonify({
                'type': 'status',
                'source': 'rule-based-v1',
                'reply': 'Please sign in so I can fetch your issue status safely.',
                'suggestions': ['Sign in and ask: What is my latest issue status?'],
            }), 200

        if current_user.role == UserRole.STUDENT:
            issue_hint = _extract_issue_id_hint(message)
            query = HostelIssue.query.filter_by(reporter_id=current_user.id).order_by(HostelIssue.reported_date.desc())

            issue = None
            if issue_hint and len(issue_hint) >= 6:
                if len(issue_hint) == 36:
                    issue = HostelIssue.query.filter_by(id=issue_hint, reporter_id=current_user.id).first()
                else:
                    for candidate in query.limit(30).all():
                        if candidate.id.startswith(issue_hint):
                            issue = candidate
                            break

            if issue:
                rule_reply = f"Issue '{issue.title}' is currently '{issue.status.value}'. {_status_guidance(issue.status)}"
                llm_reply = generate_assistant_reply(
                    user_message=message,
                    additional_context=(
                        f"{user_context}\n"
                        f"issue_id={issue.id}\n"
                        f"issue_title={issue.title}\n"
                        f"issue_status={issue.status.value}\n"
                        f"guidance={_status_guidance(issue.status)}\n"
                        'Rewrite the guidance naturally in 1-2 short lines and keep facts unchanged.'
                    ),
                    max_tokens=140,
                )
                return jsonify({
                    'type': 'status',
                    'source': 'hybrid-v2' if llm_reply else 'rule-based-v1',
                    'reply': llm_reply or rule_reply,
                    'data': {
                        'issues': [_to_status_summary(issue)],
                    },
                    'suggestions': ['Show my last 3 issues', 'How do I close a resolved issue?'],
                }), 200

            recent_issues = query.limit(3).all()
            if not recent_issues:
                return jsonify({
                    'type': 'status',
                    'source': 'rule-based-v1',
                    'reply': 'I could not find any issues reported by your account yet.',
                    'data': {'issues': []},
                    'suggestions': ['How do I report a new issue?'],
                }), 200

            latest = recent_issues[0]
            rule_reply = (
                f"Your latest issue '{latest.title}' is '{latest.status.value}'. "
                f"{_status_guidance(latest.status)}"
            )
            llm_reply = generate_assistant_reply(
                user_message=message,
                additional_context=(
                    f"{user_context}\n"
                    f"latest_issue_title={latest.title}\n"
                    f"latest_issue_status={latest.status.value}\n"
                    f"guidance={_status_guidance(latest.status)}\n"
                    'Respond with a concise personalized summary and one practical next step.'
                ),
                max_tokens=170,
            )
            return jsonify({
                'type': 'status',
                'source': 'hybrid-v2' if llm_reply else 'rule-based-v1',
                'reply': llm_reply or rule_reply,
                'data': {
                    'issues': [_to_status_summary(issue) for issue in recent_issues],
                },
                'suggestions': ['Check issue by ID', 'How do I report another issue?'],
            }), 200

        # Admin status intent response
        total_issues = HostelIssue.query.count()
        open_count = HostelIssue.query.filter(HostelIssue.status != IssueStatus.CLOSED).count()
        resolved_waiting_confirmation = HostelIssue.query.filter_by(status=IssueStatus.RESOLVED_BY_ADMIN).count()
        rule_reply = (
            f'Current issue overview: total={total_issues}, open={open_count}, '
            f'resolved_by_admin={resolved_waiting_confirmation}.'
        )
        llm_reply = generate_assistant_reply(
            user_message=message,
            additional_context=(
                f"{user_context}\n"
                f"stats_total={total_issues}\n"
                f"stats_open={open_count}\n"
                f"stats_resolved_by_admin={resolved_waiting_confirmation}\n"
                'Summarize in plain language and suggest one admin action priority.'
            ),
            max_tokens=170,
        )
        return jsonify({
            'type': 'status',
            'source': 'hybrid-v2' if llm_reply else 'rule-based-v1',
            'reply': llm_reply or rule_reply,
            'data': {
                'stats': {
                    'total': total_issues,
                    'open': open_count,
                    'resolved_by_admin': resolved_waiting_confirmation,
                }
            },
            'suggestions': ['Show issue lifecycle', 'How can students close issues?'],
        }), 200

    faq_match = _match_faq(message)
    if faq_match:
        llm_reply = generate_assistant_reply(
            user_message=message,
            additional_context=(
                f"{user_context}\n"
                f"faq_id={faq_match['id']}\n"
                f"faq_base_answer={faq_match['answer']}\n"
                'Use faq_base_answer as source of truth and expand with 1 actionable tip.'
            ),
            max_tokens=220,
        )
        return jsonify({
            'type': 'faq',
            'source': 'hybrid-v2' if llm_reply else 'rule-based-v1',
            'reply': llm_reply or faq_match['answer'],
            'data': {'faq_id': faq_match['id']},
            'suggestions': ['What is my latest issue status?', 'How do events registration rules work?'],
        }), 200

    verification_hint = ''
    if current_user and current_user.role == UserRole.STUDENT and current_user.status == UserStatus.PENDING_VERIFICATION:
        verification_hint = ' Your account is still pending verification, so issue creation is blocked until approval.'

    llm_reply = None
    if llm_enabled():
        llm_reply = generate_assistant_reply(
            user_message=message,
            additional_context=(
                f"{user_context}\n"
                'If query is outside supported scope, politely redirect to supported capabilities: '
                'issue status, issue lifecycle, account verification, event registration.'
            ),
            max_tokens=220,
        )

    return jsonify({
        'type': 'fallback',
        'source': 'hybrid-v2' if llm_reply else 'rule-based-v1',
        'reply': llm_reply or (
            'I can help with issue status, issue lifecycle, account verification, '
            f'and event registration FAQs.{verification_hint}'
        ),
        'suggestions': [
            'What is my latest issue status?',
            'How do I report a new issue?',
            'How does verification work?'
        ],
    }), 200
