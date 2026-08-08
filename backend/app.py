import logging
import os
import time
from datetime import datetime, timezone

from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from prometheus_flask_exporter import PrometheusMetrics
from sqlalchemy import text


db = SQLAlchemy()


class Ticket(db.Model):
    __tablename__ = "tickets"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    requester_email = db.Column(db.String(160), nullable=False, index=True)
    priority = db.Column(db.String(20), nullable=False, default="medium")
    status = db.Column(db.String(20), nullable=False, default="open", index=True)
    attachment_key = db.Column(db.String(500))
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "requester_email": self.requester_email,
            "priority": self.priority,
            "status": self.status,
            "attachment_key": self.attachment_key,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(
        SQLALCHEMY_DATABASE_URI=os.getenv(
            "DATABASE_URL", "postgresql://support:support@localhost:5432/support"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True, "pool_recycle": 300},
        MAX_CONTENT_LENGTH=10 * 1024 * 1024,
    )
    if test_config:
        app.config.update(test_config)

    CORS(app)
    db.init_app(app)
    PrometheusMetrics(app, group_by="endpoint")

    logger = logging.getLogger("support-ticket-api")
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter(
                '{"time":"%(asctime)s","level":"%(levelname)s",'
                '"service":"support-ticket-api","message":"%(message)s"}'
            )
        )
        logger.addHandler(handler)
    logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

    @app.before_request
    def start_timer():
        g.started_at = time.perf_counter()

    @app.after_request
    def log_request(response):
        duration_ms = round((time.perf_counter() - g.started_at) * 1000, 2)
        logger.info(
            "%s %s status=%s duration_ms=%s",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )
        return response

    @app.get("/api/live")
    def live():
        return jsonify({"status": "alive", "service": "support-ticket-api"})

    @app.get("/api/ready")
    def ready():
        try:
            # Phase 1 bootstrap. A later phase replaces this with versioned migrations.
            db.create_all()
            db.session.execute(text("SELECT 1"))
            return jsonify({"status": "ready", "database": "connected"})
        except Exception:
            logger.exception("Readiness check failed")
            return jsonify({"status": "not_ready", "database": "disconnected"}), 503

    @app.get("/api/tickets")
    def list_tickets():
        query = Ticket.query
        if request.args.get("status"):
            query = query.filter_by(status=request.args["status"])
        return jsonify([ticket.to_dict() for ticket in query.order_by(Ticket.id.desc()).all()])

    @app.get("/api/tickets/<int:ticket_id>")
    def get_ticket(ticket_id):
        ticket = db.session.get(Ticket, ticket_id)
        if ticket is None:
            return jsonify({"error": "Ticket not found"}), 404
        return jsonify(ticket.to_dict())

    @app.post("/api/tickets")
    def create_ticket():
        data = request.get_json(silent=True) or {}
        required = ("title", "description", "requester_email")
        missing = [field for field in required if not str(data.get(field, "")).strip()]
        if missing:
            return jsonify({"error": "Missing required fields", "fields": missing}), 400

        priority = data.get("priority", "medium").lower()
        if priority not in {"low", "medium", "high", "critical"}:
            return jsonify({"error": "Invalid priority"}), 400

        ticket = Ticket(
            title=data["title"].strip(),
            description=data["description"].strip(),
            requester_email=data["requester_email"].strip().lower(),
            priority=priority,
        )
        db.session.add(ticket)
        db.session.commit()
        logger.info("ticket_created id=%s priority=%s", ticket.id, ticket.priority)
        return jsonify(ticket.to_dict()), 201

    @app.patch("/api/tickets/<int:ticket_id>/status")
    def update_ticket_status(ticket_id):
        ticket = db.session.get(Ticket, ticket_id)
        if ticket is None:
            return jsonify({"error": "Ticket not found"}), 404

        data = request.get_json(silent=True) or {}
        status = str(data.get("status", "")).lower()
        if status not in {"open", "in_progress", "resolved", "closed"}:
            return jsonify({"error": "Invalid status"}), 400

        ticket.status = status
        db.session.commit()
        logger.info("ticket_status_changed id=%s status=%s", ticket.id, status)
        return jsonify(ticket.to_dict())

    @app.delete("/api/tickets/<int:ticket_id>")
    def delete_ticket(ticket_id):
        ticket = db.session.get(Ticket, ticket_id)
        if ticket is None:
            return jsonify({"error": "Ticket not found"}), 404
        db.session.delete(ticket)
        db.session.commit()
        logger.info("ticket_deleted id=%s", ticket_id)
        return "", 204

    @app.get("/api/stats")
    def stats():
        total = Ticket.query.count()
        by_status = dict(
            db.session.query(Ticket.status, db.func.count(Ticket.id))
            .group_by(Ticket.status)
            .all()
        )
        by_priority = dict(
            db.session.query(Ticket.priority, db.func.count(Ticket.id))
            .group_by(Ticket.priority)
            .all()
        )
        return jsonify({"total": total, "by_status": by_status, "by_priority": by_priority})

    @app.errorhandler(413)
    def too_large(_error):
        return jsonify({"error": "Request exceeds 10 MB"}), 413

    @app.errorhandler(500)
    def internal_error(_error):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
