import os

# Render dynamic port binding
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Concurrency settings
workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
threads = 2
timeout = 120
accesslog = "-"
errorlog = "-"
