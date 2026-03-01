import time
import string
import random
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory storage (Resets on restart - use Redis for production)
url_db = {}        # {alias: {"original": url, "clicks": []}}
rate_limit_db = {} # {ip: [timestamps]}

def generate_alias():
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(6))

@app.route('/shorten', methods=['POST'])
def shorten():
    ip = request.remote_addr
    now = time.time()
    
    # --- Custom Rate Limiter Logic ---
    if ip not in rate_limit_db:
        rate_limit_db[ip] = []
    
    # Clean window: Remove timestamps older than 60s
    rate_limit_db[ip] = [t for t in rate_limit_db[ip] if now - t < 60]
    
    if len(rate_limit_db[ip]) >= 5:
        # Calculate seconds until the oldest request falls out of the 60s window
        retry_after = int(60 - (now - rate_limit_db[ip][0]))
        return jsonify({
            "error": "Too Many Requests",
            "retry_after": retry_after
        }), 429

    # --- Shortening Logic ---
    data = request.get_json()
    long_url = data.get('url')
    if not long_url:
        return jsonify({"error": "URL is required"}), 400

    alias = generate_alias()
    url_db[alias] = {"original": long_url, "clicks": []}
    rate_limit_db[ip].append(now) # Log the successful request
    
    return jsonify({
        "alias": alias, 
        "short_url": f"http://localhost:5000/{alias}"
    }), 201

@app.route('/<alias>', methods=['GET'])
def resolve(alias):
    if alias in url_db:
        # Log click with current timestamp
        url_db[alias]["clicks"].append(time.time())
        return redirect(url_db[alias]["original"])
    return "URL Not Found", 404

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    return jsonify(url_db)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)